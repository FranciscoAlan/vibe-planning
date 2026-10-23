import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import twilio from 'twilio';
import { ProviderClient } from './provider-client.js';

@Injectable()
export class TwilioClient extends ProviderClient {
  constructor() {
    super('Twilio', {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_FROM_NUMBER,
    });
  }

  async sendSms(input: { to: string; body: string }): Promise<void> {
    const { accountSid, authToken, fromNumber } = this.configuration;
    if (!accountSid || !authToken || !fromNumber) {
      throw new ServiceUnavailableException('Twilio SMS configuration is incomplete');
    }

    try {
      await twilio(accountSid, authToken).messages.create({
        to: input.to,
        from: fromNumber,
        body: input.body,
      });
    } catch {
      throw new ServiceUnavailableException('SMS delivery failed');
    }
  }
}
