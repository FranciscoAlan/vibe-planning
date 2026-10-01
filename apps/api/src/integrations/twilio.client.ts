import { Injectable } from '@nestjs/common';
import { ProviderClient } from './provider-client.js';

@Injectable()
export class TwilioClient extends ProviderClient {
  constructor() {
    super('Twilio', {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
    });
  }
}
