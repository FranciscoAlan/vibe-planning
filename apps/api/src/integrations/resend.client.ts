import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Resend } from 'resend';
import { ProviderClient } from './provider-client.js';

@Injectable()
export class ResendClient extends ProviderClient {
  constructor() {
    super('Resend', {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL,
    });
  }

  async sendEmail(input: { to: string; subject: string; text: string }): Promise<void> {
    const apiKey = this.configuration.apiKey;
    const from = this.configuration.fromEmail;
    if (!apiKey || !from) {
      throw new ServiceUnavailableException('Resend email configuration is incomplete');
    }

    const { error } = await new Resend(apiKey).emails.send({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    if (error) {
      throw new ServiceUnavailableException('Email delivery failed');
    }
  }
}
