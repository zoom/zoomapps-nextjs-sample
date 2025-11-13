/**
 * Authentication Service (Server-Side)
 * Handles server-side authentication operations
 */

import crypto from "crypto";
import { createClient } from "@/utils/supabase/server";
import { config } from "@/lib/config/environment";
import type { 
  OAuthUrlResponse, 
  AuthSession,
} from "@/lib/types/auth";

class AuthServerService {
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
    const supabase = await createClient();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'zoom',
      options: {
        skipBrowserRedirect: true,
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      throw new AuthServerError(error.message);
    }

    if (!data.url) {
      throw new AuthServerError("No OAuth URL generated");
    }

    return data.url;
  }

  /**
   * Handle OAuth callback and exchange code for session
   */
  async handleOAuthCallback(code: string): Promise<AuthSession> {
    const supabase = await createClient();
    
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
   
    if (error) {
      throw new AuthServerError(error.message);
    }

    return data.session as AuthSession;
  }

  /**
   * Get current user session
   */
  async getCurrentSession(): Promise<AuthSession | null> {
    try {
      const supabase = await createClient();
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw new AuthServerError(error.message);
      }

      return session as AuthSession | null;
    } catch (error) {
      // Handle case where Supabase client can't be created (missing env vars)
      console.warn('Failed to create Supabase client:', (error as Error).message);
      return null;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const supabase = await createClient();
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        throw new AuthServerError(error.message);
      }

      return user;
    } catch (error) {
      // Handle case where Supabase client can't be created (missing env vars)
      console.warn('Failed to create Supabase client for user:', (error as Error).message);
      return null;
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new AuthServerError(error.message);
    }
  }
}

class AuthServerError extends Error {
  public status?: number;
  public code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "AuthServerError";
    this.status = status;
    this.code = code;
  }
}

export const authServerService = new AuthServerService();
export { AuthServerService, AuthServerError };