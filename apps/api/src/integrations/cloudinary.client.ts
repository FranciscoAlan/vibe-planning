import { Injectable } from '@nestjs/common';
import { ProviderClient } from './provider-client.js';

@Injectable()
export class CloudinaryClient extends ProviderClient {
  constructor() {
    super('Cloudinary', {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    });
  }
}
