import { Injectable } from '@nestjs/common';
import { TwilioClient } from '../../../integrations/twilio.client.js';
import type { IdentitySmsSender } from '../ports/identity-sms-sender.js';

@Injectable()
export class TwilioIdentitySmsSender implements IdentitySmsSender {
  constructor(private readonly twilio: TwilioClient) {}

  sendCode(input: { phone: string; code: string }): Promise<void> {
    return this.twilio.sendSms({
      to: input.phone,
      body: `Your Vibe Planners verification code is ${input.code}.`,
    });
  }
}
