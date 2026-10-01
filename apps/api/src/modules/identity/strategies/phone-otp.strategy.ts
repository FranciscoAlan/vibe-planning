import { Injectable } from '@nestjs/common';

/**
 * Stub for phone/OTP login. Real implementation (SMS send + code verification
 * via Twilio) lands with the `identity` feature spec — see Twilio placeholder
 * client in `common/providers`.
 */
@Injectable()
export class PhoneOtpStrategy {
  async sendCode(_phone: string): Promise<never> {
    throw new Error('Phone OTP login not implemented yet');
  }

  async verifyCode(_phone: string, _code: string): Promise<never> {
    throw new Error('Phone OTP login not implemented yet');
  }
}
