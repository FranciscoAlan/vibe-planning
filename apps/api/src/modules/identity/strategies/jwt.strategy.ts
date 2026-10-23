import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

export interface JwtPayload {
  sub: string;
  sessionId?: string;
  tenantId?: string;
  role?: string;
}

export type OrganizationJwtPayload = JwtPayload & { tenantId: string; role: string };

/** Validates active sessions and resolves organization roles from membership records. */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-only-placeholder-secret',
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sub || !payload.sessionId) {
      throw new UnauthorizedException('Invalid access token');
    }

    const activeSession = await this.prisma.authSession.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        twoFactorVerified: true,
        user: { select: { twoFactorEnabled: true } },
      },
    });
    if (!activeSession) {
      throw new UnauthorizedException('Session is no longer active');
    }

    const adminMembership = await this.prisma.organizationMembership.findFirst({
      where: { userId: payload.sub, role: 'ADMIN' },
      select: { id: true },
    });
    if (
      adminMembership &&
      (!activeSession.twoFactorVerified || !activeSession.user.twoFactorEnabled)
    ) {
      throw new UnauthorizedException('Administrator access requires a TOTP-verified session');
    }

    const principal: JwtPayload = { sub: payload.sub, sessionId: payload.sessionId };
    const tenantId = request.header('x-tenant-id');
    if (!tenantId) {
      return principal;
    }

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId)
    ) {
      throw new ForbiddenException('Invalid organization context');
    }

    const membership = await this.prisma.organizationMembership.findUnique({
      where: { tenantId_userId: { tenantId, userId: payload.sub } },
      select: { role: true },
    });
    if (membership) {
      return { ...principal, tenantId, role: membership.role };
    }

    const clientProfile = await this.prisma.userProfile.findUnique({
      where: { userId_role: { userId: payload.sub, role: 'CLIENT' } },
      select: { id: true },
    });
    if (!clientProfile) {
      throw new ForbiddenException('User is not authorized for this organization context');
    }

    return { ...principal, tenantId, role: 'CLIENT' };
  }
}
