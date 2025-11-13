// token-store.js (or .ts)

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL,
  token: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN,
});

// Get Supabase tokens for a user
/**
 * @param {string} userId
 * @returns {Promise<string>} the latest OAuth state for the user
 */
export async function getSupabaseUserbyId(userId:string) {
  const key = `user:${userId}:latestState`;
  const raw = await redis.get(key);
  if (!raw) {
    console.error("Zoom App (embedded client) - Third-party OAuth user token not found in Redis");
    throw new Error("User not found");
  }
  return raw;
}

export interface SupabaseTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export async function getSupabaseUser(
  state: string
): Promise<SupabaseTokens> {
  
  console.log("Zoom App (embedded client) - Third-party OAuth state value:",state)
  const key = `supabase:user:${state}`;
  const raw = await redis.get(key);

  if (!raw) {
    console.error("Zoom App (embedded client) - Third-party OAuth Supabase tokens not found in Redis");
    throw new Error("User not found");
  }
  // Parse the raw value and ensure it matches SupabaseTokens
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (
    typeof parsed.accessToken === 'string' &&
    typeof parsed.refreshToken === 'string' &&
    typeof parsed.expiresAt === 'number'
  ) {
    return parsed as SupabaseTokens;
  } else {
    throw new Error("Invalid token format in Redis");
  }
}

// Insert or update Supabase tokens, add state
export async function upsertSupabaseUser(state: string, accessToken: string, refreshToken: string, expiresAt: number) {
  const isValid = Boolean(
    typeof state === 'string' &&
    typeof accessToken === 'string' &&
    typeof refreshToken === 'string' &&
    typeof expiresAt === 'number'
  );

  if (!isValid) {
    return Promise.reject('Invalid Supabase user input');
  }

  const key = `supabase:user:${state}`;
  const value = JSON.stringify({ accessToken, refreshToken, expiresAt });

  // Set with a TTL of 1 hour (3600 seconds)
  await redis.set(key, value, { ex: 3600 });
}

// Update just part of the stored user data
export async function updateSupabaseUser(
  userId: string,
  updates: Partial<Record<string, unknown>>
): Promise<void> {
  const key = `supabase:user:${userId}`;
  const currentStr = await redis.get<string>(key);
  if (!currentStr) {
    throw new Error("User not found");
  }

  const existing = JSON.parse(currentStr) as Record<string, unknown>;
  const updated = { ...existing, ...updates };
  await redis.set(key, JSON.stringify(updated), { ex: 3600 });
}

// Remove access token only
export async function logoutSupabaseUser(
  userId: string
): Promise<void> {
  const key = `supabase:user:${userId}`;
  const currentStr = await redis.get<string>(key);
  if (!currentStr) {
    throw new Error("User not found");
  }

  const parsed = JSON.parse(currentStr) as Record<string, unknown>;
  delete parsed.accessToken;

  await redis.set(key, JSON.stringify(parsed), { ex: 3600 });
}

// Delete user from Redis
export async function deleteSupabaseUser(userId: string) {
  await redis.del(`supabase:user:${userId}`);
}
