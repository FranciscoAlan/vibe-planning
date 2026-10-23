import {
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, randomInt } from 'node:crypto';
import * as argon2 from 'argon2';
import {
  AccountStatus as DatabaseAccountStatus,
  ChallengeChannel as DatabaseChallengeChannel,
  ChallengePurpose as DatabaseChallengePurpose,
  Prisma,
  UserProfileType as DatabaseUserProfileType,
} from '@vibe-planners/database';
import { AccountStatus, ChallengePurpose, UserProfileType } from '@vibe-planners/shared-types';
import type {
  ChangePasswordInput,
  LoginWithCredentialsInput,
  RegisterWithCredentialsInput,
  RequestEmailVerificationInput,
  RequestPhoneChallengeInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
  VerifyChallengeInput,
  VerifyPhoneChallengeInput,
} from '@vibe-planners/shared-validations';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type { IdentityEmailSender } from './ports/identity-email-sender.js';
import { IDENTITY_EMAIL_SENDER } from './ports/identity-email-sender.js';
import type { IdentitySmsSender } from './ports/identity-sms-sender.js';
import { IDENTITY_SMS_SENDER } from './ports/identity-sms-sender.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);
  private readonly dummyPasswordHash = argon2.hash(randomBytes(32).toString('hex'));

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(IDENTITY_EMAIL_SENDER)
    private readonly emailSender: IdentityEmailSender,
    @Inject(IDENTITY_SMS_SENDER)
    private readonly smsSender: IdentitySmsSender,
  ) {}

  async register(input: RegisterWithCredentialsInput) {
    const uniqueIdentityFilters: Prisma.UserWhereInput[] = [{ phone: input.phone }];
    if (input.email) {
      uniqueIdentityFilters.push({ email: input.email });
    }
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: uniqueIdentityFilters },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email or phone is already registered');
    }

    const passwordHash = input.password
      ? await argon2.hash(input.password, { type: argon2.argon2id })
      : undefined;
    const profile =
      input.profile === UserProfileType.EVENT_PLANNER
        ? DatabaseUserProfileType.EVENT_PLANNER
        : DatabaseUserProfileType.CLIENT;

    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          email: input.email ?? null,
          phone: input.phone,
          ...(passwordHash ? { passwordHash } : {}),
          profiles: { create: { role: profile } },
        },
        select: { id: true, email: true, status: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email or phone is already registered');
      }
      throw error;
    }

    const emailVerificationChallengeId = input.email
      ? await this.createEmailChallenge(
          user.id,
          input.email,
          DatabaseChallengePurpose.EMAIL_VERIFICATION,
        )
      : undefined;
    const phoneVerificationChallengeId = await this.createPhoneChallenge(
      user.id,
      input.phone,
      DatabaseChallengePurpose.PHONE_VERIFICATION,
    );

    return {
      user: { ...user, status: AccountStatus.PENDING_VERIFICATION },
      ...(emailVerificationChallengeId ? { emailVerificationChallengeId } : {}),
      phoneVerificationChallengeId,
    };
  }

  async login(input: LoginWithCredentialsInput): Promise<{ accessToken: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    const passwordHash = user?.passwordHash ?? (await this.dummyPasswordHash);
    const passwordMatches = await argon2.verify(passwordHash, input.password);

    if (
      !user ||
      !passwordMatches ||
      user.status !== DatabaseAccountStatus.ACTIVE ||
      !user.emailVerifiedAt ||
      !user.phoneVerifiedAt
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { accessToken: this.jwt.sign({ sub: user.id }) };
  }

  async requestPhoneChallenge(input: RequestPhoneChallengeInput) {
    const purpose =
      input.purpose === ChallengePurpose.PHONE_LOGIN
        ? DatabaseChallengePurpose.PHONE_LOGIN
        : DatabaseChallengePurpose.PHONE_VERIFICATION;
    const user = await this.prisma.user.findUnique({ where: { phone: input.phone } });

    if (
      !user ||
      (purpose === DatabaseChallengePurpose.PHONE_VERIFICATION && user.phoneVerifiedAt) ||
      (purpose === DatabaseChallengePurpose.PHONE_LOGIN &&
        (user.status !== DatabaseAccountStatus.ACTIVE || !user.phoneVerifiedAt))
    ) {
      return { message: 'If the account can receive a verification code, one will be sent.' };
    }

    try {
      await this.createPhoneChallenge(user.id, input.phone, purpose);
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
        return { message: 'If the account can receive a verification code, one will be sent.' };
      }
      throw error;
    }

    return { message: 'If the account can receive a verification code, one will be sent.' };
  }

  async verifyPhoneChallenge(input: VerifyPhoneChallengeInput) {
    const user = await this.prisma.user.findUnique({ where: { phone: input.phone } });
    const purpose =
      input.purpose === ChallengePurpose.PHONE_LOGIN
        ? DatabaseChallengePurpose.PHONE_LOGIN
        : DatabaseChallengePurpose.PHONE_VERIFICATION;
    if (!user) {
      throw new UnauthorizedException('Invalid or expired challenge');
    }

    const challenge = await this.getValidChallenge(
      { userId: user.id },
      DatabaseChallengeChannel.SMS,
      purpose,
    );
    await this.verifyChallengeCode(challenge, input.code);

    const now = new Date();
    await this.prisma.$transaction(async (transaction) => {
      const consumed = await transaction.verificationChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          expiresAt: { gt: now },
          attempts: { lt: this.maxChallengeAttempts(DatabaseChallengeChannel.SMS) },
        },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) {
        throw new UnauthorizedException('Invalid or expired challenge');
      }

      if (purpose === DatabaseChallengePurpose.PHONE_VERIFICATION) {
        await transaction.user.update({
          where: { id: user.id },
          data: {
            phoneVerifiedAt: now,
            ...(user.emailVerifiedAt || !user.email
              ? { status: DatabaseAccountStatus.ACTIVE }
              : {}),
          },
        });
      }
    });

    if (purpose === DatabaseChallengePurpose.PHONE_LOGIN) {
      return { accessToken: this.jwt.sign({ sub: user.id }) };
    }

    return {
      phoneVerified: true,
      status:
        user.emailVerifiedAt || !user.email
          ? DatabaseAccountStatus.ACTIVE
          : DatabaseAccountStatus.PENDING_VERIFICATION,
    };
  }

  async requestEmailVerification(input: RequestEmailVerificationInput) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (user && !user.emailVerifiedAt) {
      try {
        await this.createEmailChallenge(
          user.id,
          input.email,
          DatabaseChallengePurpose.EMAIL_VERIFICATION,
        );
      } catch (error) {
        if (!(
          error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS
        )) {
          this.logger.warn('Email verification delivery could not be completed');
        }
      }
    }

    return { message: 'If the account can receive a verification email, one will be sent.' };
  }

  async verifyEmail(input: VerifyChallengeInput) {
    const challenge = await this.getValidEmailChallenge(
      input.challengeId,
      DatabaseChallengePurpose.EMAIL_VERIFICATION,
    );
    await this.verifyChallengeCode(challenge, input.code);

    const now = new Date();
    await this.prisma.$transaction(async (transaction) => {
      const consumed = await transaction.verificationChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          expiresAt: { gt: now },
          attempts: { lt: this.maxChallengeAttempts(DatabaseChallengeChannel.EMAIL) },
        },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) {
        throw new UnauthorizedException('Invalid or expired challenge');
      }

      await transaction.user.update({
        where: { id: challenge.userId },
        data: {
          emailVerifiedAt: now,
          ...(challenge.user.phoneVerifiedAt ? { status: DatabaseAccountStatus.ACTIVE } : {}),
        },
      });
    });

    return { emailVerified: true };
  }

  async requestPasswordReset(input: RequestPasswordResetInput) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (user?.emailVerifiedAt) {
      try {
        await this.createEmailChallenge(
          user.id,
          input.email,
          DatabaseChallengePurpose.PASSWORD_RESET,
        );
      } catch {
        this.logger.warn('Password reset email could not be queued');
      }
    }

    return { message: 'If the account exists, password reset instructions will be sent.' };
  }

  async resetPassword(input: ResetPasswordInput) {
    const challenge = await this.getValidEmailChallenge(
      input.challengeId,
      DatabaseChallengePurpose.PASSWORD_RESET,
    );
    await this.verifyChallengeCode(challenge, input.code);

    const passwordHash = await argon2.hash(input.newPassword, { type: argon2.argon2id });
    const now = new Date();
    await this.prisma.$transaction(async (transaction) => {
      const consumed = await transaction.verificationChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          expiresAt: { gt: now },
          attempts: { lt: this.maxChallengeAttempts(DatabaseChallengeChannel.EMAIL) },
        },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) {
        throw new UnauthorizedException('Invalid or expired challenge');
      }

      await transaction.user.update({
        where: { id: challenge.userId },
        data: { passwordHash },
      });
    });

    return { passwordReset: true };
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash || !(await argon2.verify(user.passwordHash, input.currentPassword))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await argon2.hash(input.newPassword, { type: argon2.argon2id });
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { passwordChanged: true };
  }

  /** Issues the access token for an already-authenticated user. */
  issueToken(payload: JwtPayload): { accessToken: string } {
    return { accessToken: this.jwt.sign(payload) };
  }

  private maxChallengeAttempts(channel: DatabaseChallengeChannel): number {
    const prefix = channel === DatabaseChallengeChannel.SMS ? 'IDENTITY_PHONE' : 'IDENTITY_EMAIL';
    return this.positiveIntegerEnv(
      `${prefix}_MAX_ATTEMPTS`,
      channel === DatabaseChallengeChannel.EMAIL
        ? this.positiveIntegerEnv('IDENTITY_EMAIL_MAX_ATTEMPTS', 5)
        : 5,
    );
  }

  private async createEmailChallenge(
    userId: string,
    email: string,
    purpose: DatabaseChallengePurpose,
  ): Promise<string> {
    return this.createChallenge(userId, email, DatabaseChallengeChannel.EMAIL, purpose);
  }

  private async createPhoneChallenge(
    userId: string,
    phone: string,
    purpose: DatabaseChallengePurpose,
  ): Promise<string> {
    return this.createChallenge(userId, phone, DatabaseChallengeChannel.SMS, purpose);
  }

  private async createChallenge(
    userId: string,
    target: string,
    channel: DatabaseChallengeChannel,
    purpose: DatabaseChallengePurpose,
  ): Promise<string> {
    const now = new Date();
    const prefix = channel === DatabaseChallengeChannel.SMS ? 'IDENTITY_PHONE' : 'IDENTITY_EMAIL';
    const resendWindowSeconds = this.positiveIntegerEnv(`${prefix}_RESEND_SECONDS`, 60);
    const recentChallenge = await this.prisma.verificationChallenge.findFirst({
      where: {
        userId,
        purpose,
        createdAt: { gt: new Date(now.getTime() - resendWindowSeconds * 1000) },
      },
      select: { id: true },
    });

    if (recentChallenge) {
      throw new HttpException(
        'Please wait before requesting another verification code',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const secretHash = await argon2.hash(code, { type: argon2.argon2id });
    const defaultTtlMinutes = channel === DatabaseChallengeChannel.SMS ? 10 : 15;
    const expiresAt = new Date(
      now.getTime() +
        this.positiveIntegerEnv(`${prefix}_TTL_MINUTES`, defaultTtlMinutes) * 60 * 1000,
    );

    const challenge = await this.prisma.$transaction(async (transaction) => {
      await transaction.verificationChallenge.updateMany({
        where: { userId, purpose, consumedAt: null },
        data: { consumedAt: now },
      });
      return transaction.verificationChallenge.create({
        data: {
          userId,
          channel,
          purpose,
          target,
          secretHash,
          expiresAt,
        },
        select: { id: true },
      });
    });

    try {
      if (channel === DatabaseChallengeChannel.EMAIL) {
        const deliveryPurpose =
          purpose === DatabaseChallengePurpose.EMAIL_VERIFICATION
            ? ChallengePurpose.EMAIL_VERIFICATION
            : ChallengePurpose.PASSWORD_RESET;
        await this.emailSender.sendCode({
          email: target,
          challengeId: challenge.id,
          code,
          purpose: deliveryPurpose,
        });
      } else {
        await this.smsSender.sendCode({ phone: target, code });
      }
    } catch (error) {
      await this.prisma.verificationChallenge.updateMany({
        where: { id: challenge.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      throw error;
    }
    return challenge.id;
  }

  private async getValidEmailChallenge(id: string, purpose: DatabaseChallengePurpose) {
    return this.getValidChallenge({ id }, DatabaseChallengeChannel.EMAIL, purpose);
  }

  private async getValidChallenge(
    filter: { id: string } | { userId: string },
    channel: DatabaseChallengeChannel,
    purpose: DatabaseChallengePurpose,
  ) {
    const challenge = await this.prisma.verificationChallenge.findFirst({
      where: {
        ...filter,
        channel,
        purpose,
      },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });

    if (
      !challenge ||
      challenge.consumedAt ||
      challenge.expiresAt <= new Date() ||
      challenge.attempts >= this.maxChallengeAttempts(channel)
    ) {
      throw new UnauthorizedException('Invalid or expired challenge');
    }

    return challenge;
  }

  private async verifyChallengeCode(
    challenge: Awaited<ReturnType<IdentityService['getValidEmailChallenge']>>,
    code: string,
  ): Promise<void> {
    if (!(await argon2.verify(challenge.secretHash, code))) {
      await this.prisma.verificationChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          expiresAt: { gt: new Date() },
          attempts: { lt: this.maxChallengeAttempts(challenge.channel) },
        },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid or expired challenge');
    }
  }

  private positiveIntegerEnv(name: string, fallback: number): number {
    const value = Number(process.env[name]);
    return Number.isInteger(value) && value > 0 ? value : fallback;
  }
}
