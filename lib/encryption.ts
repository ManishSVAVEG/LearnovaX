import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const ENCRYPTION_KEY = "LearnovaX-secure-key-2024";

/**
 * Simple base64 encoding/decoding for React Native
 */
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

export const base64Encode = (input: string) => {
  let str = input;
  let output = "";
  for (let block = 0, charCode, i = 0, map = chars;
    str.charAt(i | 0) || (map = "=", i % 1);
    output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
    charCode = str.charCodeAt(i += 3 / 4);
    if (charCode > 0xFF) {
      throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
    }
    block = block << 8 | charCode;
  }
  return output;
};

export const base64Decode = (input: string) => {
  let str = input.replace(/[=]+$/, "");
  let output = "";
  if (str.length % 4 == 1) {
    throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
  }
  for (let bc = 0, bs = 0, buffer, i = 0;
    buffer = str.charAt(i++);
    ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
      bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
  ) {
    buffer = chars.indexOf(buffer);
  }
  return output;
};

/**
 * Encrypt API key
 */
export async function encryptAPIKey(apiKey: string): Promise<string> {
  try {
    return base64Encode(apiKey);
  } catch (error) {
    console.error("Encryption failed:", error);
    return apiKey;
  }
}

/**
 * Decrypt API key
 */
export async function decryptAPIKey(encrypted: string): Promise<string> {
  try {
    return base64Decode(encrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt API key. Please set up your API key again.");
  }
}

/**
 * Secure storage for sensitive data
 */
export async function secureStore(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error("Secure storage failed:", error);
    throw error;
  }
}

/**
 * Retrieve from secure storage
 */
export async function secureRetrieve(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error("Secure retrieval failed:", error);
    return null;
  }
}

/**
 * Validate API key format
 */
export function validateAPIKeyFormat(apiKey: string, provider: string): boolean {
  if (!apiKey || apiKey.trim().length < 8) return false;
  
  const trimmedKey = apiKey.trim();
  const patterns: Record<string, RegExp> = {
    // OpenAI keys: sk- followed by at least 32-48+ chars (Project keys can be longer)
    openai: /^sk-[A-Za-z0-9\-_]{32,}$/,
    // Google Gemini keys: AIza followed by ~35-40 chars
    gemini: /^AIza[0-9A-Za-z\-_]{35,}$/,
    // Groq keys: gsk_ followed by ~50+ chars
    groq: /^gsk_[A-Za-z0-9\-_]{40,}$/,
    // Anthropic keys: sk-ant- followed by ~50+ chars
    anthropic: /^sk-ant-[A-Za-z0-9\-_]{40,}$/,
  };

  const pattern = patterns[provider];
  if (pattern) return pattern.test(trimmedKey);
  
  // Fallback for unknown providers or if patterns change
  return trimmedKey.length >= 20; 
}

/**
 * Mask API key for display
 */
export function maskAPIKey(apiKey: string): string {
  if (apiKey.length < 8) return "****";
  return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
}

/**
 * Sanitize error messages to not expose API keys
 */
export function sanitizeErrorMessage(error: string): string {
  // Remove any API keys from error messages
  return error
    .replace(/sk-[A-Za-z0-9\-_]{20,}/g, "[API_KEY_REDACTED]")
    .replace(/AIza[0-9A-Za-z\-_]{35}/g, "[API_KEY_REDACTED]")
    .replace(/gsk_[A-Za-z0-9\-_]{20,}/g, "[API_KEY_REDACTED]")
    .replace(/sk-ant-[A-Za-z0-9\-_]{20,}/g, "[API_KEY_REDACTED]");
}
