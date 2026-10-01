import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { IdentityController } from './identity.controller.js';
import { IdentityService } from './identity.service.js';
import { TwoFactorService } from './two-factor/two-factor.service.js';
import { CredentialsStrategy } from './strategies/credentials.strategy.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { GoogleStrategy } from './strategies/google.strategy.js';
import { FacebookStrategy } from './strategies/facebook.strategy.js';
import { AppleStrategy } from './strategies/apple.strategy.js';
import { PhoneOtpStrategy } from './strategies/phone-otp.strategy.js';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-only-placeholder-secret',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ??
          '1h') as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    }),
  ],
  controllers: [IdentityController],
  providers: [
    IdentityService,
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
