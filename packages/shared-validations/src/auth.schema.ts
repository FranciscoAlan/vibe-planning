import { z } from "zod";
import { AuthProvider } from "@vibe-planners/shared-types";

/** Shared across all login providers: every account must resolve to one phone number. */
export const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, "Phone must be in E.164 format, e.g. +525512345678");

export const registerWithCredentialsSchema = z.object({
  tenantId: z.string().uuid(),
  email: z.string().email(),
  phone: phoneSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerWithProviderSchema = z.object({
  tenantId: z.string().uuid(),
  provider: z.nativeEnum(AuthProvider),
  providerId: z.string().min(1),
  phone: phoneSchema,
  email: z.string().email().optional(),
});

export const loginWithCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const verifyTwoFactorSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().length(6),
});

export type RegisterWithCredentialsInput = z.infer<typeof registerWithCredentialsSchema>;
export type RegisterWithProviderInput = z.infer<typeof registerWithProviderSchema>;
export type LoginWithCredentialsInput = z.infer<typeof loginWithCredentialsSchema>;
export type VerifyTwoFactorInput = z.infer<typeof verifyTwoFactorSchema>;
