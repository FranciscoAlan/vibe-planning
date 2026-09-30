/** Roles a user can hold within a tenant. A user may hold more than one over time. */
export enum UserRole {
  CLIENT = "client",
  PROVIDER = "provider",
  EVENT_PLANNER = "event_planner",
  ADMIN = "admin",
}

/** Login providers supported by the identity module. */
export enum AuthProvider {
  GOOGLE = "google",
  APPLE = "apple",
  FACEBOOK = "facebook",
  PHONE = "phone",
  CREDENTIALS = "credentials",
}

export interface IUser {
  id: string;
  tenantId: string;
  email: string | null;
  phone: string | null;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Links a user to one of the providers they used to sign in, to prevent duplicate accounts. */
export interface IAuthIdentity {
  id: string;
  userId: string;
  provider: AuthProvider;
  providerId: string;
  createdAt: string;
}
