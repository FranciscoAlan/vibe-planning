import { Injectable } from '@nestjs/common';
import { ChallengePurpose } from '@vibe-planners/shared-types';
import { ResendClient } from '../../../integrations/resend.client.js';
import type { IdentityEmailSender } from '../ports/identity-email-sender.js';

@Injectable()
export class ResendIdentityEmailSender implements IdentityEmailSender {
  constructor(private readonly resend: ResendClient) {}

  sendCode(input: {
    email: string;
    challengeId: string;
    code: string;
    purpose: ChallengePurpose.EMAIL_VERIFICATION | ChallengePurpose.PASSWORD_RESET;
  }): Promise<void> {
    const isPasswordReset = input.purpose === ChallengePurpose.PASSWORD_RESET;
    return this.resend.sendEmail({
      to: input.email,
      subject: isPasswordReset
        ? 'Reset your Vibe Planners password'
        : 'Verify your Vibe Planners account',
      text: [
        isPasswordReset
          ? `Your password reset code is ${input.code}.`
          : `Your email verification code is ${input.code}.`,
        `Challenge ID: ${input.challengeId}`,
        'This code expires soon. If you did not request it, you can ignore this email.',
      ].join('\n'),
    });
  }
}
