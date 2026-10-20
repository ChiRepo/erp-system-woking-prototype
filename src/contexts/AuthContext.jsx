import { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { collection, doc, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { firestoreService } from '../services/firestoreService';
import { cloudStorageService } from '../services/cloudStorageService';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  signInWithRedirect, 
  getRedirectResult,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { studentChatService } from '../services/studentChatService';
import { isAdminIdentity, normalizeEmail, registeredRole, enrollmentAllowsSession } from '../utils/authPolicy';
import { AuthContext } from './authSession';
import { enterGoogleSignIn } from '../utils/googleSignInEntry.js';
import { persistEnrollmentProfile } from '../utils/enrollmentPersistence.js';
export { useAuth } from './authSession';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const authRevision = useRef(0);

  const resolveUserAndRole = async (currentUser) => {
    const token = await currentUser.getIdTokenResult();
    const email = normalizeEmail(currentUser.email);
    const admin = isAdminIdentity(email, token.signInProvider, token.claims.email_verified === true);
    let profile = await firestoreService.getUserProfile(currentUser.uid);
    const allowsSession = candidate => enrollmentAllowsSession(candidate, email, token.signInProvider, token.claims.email_verified === true);
    const hasUidEnrollment = allowsSession(profile);
    let resolvedRole = admin ? 'admin' : hasUidEnrollment ? registeredRole(profile) : 'guest';

    // Resolve only database enrollment. Browser caches and email domains grant no role.
    const canLookUpEnrollment = token.signInProvider === 'password' || (token.signInProvider === 'google.com' && token.claims.email_verified === true);
    if (!admin && resolvedRole === 'guest' && email && canLookUpEnrollment) {
      const keys = token.signInProvider === 'google.com' ? [`google_${email}`, email] : [email];
      for (const key of keys) {
        const candidate = await firestoreService.getUserProfile(key);
        if (allowsSession(candidate)) {
          profile = candidate;
          resolvedRole = registeredRole(candidate);
          break;
        }
      }
      const fields = token.signInProvider === 'google.com' ? ['googleEmail', 'email'] : ['email'];
      for (const field of fields) {
        if (resolvedRole !== 'guest') break;
        try {
          const snapshot = await getDocs(query(collection(db, 'users'), where(field, '==', email)));
          const candidate = snapshot.docs.map(doc => doc.data()).find(allowsSession);
          if (candidate) {
            profile = candidate;
            resolvedRole = registeredRole(candidate);
          }
        } catch (error) {
          console.debug('[Auth] Enrollment lookup unavailable:', error.code);
        }
      }
    }

    if (!admin && !hasUidEnrollment && resolvedRole !== 'guest') {
      await persistEnrollmentProfile(currentUser.uid, profile, (...args) => firestoreService.setUserProfile(...args));
    }

    return {
      ...currentUser,
      ...(profile || {}),
      // A PRN/email alias must never replace the actual Firebase session UID.
      uid: currentUser.uid,
      email: currentUser.email,
      institutionalEmail: profile?.email || currentUser.email,
      role: resolvedRole,
      signInProvider: token.signInProvider,
      displayName: profile?.name || profile?.displayName || currentUser.displayName || email.split('@')[0],
      name: profile?.name || profile?.displayName || currentUser.displayName || email.split('@')[0],
      photoURL: profile?.photoURL || currentUser.photoURL || null,
      initialPhotoURL: profile?.initialPhotoURL || currentUser.photoURL || null,
      uploadedPhotos: profile?.uploadedPhotos || [],
      prn: profile?.prn || '',
      allowChatting: resolvedRole === 'student' && profile?.allowChatting !== false
    };
  };

  const storeResolvedUser = (resolved) => {
    localStorage.removeItem('krc_active_user');
    if (resolved.role === 'guest') {
      localStorage.removeItem('krc_user_pref_dashboard');
    } else {
      localStorage.setItem('krc_user_pref_dashboard', resolved.role);
    }
    setUser(resolved);
    setRole(resolved.role);
  };

  useEffect(() => {
    let active = true;
    // The auth observer handles popup, email, redirect and restored sessions uniformly.
    getRedirectResult(auth).catch(error => {
      if (active) setAuthError(error.message || 'Google sign-in failed.');
    });
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const revision = ++authRevision.current;
      if (!currentUser) {
        localStorage.removeItem('krc_active_user');
        localStorage.removeItem('krc_user_pref_dashboard');
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const resolved = await resolveUserAndRole(currentUser);
        if (active && revision === authRevision.current) storeResolvedUser(resolved);
      } catch (error) {
        if (active && revision === authRevision.current) {
          setAuthError('Unable to verify institutional access. Please sign in again.');
          storeResolvedUser({ uid: currentUser.uid, email: currentUser.email, role: 'guest' });
        }
      } finally {
        if (active && revision === authRevision.current) setLoading(false);
      }
    });
    return () => {
      active = false;
      ++authRevision.current;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.uid || !auth.currentUser) return;
    let active = true;
    let revision = 0;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), async () => {
      const current = auth.currentUser;
      const request = ++revision;
      if (!current) return;
      try {
        const resolved = await resolveUserAndRole(current);
        if (active && request === revision && auth.currentUser?.uid === resolved.uid) storeResolvedUser(resolved);
      } catch (error) {
        console.debug('[Auth] Profile refresh unavailable:', error.code);
      }
    });
    return () => { active = false; unsubscribe(); };
  }, [user?.uid]);

  // Universal real-time dynamic avatar synchronization
  useEffect(() => {
    const handleAvatarUpdate = (e) => {
      const { uid, avatarUrl } = e.detail || {};
      if (avatarUrl === undefined) return;
      if (user && (!uid || user.uid === uid || user.prn === uid || uid === 'current')) {
        setUser(prev => {
          if (!prev) return null;
          const updated = { ...prev, photoURL: avatarUrl };
          if (prev.isLocalAuth) {
            localStorage.setItem('krc_active_user', JSON.stringify({ ...updated, role }));
          }
          return updated;
        });
      }
    };

    const handleStorageUpdate = (e) => {
      if (user && e.key === `krc_student_avatar_${user.uid}`) {
        setUser(prev => prev ? { ...prev, photoURL: e.newValue } : null);
      }
    };

    window.addEventListener('krc_avatar_updated', handleAvatarUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('krc_avatar_updated', handleAvatarUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [user, role]);

  const signIn = async (email, password) => {
    setAuthError('');
    const credential = await signInWithEmailAndPassword(auth, normalizeEmail(email), String(password || ''));
    const resolved = await resolveUserAndRole(credential.user);
    if (auth.currentUser?.uid === resolved.uid) storeResolvedUser(resolved);
    return { user: resolved, role: resolved.role };
  };

  const signInWithGoogle = async ({ redirect = false } = {}) => {
    setAuthError('');
    try {
      const result = await enterGoogleSignIn(window.location, {
        navigate: target => window.location.assign(target),
        popup: () => signInWithPopup(auth, googleProvider),
        redirect: () => signInWithRedirect(auth, googleProvider)
      }, redirect);
      if (!result) return null;
      const resolved = await resolveUserAndRole(result.user);
      if (auth.currentUser?.uid === resolved.uid) storeResolvedUser(resolved);
      return { user: resolved, role: resolved.role };
    } catch (error) {
      if (error.code === 'auth/popup-blocked') return signInWithRedirect(auth, googleProvider);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') return null;
      setAuthError(error.message || 'Google sign-in failed.');
      throw error;
    }
  };

  const signOut = async () => {
    localStorage.removeItem('krc_active_user');
    localStorage.removeItem('krc_user_pref_dashboard');
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn("Sign out error", e);
    }
    setUser(null);
    setRole(null);
  };

  const updateUserPhoto = async (newPhotoURL, photoMeta = {}) => {
    if (!user) return null;
    const uid = user.uid;

    const updatedRecord = await firestoreService.recordUserPhotoUpload(uid, newPhotoURL, photoMeta);
    if (auth.currentUser && !user.isLocalAuth) {
      try { await updateProfile(auth.currentUser, { photoURL: newPhotoURL || '' }); }
      catch (error) { console.debug('[Auth] Optional provider photo sync unavailable:', error.code); }
    }

    setUser(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        photoURL: newPhotoURL,
        initialPhotoURL: updatedRecord?.initialPhotoURL || prev.initialPhotoURL || newPhotoURL,
        uploadedPhotos: updatedRecord?.uploadedPhotos || prev.uploadedPhotos || []
      };
      if (prev.isLocalAuth) {
        localStorage.setItem('krc_active_user', JSON.stringify({ ...updated, role }));
      }
      return updated;
    });

    // Universal Dynamic Broadcast
    try {
      localStorage.setItem(`krc_student_avatar_${uid}`, newPhotoURL);
      localStorage.setItem('krc_active_user_avatar', newPhotoURL);
      window.dispatchEvent(new CustomEvent('krc_avatar_updated', {
        detail: { uid, avatarUrl: newPhotoURL, timestamp: Date.now() }
      }));
    } catch (e) {
      console.debug('[Auth] Broadcast error:', e);
    }

    return newPhotoURL;
  };

  const revertUserPhoto = async () => {
    if (!user) return null;
    const uid = user.uid;

    let targetUrl = user.initialPhotoURL;
    try {
      const reverted = await firestoreService.revertUserPhotoToInitial(uid);
      if (reverted) targetUrl = reverted;
    } catch (e) {
      throw e;
    }

    if (targetUrl) {
      if (auth.currentUser && !user.isLocalAuth) {
        try {
          await updateProfile(auth.currentUser, { photoURL: targetUrl });
        } catch (err) {
          console.debug("[Auth] Firebase revert notice:", err.message);
        }
      }

      setUser(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          photoURL: targetUrl
        };
        if (prev.isLocalAuth) {
          localStorage.setItem('krc_active_user', JSON.stringify({ ...updated, role }));
        }
        return updated;
      });

      // Universal Dynamic Broadcast
      try {
        localStorage.setItem(`krc_student_avatar_${uid}`, targetUrl);
        localStorage.setItem('krc_active_user_avatar', targetUrl);
        window.dispatchEvent(new CustomEvent('krc_avatar_updated', {
          detail: { uid, avatarUrl: targetUrl, timestamp: Date.now() }
        }));
      } catch (e) {
        console.debug('[Auth] Broadcast error:', e);
      }

      return targetUrl;
    }
    return null;
  };

  const deleteUserPhoto = async (photoUrl, objectKey = null) => {
    if (!user) return null;
    const uid = user.uid;

    try {
      // 1. Delete from Cloud storage & local cache
      const ownPhotoPath = `/users/${uid}/`;
      if (objectKey || photoUrl?.includes(ownPhotoPath)) {
        await cloudStorageService.deleteUserProfilePhoto(uid, objectKey, photoUrl);
      }

      // 2. Remove from Firestore history
      const updatedProfile = await firestoreService.removeUserPhotoFromHistory(uid, photoUrl, objectKey);

      // 3. Determine if current photo was deleted and what next photo should be
      const isCurrentDeleted = user.photoURL === photoUrl;
      let newActivePhoto = isCurrentDeleted ? (updatedProfile?.photoURL ?? null) : user.photoURL;

      if (isCurrentDeleted && auth.currentUser && !user.isLocalAuth) {
        try {
          await updateProfile(auth.currentUser, { photoURL: newActivePhoto || '' });
        } catch (err) {
          console.debug("[Auth] Firebase photoURL update notice on delete:", err.message);
        }
      }

      setUser(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          photoURL: newActivePhoto,
          initialPhotoURL: updatedProfile.initialPhotoURL,
          uploadedPhotos: updatedProfile?.uploadedPhotos || (prev.uploadedPhotos || []).filter(p => {
            if (typeof p === 'string') return p !== photoUrl;
            if (objectKey && p.key === objectKey) return false;
            if (photoUrl && p.url === photoUrl) return false;
            return true;
          })
        };
        if (prev.isLocalAuth) {
          localStorage.setItem('krc_active_user', JSON.stringify({ ...updated, role }));
        }
        return updated;
      });

      // Universal Dynamic Broadcast
      if (isCurrentDeleted) {
        try {
          if (newActivePhoto) {
            localStorage.setItem(`krc_student_avatar_${uid}`, newActivePhoto);
            localStorage.setItem('krc_active_user_avatar', newActivePhoto);
          } else {
            localStorage.removeItem(`krc_student_avatar_${uid}`);
            localStorage.removeItem('krc_active_user_avatar');
          }
          window.dispatchEvent(new CustomEvent('krc_avatar_updated', {
            detail: { uid, avatarUrl: newActivePhoto || '', timestamp: Date.now() }
          }));
        } catch (e) {
          console.debug('[Auth] Broadcast error:', e);
        }
      }

      return newActivePhoto;
    } catch (err) {
      console.error("[Auth] deleteUserPhoto error:", err);
      throw err;
    }
  };

  const updateUserName = async (newDisplayName, profilePatch = {}) => {
    if (!user || !newDisplayName) return null;
    const cleanName = newDisplayName.trim().replace(/\s+/g, ' ');
    if (!cleanName) return null;
    const uid = user.uid;

    try {
      await studentChatService.propagateUserNameChange(uid, cleanName, user.displayName || user.name, { ...profilePatch, syncStudentProfile: role === 'student' });
    } catch (e) {
      console.warn("[Auth] propagateUserNameChange error:", e);
      throw e;
    }

    setUser(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        displayName: cleanName,
        name: cleanName,
        fullName: cleanName
      };
      if (prev.isLocalAuth) {
        localStorage.setItem('krc_active_user', JSON.stringify({ ...updated, role }));
      }
      return updated;
    });

    try {
      window.dispatchEvent(new CustomEvent('krc_user_name_changed', {
        detail: { uid, newName: cleanName, timestamp: Date.now() }
      }));
    } catch (e) {}

    return cleanName;
  };

  // Kept for callers, but roles can only be refreshed from the signed-in identity.
  const refreshUserRole = async () => {
    const current = auth.currentUser;
    if (!current) return;
    const resolved = await resolveUserAndRole(current);
    if (auth.currentUser?.uid === resolved.uid) storeResolvedUser(resolved);
  };
  const switchRole = () => refreshUserRole();

  const isRegistered = role !== 'guest' && role !== null;

  return (
    <AuthContext.Provider value={{ 
      user, 
      role, 
      isRegistered, 
      signIn, 
      signInWithGoogle, 
      signOut, 
      switchRole, 
      refreshUserRole, 
      updateUserName,
      updateUserPhoto,
      revertUserPhoto,
      deleteUserPhoto,
      loading, 
      authError 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

