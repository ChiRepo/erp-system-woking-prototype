/**
 * @fileoverview Dedicated Student Folder and Data Partition Service
 * Persists initial enrollment and profile records atomically.
 * Existing student records require separate edit flows.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

import { doc, setDoc, getDoc, deleteDoc, collection, getDocs, runTransaction } from 'firebase/firestore';
import { db } from '../firebase.js';
import { firestoreService } from './firestoreService.js';
import { credentialService } from './credentialService.js';
import { securityVault } from './securityVault.js';
import { cloudStorageService, sanitizeUserId } from './cloudStorageService.js';
import { studentSearchService } from './studentSearchService.js';
import { studentChatService } from './studentChatService.js';
import { createEnrollmentId } from '../utils/enrollmentIdentity.js';
import { sanitizeEnrollmentData, sanitizeEnrollmentRoster } from '../utils/enrollmentCache.js';
import { studentDirectoryProjection } from '../utils/studentDirectoryProjection.js';

export class StudentFolderService {
  constructor({ database = db } = {}) { this.database = database; }

  /**
   * Provisions a dedicated data folder for a student with all subcollections:
   * - /users/{uid}/folder/profile
   * - /users/{uid}/folder/academic
   * - /users/{uid}/folder/fees
   * - /users/{uid}/folder/security
   * - /users/{uid}/folder/storage
   * - /student_social_profiles/{uid}
   * No fee receipt, attendance mark or remote storage allocation is invented.
   * - Dedicated local storage mirror: krc_student_folder_{uid}
   */
  async provisionStudentFolder(studentData) {
    if (!studentData) throw new Error("Student data is required to provision folder.");

    const cleanUid = String(studentData.uid || '').trim();
    if (!cleanUid || cleanUid.startsWith('PRN-') || cleanUid.includes('/')) throw new Error('A real authentication UID is required to enroll a student.');
    const prn = studentData.prn || createEnrollmentId();
    const studentEmail = (studentData.email || '').toLowerCase().trim();
    const name = String(studentData.name || studentData.fullName || '').trim().replace(/\s+/g, ' ');
    if (!name || !studentEmail) throw new Error('Full name and institutional email are required.');
    const dept = studentData.dept || 'CSE';
    const sem = studentData.sem || 'Sem I';
    const attendance = null;
    const cgpa = null;
    const fee = 'Not assessed';
    const allowChatting = studentData.allowChatting !== false;
    const chatAccessKey = studentData.chatAccessKey || (allowChatting ? securityVault.generateStudentChatPass(cleanUid) : null);
    const authProviders = studentData.authProviders || (studentData.googleEmail ? ['password', 'google'] : ['password']);
    const googleEmail = (studentData.googleEmail || '').toLowerCase().trim();
    const startingPassword = studentData.startingPassword || '';
    if (googleEmail) throw new Error('Create the student enrollment first, then enroll Google sign-in without resetting student records.');
    const timestamp = new Date().toISOString();
    const folderPath = `users/${cleanUid}/`;

    // 1. Profile Dataset
    const profileData = {
      uid: cleanUid,
      prn,
      name,
      fullName: name,
      displayName: name,
      email: studentEmail,
      googleEmail: googleEmail || null,
      role: 'student',
      dept,
      sem,
      attendance,
      cgpa,
      fee,
      allowChatting,
      chatAccessKey,
      authProviders,
      isGoogleLinked: !!googleEmail,
      folderPath,
      isStartingPassword: true,
      mustChangePassword: true,
      createdAt: studentData.createdAt || timestamp,
      updatedAt: timestamp
    };

    // 2. Academic Dataset
    const academicData = {
      prn,
      studentUid: cleanUid,
      dept,
      sem,
      cgpa,
      attendance,
      credits: 0,
      enrolledCourses: [],
      status: 'Active',
      updatedAt: timestamp
    };

    // 3. Financial & Fee Dataset
    const feesData = {
      prn,
      studentUid: cleanUid,
      studentName: name,
      feeStatus: fee,
      annualTuition: null,
      paidAmount: null,
      dueAmount: null,
      currency: 'INR',
      updatedAt: timestamp
    };

    // 4. Security & Access Dataset
    const securityData = {
      uid: cleanUid,
      prn,
      authProviders,
      hasChatClearance: allowChatting,
      chatAccessKey,
      mustChangePassword: true,
      updatedAt: timestamp
    };

    // 5. Cloud Storage Partition Metadata
    const storageData = {
      studentUid: cleanUid,
      folderPath,
      status: 'not_initialized',
      updatedAt: timestamp
    };

    // 8. Public Social Profile
    const socialProfile = {
      uid: cleanUid,
      prn,
      name,
      fullName: name,
      displayName: name,
      email: studentEmail,
      googleEmail: googleEmail || null,
      dept,
      sem,
      bio: `Student at KRC Institute of Technology • Department of ${dept}`,
      avatar: studentData.photoURL || studentData.avatarUrl || null,
      allowChatting,
      updatedAt: timestamp
    };

    // Creation cannot overwrite an established account or its academic/payment history.
    const database = this.database;
    const records = [
      [['users', cleanUid], profileData],
      ...(prn !== cleanUid ? [[['users', prn], profileData]] : []),
      ...Object.entries({ profile: profileData, academic: academicData, fees: feesData, security: securityData, storage: storageData }).map(([key, value]) => [['users', cleanUid, 'folder', key], value]),
      [['student_social_profiles', cleanUid], socialProfile],
      [['student_directory', cleanUid], studentDirectoryProjection(profileData, cleanUid)]
    ];
    await runTransaction(database, async transaction => {
      const refs = records.map(([path]) => doc(database, ...path));
      const existing = await Promise.all(refs.map(ref => transaction.get(ref)));
      if (existing[0].exists()) throw new Error('This student is already enrolled. Use the existing enrollment instead of creating it again.');
      if (existing.some(snapshot => snapshot.exists())) throw new Error('Enrollment records already exist for this UID or PRN. Refresh the directory before retrying.');
      records.forEach(([, value], index) => transaction.set(refs[index], value));
    });

    // --- Local Dedicated Folder Store Mirror ---
    try {
      const dedicatedFolder = sanitizeEnrollmentData({
        folderPath,
        studentUid: cleanUid,
        prn,
        profile: profileData,
        academic: academicData,
        fees: feesData,
        security: securityData,
        storage: storageData,
        feeReceipts: [],
        attendanceHistory: [],
        socialProfile,
        initializedAt: timestamp
      });
      localStorage.setItem(`krc_student_folder_${cleanUid}`, JSON.stringify(dedicatedFolder));
      if (prn !== cleanUid) {
        localStorage.setItem(`krc_student_folder_${prn}`, JSON.stringify(dedicatedFolder));
      }

      // Retain lifecycle flags without persisting credential values
      if (studentEmail && startingPassword) {
        credentialService.setStartingPassword(studentEmail, startingPassword, 'student', name);
      }
      if (googleEmail && startingPassword) {
        credentialService.setStartingPassword(googleEmail, startingPassword, 'student', name);
      }
    } catch (localErr) {
      console.warn('[StudentFolderService] Local storage mirror notice:', localErr);
    }

    // --- Sync with central 'krc_students' list ---
    try {
      const local = sanitizeEnrollmentRoster(JSON.parse(localStorage.getItem('krc_students') || '[]'));
      const idx = local.findIndex(s => 
        (s.uid && s.uid === cleanUid) || 
        (s.prn && s.prn === prn) || 
        (s.email && s.email.toLowerCase() === studentEmail)
      );

      if (idx >= 0) {
        local[idx] = { ...local[idx], ...profileData };
      } else {
        local.unshift(profileData);
      }
      localStorage.setItem('krc_students', JSON.stringify(sanitizeEnrollmentRoster(local)));
    } catch (e) {
      console.warn('[StudentFolderService] Roster sync notice:', e);
    }

    // --- Invalidate Search & Clearance In-Memory Caches ---
    if (studentSearchService?.invalidateCache) {
      studentSearchService.invalidateCache();
    }
    if (studentChatService?.clearClearanceCache) {
      studentChatService.clearClearanceCache();
    }

    // --- Dynamic System-Wide Broadcast ---
    if (typeof window !== 'undefined') {
      // 1. Core student updated event (received by Dashboard, Directory, Attendance, Fees)
      window.dispatchEvent(new CustomEvent('krc_students_updated', {
        detail: { student: profileData, action: 'create', folderPath }
      }));

      // 2. Specific student created event
      window.dispatchEvent(new CustomEvent('krc_student_created', {
        detail: { student: profileData, folder: { profile: profileData, academic: academicData, fees: feesData } }
      }));

      // 3. Search cache invalidation event (received by SearchFeedView)
      window.dispatchEvent(new CustomEvent('krc_search_cache_invalidated'));

      // 4. Clearance access event (received by ChatRoom and Navigation)
      window.dispatchEvent(new CustomEvent('krc_clearance_updated', {
        detail: { prn, email: studentEmail, uid: cleanUid, allowChatting }
      }));

      // 5. Cross-tab storage event
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'krc_students',
        newValue: localStorage.getItem('krc_students')
      }));
    }

    return {
      success: true,
      folderPath,
      student: profileData,
      academic: academicData,
      fees: feesData,
      security: securityData,
      storage: storageData
    };
  }

  /**
   * Retrieves a student's full dedicated folder data
   */
  async getStudentFolder(studentUid) {
    if (!studentUid) return null;
    const cleanUid = sanitizeUserId(studentUid);

    // 1. Try local mirror first for instant retrieval
    try {
      const local = localStorage.getItem(`krc_student_folder_${cleanUid}`);
      if (local) return sanitizeEnrollmentData(JSON.parse(local));
    } catch (e) {}

    // 2. Query Firestore folder subcollection
    try {
      const folderCol = collection(db, 'users', cleanUid, 'folder');
      const snap = await getDocs(folderCol);
      if (!snap.empty) {
        const folderData = {};
        snap.docs.forEach(d => {
          folderData[d.id] = d.data();
        });
        return folderData;
      }
    } catch (e) {
      console.warn('[StudentFolderService] getStudentFolder notice:', e);
    }

    return null;
  }

  /**
   * Updates any portion of the student's folder and dynamically propagates changes
   */
  async updateStudentFolder(studentUid, partialData) {
    if (!studentUid || !partialData) return false;
    const cleanUid = sanitizeUserId(studentUid);
    const timestamp = new Date().toISOString();

    try {
      await runTransaction(this.database,async transaction=>{
        const ref=doc(this.database,'users',cleanUid),snapshot=await transaction.get(ref);
        if(!snapshot.exists())throw new Error('The enrolled student no longer exists.');
        const updates={...partialData,updatedAt:timestamp};
        transaction.set(ref,updates,{merge:true});
        transaction.set(doc(this.database,'users',cleanUid,'folder','profile'),updates,{merge:true});
        const peer=studentDirectoryProjection({...snapshot.data(),...updates},cleanUid);
        if(peer)transaction.set(doc(this.database,'student_directory',cleanUid),peer);
      });

      // Update local storage folder mirror
      const localKey = `krc_student_folder_${cleanUid}`;
      const existing = JSON.parse(localStorage.getItem(localKey) || '{}');
      const updatedFolder = sanitizeEnrollmentData({
        ...existing,
        profile: { ...(existing.profile || {}), ...partialData, updatedAt: timestamp },
        updatedAt: timestamp
      });
      localStorage.setItem(localKey, JSON.stringify(updatedFolder));

      // Update central roster
      const roster = sanitizeEnrollmentRoster(JSON.parse(localStorage.getItem('krc_students') || '[]'));
      const updatedRoster = sanitizeEnrollmentRoster(roster.map(s => {
        if (s.uid === cleanUid || s.prn === cleanUid || (partialData.prn && s.prn === partialData.prn)) {
          return { ...s, ...partialData, updatedAt: timestamp };
        }
        return s;
      }));
      localStorage.setItem('krc_students', JSON.stringify(updatedRoster));

      // Broadcast dynamic updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('krc_students_updated', {
          detail: { student: { uid: cleanUid, ...partialData }, action: 'update' }
        }));
        window.dispatchEvent(new CustomEvent('krc_search_cache_invalidated'));
      }

      return true;
    } catch (err) {
      console.warn('[StudentFolderService] updateStudentFolder error:', err);
      return false;
    }
  }

  /**
   * Permanently deletes a student's dedicated folder, all subcollections, and profile
   */
  async deleteStudentFolder(studentUid, prn, email, googleEmail) {
    const cleanUid = studentUid || prn;
    if (!cleanUid) return false;

    try {
      // 1. Delete folder subcollections in Firestore
      const subcollections = ['folder/profile', 'folder/academic', 'folder/fees', 'folder/security', 'folder/storage'];
      for (const subPath of subcollections) {
        await deleteDoc(doc(db, 'users', cleanUid, ...subPath.split('/'))).catch(() => {});
      }

      // 2. Delete initial receipts and attendance
      await deleteDoc(doc(db, 'users', cleanUid, 'fee_receipts', `REC-${prn}`)).catch(() => {});
      await deleteDoc(doc(db, 'users', cleanUid, 'attendance_history', 'INIT-ONBOARDING')).catch(() => {});

      // 3. Delete social profile
      await deleteDoc(doc(db, 'student_social_profiles', cleanUid)).catch(() => {});

      // 4. Delete root profile docs
      await firestoreService.deleteUserProfile(cleanUid).catch(() => {});
      if (prn && prn !== cleanUid) {
        await firestoreService.deleteUserProfile(prn).catch(() => {});
      }
      if (email) {
        await firestoreService.deleteUserProfile(email).catch(() => {});
        credentialService.removeCredential(email);
      }
      if (googleEmail) {
        await firestoreService.deleteUserProfile(`google_${googleEmail.toLowerCase().trim()}`).catch(() => {});
        credentialService.removeCredential(googleEmail);
      }

      // 5. Purge local mirrors
      localStorage.removeItem(`krc_student_folder_${cleanUid}`);
      if (prn) localStorage.removeItem(`krc_student_folder_${prn}`);

      // 6. Remove from central krc_students
      const roster = sanitizeEnrollmentRoster(JSON.parse(localStorage.getItem('krc_students') || '[]'));
      const filtered = sanitizeEnrollmentRoster(roster.filter(s => s.uid !== cleanUid && s.prn !== prn && s.email !== email));
      localStorage.setItem('krc_students', JSON.stringify(filtered));

      // 7. Invalidate caches and broadcast dynamic events
      if (studentSearchService?.invalidateCache) {
        studentSearchService.invalidateCache();
      }
      if (studentChatService?.clearClearanceCache) {
        studentChatService.clearClearanceCache();
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('krc_students_updated', {
          detail: { uid: cleanUid, prn, action: 'delete' }
        }));
        window.dispatchEvent(new CustomEvent('krc_search_cache_invalidated'));
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'krc_students',
          newValue: JSON.stringify(filtered)
        }));
      }

      return true;
    } catch (err) {
      console.warn('[StudentFolderService] deleteStudentFolder error:', err);
      return false;
    }
  }
}

export const studentFolderService = new StudentFolderService();
