import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  loginWithCredentialsSchema,
  registerWithCredentialsSchema,
  registerWithProviderSchema,
  verifyTwoFactorSchema,
} from '@vibe-planners/shared-validations';

/**
 * Placeholder endpoints for the identity flows described in the spec
 * (credentials, Google/Apple/Facebook, phone OTP, 2FA). Request bodies are
 * validated with the shared Zod schemas; the actual user store / strategy
 * wiring lands with the `identity` feature spec.
 */
@Controller('identity')
export class IdentityController {
  @Get()
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  placeholder() {
    return { message: 'identity module not implemented yet' };
  }

  @Post('register')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  register(@Body() body: unknown) {
    const parsed = registerWithCredentialsSchema.safeParse(body);
    return {
      message: 'identity.register not implemented yet',
      validInput: parsed.success,
    };
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
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  login(@Body() body: unknown) {
    const parsed = loginWithCredentialsSchema.safeParse(body);
    return {
      message: 'identity.login not implemented yet',
      validInput: parsed.success,
    };
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
}
