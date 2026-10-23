import { ServiceUnavailableException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const sdkMocks = vi.hoisted(() => ({
  resendSend: vi.fn(),
  twilioCreate: vi.fn(),
}));

vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: sdkMocks.resendSend };
  },
}));

vi.mock('twilio', () => ({
  default: vi.fn().mockImplementation(() => ({ messages: { create: sdkMocks.twilioCreate } })),
}));

import { ResendClient } from './resend.client.js';
import { TwilioClient } from './twilio.client.js';

describe('identity delivery clients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 'test-resend-key';
    process.env.RESEND_FROM_EMAIL = 'Vibe Planners <test@example.com>';
    process.env.TWILIO_ACCOUNT_SID = 'test-account-sid';
    process.env.TWILIO_AUTH_TOKEN = 'test-auth-token';
    process.env.TWILIO_FROM_NUMBER = '+15551234567';
  });

  it('sends email through Resend with configured sender details', async () => {
    sdkMocks.resendSend.mockResolvedValue({ data: { id: 'email-id' }, error: null });

    await new ResendClient().sendEmail({
      to: 'user@example.com',
      subject: 'Verify account',
      text: 'Code 123456',
    });

    expect(sdkMocks.resendSend).toHaveBeenCalledWith({
      from: 'Vibe Planners <test@example.com>',
      to: 'user@example.com',
      subject: 'Verify account',
      text: 'Code 123456',
    });
  });

  it('rejects email delivery when sender configuration is missing', async () => {
    delete process.env.RESEND_FROM_EMAIL;

    await expect(
      new ResendClient().sendEmail({ to: 'user@example.com', subject: 'Test', text: 'Test' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(sdkMocks.resendSend).not.toHaveBeenCalled();
  });

  it('sends SMS through Twilio with the configured number', async () => {
    sdkMocks.twilioCreate.mockResolvedValue({ sid: 'message-id' });

    await new TwilioClient().sendSms({ to: '+525512345678', body: 'Code 123456' });

    expect(sdkMocks.twilioCreate).toHaveBeenCalledWith({
      to: '+525512345678',
      from: '+15551234567',
      body: 'Code 123456',
    });
  });

  it('rejects SMS delivery when sender configuration is missing', async () => {
    delete process.env.TWILIO_FROM_NUMBER;

    await expect(
      new TwilioClient().sendSms({ to: '+525512345678', body: 'Code 123456' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(sdkMocks.twilioCreate).not.toHaveBeenCalled();
  });
});
