/**
 * Attendance & User Database Abstraction Service
 * 
 * Implements user-scoped database isolation:
 * - Each user's data is stored in their dedicated folder:
 *   Firestore: /users/{userId}/attendance_history/{attendanceId}
 * - Global immutable audit ledger for conflict resolution:
 *   Firestore: /attendance_audit_log/{attendanceId}
 * - Real-time event broadcasting for live dashboard charts and analytics.
 */

import { classroomAttendanceRepository } from './classroomAttendanceRepository';
import { attendanceRecords } from '../utils/academicRecords';

const STORAGE_PREFIX = 'krc_user_folder_';
const GLOBAL_AUDIT_KEY = 'krc_global_attendance_audit';
const ATTENDANCE_EVENT = 'krc_attendance_updated';

// Subject reference catalogue
export const COURSE_CATALOGUE = {
  'CS-501': { code: 'CS-501', name: 'Operating Systems', faculty: 'Dr. Chinmay Chaudhari', room: 'Hall A' },
  'CS-502': { code: 'CS-502', name: 'Database Management Systems', faculty: 'Prof. Aniket Patil', room: 'Lab 2' },
  'CS-503': { code: 'CS-503', name: 'Computer Networks & Security', faculty: 'Dr. Sneha Kulkarni', room: 'Hall B' },
  'AI-504': { code: 'AI-504', name: 'Machine Learning & Neural Nets', faculty: 'Dr. Arvind Joshi', room: 'AI Lab' },
  'EC-301': { code: 'EC-301', name: 'Digital Signal Processing', faculty: 'Dr. Rajesh Sharma', room: 'Hardware Lab' }
};

export class AttendanceService {
  constructor({repository=classroomAttendanceRepository}={}) {
    this.repository=repository;
    this._listeners = new Set();
  }

  /**
   * Returns storage key for the isolated user folder
   */
  getUserFolderKey(userId) {
    return userId ? `${STORAGE_PREFIX}${userId}_attendance_history` : null;
  }

  /**
   * Get attendance history from the user's isolated folder
   */
  getAttendanceHistory(userId) {
    const key = this.getUserFolderKey(userId);
    if (!key) return [];
    try {
      return attendanceRecords(JSON.parse(localStorage.getItem(key) || '[]'), userId);
    } catch { return []; }
  }

  /**
   * Record a new verified attendance check-in into the student's database folder
   * Also appends to the immutable college audit ledger.
   */
  async markAttendance({courseId,rawToken,user}) {
    if(!user?.uid)throw new Error('Sign in with your enrolled student account.');
    const saved=await this.repository.submitAttendance({uid:user.uid,courseId,rawToken});
    if(!saved?.attendanceId)throw new Error('The database did not confirm this attendance record.');
    window.dispatchEvent(new CustomEvent(ATTENDANCE_EVENT,{detail:saved}));
    return saved;
  }

  /**
   * Pure calculation of analytics metrics from any history dataset (Firestore or cache)
   */
  calculateAnalyticsFromHistory(history = []) {
    const records = Array.isArray(history) ? history : [];
    const present = records.filter(record => String(record.status || '').toLowerCase() === 'present');
    const subjects = [...new Set(records.map(record => record.courseId).filter(Boolean))].map(code => {
      const entries = records.filter(record => record.courseId === code);
      return {code,name:entries[0].courseName || code,totalLectures:null,
        attendedLectures:entries.filter(record => String(record.status || '').toLowerCase()==='present').length,
        percentage:null,status:'Not published'};
    });
    return {
      attendancePercentage:null,totalLectures:null,verifiedAttended:present.length,
      missedLectures:null,subjects,trendData:[],recentLogs:records.slice(0,8)
    };
  }

  /**
   * Calculate live attendance analytics and chart trend data for a student
   */
  getStudentAnalytics(userId) {
    const history = this.getAttendanceHistory(userId);
    return this.calculateAnalyticsFromHistory(history);
  }

  /**
   * Subscribe to real-time attendance changes
   */
  subscribe(callback) {
    const handler = (e) => callback(e.detail);
    window.addEventListener(ATTENDANCE_EVENT, handler);
    return () => window.removeEventListener(ATTENDANCE_EVENT, handler);
  }

  /**
   * Get global audit log for conflict resolution
   */
  getGlobalAuditLog() {
    try {
      return JSON.parse(localStorage.getItem(GLOBAL_AUDIT_KEY) || '[]');
    } catch {
      return [];
    }
  }
}

export const attendanceService = new AttendanceService();
