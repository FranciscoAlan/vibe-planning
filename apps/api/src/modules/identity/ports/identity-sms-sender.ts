export const IDENTITY_SMS_SENDER = Symbol('IDENTITY_SMS_SENDER');

export interface IdentitySmsSender {
  sendCode(input: { phone: string; code: string }): Promise<void>;
}
