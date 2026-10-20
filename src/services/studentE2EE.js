/**
 * @fileoverview Student End-to-End Encryption (E2EE) Module
 * WebCrypto AES-GCM client-side encryption layer for in-campus student chats.
 * Encrypts direct-message text in the browser before database persistence.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

class StudentE2EE {
  constructor() {
    this.keyCache = new Map();
  }

  /**
   * Generates a new 256-bit AES-GCM conversation cryptographic key
   * Returns base64 representation of the raw key for secure storage
   */
  async generateConversationKey() {
    const key = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  /**
   * Imports a base64 key into a CryptoKey object and caches it
   */
  async importKey(base64Key, cacheId = null) {
    const cached = cacheId && this.keyCache.get(cacheId);
    if (cached?.source === base64Key) {
      return cached.key;
    }

    const binaryString = atob(base64Key);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      bytes,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );

    if (cacheId) {
      this.keyCache.set(cacheId, { source: base64Key, key: cryptoKey });
    }
    return cryptoKey;
  }

  async getKeyFingerprint(base64Key) {
    if (!base64Key) throw new Error('Select a direct conversation first.');
    const bytes = Uint8Array.from(atob(base64Key), char => char.charCodeAt(0));
    if (![16, 24, 32].includes(bytes.length)) throw new Error('The conversation key is invalid.');
    const digest = new Uint8Array(await window.crypto.subtle.digest('SHA-256', bytes));
    return Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Encrypts plaintext message using AES-GCM
   * Returns 'E2EE::' prefixed base64 payload containing IV + ciphertext
   */
  async encrypt(plaintext, keyInput, cacheId = null) {
    if (!plaintext || typeof plaintext !== 'string') return '';
    try {
      const key = typeof keyInput === 'string' 
        ? await this.importKey(keyInput, cacheId) 
        : keyInput;

      // 12-byte initialization vector (standard for AES-GCM)
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const encodedText = encoder.encode(plaintext);

      const ciphertext = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedText
      );

      // Pack IV (12 bytes) + Ciphertext into single base64 string
      const combined = new Uint8Array(iv.length + ciphertext.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(ciphertext), iv.length);

      const base64Cipher = btoa(String.fromCharCode(...combined));
      return `E2EE::${base64Cipher}`;
    } catch (err) {
      throw new Error('Message encryption failed. Your message was not sent.', { cause: err });
    }
  }

  /**
   * Decrypts ciphertext message using AES-GCM
   * If message is not encrypted, returns original text gracefully
   */
  async decrypt(ciphertextInput, keyInput, cacheId = null) {
    if (!ciphertextInput || typeof ciphertextInput !== 'string') return '';
    if (!ciphertextInput.startsWith('E2EE::')) {
      return ciphertextInput; // Graceful fallback for non-encrypted text
    }

    try {
      const key = typeof keyInput === 'string' 
        ? await this.importKey(keyInput, cacheId) 
        : keyInput;

      const base64Data = ciphertextInput.replace('E2EE::', '');
      const binaryString = atob(base64Data);
      const combined = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        combined[i] = binaryString.charCodeAt(i);
      }

      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (err) {
      console.warn('[E2EE] Decryption warning (key mismatch or corrupted):', err);
      return '[Encrypted Campus Message - Access Restricted]';
    }
  }

  /**
   * Clear in-memory cached keys upon sign out
   */
  clearCache() {
    this.keyCache.clear();
  }
}

export const studentE2EE = new StudentE2EE();
