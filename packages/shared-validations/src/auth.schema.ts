import { z } from 'zod';
import { AuthProvider, ChallengePurpose, UserProfileType } from '@vibe-planners/shared-types';

/** Shared across all login providers: every account must resolve to one phone number. */
export const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, 'Phone must be in E.164 format, e.g. +525512345678');

export const emailSchema = z.string().trim().toLowerCase().email();

export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

export const verificationCodeSchema = z.string().regex(/^\d{6}$/, 'Code must contain 6 digits');

export const registerWithCredentialsSchema = z
  .object({
    email: emailSchema.optional(),
    phone: phoneSchema,
    password: passwordSchema.optional(),
    profile: z.nativeEnum(UserProfileType).optional(),
  })
  .refine(({ email, password }) => Boolean(email) === Boolean(password), {
    message: 'Email and password must be provided together',
    path: ['password'],
  });

export const requestPhoneChallengeSchema = z.object({
  phone: phoneSchema,
  purpose: z.enum([ChallengePurpose.PHONE_VERIFICATION, ChallengePurpose.PHONE_LOGIN]),
});

export const registerWithProviderSchema = z.object({
  provider: z.nativeEnum(AuthProvider),
  providerId: z.string().min(1),
  phone: phoneSchema,
  email: emailSchema.optional(),
});

export const loginWithCredentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const verifyTwoFactorSchema = z.object({
  code: verificationCodeSchema,
});

export const verifyChallengeSchema = z.object({
  challengeId: z.string().uuid(),
  code: verificationCodeSchema,
});

export const verifyPhoneChallengeSchema = z.object({
  phone: phoneSchema,
  purpose: z.enum([ChallengePurpose.PHONE_VERIFICATION, ChallengePurpose.PHONE_LOGIN]),
  code: verificationCodeSchema,
});

export const requestEmailVerificationSchema = z.object({
  email: emailSchema,
});

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  challengeId: z.string().uuid(),
  code: verificationCodeSchema,
  newPassword: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export const refreshSessionSchema = z.object({
  refreshToken: z.string().min(32),
});

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export type RegisterWithCredentialsInput = z.infer<typeof registerWithCredentialsSchema>;
export type RequestPhoneChallengeInput = z.infer<typeof requestPhoneChallengeSchema>;
export type RegisterWithProviderInput = z.infer<typeof registerWithProviderSchema>;
export type LoginWithCredentialsInput = z.infer<typeof loginWithCredentialsSchema>;
export type VerifyTwoFactorInput = z.infer<typeof verifyTwoFactorSchema>;
export type VerifyChallengeInput = z.infer<typeof verifyChallengeSchema>;
export type VerifyPhoneChallengeInput = z.infer<typeof verifyPhoneChallengeSchema>;
export type RequestEmailVerificationInput = z.infer<typeof requestEmailVerificationSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RefreshSessionInput = z.infer<typeof refreshSessionSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
