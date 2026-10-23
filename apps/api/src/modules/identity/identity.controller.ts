import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  changePasswordSchema,
  loginWithCredentialsSchema,
  requestEmailVerificationSchema,
  requestPhoneChallengeSchema,
  requestPasswordResetSchema,
  registerWithCredentialsSchema,
  registerWithProviderSchema,
  resetPasswordSchema,
  refreshSessionSchema,
  verifyTwoFactorSchema,
  verifyChallengeSchema,
  verifyPhoneChallengeSchema,
} from '@vibe-planners/shared-validations';
import { IdentityService } from './identity.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';

type AuthenticatedRequest = Request & { user?: JwtPayload };

type SafeParseSchema<T> = {
  safeParse(
    input: unknown,
  ): { success: true; data: T } | { success: false; error: { issues: unknown } };
};

/**
 * API endpoints for credentials and phone verification. Social sign-in and
 * 2FA flows remain placeholders until their implementation steps.
 */
@Controller('identity')
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @Get()
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  placeholder() {
    return { message: 'identity module not implemented yet' };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() body: unknown) {
    return this.identity.register(this.parseBody(registerWithCredentialsSchema, body));
  }

  @Post('register/provider')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  registerWithProvider(@Body() body: unknown) {
    const parsed = registerWithProviderSchema.safeParse(body);
    return {
      message: 'identity.registerWithProvider not implemented yet',
      validInput: parsed.success,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: unknown) {
    return this.identity.login(this.parseBody(loginWithCredentialsSchema, body));
  }

  @Post('phone/challenge')
  @HttpCode(HttpStatus.OK)
  requestPhoneChallenge(@Body() body: unknown) {
    return this.identity.requestPhoneChallenge(this.parseBody(requestPhoneChallengeSchema, body));
  }

  @Post('phone/verify')
  @HttpCode(HttpStatus.OK)
  verifyPhoneChallenge(@Body() body: unknown) {
    return this.identity.verifyPhoneChallenge(this.parseBody(verifyPhoneChallengeSchema, body));
  }

  @Post('email/verification/request')
  @HttpCode(HttpStatus.OK)
  requestEmailVerification(@Body() body: unknown) {
    return this.identity.requestEmailVerification(
      this.parseBody(requestEmailVerificationSchema, body),
    );
  }

  @Post('email/verification/confirm')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() body: unknown) {
    return this.identity.verifyEmail(this.parseBody(verifyChallengeSchema, body));
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  requestPasswordReset(@Body() body: unknown) {
    return this.identity.requestPasswordReset(this.parseBody(requestPasswordResetSchema, body));
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() body: unknown) {
    return this.identity.resetPassword(this.parseBody(resetPasswordSchema, body));
  }

  @Post('password/change')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  changePassword(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    if (!request.user?.sub) {
      throw new BadRequestException('Authenticated identity is missing');
    }
    return this.identity.changePassword(
      request.user.sub,
      this.parseBody(changePasswordSchema, body),
    );
  }

  @Post('sessions/refresh')
  @HttpCode(HttpStatus.OK)
  refreshSession(@Body() body: unknown) {
    return this.identity.refreshSession(this.parseBody(refreshSessionSchema, body));
  }

  @Post('sessions/logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logout(@Req() request: AuthenticatedRequest) {
    const principal = request.user;
    if (!principal?.sub || !principal.sessionId) {
      throw new BadRequestException('Authenticated session is missing');
    }
    return this.identity.logout(principal.sub, principal.sessionId);
  }

  @Post('sessions/logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logoutAll(@Req() request: AuthenticatedRequest) {
    if (!request.user?.sub) {
      throw new BadRequestException('Authenticated identity is missing');
    }
    return this.identity.logoutAll(request.user.sub);
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  verifyTwoFactor(@Body() body: unknown) {
    const parsed = verifyTwoFactorSchema.safeParse(body);
    return {
      message: 'identity.verifyTwoFactor not implemented yet',
      validInput: parsed.success,
    };
  }

  private parseBody<T>(schema: SafeParseSchema<T>, body: unknown): T {
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }
    return parsed.data;
  }
}
