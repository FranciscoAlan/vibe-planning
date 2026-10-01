import { Module } from '@nestjs/common';
import { CloudinaryClient } from './cloudinary.client.js';
import { ElasticsearchClient } from './elasticsearch.client.js';
import { FirebaseClient } from './firebase.client.js';
import { ResendClient } from './resend.client.js';
import { StripeClient } from './stripe.client.js';
import { TwilioClient } from './twilio.client.js';

@Module({
  providers: [
    CloudinaryClient,
    ElasticsearchClient,
    FirebaseClient,
    ResendClient,
    StripeClient,
    TwilioClient,
  ],
  exports: [
    CloudinaryClient,
    ElasticsearchClient,
    FirebaseClient,
    ResendClient,
    StripeClient,
    TwilioClient,
  ],
})
export class IntegrationsModule {}
