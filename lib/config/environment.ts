/**
 * Centralized environment configuration
 * All environment variables are validated and typed here
 */

interface ZoomConfig {
  host: string;
  apiHost: string;
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
  oauthStateSecret: string;
}

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

interface RedisConfig {
  url: string;
  token: string;
}

interface AppConfig {
  nodeEnv: string;
  siteUrl: string;
  isProduction: boolean;
  isDevelopment: boolean;
}

class EnvironmentConfig {
  public readonly zoom: ZoomConfig;
  public readonly supabase: SupabaseConfig;
  public readonly redis: RedisConfig;
  public readonly app: AppConfig;

  constructor() {
    // Only validate in runtime when actually using the services
    // Skip validation during build/static generation
    const isBuild = process.env.NEXT_PHASE === 'phase-production-build' || 
                   process.env.NEXT_PHASE === 'phase-export' ||
                   typeof window === 'undefined' && process.env.NODE_ENV === 'production';
    
    if (!isBuild && process.env.NODE_ENV === 'development') {
      try {
        this.validateRequiredEnvVars();
      } catch (error) {
        console.warn('Environment validation warning:', (error as Error).message);
      }
    }
    
    this.zoom = {
      host: process.env.ZOOM_HOST || "https://zoom.us",
      apiHost: process.env.ZOOM_API_HOST || "https://api.zoom.us",
      clientId: process.env.ZOOM_CLIENT_ID || "",
      clientSecret: process.env.ZOOM_CLIENT_SECRET || "",
      redirectUrl: process.env.ZOOM_REDIRECT_URL || "",
      oauthStateSecret: process.env.ZOOM_APP_OAUTH_STATE_SECRET || "",
    };

    this.supabase = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    };

    this.redis = {
      url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL || "",
      token: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN || "",
    };

    this.app = {
      nodeEnv: process.env.NODE_ENV || "development",
      siteUrl: process.env.SITE_URL || "https://localhost:3000",
      isProduction: process.env.NODE_ENV === "production",
      isDevelopment: process.env.NODE_ENV === "development",
    };
  }

  private validateRequiredEnvVars() {
    const required = [
      "ZOOM_CLIENT_ID",
      "ZOOM_CLIENT_SECRET", 
      "ZOOM_REDIRECT_URL",
      "ZOOM_APP_OAUTH_STATE_SECRET",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_UPSTASH_REDIS_REST_URL",
      "NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN",
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }
  }
}

export const config = new EnvironmentConfig();
export type { ZoomConfig, SupabaseConfig, RedisConfig, AppConfig };