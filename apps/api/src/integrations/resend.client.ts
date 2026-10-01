import { Injectable } from '@nestjs/common';
import { ProviderClient } from './provider-client.js';

@Injectable()
export class ResendClient extends ProviderClient {
  constructor() {
    super('Resend', {
      apiKey: process.env.RESEND_API_KEY,
    });
  }
}
