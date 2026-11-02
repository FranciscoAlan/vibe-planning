import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { IdentityController } from './identity.controller.js';
import { IdentityService } from './identity.service.js';
import { TwoFactorService } from './two-factor/two-factor.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { IntegrationsModule } from '../../integrations/integrations.module.js';
import { IDENTITY_EMAIL_SENDER } from './ports/identity-email-sender.js';
import { IDENTITY_SMS_SENDER } from './ports/identity-sms-sender.js';
import { ResendIdentityEmailSender } from './providers/resend-identity-email-sender.js';
import { TwilioIdentitySmsSender } from './providers/twilio-identity-sms-sender.js';
import { CredentialsStrategy } from './strategies/credentials.strategy.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { GoogleStrategy } from './strategies/google.strategy.js';
import { FacebookStrategy } from './strategies/facebook.strategy.js';
import { AppleStrategy } from './strategies/apple.strategy.js';
import { PhoneOtpStrategy } from './strategies/phone-otp.strategy.js';

@Module({
  imports: [
    IntegrationsModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-only-placeholder-secret',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    }),
  ],
  controllers: [IdentityController],
  providers: [
    IdentityService,
    JwtAuthGuard,
    PrismaService,
    ResendIdentityEmailSender,
    TwilioIdentitySmsSender,
    { provide: IDENTITY_EMAIL_SENDER, useExisting: ResendIdentityEmailSender },
    { provide: IDENTITY_SMS_SENDER, useExisting: TwilioIdentitySmsSender },
    TwoFactorService,
    CredentialsStrategy,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
    AppleStrategy,
    PhoneOtpStrategy,
  ],
  exports: [IdentityService],
})
export class IdentityModule {}
