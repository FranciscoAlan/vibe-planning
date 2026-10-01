import { Injectable } from '@nestjs/common';
import { ProviderClient } from './provider-client.js';

@Injectable()
export class StripeClient extends ProviderClient {
  constructor() {
    super('Stripe', {
      secretKey: process.env.STRIPE_SECRET_KEY,
    });
  }
}
