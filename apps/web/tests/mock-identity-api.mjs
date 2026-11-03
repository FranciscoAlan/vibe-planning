import { Buffer } from 'node:buffer';
import { createServer } from 'node:http';
import process from 'node:process';
import { URL } from 'node:url';

const port = Number(process.env.PORT ?? 3101);
let nextSessionId = 1;
let nextTokenId = 1;
let nextChallengeId = 1;
let nextOrganizationId = 1;
const sessions = new Map();
const accessTokens = new Map();
const refreshTokens = new Map();
const challenges = new Map();
const registrationsByEmail = new Map();
const registrationsByUser = new Map();
const emailChallenges = new Map();
const phoneChallenges = new Map();
const registeredOrganizations = new Map();
const counters = new Map();

const organizationsByUser = {
  'owner-user': [
    {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Estudio Norte',
      role: 'OWNER',
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Música Viva',
      role: 'PROVIDER',
    },
  ],
  'provider-user': [
    {
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Fotografía Luz',
      role: 'PROVIDER',
    },
  ],
  'refresh-user': [
    {
      id: '44444444-4444-4444-8444-444444444444',
      name: 'Decoración Viva',
      role: 'OWNER',
    },
  ],
  'refresh-fail-user': [
    {
      id: '66666666-6666-4666-8666-666666666666',
      name: 'Sesión Caducada',
      role: 'OWNER',
    },
  ],
  'stale-cookie-user': [
    {
      id: '77777777-7777-4777-8777-777777777777',
      name: 'Sesión de prueba',
      role: 'OWNER',
    },
  ],
  'no-org-user': [],
  'totp-user': [
    {
      id: '55555555-5555-4555-8555-555555555555',
      name: 'Eventos TOTP',
      role: 'OWNER',
    },
  ],
};

function respond(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 16_384) reject(new Error('Request body too large'));
    });
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    request.on('error', reject);
  });
}

function userIdForEmail(email) {
  const registration = registrationsByEmail.get(email);
  if (registration) return registration.userId;
  const localPart = email.split('@')[0];
  if (localPart === 'owner') return 'owner-user';
  if (localPart === 'provider') return 'provider-user';
  if (localPart === 'refresh') return 'refresh-user';
  if (localPart === 'refresh-fail') return 'refresh-fail-user';
  if (localPart === 'stale-cookie') return 'stale-cookie-user';
  if (localPart === 'no-org') return 'no-org-user';
  if (localPart === 'totp') return 'totp-user';
  return undefined;
}

function newChallengeId() {
  return `00000000-0000-4000-8000-${String(nextChallengeId++).padStart(12, '0')}`;
}

function newAccessToken(userId, sessionId) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      sessionId,
      exp: Math.floor(Date.now() / 1000) + 900,
    }),
  ).toString('base64url');
  const token = `${header}.${payload}.test-signature-${nextTokenId++}`;
  accessTokens.set(token, sessionId);
  return token;
}

function issueTokens(userId, sessionId) {
  const session = sessions.get(sessionId) ?? {
    id: sessionId ?? `session-${nextSessionId++}`,
    userId,
    active: true,
    refreshToken: undefined,
  };
  session.active = true;
  const refreshToken = `refresh-token-${nextTokenId++}-${userId}-long-enough`;
  session.refreshToken = refreshToken;
  sessions.set(session.id, session);
  refreshTokens.set(refreshToken, session.id);
  return {
    accessToken: newAccessToken(userId, session.id),
    refreshToken,
  };
}

function authenticatedUser(request) {
  const authorization = request.headers.authorization;
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) return undefined;
  const sessionId = accessTokens.get(authorization.slice('Bearer '.length));
  const session = sessionId ? sessions.get(sessionId) : undefined;
  return session?.active ? session.userId : undefined;
}

