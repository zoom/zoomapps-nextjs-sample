/**
 * Authentication and session type definitions
 */

export interface SupabaseTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthUser {
  id: string;
  email?: string;
  aud: string;
  created_at: string;
  [key: string]: any;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  provider_token?: string;
  provider_refresh_token?: string;
  token_type: string;
  user: AuthUser;
}

export type AuthStatus = "idle" | "loading" | "success" | "error";

export interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

export interface OAuthUrlResponse {
  url: string;
}

export interface AuthCallbackParams {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}