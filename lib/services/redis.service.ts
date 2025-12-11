/**
 * Redis Service
 * Centralized Redis operations for token storage and session management
 * Uses AES-256-GCM encryption for secure token storage
 */

import { Redis } from '@upstash/redis';
import { config } from '@/lib/config/environment';
import type { SupabaseTokens } from '@/lib/types/auth';
import { encrypt, decrypt } from '@/lib/utils/encryption';

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
   * Store Supabase tokens in Redis with TTL (encrypted)
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
    const plaintext = JSON.stringify({
      accessToken,
      refreshToken,
      expiresAt
    });

    // Encrypt tokens before storing in Redis
    const encryptedValue = await encrypt(plaintext);

    await this.redis.set(key, encryptedValue, { ex: ttl });
  }

  /**
   * Retrieve Supabase tokens from Redis (decrypted)
   * Handles both encrypted (new) and unencrypted (legacy) tokens
   */
  async getSupabaseTokens(state: string): Promise<SupabaseTokens> {
    const key = this.getUserTokenKey(state);
    const raw = await this.redis.get(key);

    if (!raw) {
      throw new RedisError("Supabase tokens not found in Redis", "TOKEN_NOT_FOUND");
    }

    const dataStr = typeof raw === 'string' ? raw : JSON.stringify(raw);
    let parsed: any;

    try {
      // Try to decrypt first (new encrypted format)
      const decryptedJson = await decrypt(dataStr);
      parsed = JSON.parse(decryptedJson);
      console.log("✅ Tokens decrypted successfully from Redis");
    } catch (decryptError) {
      // If decryption fails, try parsing as plain JSON (legacy unencrypted format)
      console.warn("⚠️  Decryption failed, attempting to parse as legacy unencrypted format");
      try {
        parsed = JSON.parse(dataStr);
        console.log("✅ Legacy unencrypted tokens found, will re-encrypt");

        // Auto-migrate: re-encrypt and store the old unencrypted data
        const encryptedValue = await encrypt(dataStr);
        await this.redis.set(key, encryptedValue, { ex: this.DEFAULT_TTL });
        console.log("✅ Legacy tokens migrated to encrypted format");
      } catch (parseError) {
        throw new RedisError(
          "Failed to decrypt or parse token data. Data may be corrupted.",
          "DECRYPTION_FAILED"
        );
      }
    }

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
   * Update specific fields in stored user data (decrypt/update/encrypt)
   * Handles both encrypted (new) and unencrypted (legacy) data
   */
  async updateUserData(
    state: string,
    updates: Partial<Record<string, unknown>>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    const key = this.getUserTokenKey(state);
    const rawData = await this.redis.get<string>(key);

    if (!rawData) {
      throw new RedisError("User data not found for update", "USER_NOT_FOUND");
    }

    let existing: Record<string, unknown>;

    try {
      // Try to decrypt first (new encrypted format)
      const decryptedJson = await decrypt(rawData);
      existing = JSON.parse(decryptedJson) as Record<string, unknown>;
    } catch (decryptError) {
      // If decryption fails, try parsing as plain JSON (legacy format)
      try {
        existing = JSON.parse(rawData) as Record<string, unknown>;
      } catch (parseError) {
        throw new RedisError("Failed to decrypt or parse user data", "DATA_CORRUPTED");
      }
    }

    // Apply updates
    const updated = { ...existing, ...updates };

    // Re-encrypt and store
    const encryptedValue = await encrypt(JSON.stringify(updated));
    await this.redis.set(key, encryptedValue, { ex: ttl });
  }

  /**
   * Remove access token (logout while keeping refresh token)
   * Handles both encrypted (new) and unencrypted (legacy) data
   */
  async removeAccessToken(
    state: string,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    const key = this.getUserTokenKey(state);
    const rawData = await this.redis.get<string>(key);

    if (!rawData) {
      throw new RedisError("User not found for logout", "USER_NOT_FOUND");
    }

    let parsed: Record<string, unknown>;

    try {
      // Try to decrypt first (new encrypted format)
      const decryptedJson = await decrypt(rawData);
      parsed = JSON.parse(decryptedJson) as Record<string, unknown>;
    } catch (decryptError) {
      // If decryption fails, try parsing as plain JSON (legacy format)
      try {
        parsed = JSON.parse(rawData) as Record<string, unknown>;
      } catch (parseError) {
        throw new RedisError("Failed to decrypt or parse user data", "DATA_CORRUPTED");
      }
    }

    // Remove access token
    delete parsed.accessToken;

    // Re-encrypt and store
    const encryptedValue = await encrypt(JSON.stringify(parsed));
    await this.redis.set(key, encryptedValue, { ex: ttl });
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