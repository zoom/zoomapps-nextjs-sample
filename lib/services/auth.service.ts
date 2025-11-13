/**
 * Authentication Service (Client-Side)
 * Handles client-side authentication flows and session management
 */

import crypto from "crypto";
import { createClient } from "@/utils/supabase/client";
import { config } from "@/lib/config/environment";
import type { 
  OAuthUrlResponse, 
  AuthSession,
  SupabaseTokens 
} from "@/lib/types/auth";

class AuthService {
  /**
   * Generate secure random state for OAuth flow
   */
  generateOAuthState(): string {
    return crypto.randomBytes(12).toString("hex");
  }

  /**
   * Initialize Zoom OAuth with Supabase for embedded Zoom app
   */
  async initiateZoomAppAuth(origin: string): Promise<OAuthUrlResponse> {
    const state = this.generateOAuthState();
    const zoomAppRedirect = `${origin}/zoom/launch?state=${state}`;
    const supabaseAuthUrl = `${config.supabase.url}/auth/v1/authorize?provider=zoom&redirect_to=${encodeURIComponent(zoomAppRedirect)}`;
    
    return { url: supabaseAuthUrl };
  }

  /**
   * Initialize standard Zoom OAuth with Supabase
   */
  async initiateZoomAuth(origin: string): Promise<string> {
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'zoom',
      options: {
        skipBrowserRedirect: true,
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      throw new AuthError(error.message);
    }

    if (!data.url) {
      throw new AuthError("No OAuth URL generated");
    }

    return data.url;
  }

  /**
   * Handle OAuth callback and exchange code for session (client-side)
   */
  async exchangeCodeForSession(code: string): Promise<AuthSession> {
    const supabase = createClient();
    
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
   
    if (error) {
      throw new AuthError(error.message);
    }

    return data.session as AuthSession;
  }

  /**
   * Set Supabase session with tokens (client-side)
   */
  async setClientSession(accessToken: string, refreshToken: string): Promise<AuthSession> {
    const supabase = createClient();
    
    const { error, data } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      throw new AuthError(error.message);
    }

    return data.session as AuthSession;
  }

  /**
   * Get current user session
   */
  async getCurrentSession(): Promise<AuthSession | null> {
    const supabase = createClient();
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw new AuthError(error.message);
    }

    return session as AuthSession | null;
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    const supabase = createClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw new AuthError(error.message);
    }

    return user;
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new AuthError(error.message);
    }
  }

  /**
   * Refresh user session
   */
  async refreshSession(): Promise<AuthSession> {
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      throw new AuthError(error.message);
    }

    return data.session as AuthSession;
  }

  /**
   * Listen to authentication state changes
   */
  onAuthStateChange(callback: (event: any, session: any) => void) {
    const supabase = createClient();
    
    return supabase.auth.onAuthStateChange(callback);
  }
}

class AuthError extends Error {
  public status?: number;
  public code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
  }
}

export const authService = new AuthService();
export { AuthService, AuthError };