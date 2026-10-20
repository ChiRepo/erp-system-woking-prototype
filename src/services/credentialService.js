/**
 * KRC Institutional Credential & Account Lifecycle Service
 * 
 * Secure Architecture:
 * - Real authentication and user verification is handled strictly by Firebase Authentication.
 * - Zero plaintext passwords are hardcoded in the codebase or saved in storage.
 * - Manages starting password lifecycle state (initial onboarding status) and generates
 *   high-entropy temporary starting passwords for administrative provisioning.
 */
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { sanitizeEnrollmentData } from '../utils/enrollmentCache.js';

const STORAGE_KEY = 'krc_account_security_lifecycle';

class CredentialService {
  constructor() {
    this._purgeLegacyInsecureCredentials();
  }

  /**
   * Defensive security scrub: Wipes any legacy plaintext passwords stored in browser storage
   */
  _purgeLegacyInsecureCredentials() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      
      const oldRaw = localStorage.getItem('krc_user_credentials');
      if (oldRaw) {
        const parsed = JSON.parse(oldRaw);
        // Strip out all plaintext password fields from local storage
        const sanitized = {};
        for (const [key, val] of Object.entries(parsed)) {
          if (val && typeof val === 'object') {
            sanitized[key] = sanitizeEnrollmentData(val);
          }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
        localStorage.removeItem('krc_user_credentials');
      }
    } catch (e) {
      console.debug('[CredentialService] Storage hygiene notice');
    }
  }

  /**
   * Retrieves account lifecycle metadata (safe flags only, zero passwords)
   */
  getAllAccounts() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? sanitizeEnrollmentData(JSON.parse(saved)) : {};
    } catch (e) {
      return {};
    }
  }

  saveAllAccounts(records) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeEnrollmentData(records)));
    } catch (e) {
      console.error('[CredentialService] Failed to record security state', e);
    }
  }

  removeCredential(email) {
    if (!email) return false;
    const cleanEmail = String(email).toLowerCase().trim();
    const accounts = this.getAllAccounts();
    if (accounts[cleanEmail]) {
      delete accounts[cleanEmail];
      this.saveAllAccounts(accounts);
      return true;
    }
    return false;
  }

  getUserCredential(email) {
    if (!email) return null;
    const cleanEmail = String(email).toLowerCase().trim();
    const accounts = this.getAllAccounts();
    return accounts[cleanEmail] || null;
  }

  /**
   * Records starting password onboarding state for newly provisioned user.
   * NOTE: The actual credentials are registered directly in Firebase Authentication;
   * this only tracks the requirement to change password upon first sign-in.
   */
  setStartingPassword(email, _unneededPassword, role, name) {
    if (!email) return false;
    const cleanEmail = String(email).toLowerCase().trim();
    const accounts = this.getAllAccounts();
    accounts[cleanEmail] = {
      role: role || 'student',
      name: name || cleanEmail.split('@')[0],
      mustChangePassword: true,
      isStartingPassword: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.saveAllAccounts(accounts);
    return true;
  }

  /**
   * Updates state once user sets their permanent personal password
   */
  updatePassword(email, _newPassword = null) {
    if (!email) return false;
    const cleanEmail = String(email).toLowerCase().trim();
    const accounts = this.getAllAccounts();
    const existing = accounts[cleanEmail] || {
      role: 'student',
      name: cleanEmail.split('@')[0]
    };
    accounts[cleanEmail] = {
      ...existing,
      mustChangePassword: false,
      isStartingPassword: false,
      updatedAt: new Date().toISOString()
    };
    this.saveAllAccounts(accounts);
    return true;
  }

  /**
   * Verifies credentials authoritatively via Firebase Authentication
   */
  async verifyPassword(email, password) {
    if (!email || !password) return false;
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), String(password).trim());
      return Boolean(result?.user);
    } catch (err) {
      return false;
    }
  }

  /**
   * Checks whether the user is still on an administrative starting password
   */
  isStartingPassword(email) {
    if (!email) return false;
    const cleanEmail = String(email).toLowerCase().trim();
    const cred = this.getUserCredential(cleanEmail);
    return Boolean(cred?.mustChangePassword || cred?.isStartingPassword);
  }

  /**
   * Generates a high-entropy compliant temporary password for admin provisioning
   */
  generateRandomPassword(prefix = 'Krc') {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let entropy = '';
    const array = new Uint8Array(6);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
      for (let i = 0; i < array.length; i++) {
        entropy += chars[array[i] % chars.length];
      }
    } else {
      entropy = String(Math.floor(100000 + Math.random() * 900000));
    }
    return `${prefix}@${entropy}`;
  }
}

export const credentialService = new CredentialService();
