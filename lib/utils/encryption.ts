/**
 * Encryption utilities for securing sensitive data at rest
 * Uses AES-256-GCM for authenticated encryption via Web Crypto API
 *
 * SECURITY: Tokens are encrypted before storage in Redis to prevent
 * plaintext exposure in case of Redis compromise or log leakage
 *
 * Compatible with Edge Runtime (uses Web Crypto API, not Node.js crypto)
 */

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96 bits (recommended for GCM)
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment and convert to CryptoKey
 * Key should be a 64-character hex string (32 bytes)
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyHex = process.env.REDIS_ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error('REDIS_ENCRYPTION_KEY environment variable is required for token encryption');
  }

  // Validate key format (should be 64 hex characters = 32 bytes)
  if (!/^[0-9a-f]{64}$/i.test(keyHex)) {
    throw new Error('REDIS_ENCRYPTION_KEY must be a 64-character hexadecimal string');
  }

  // Convert hex string to Uint8Array
  const keyData = new Uint8Array(
    keyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );

  // Import key for Web Crypto API
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Convert string to Uint8Array
 */
function stringToUint8Array(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Convert Uint8Array to string
 */
function uint8ArrayToString(array: Uint8Array): string {
  const decoder = new TextDecoder();
  return decoder.decode(array);
}

/**
 * Convert Uint8Array to base64 string
 */
function uint8ArrayToBase64(array: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < array.length; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return array;
}

/**
 * Encrypt sensitive data using AES-256-GCM (Web Crypto API)
 *
 * @param plaintext - The data to encrypt (string)
 * @returns Encrypted data in format: iv:encryptedData (base64)
 */
export async function encrypt(plaintext: string): Promise<string> {
  try {
    const key = await getEncryptionKey();

    // Generate random IV (initialization vector)
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Convert plaintext to Uint8Array
    const plaintextArray = stringToUint8Array(plaintext);

    // Encrypt the data
    // Use .slice() to ensure proper ArrayBuffer type for TypeScript
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv.slice(),
      },
      key,
      plaintextArray.slice()
    ) as ArrayBuffer;

    const encryptedArray = new Uint8Array(encryptedBuffer);

    // Return format: iv:encryptedData (all base64 encoded)
    // Note: GCM includes auth tag in the encrypted output automatically
    return [
      uint8ArrayToBase64(iv),
      uint8ArrayToBase64(encryptedArray),
    ].join(':');

  } catch (error) {
    console.error('❌ Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data encrypted with encrypt()
 *
 * @param encryptedData - Encrypted data in format: iv:encryptedData (base64)
 * @returns Decrypted plaintext string
 */
export async function decrypt(encryptedData: string): Promise<string> {
  try {
    const key = await getEncryptionKey();

    // Parse the encrypted data format
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivBase64, encryptedBase64] = parts;

    // Decode from base64
    const iv = base64ToUint8Array(ivBase64);
    const encrypted = base64ToUint8Array(encryptedBase64);

    // Validate IV length
    if (iv.length !== IV_LENGTH) {
      throw new Error('Invalid IV length');
    }

    // Decrypt the data
    // Use .slice() to ensure proper ArrayBuffer type for TypeScript
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv.slice(),
      },
      key,
      encrypted.slice()
    ) as ArrayBuffer;

    const decryptedArray = new Uint8Array(decryptedBuffer);
    return uint8ArrayToString(decryptedArray);

  } catch (error) {
    console.error('❌ Decryption failed:', error);
    throw new Error('Failed to decrypt data - data may be corrupted or key is incorrect');
  }
}

/**
 * Generate a random encryption key for REDIS_ENCRYPTION_KEY
 * Run this once and store the output in your .env.local file
 *
 * @returns 64-character hex string (32 bytes)
 */
export function generateEncryptionKey(): string {
  const array = crypto.getRandomValues(new Uint8Array(KEY_LENGTH));
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
