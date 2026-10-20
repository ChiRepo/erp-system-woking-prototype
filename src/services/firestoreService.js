/**
 * KRC ERP - Firestore Database Service
 * 
 * Strict User-Scoped Security & Role Isolation:
 * - /users/{userId} -> User profile (Owner, Faculty, Admin)
 * - /users/{userId}/attendance_history/{attendanceId} -> Student personal attendance
 * - /users/{userId}/grades/{gradeId} -> Student academic grades
 * - /users/{userId}/fee_receipts/{receiptId} -> Student fee receipts (Owner, Admin only)
 * - /users/{userId}/qr_sessions/{sessionId} -> Faculty live attendance QR sessions
 * - /attendance_audit_log/{auditId} -> Immutable central ledger
 * - /courses/{courseId} -> Academic catalog
 * - /timetable/{scheduleId} -> Timetable schedules
 */

import { 
  collection, 
  collectionGroup,
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from '../firebase.js';
import { classroomAttendanceRepository } from './classroomAttendanceRepository';
import { isAdminIdentity } from '../utils/authPolicy';
import { onAuthStateChanged } from 'firebase/auth';
import { mergeStudentDirectory } from './studentDirectory.js';
import { studentDirectoryRepository } from './studentDirectoryRepository.js';
import { studentDirectoryProjection } from '../utils/studentDirectoryProjection.js';
import { demoFaculty, demoFees, demoCourses } from '../data/demoData';

class FirestoreService {
  /**
   * Helper to get currently authenticated Firebase user UID
   */
  getCurrentUid() {
    return auth.currentUser?.uid || null;
  }

  // =========================================================================
  // 1. ROOT USER PROFILES: /users/{userId}
  // =========================================================================

  /**
   * Get a user's profile document
   */
  async getUserProfile(userId) {
    if (!userId) return null;
    try {
      const docRef = doc(db, 'users', userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ...snap.data(), _documentId: snap.id };
      }
    } catch (err) {
      console.warn(`[Firestore] getUserProfile(${userId}) notice:`, err.message);
    }
    return null;
  }

  /**
   * Create or update user profile document (Admin or self for permitted fields)
   */
  async setUserProfile(userId, profileData, isCreate = false) {
    if (!userId) return false;
    try {
      const docRef = doc(db, 'users', userId);
      const data = {
        ...profileData,
        updatedAt: new Date().toISOString()
      };
      if (isCreate) {
        data.createdAt = new Date().toISOString();
      }
      await runTransaction(db,async transaction=>{
        const existing=await transaction.get(docRef);
        const merged={...(existing.exists()?existing.data():{}),...data};
        transaction.set(docRef,data,{merge:true});
        const peer=studentDirectoryProjection(merged,userId);
        if(peer)transaction.set(doc(db,'student_directory',userId),peer);
      });
      return true;
    } catch (err) {
      console.warn(`[Firestore] setUserProfile(${userId}) error:`, err.message);
      return false;
    }
  }

  async mutateOwnPhotoHistory(userId, change) {
    if (!userId || userId !== auth.currentUser?.uid) throw new Error('Sign in to update your profile photos.');
    const ref = doc(db, 'users', userId);
    return runTransaction(db, async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error('Your campus profile could not be found.');
      const existing = snapshot.data();
      const updates = change(existing);
      transaction.update(ref, { ...updates, updatedAt: new Date().toISOString() });
      const peer=studentDirectoryProjection({...existing,...updates},userId);
      if(peer)transaction.set(doc(db,'student_directory',userId),peer);
      if (String(existing.role || '').toLowerCase() === 'student') {
        transaction.set(doc(db, 'student_social_profiles', userId), { customAvatar: updates.photoURL || null }, { merge: true });
      }
      return updates;
    });
  }

  /** Save the active photo and history together; failures reach the caller. */
  async recordUserPhotoUpload(userId, photoUrl, photoMeta = {}) {
    const url = photoUrl || null;
    return this.mutateOwnPhotoHistory(userId, existing => {
      const history = Array.isArray(existing.uploadedPhotos) ? [...existing.uploadedPhotos] : [];
      if (url && !history.some(photo => (typeof photo === 'string' ? photo : photo.url) === url)) {
        history.unshift({ url, key: photoMeta.key || null, fileName: photoMeta.fileName || 'profile_image.jpg',
          uploadedAt: photoMeta.uploadedAt || new Date().toISOString() });
      }
      return { photoURL: url, initialPhotoURL: existing.initialPhotoURL || existing.photoURL || url, uploadedPhotos: history };
    });
  }

  async revertUserPhotoToInitial(userId) {
    const updates = await this.mutateOwnPhotoHistory(userId, existing => {
      if (!existing.initialPhotoURL) throw new Error('No original profile photo is available.');
      return { photoURL: existing.initialPhotoURL };
    });
    return updates.photoURL;
  }

  async removeUserPhotoFromHistory(userId, photoUrl, objectKey = null) {
    if (!photoUrl) throw new Error('Select a profile photo to remove.');
    return this.mutateOwnPhotoHistory(userId, existing => {
      const history = (Array.isArray(existing.uploadedPhotos) ? existing.uploadedPhotos : []).filter(photo =>
        typeof photo === 'string' ? photo !== photoUrl : photo.url !== photoUrl && (!objectKey || photo.key !== objectKey));
      const urlOf = photo => typeof photo === 'string' ? photo : photo?.url;
      const initial = existing.initialPhotoURL === photoUrl
        ? urlOf(history[history.length - 1]) || (existing.photoURL !== photoUrl ? existing.photoURL : null) || null
        : existing.initialPhotoURL || null;
      return { uploadedPhotos: history, initialPhotoURL: initial,
        photoURL: existing.photoURL === photoUrl ? urlOf(history[0]) || initial || null : existing.photoURL || null };
    });
  }

  // =========================================================================
  // 2. ATTENDANCE HISTORY: /users/{userId}/attendance_history/{attendanceId}
  // =========================================================================

  /**
   * Fetch a student's personal attendance history from their isolated subcollection
   */
  async getStudentAttendance(userId) {
    const targetUid = userId || this.getCurrentUid();
    if (!targetUid) return [];

    try {
      const historyCol = collection(db, 'users', targetUid, 'attendance_history');
      const q = query(historyCol, orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        return snap.docs.map(d => ({ attendanceId: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn(`[Firestore] getStudentAttendance(${targetUid}) notice:`, err.message);
    }
    return [];
  }

  /**
   * Log student attendance:
   * Writes to /users/{userId}/attendance_history/{attendanceId}
   * and appends to /attendance_audit_log/{attendanceId}
   */
  async logAttendance(userId, record) {
    return classroomAttendanceRepository.submitAttendance({uid:userId,courseId:record?.courseId,rawToken:record?.rawToken});
  }

  /**
   * Subscribe to a student's real-time attendance stream
   */
  subscribeStudentAttendance(userId, onUpdate) {
    const targetUid = userId || this.getCurrentUid();
    if (!targetUid) return () => {};

    try {
      const historyCol = collection(db, 'users', targetUid, 'attendance_history');
      const q = query(historyCol, orderBy('timestamp', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const records = snapshot.docs.map(d => ({ attendanceId: d.id, ...d.data() }));
        onUpdate(records);
      }, (error) => {
        console.warn(`[Firestore] Attendance subscription notice:`, error.message);
      });
    } catch (e) {
      return () => {};
    }
  }

  // =========================================================================
  // 3. ACADEMIC MARKS & GRADES: /users/{userId}/grades/{gradeId}
  // =========================================================================

  /**
   * Get a student's grades from their isolated folder
   */
  async getStudentGrades(userId) {
    const targetUid = userId || this.getCurrentUid();
    if (!targetUid) return [];

    try {
      const gradesCol = collection(db, 'users', targetUid, 'grades');
      const snap = await getDocs(gradesCol);
      if (!snap.empty) {
        return snap.docs.map(d => ({ gradeId: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn(`[Firestore] getStudentGrades(${targetUid}) notice:`, err.message);
    }
    return [];
  }

  /**
   * Save student grade (Faculty or Admin only)
   */
  async saveStudentGrade(userId, gradeId, gradeData) {
    if (!userId || !gradeId) return false;
    try {
      const gradeDocRef = doc(db, 'users', userId, 'grades', gradeId);
      await setDoc(gradeDocRef, {
        gradeId,
        studentUid: userId,
        ...gradeData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (err) {
      console.warn(`[Firestore] saveStudentGrade(${userId}) error:`, err.message);
      return false;
    }
  }

  // =========================================================================
  // 4. FEE RECEIPTS: /users/{userId}/fee_receipts/{receiptId}
  // =========================================================================

  /**
   * Get student's fee receipts (Only Owner or Admin can read)
   */
  async getStudentFeeReceipts(userId) {
    const targetUid = userId || this.getCurrentUid();
    if (!targetUid) return [];

    try {
      const feesCol = collection(db, 'users', targetUid, 'fee_receipts');
      const snap = await getDocs(feesCol);
      if (!snap.empty) {
        return snap.docs.map(d => ({ receiptId: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn(`[Firestore] getStudentFeeReceipts(${targetUid}) notice:`, err.message);
    }
    return [];
  }

  /**
   * Record fee receipt (Admin or payment gateway)
   */
  async recordFeeReceipt(userId, receiptData) {
    const actor=auth.currentUser;
    if(!actor||!userId||!receiptData?.receiptNo)throw new Error('An administrator and a recorded receipt number are required.');
    const token=await actor.getIdTokenResult();
    if(!isAdminIdentity(actor.email,token.signInProvider,token.claims.email_verified===true))throw new Error('Only the accounts administrator can record a payment receipt.');
    await setDoc(doc(db,'users',userId,'fee_receipts',receiptData.receiptNo),{
      ...receiptData,receiptId:receiptData.receiptNo,studentUid:userId,timestamp:serverTimestamp()
    });
    return true;
  }

  // =========================================================================
  // 5. FACULTY QR SESSIONS: /users/{userId}/qr_sessions/{sessionId}
  // =========================================================================

  /**
   * Get faculty's active QR sessions
   */
  async getFacultyQRSessions(facultyId) {
    const targetUid = facultyId || this.getCurrentUid();
    if (!targetUid) return [];

    try {
      const sessionsCol = collection(db, 'users', targetUid, 'qr_sessions');
      const snap = await getDocs(sessionsCol);
      if (!snap.empty) {
        return snap.docs.map(d => ({ sessionId: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn(`[Firestore] getFacultyQRSessions(${targetUid}) notice:`, err.message);
    }
    return [];
  }

  /**
   * Save a faculty QR session
   */
  async saveFacultyQRSession(facultyId, sessionId, sessionData) {
    const targetUid = facultyId || this.getCurrentUid();
    if (!targetUid || !sessionId) return false;

    try {
      const sessionDocRef = doc(db, 'users', targetUid, 'qr_sessions', sessionId);
      await setDoc(sessionDocRef, {
        sessionId,
        facultyUid: targetUid,
        ...sessionData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (err) {
      console.warn(`[Firestore] saveFacultyQRSession(${targetUid}) error:`, err.message);
      return false;
    }
  }

  // =========================================================================
  // 6. GLOBAL CENTRAL ATTENDANCE AUDIT LOG: /attendance_audit_log/{auditId}
  // =========================================================================

  /**
   * Read the global attendance audit log (Faculty and Admin only)
   */
  async getAuditLog(courseFilter = null) {
    try {
      const auditCol = collection(db, 'attendance_audit_log');
      let q = query(auditCol, orderBy('timestamp', 'desc'));
      if (courseFilter && courseFilter !== 'ALL') {
        q = query(auditCol, where('courseId', '==', courseFilter), orderBy('timestamp', 'desc'));
      }
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(d => ({ auditId: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn(`[Firestore] getAuditLog notice:`, err.message);
    }
    return [];
  }

  /**
   * Real-time subscription to central audit log (Faculty/Admin live roster)
   */
  subscribeAuditLog(onUpdate, courseFilter = null, sessionId = null, onError = () => {}) {
    try {
      const auditCol = collection(db, 'attendance_audit_log');
      const q = sessionId
        ? query(auditCol, where('sessionId', '==', sessionId))
        : courseFilter
          ? query(auditCol, where('courseId', '==', courseFilter), orderBy('timestamp', 'desc'))
          : query(auditCol, orderBy('timestamp', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const records = snapshot.docs.map(d => ({ auditId: d.id, ...d.data() }));
        onUpdate(records);
      }, (error) => {
        onError(error);
      });
    } catch (e) {
      onError(e);
      return () => {};
    }
  }

  // =========================================================================
  // 7. CATALOGUES: /courses, /timetable, /college_analytics
  // =========================================================================

  async getCourses() {
    try {
      const col = collection(db, 'courses');
      const snap = await getDocs(col);
      if (!snap.empty) {
        return snap.docs.map(d => ({ code: d.id, ...d.data() }));
      }
    } catch (e) {
      console.warn(`[Firestore] getCourses notice:`, e.message);
    }
    return demoCourses;
  }

  async saveCourse(courseCode, courseData) {
    if (!courseCode) return false;
    try {
      const docRef = doc(db, 'courses', courseCode);
      await setDoc(docRef, courseData, { merge: true });
      return true;
    } catch (e) {
      console.warn(`[Firestore] saveCourse error:`, e.message);
      return false;
    }
  }

  /**
   * Real-time subscription to students in Firestore.
   * Peers read only campus directory fields; admin enrollment screens opt into private records.
   * Fires callback(students) whenever any student is added, updated, or removed.
   */
  subscribeStudents(callback, {administrative=false}={}) {
    if (typeof callback !== 'function') return () => {};
    let stopUsers = () => {};
    let stopSocial = () => {};
    let generation = 0;
    const stopAuth = onAuthStateChanged(auth, currentUser => {
      const revision = ++generation;
      stopUsers();
      stopSocial();
      let enrollments = [];
      let social = [];
      let loaded = false;
      let error = null;
      const emit = () => {
        if (revision === generation) callback(mergeStudentDirectory(enrollments, social), { loading: !loaded, error });
      };
      if (!currentUser) {
        callback([], { loading: false, error: null });
        return;
      }
      emit();
      stopUsers = studentDirectoryRepository.subscribe(administrative, rows => {
        enrollments = rows;
        loaded = true;
        error = null;
        emit();
      }, failure => {
        loaded = true;
        error = failure.code === 'permission-denied'
          ? 'Student directory access was denied. Please sign in again or contact administration.'
          : 'The student directory is unavailable. Check your connection and retry.';
        emit();
      });
      stopSocial = onSnapshot(collection(db, 'student_social_profiles'), snap => {
        social = snap.docs.map(d => ({ ...d.data(), _documentId: d.id }));
        emit();
      }, failure => {
        // Social metadata is optional. Enrollment results remain usable on failure.
        console.debug('[Directory] Social enrichment unavailable:', failure.code);
      });
    });
    return () => {
      ++generation;
      stopAuth();
      stopUsers();
      stopSocial();
    };
  }

  async getStudents({administrative=false}={}) {
    if (!auth.currentUser) return [];
    const enrollments = await studentDirectoryRepository.get(administrative);
    let social = [];
    try {
      const profiles = await getDocs(collection(db, 'student_social_profiles'));
      social = profiles.docs.map(d => ({ ...d.data(), _documentId: d.id }));
    } catch (error) {
      console.debug('[Directory] Social enrichment unavailable:', error.code);
    }
    return mergeStudentDirectory(enrollments, social);
  }

  async getFaculty() {
    try {
      const col = collection(db, 'users');
      const q = query(col, where('role', '==', 'faculty'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const seen = new Set();
        const list = [];
        for (const d of snap.docs) {
          const item = { id: d.id, ...d.data() };
          const key = item.id || item.email;
          if (key && !seen.has(key)) {
            seen.add(key);
            list.push({
              ...item,
              name: item.name || 'Faculty Member',
              email: item.email || '',
              dept: item.dept || 'CSE',
              role: item.role || 'Assistant Professor',
              subjects: item.subjects || 'General Curriculum',
              room: item.room || 'Block A',
              exp: item.exp || '3 Yrs Exp',
              status: item.status || 'Active'
            });
          }
        }
        if (list.length > 0) return list;
      }
    } catch (e) {
      console.warn(`[Firestore] getFaculty notice:`, e.message);
    }
    return demoFaculty;
  }

  async getTimetable() {
    try {
      const col = collection(db, 'timetable');
      const snap = await getDocs(col);
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      console.warn(`[Firestore] getTimetable notice:`, e.message);
    }
    return [];
  }

  async getCollegeAnalytics() {
    try {
      const docRef = doc(db, 'college_analytics', 'main');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
    } catch (e) {
      console.warn(`[Firestore] getCollegeAnalytics notice:`, e.message);
    }
    return null;
  }

  async getAllFeeReceipts() {
    try {
      // 1. First attempt collectionGroup query for all fee receipts (Admin authorized)
      try {
        const cg = collectionGroup(db, 'fee_receipts');
        const snap = await getDocs(cg);
        if (!snap.empty) {
          return snap.docs.map(d => ({ receiptId: d.id, ...d.data() }));
        }
      } catch (cgErr) {
        console.debug("[Firestore] Collection group query fallback:", cgErr.message);
      }

      // 2. Comprehensive fallback: Query all student user folders in Firestore
      const students = await this.getStudents();
      const allReceipts = [];
      const seen = new Set();
      for (const stu of students) {
        const targetId = stu.uid || stu.id;
        if (targetId) {
          const receipts = await this.getStudentFeeReceipts(targetId);
          for (const r of receipts) {
            const key = r.receiptNo || r.receiptId;
            if (key && !seen.has(key)) {
              seen.add(key);
              allReceipts.push(r);
            }
          }
        }
      }
      if (allReceipts.length > 0) {
        return allReceipts;
      }
    } catch (e) {
      console.warn(`[Firestore] getAllFeeReceipts notice:`, e.message);
    }
    return [];
  }
}

export const firestoreService = new FirestoreService();
