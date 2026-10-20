import { collection, doc, getDoc, getDocs, query, where, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import { normalizeEmail, registeredRole } from '../utils/authPolicy.js';
import { createStudentAccessAdapter } from './studentAccessRepository.js';
import { studentDirectoryProjection } from '../utils/studentDirectoryProjection.js';

export function validateGoogleEnrollmentEmail(value) {
  const email = normalizeEmail(value);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.includes('/')) throw new Error('Enter a valid Google account email address.');
  if (['chinmayc3003@gmail.com', 'admin@krc.edu'].includes(email)) throw new Error('Administrator addresses cannot be enrolled as student accounts.');
  return email;
}

const sameEnrollment = (profile, canonical) => registeredRole(profile) === 'student' && normalizeEmail(profile.email) === normalizeEmail(canonical.email);
const identityFields = profile => Object.fromEntries(['uid', 'prn', 'name', 'fullName', 'displayName', 'email', 'role', 'dept', 'sem', 'allowChatting', 'chatAccessKey', 'googleEmail', 'isGoogleLinked', 'authProviders'].filter(key => profile[key] !== undefined).map(key => [key, profile[key]]));

export function createGoogleEnrollmentAdapter({ database = db, requireAdmin = createStudentAccessAdapter().requireAdmin } = {}) {
  return {
    requireAdmin,
    async link(uid, email) {
      // Queries locate historical aliases; the transaction rereads every target before updating it.
      const current = await getDoc(doc(database, 'users', uid));
      if (!current.exists()) throw new Error('The student enrollment no longer exists.');
      const institutional = normalizeEmail(current.data().email);
      const matches = await Promise.all(['email', 'googleEmail'].map(field => getDocs(query(collection(database, 'users'), where(field, '==', email)))));
      if (matches.some(result => result.docs.some(item => !sameEnrollment(item.data(), current.data())))) throw new Error('That Google address belongs to another enrollment.');
      const linked = await getDocs(query(collection(database, 'users'), where('email', '==', institutional)));
      const ids = [...new Set([uid, ...linked.docs.map(item => item.id), `google_${email}`, email])];
      return runTransaction(database, async transaction => {
        const refs = ids.map(id => doc(database, 'users', id));
        const snapshots = await Promise.all(refs.map(ref => transaction.get(ref)));
        const canonical = snapshots[ids.indexOf(uid)];
        if (!canonical.exists() || registeredRole(canonical.data()) !== 'student' || normalizeEmail(canonical.data().email) !== institutional) throw new Error('The enrollment changed. Refresh and try again.');
        const profile = canonical.data();
        if (normalizeEmail(profile.googleEmail) && normalizeEmail(profile.googleEmail) !== email) throw new Error('A different Google address is already enrolled.');
        for (const snapshot of snapshots) {
          if (snapshot.exists() && !sameEnrollment(snapshot.data(), profile)) throw new Error('An account alias belongs to another enrollment.');
          if (snapshot.exists() && normalizeEmail(snapshot.data().googleEmail) && normalizeEmail(snapshot.data().googleEmail) !== email) throw new Error('Google enrollment aliases conflict. Refresh the directory.');
        }
        const change = { googleEmail: email, isGoogleLinked: true, authProviders: [...new Set([...(Array.isArray(profile.authProviders) ? profile.authProviders : ['password']), 'google'])], googleEmailVerified: false, googleVerifiedAt: null, updatedAt: serverTimestamp() };
        for (let i = 0; i < refs.length; i++) {
          if (snapshots[i].exists()) transaction.update(refs[i], change);
          else transaction.set(refs[i], { ...identityFields(profile), ...change, uid });
          const peer = studentDirectoryProjection({...snapshots[i].data(), ...change}, ids[i]);
          if (peer) transaction.set(doc(database,'student_directory',ids[i]),peer);
        }
        // Existing academic, fees, attendance, social profile and credentials are never rewritten.
        return { ...identityFields(profile), googleEmail: email, isGoogleLinked: true, authProviders: change.authProviders, uid };
      });
    }
  };
}

export function createStudentAuthProvisioningService(adapter = createGoogleEnrollmentAdapter()) {
  return {
    async enrollGoogleAccount({ student, googleEmail }) {
      await adapter.requireAdmin();
      const email = validateGoogleEnrollmentEmail(googleEmail);
      if (!student?.uid || registeredRole(student) !== 'student') throw new Error('Select an existing student enrollment.');
      return adapter.link(student.uid, email);
    }
  };
}

export const studentAuthProvisioningService = createStudentAuthProvisioningService();
