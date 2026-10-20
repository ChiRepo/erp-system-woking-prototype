import { collection, doc, getDoc, getDocs, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase.js';
import { isAdminIdentity, normalizeEmail, registeredRole } from '../utils/authPolicy.js';
import { studentDirectoryProjection } from '../utils/studentDirectoryProjection.js';

const record = snapshot => ({ id: snapshot.id, data: snapshot.data() });

export function createStudentAccessAdapter({ database = db, currentUser = () => auth.currentUser } = {}) {
  return {
    async requireAdmin() {
      const user = currentUser();
      const token = await user?.getIdTokenResult();
      if (!user || !isAdminIdentity(user.email, token?.signInProvider, token?.claims?.email_verified === true)) {
        throw new Error('Sign in with an authorized administrator account to change chat access.');
      }
    },
    async read(uid) {
      const snapshot = await getDoc(doc(database, 'users', uid));
      return snapshot.exists() ? record(snapshot) : null;
    },
    async linked(enrollment) {
      const email = normalizeEmail(enrollment.data.email);
      const emails = [...new Set([email, enrollment.data.email].filter(Boolean))];
      const results = await Promise.all([
        getDocs(query(collection(database, 'users'), where('email', 'in', emails))),
        getDocs(query(collection(database, 'users'), where('uid', '==', enrollment.id)))
      ]);
      return results.flatMap(snapshot => snapshot.docs.map(record));
    },
    async commit(records, change) {
      const batch = writeBatch(database);
      for (const item of records) {
        const updates = {...change, updatedAt:serverTimestamp()};
        batch.update(doc(database, 'users', item.id), updates);
        const peer = studentDirectoryProjection({...item.data,...updates}, item.id);
        if (peer) batch.set(doc(database,'student_directory',item.id),peer);
      }
      await batch.commit();
    }
  };
}

/** All currently linked enrollment records change together; no cached or partial success. */
export function createStudentAccessRepository(adapter = createStudentAccessAdapter()) {
  return {
    async setChatAccess(student, allowed) {
      await adapter.requireAdmin();
      const uid = student?.uid;
      if (!uid || typeof allowed !== 'boolean') throw new Error('Select an enrolled student and a valid chat access setting.');
      const enrollment = await adapter.read(uid);
      if (!enrollment || registeredRole(enrollment.data) !== 'student' || !normalizeEmail(enrollment.data.email)) {
        throw new Error('The student enrollment is no longer available. Refresh the directory and try again.');
      }
      const email = normalizeEmail(enrollment.data.email);
      const related = await adapter.linked(enrollment);
      // PRNs can collide in historical data. Email/UID identity must establish the relationship.
      const records = [...new Map([enrollment, ...related].filter(item => {
        if (registeredRole(item.data) !== 'student') return false;
        const address = normalizeEmail(item.data.email);
        return address === email || (!address && item.data.uid === uid);
      }).map(item => [item.id, item])).values()];
      const change = { allowChatting: allowed, chatAccessKey: allowed ? enrollment.data.chatAccessKey || null : null };
      await adapter.commit(records, change);
      return { uid, allowChatting: allowed, updatedRecords: records.length };
    }
  };
}

export const studentAccessRepository = createStudentAccessRepository();
