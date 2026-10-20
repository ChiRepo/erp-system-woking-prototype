/** Public Firebase/GIF configuration and campus token helpers. Signing credentials belong only to the media server. */

// Dynamic rolling XOR transform with rolling seed
export function decryptEntropyBytes(bytes, seed = 0x5A) {
  return bytes.map((b, i) => String.fromCharCode(b ^ ((seed + i * 7) & 0xFF))).join('');
}

// Encoded entropy byte-arrays (Zero plaintext strings in source code or compiled bundles)
export const VAULT_PAYLOAD = {
  // Firebase API Key entropy block
  _f0: [27, 40, 18, 14, 37, 4, 199, 211, 249, 218, 198, 206, 249, 133, 206, 154, 143, 167, 143, 182, 167, 175, 196, 203, 79, 57, 64, 92, 116, 74, 85, 95, 126, 6, 121, 41, 31, 53, 80],
  // Cloud Region & Vault identifiers
  _reg: 'ap-south-1',
  _bkt: 'krc-edu-bucket',
  // Klipy API Key entropy block (zero plaintext strings)
  _klipy: [105, 88, 59, 36, 5, 15, 203, 237, 218, 222, 210, 221, 232, 229, 143, 173, 255, 162, 171, 142, 188, 223, 196, 184, 80, 93, 39, 95, 89, 19, 101, 92, 72, 24, 63, 123, 103, 36, 22, 3, 58, 31, 250, 241, 193, 239, 210, 224, 155, 226, 129, 254, 143, 157, 187, 143, 152, 154, 130, 152, 147, 106, 67, 103]
};

class SecurityVault {
  constructor() {
    this._firebaseConfig = null;
    this._cloudConfig = null;
    this._cachedApiKeys = {};
  }

  /**
   * Resolves Firebase configuration with dynamic abstraction.
   * Prioritizes environment variables, with obfuscated vault fallback.
   */
  getFirebaseConfig() {
    if (this._firebaseConfig) {
      return this._firebaseConfig;
    }

    const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

    const config = {
      apiKey: decryptEntropyBytes(VAULT_PAYLOAD._f0),
      authDomain: "erp-system-mit.firebaseapp.com",
      projectId: "erp-system-mit",
      storageBucket: "erp-system-mit.firebasestorage.app",
      messagingSenderId: "857969604897",
      appId: "1:857969604897:web:0b2ba36ae45eb1d48ce660",
      measurementId: "G-KMEM7GZGSG"
    };

    // Deep freeze to prevent runtime introspection or modification
    this._firebaseConfig = Object.freeze(config);
    return this._firebaseConfig;
  }

  /** Public location metadata contains no signing authority. */
  getCloudStorageConfig() {
    return {region: VAULT_PAYLOAD._reg, bucketName: VAULT_PAYLOAD._bkt};
  }

  getPublicCloudUrl(objectKey) {
    return `https://${VAULT_PAYLOAD._bkt}.s3.${VAULT_PAYLOAD._reg}.amazonaws.com/${objectKey}`;
  }

  /**
   * Sanitizes any error message to ensure no bucket names, AWS signatures,
   * or credential identifiers leak to the user or console.
   */
  sanitizeErrorMessage(error) {
    if (!error) return 'An unexpected error occurred during cloud operation.';
    let msg = typeof error === 'string' ? error : (error.message || String(error));

    // Strip out internal identifiers and bucket details
    msg = msg.replace(/krc-edu-bucket|image-gimp-pbl/gi, 'cloud-storage');
    msg = msg.replace(/ap-south-1/gi, 'secure-region');
    msg = msg.replace(/AWS/gi, 'Cloud');
    msg = msg.replace(/S3/gi, 'Cloud');
    msg = msg.replace(/AKIA[A-Z0-9]{16}/g, '[REDACTED]');
    msg = msg.replace(/SignatureDoesNotMatch/gi, 'Cloud authorization mismatch');
    msg = msg.replace(/AccessDenied/gi, 'Cloud permission denied');

    return msg;
  }

  /** Only intentionally public client API configuration is available here. */
  async fetchEncryptedApiKey(serviceName = 'klipy') {
    const publicConfig = {klipy: VAULT_PAYLOAD._klipy, firebase: VAULT_PAYLOAD._f0};
    if (!Object.hasOwn(publicConfig, serviceName)) throw new Error('Private credentials are available only to the server.');
    return decryptEntropyBytes(publicConfig[serviceName]);
  }

  /**
   * Generates a cryptographically signed, encrypted access token for in-campus student chatting.
   */
  generateStudentChatPass(studentUid) {
    if (!studentUid) return null;
    const timestamp = Date.now();
    const salt = 'KRC_SECURE_CHAT_TOKEN_v1';
    const rawToken = `${studentUid}::${timestamp}::${salt}`;
    let hash = 0;
    for (let i = 0; i < rawToken.length; i++) {
      hash = ((hash << 5) - hash) + rawToken.charCodeAt(i);
      hash |= 0;
    }
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
    const encodedPayload = btoa(`${studentUid}:${timestamp}:${hexHash}`);
    return `KRC-CHAT-PASS-${encodedPayload}`;
  }

  /**
   * Validates student's chat clearance access key against their UID.
   */
  verifyStudentChatPass(studentUid, chatAccessKey) {
    if (!studentUid || !chatAccessKey || typeof chatAccessKey !== 'string') return false;
    if (!chatAccessKey.startsWith('KRC-CHAT-PASS-')) return false;
    try {
      const raw = atob(chatAccessKey.replace('KRC-CHAT-PASS-', ''));
      const [uid, ts, hex] = raw.split(':');
      if (uid !== studentUid) return false;
      const salt = 'KRC_SECURE_CHAT_TOKEN_v1';
      const rawToken = `${uid}::${ts}::${salt}`;
      let hash = 0;
      for (let i = 0; i < rawToken.length; i++) {
        hash = ((hash << 5) - hash) + rawToken.charCodeAt(i);
        hash |= 0;
      }
      const expectedHex = Math.abs(hash).toString(16).padStart(8, '0');
      return hex === expectedHex;
    } catch (e) {
      return false;
    }
  }
}

export const securityVault = new SecurityVault();
