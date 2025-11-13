/**
 * Redis Service
 * Centralized Redis operations for token storage and session management
 */

import { Redis } from '@upstash/redis';
import { config } from '@/lib/config/environment';
import type { SupabaseTokens } from '@/lib/types/auth';

class RedisService {
  private redis: Redis;
  private readonly DEFAULT_TTL = 3600; // 1 hour in seconds

  constructor() {
    this.redis = new Redis({
      url: config.redis.url,
      token: config.redis.token,
    });
  }

  /**
   * Generate Redis key for user tokens
   */
  private getUserTokenKey(state: string): string {
    return `supabase:user:${state}`;
  }

  /**
   * Generate Redis key for user's latest state
   */
  private getUserStateKey(userId: string): string {
    return `user:${userId}:latestState`;
  }

  /**
   * Store Supabase tokens in Redis with TTL
   */
  async storeSupabaseTokens(
    state: string, 
    accessToken: string, 
    refreshToken: string, 
    expiresAt: number,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    this.validateTokenInputs(state, accessToken, refreshToken, expiresAt);

    const key = this.getUserTokenKey(state);
    const value = JSON.stringify({ 
      accessToken, 
      refreshToken, 
      expiresAt 
    });

    await this.redis.set(key, value, { ex: ttl });
  }

  /**
   * Retrieve Supabase tokens from Redis
   */
  async getSupabaseTokens(state: string): Promise<SupabaseTokens> {
    const key = this.getUserTokenKey(state);
    const raw = await this.redis.get(key);

    if (!raw) {
      throw new RedisError("Supabase tokens not found in Redis", "TOKEN_NOT_FOUND");
    }

    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    
    if (!this.isValidSupabaseTokens(parsed)) {
      throw new RedisError("Invalid token format in Redis", "INVALID_TOKEN_FORMAT");
    }

    return parsed as SupabaseTokens;
  }

  /**
   * Store user's latest state for Team Chat lookups
   */
  async storeUserLatestState(
    userId: string, 
    state: string, 
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    if (!userId || !state) {
      throw new RedisError("User ID and state are required", "INVALID_INPUT");
    }

    const key = this.getUserStateKey(userId);
    await this.redis.set(key, state, { ex: ttl });
  }

  /**
   * Get user's latest state
   */
  async getUserLatestState(userId: string): Promise<string> {
    const key = this.getUserStateKey(userId);
    const raw = await this.redis.get(key);

    if (!raw) {
      throw new RedisError("User state not found in Redis", "STATE_NOT_FOUND");
    }

    return raw as string;
  }

  /**
   * Update specific fields in stored user data
   */
  async updateUserData(
    state: string,
    updates: Partial<Record<string, unknown>>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    const key = this.getUserTokenKey(state);
    const currentStr = await this.redis.get<string>(key);
    
    if (!currentStr) {
      throw new RedisError("User data not found for update", "USER_NOT_FOUND");
    }

    const existing = JSON.parse(currentStr) as Record<string, unknown>;
    const updated = { ...existing, ...updates };
    
    await this.redis.set(key, JSON.stringify(updated), { ex: ttl });
  }

  /**
   * Remove access token (logout while keeping refresh token)
   */
  async removeAccessToken(
    state: string, 
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    const key = this.getUserTokenKey(state);
    const currentStr = await this.redis.get<string>(key);
    
    if (!currentStr) {
      throw new RedisError("User not found for logout", "USER_NOT_FOUND");
    }

    const parsed = JSON.parse(currentStr) as Record<string, unknown>;
    delete parsed.accessToken;

    await this.redis.set(key, JSON.stringify(parsed), { ex: ttl });
  }

  /**
   * Delete user data completely
   */
  async deleteUserData(state: string): Promise<void> {
    const key = this.getUserTokenKey(state);
    await this.redis.del(key);
  }

  /**
   * Delete user's latest state
   */
  async deleteUserState(userId: string): Promise<void> {
    const key = this.getUserStateKey(userId);
    await this.redis.del(key);
  }

  /**
   * Check if Redis connection is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testKey = 'health:check';
      await this.redis.set(testKey, 'ok', { ex: 10 });
      const result = await this.redis.get(testKey);
      await this.redis.del(testKey);
      return result === 'ok';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  /**
   * Get Redis connection info
   */
  getConnectionInfo() {
    return {
      url: config.redis.url,
      connected: true, // Upstash Redis doesn't expose connection status directly
    };
  }

  /**
   * Validate token inputs
   */
  private validateTokenInputs(
    state: string, 
    accessToken: string, 
    refreshToken: string, 
    expiresAt: number
  ): void {
    const isValid = Boolean(
      typeof state === 'string' && state.length > 0 &&
      typeof accessToken === 'string' && accessToken.length > 0 &&
      typeof refreshToken === 'string' && refreshToken.length > 0 &&
      typeof expiresAt === 'number' && expiresAt > 0
    );

    if (!isValid) {
      throw new RedisError("Invalid token input parameters", "INVALID_INPUT");
    }
  }

  /**
   * Type guard for SupabaseTokens
   */
  private isValidSupabaseTokens(obj: any): obj is SupabaseTokens {
    return (
      obj &&
      typeof obj.accessToken === 'string' &&
      typeof obj.refreshToken === 'string' &&
      typeof obj.expiresAt === 'number'
    );
  }
}

class RedisError extends Error {
  public code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "RedisError";
    this.code = code;
  }
}

export const redisService = new RedisService();
export { RedisService, RedisError };