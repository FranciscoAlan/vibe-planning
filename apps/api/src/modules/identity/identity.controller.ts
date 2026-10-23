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
  requestPasswordResetSchema,
  registerWithCredentialsSchema,
  registerWithProviderSchema,
  resetPasswordSchema,
  verifyTwoFactorSchema,
  verifyChallengeSchema,
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
 * Placeholder endpoints for the identity flows described in the spec
 * (credentials, Google/Apple/Facebook, phone OTP, 2FA). Request bodies are
 * validated with the shared Zod schemas; the actual user store / strategy
 * wiring lands with the `identity` feature spec.
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
