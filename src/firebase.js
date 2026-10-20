import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

import { securityVault } from './services/securityVault.js';

// Abstracted and securely resolved Firebase configuration (zero plaintext keys in source)
const firebaseConfig = securityVault.getFirebaseConfig();

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export const analytics = (typeof window !== 'undefined' && typeof window.document !== 'undefined') ? getAnalytics(app) : null;

/**
 * Provision a real Firebase Auth user account without disrupting current admin session
 */
export async function provisionAuthUser(email, password, fullName) {
  let provisionerAuth;
  try {
    let provisionerApp;
    if (!getApps().some(a => a.name === 'UserProvisioner')) {
      provisionerApp = initializeApp(firebaseConfig, 'UserProvisioner');
    } else {
      provisionerApp = getApp('UserProvisioner');
    }
    provisionerAuth = getAuth(provisionerApp);
    const cred = await createUserWithEmailAndPassword(provisionerAuth, email.trim().toLowerCase(), password);
    await updateProfile(cred.user, { displayName: String(fullName || '').trim().replace(/\s+/g, ' ') });
    const uid = cred.user.uid;
    return uid;
  } catch (err) {
    console.warn("[Provisioner] Notice:", err.code, err.message);
    throw err;
  } finally {
    if (provisionerAuth) await signOut(provisionerAuth);
  }
}
