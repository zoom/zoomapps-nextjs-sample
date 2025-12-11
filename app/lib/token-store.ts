// token-store.ts
// Secure token storage with encryption at rest

import { Redis } from '@upstash/redis';
import { encrypt, decrypt } from '@/lib/utils/encryption';

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

  // Decrypt the encrypted token data
  const encryptedData = typeof raw === 'string' ? raw : JSON.stringify(raw);
  const decryptedJson = await decrypt(encryptedData);

  // Parse the decrypted value and ensure it matches SupabaseTokens
  const parsed = JSON.parse(decryptedJson);
  if (
    typeof parsed.accessToken === 'string' &&
    typeof parsed.refreshToken === 'string' &&
    typeof parsed.expiresAt === 'number'
  ) {
    console.log("✅ Tokens decrypted successfully from Redis");
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
  const plaintext = JSON.stringify({ accessToken, refreshToken, expiresAt });

  // Encrypt the token data before storing in Redis
  const encryptedValue = await encrypt(plaintext);

  console.log("✅ Tokens encrypted before storing in Redis");

  // Set with a TTL of 1 hour (3600 seconds)
  await redis.set(key, encryptedValue, { ex: 3600 });
}

// Update just part of the stored user data
export async function updateSupabaseUser(
  userId: string,
  updates: Partial<Record<string, unknown>>
): Promise<void> {
  const key = `supabase:user:${userId}`;
  const encryptedData = await redis.get<string>(key);
  if (!encryptedData) {
    throw new Error("User not found");
  }

  // Decrypt existing data
  const decryptedJson = await decrypt(encryptedData);
  const existing = JSON.parse(decryptedJson) as Record<string, unknown>;

  // Apply updates
  const updated = { ...existing, ...updates };

  // Re-encrypt and store
  const encryptedValue = await encrypt(JSON.stringify(updated));
  await redis.set(key, encryptedValue, { ex: 3600 });
}

// Remove access token only
export async function logoutSupabaseUser(
  userId: string
): Promise<void> {
  const key = `supabase:user:${userId}`;
  const encryptedData = await redis.get<string>(key);
  if (!encryptedData) {
    throw new Error("User not found");
  }

  // Decrypt existing data
  const decryptedJson = await decrypt(encryptedData);
  const parsed = JSON.parse(decryptedJson) as Record<string, unknown>;

  // Remove access token
  delete parsed.accessToken;

  // Re-encrypt and store
  const encryptedValue = await encrypt(JSON.stringify(parsed));
  await redis.set(key, encryptedValue, { ex: 3600 });
}

// Delete user from Redis
export async function deleteSupabaseUser(userId: string) {
  await redis.del(`supabase:user:${userId}`);
}