function increment(userId, name) {
  const values = counters.get(userId) ?? {
    login: 0,
    refresh: 0,
    logout: 0,
    organizations: 0,
    registration: 0,
    emailVerification: 0,
    phoneVerification: 0,
    organizationCreate: 0,
  };
  values[name] += 1;
  counters.set(userId, values);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);

  if (request.method === 'GET' && url.pathname === '/__test/health') {
    return respond(response, 200, { ready: true });
  }

  if (request.method === 'GET' && url.pathname === '/__test/state') {
    return respond(response, 200, counters.get(url.searchParams.get('userId')) ?? {});
  }

  if (request.method === 'POST' && url.pathname === '/__test/reset') {
    const body = await readBody(request);
    const userId = body.userId;
    counters.delete(userId);
    const registration = registrationsByUser.get(userId);
    if (registration) {
      registrationsByUser.delete(userId);
      registrationsByEmail.delete(registration.email);
      registeredOrganizations.delete(userId);
      for (const [challengeId, challengeUserId] of emailChallenges) {
        if (challengeUserId === userId) emailChallenges.delete(challengeId);
      }
      phoneChallenges.delete(registration.phone);
    }
    for (const [id, session] of sessions) {
      if (session.userId === userId) {
        session.active = false;
        sessions.delete(id);
      }
    }
    for (const [token, sessionId] of refreshTokens) {
      if (!sessions.has(sessionId)) refreshTokens.delete(token);
    }
    return respond(response, 200, { reset: true });
  }

  try {
    if (request.method === 'POST' && url.pathname === '/identity/register') {
      const body = await readBody(request);
      if (
        registrationsByEmail.has(body.email) ||
        [...registrationsByUser.values()].some(({ phone }) => phone === body.phone) ||
        userIdForEmail(body.email ?? '')
      ) {
        return respond(response, 409, { message: 'Email or phone is already registered' });
      }

      const userId = `registration-${nextSessionId++}`;
      const registration = {
        userId,
        email: body.email,
        phone: body.phone,
        password: body.password,
        emailVerified: false,
        phoneVerified: false,
      };
      registrationsByEmail.set(body.email, registration);
      registrationsByUser.set(userId, registration);
      registration.emailChallengeId = newChallengeId();
      emailChallenges.set(registration.emailChallengeId, userId);
      phoneChallenges.set(body.phone, { userId, code: '123456' });
      increment(userId, 'registration');
      return respond(response, 201, {
        user: { id: userId, email: body.email, status: 'pending_verification' },
        emailVerificationChallengeId: registration.emailChallengeId,
        phoneVerificationChallengeId: newChallengeId(),
      });
    }

    if (request.method === 'POST' && url.pathname === '/identity/email/verification/request') {
      const body = await readBody(request);
      const registration = registrationsByEmail.get(body.email);
      let challengeId = newChallengeId();
      if (registration && !registration.emailVerified) {
        emailChallenges.delete(registration.emailChallengeId);
        challengeId = newChallengeId();
        registration.emailChallengeId = challengeId;
        emailChallenges.set(challengeId, registration.userId);
        increment(registration.userId, 'emailVerification');
      }
      return respond(response, 200, {
        message: 'If the account can receive a verification email, one will be sent.',
        challengeId,
      });
    }

    if (request.method === 'POST' && url.pathname === '/identity/email/verification/confirm') {
      const body = await readBody(request);
      const userId = emailChallenges.get(body.challengeId);
      const registration = userId ? registrationsByUser.get(userId) : undefined;
      if (!registration || body.code !== '123456' || registration.emailVerified) {
        return respond(response, 401, { message: 'Invalid or expired challenge' });
      }
      registration.emailVerified = true;
      emailChallenges.delete(body.challengeId);
      increment(userId, 'emailVerification');
      return respond(response, 200, { emailVerified: true });
    }

    if (request.method === 'POST' && url.pathname === '/identity/phone/challenge') {
      const body = await readBody(request);
      const registration =
        registrationsByEmail.get(body.email) ??
        [...registrationsByUser.values()].find(({ phone }) => phone === body.phone);
      if (registration && !registration.phoneVerified) {
        phoneChallenges.set(body.phone, { userId: registration.userId, code: '123456' });
      }
      return respond(response, 200, {
        message: 'If the account can receive a verification code, one will be sent.',
      });
    }

    if (request.method === 'POST' && url.pathname === '/identity/phone/verify') {
      const body = await readBody(request);
      const challenge = phoneChallenges.get(body.phone);
      const registration = challenge ? registrationsByUser.get(challenge.userId) : undefined;
      if (!registration || body.code !== challenge.code || registration.phoneVerified) {
        return respond(response, 401, { message: 'Invalid or expired challenge' });
      }
      registration.phoneVerified = true;
      increment(registration.userId, 'phoneVerification');
      return respond(response, 200, {
        phoneVerified: true,
        status: registration.emailVerified ? 'ACTIVE' : 'PENDING_VERIFICATION',
      });
    }

    if (request.method === 'POST' && url.pathname === '/identity/login') {
      const body = await readBody(request);
      const userId = userIdForEmail(body.email ?? '');
      if (userId) increment(userId, 'login');
      const registration = userId ? registrationsByUser.get(userId) : undefined;
      if (
        !userId ||
        (registration
          ? body.password !== registration.password ||
            !registration.emailVerified ||
            !registration.phoneVerified
          : body.password !== 'correct-password')
      ) {
        return respond(response, 401, { message: 'Invalid credentials' });
      }
      if (userId === 'totp-user') {
        const challengeToken = `challenge-${userId}`;
        challenges.set(challengeToken, userId);
        return respond(response, 200, { twoFactorRequired: true, challengeToken });
      }
      return respond(response, 200, issueTokens(userId));
    }

    if (request.method === 'POST' && url.pathname === '/identity/2fa/verify') {
      const body = await readBody(request);
      const userId = challenges.get(body.challengeToken);
      if (!userId || body.code !== '123456') {
        return respond(response, 401, { message: 'Invalid two-factor code' });
      }
      challenges.delete(body.challengeToken);
      return respond(response, 200, issueTokens(userId));
    }

    if (request.method === 'POST' && url.pathname === '/identity/sessions/refresh') {
      const body = await readBody(request);
      const sessionId = refreshTokens.get(body.refreshToken);
      const session = sessionId ? sessions.get(sessionId) : undefined;
      if (!session?.active || session.refreshToken !== body.refreshToken) {
        return respond(response, 401, { message: 'Invalid refresh token' });
      }
      increment(session.userId, 'refresh');
      if (session.userId === 'refresh-fail-user') {
        return respond(response, 401, { message: 'Refresh session expired' });
      }
      refreshTokens.delete(body.refreshToken);
      return respond(response, 200, issueTokens(session.userId, session.id));
    }

    if (request.method === 'GET' && url.pathname === '/identity/organizations') {
      const userId = authenticatedUser(request);
      if (!userId) return respond(response, 401, { message: 'Invalid access token' });
      increment(userId, 'organizations');
      if (userId === 'refresh-user' && counters.get(userId).organizations === 1) {
        return respond(response, 401, { message: 'Access token expired' });
      }
      if (userId === 'refresh-fail-user') {
        return respond(response, 401, { message: 'Access token expired' });
      }
      return respond(
        response,
        200,
        registeredOrganizations.get(userId) ?? organizationsByUser[userId] ?? [],
      );
    }

    if (request.method === 'POST' && url.pathname === '/identity/organizations') {
      const userId = authenticatedUser(request);
      if (!userId) return respond(response, 401, { message: 'Invalid access token' });
      const body = await readBody(request);
      const id = `00000000-0000-4000-8000-${String(nextOrganizationId++).padStart(12, '0')}`;
      const organization = { id, name: body.name };
      registeredOrganizations.set(userId, [{ ...organization, role: 'OWNER' }]);
      increment(userId, 'organizationCreate');
      return respond(response, 201, {
        organization,
        membership: { id: `membership-${id}`, tenantId: id, userId, role: 'OWNER' },
      });
    }

    if (request.method === 'POST' && url.pathname === '/identity/sessions/logout') {
      const userId = authenticatedUser(request);
      if (!userId) return respond(response, 401, { message: 'Invalid access token' });
      const sessionId = accessTokens.get(request.headers.authorization.slice('Bearer '.length));
      const session = sessions.get(sessionId);
      if (session) {
        session.active = false;
        refreshTokens.delete(session.refreshToken);
      }
      increment(userId, 'logout');
      return respond(response, 200, { loggedOut: true });
    }

    return respond(response, 404, { message: 'Not found' });
  } catch {
    return respond(response, 400, { message: 'Invalid mock API request' });
  }
});

server.listen(port, '127.0.0.1');
