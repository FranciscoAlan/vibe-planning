import { ServiceUnavailableException } from '@nestjs/common';
import type { ChallengePurpose } from '@vibe-planners/shared-types';

export const IDENTITY_EMAIL_SENDER = Symbol('IDENTITY_EMAIL_SENDER');

export interface IdentityEmailSender {
  sendCode(input: {
    email: string;
    challengeId: string;
    code: string;
    purpose: ChallengePurpose.EMAIL_VERIFICATION | ChallengePurpose.PASSWORD_RESET;
  }): Promise<void>;
}

export class UnavailableIdentityEmailSender implements IdentityEmailSender {
  async sendCode(): Promise<void> {
    throw new ServiceUnavailableException('Email delivery is not configured');
  }
}
