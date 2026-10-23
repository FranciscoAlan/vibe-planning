/** Profiles that belong to a global user identity. */
export enum UserProfileType {
  CLIENT = 'client',
  EVENT_PLANNER = 'event_planner',
}

/** Roles assigned through an organization membership. */
export enum OrganizationRole {
  OWNER = 'owner',
  PROVIDER = 'provider',
  ADMIN = 'admin',
}

export enum AccountStatus {
  PENDING_VERIFICATION = 'pending_verification',
  ACTIVE = 'active',
}

export enum ChallengeChannel {
  SMS = 'sms',
  EMAIL = 'email',
}

export enum ChallengePurpose {
  PHONE_VERIFICATION = 'phone_verification',
  PHONE_LOGIN = 'phone_login',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
}

/** Login providers supported by the identity module. */
export enum AuthProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
  FACEBOOK = 'facebook',
  PHONE = 'phone',
  CREDENTIALS = 'credentials',
}

export interface IUser {
  id: string;
  email: string | null;
  emailVerifiedAt: string | null;
  phone: string | null;
  phoneVerifiedAt: string | null;
  status: AccountStatus;
  twoFactorEnabled: boolean;
  profiles: UserProfileType[];
  memberships: IOrganizationMembership[];
  createdAt: string;
  updatedAt: string;
}

export interface IUserProfile {
  id: string;
  userId: string;
  role: UserProfileType;
  createdAt: string;
}

export interface IOrganizationMembership {
  id: string;
  tenantId: string;
  userId: string;
  role: OrganizationRole;
  createdAt: string;
}

export interface IAuthSession {
  id: string;
  userId: string;
  familyId: string;
  twoFactorVerified: boolean;
  expiresAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface IVerificationChallenge {
  id: string;
  userId: string;
  channel: ChallengeChannel;
  purpose: ChallengePurpose;
  target: string;
  attempts: number;
  expiresAt: string;
  consumedAt: string | null;
  createdAt: string;
}

/** Links a user to one of the providers they used to sign in, to prevent duplicate accounts. */
export interface IAuthIdentity {
  id: string;
  userId: string;
  provider: AuthProvider;
  providerId: string;
  createdAt: string;
}
