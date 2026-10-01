import { Injectable } from '@nestjs/common';

/**
 * Stub: Sign in with Apple requires a JWT-signed client secret and a
 * dedicated verifier (no mature passive passport strategy maintained for
 * Nest 12/ESM). Real implementation lands with the `identity` feature spec.
 */
@Injectable()
export class AppleStrategy {
  async verifyIdentityToken(_identityToken: string): Promise<never> {
    throw new Error('Apple sign-in not implemented yet');
  }
}
