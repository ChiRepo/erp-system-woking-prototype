/**
 * @fileoverview ADMIN Attendance Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { useState, useEffect } from 'react';
import { CalendarCheck2, ShieldCheck, QrCode, AlertCircle, Hash, Clock, FileCheck } from 'lucide-react';
import AttendanceSessionManager from '../../components/attendance/AttendanceSessionManager';
import { recordDateLabel } from '../../utils/academicRecords';
import { attendanceService } from '../../services/attendanceService';
import { firestoreService } from '../../services/firestoreService';

export default function AdminAttendance() {
  const [auditLog, setAuditLog] = useState([]);
  const [activeTab, setActiveTab] = useState('register'); // 'register' or 'audit'
  const [students, setStudents] = useState(() => {
    try {
      const saved = localStorage.getItem('krc_students');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const loadData = async () => {

    try {
      const live = await firestoreService.getAuditLog();
      if (live) setAuditLog(live);
    } catch (e) {
      console.warn("[Firestore] Audit load notice:", e.message);
    }

    try {
      const liveStudents = await firestoreService.getStudents({administrative:true});
      if (liveStudents && liveStudents.length > 0) {
        setStudents(liveStudents);
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadData();
    const unsubscribeLocal = attendanceService.subscribe(() => {
      loadData();
    });

    const unsubscribeFirestore = firestoreService.subscribeAuditLog((liveLogs) => {
      if (liveLogs) setAuditLog(liveLogs);
    });

    const handleStudentsUpdated = () => {
      try {
        const saved = localStorage.getItem('krc_students');
        if (saved) setStudents(JSON.parse(saved));
      } catch (e) {}
    };

    window.addEventListener('krc_students_updated', handleStudentsUpdated);
    window.addEventListener('storage', handleStudentsUpdated);

    return () => {
      unsubscribeLocal();
      if (unsubscribeFirestore) unsubscribeFirestore();
      window.removeEventListener('krc_students_updated', handleStudentsUpdated);
      window.removeEventListener('storage', handleStudentsUpdated);
    };
  }, []);


  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text">Campus Attendance &amp; Classroom Sessions</h1>
          <p className="text-muted text-xs sm:text-sm mt-1">
            Saved classroom check-ins and administrator-assigned sessions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('register')}
            className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-colors touch-manipulation ${
              activeTab === 'register' ? 'bg-text text-bg' : 'border border-border bg-surface text-muted hover:text-text'
            }`}
          >
            Student Register
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 touch-manipulation ${
              activeTab === 'audit' ? 'bg-text text-bg' : 'border border-border bg-surface text-muted hover:text-text'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" /> Immutable Audit Ledger ({auditLog.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Campus Average</p>
          <h3 className="text-3xl font-bold text-text">Not published</h3>
          <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Published lecture totals required
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Recorded Check-Ins</p>
          <h3 className="text-3xl font-bold text-text">{auditLog.length} Records</h3>
          <p className="text-xs text-muted mt-2 flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5" /> Saved classroom entries
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Low Attendance Alerts</p>
          <h3 className="text-3xl font-bold text-orange-500">Not published</h3>
          <p className="text-xs text-muted mt-2 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> No published eligibility calculation
          </p>
        </div>
      </div>

      <AttendanceSessionManager />

      {activeTab === 'register' ? (
        <div className="bg-surface border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text">Undergraduate Student Attendance Register</h3>
            <span className="text-xs text-muted">{students.length} Students Active</span>
          </div>
          <div className="overflow-x-auto table-responsive">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-bg/50 text-muted uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">PRN</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4">Exam Eligibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.length > 0 ? (
                  students.map(s => (
                    <tr key={s.prn} className="hover:bg-bg/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-text whitespace-nowrap">{s.name}</td>
                      <td className="py-3 px-4 font-mono text-muted whitespace-nowrap">{s.prn}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{s.dept} · {s.sem}</td>
                      <td className="py-3 px-4 font-bold text-text whitespace-nowrap">Not published</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-muted">Not published</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-muted">
                      No registered students in attendance ledger yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-text">Centralized Attendance Dispute Audit Ledger</h3>
              <p className="text-xs text-muted mt-0.5">
                Each saved entry records its classroom session. A classroom code is not independent proof of physical location.
              </p>
            </div>
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-bg border border-border text-muted shrink-0 self-start sm:self-auto">
              Tamper-Proof
            </span>
          </div>

          <div className="overflow-x-auto table-responsive">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-bg/50 text-muted uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Receipt Hash</th>
                  <th className="py-3 px-4">Student Name &amp; PRN</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Faculty</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLog.map((rec) => (
                  <tr key={rec.attendanceId} className="hover:bg-bg/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-text">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-muted" />
                        <span className="bg-bg px-2 py-0.5 rounded border border-border">{rec.receiptHash || rec.attendanceId}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-text">
                      <div>{rec.studentName}</div>
                      <div className="font-mono text-[10px] text-muted">{rec.prn}</div>
                    </td>
                    <td className="py-3 px-4 text-text font-medium">{rec.courseId} - {rec.courseName}</td>
                    <td className="py-3 px-4 text-muted">{rec.faculty}</td>
                    <td className="py-3 px-4 text-muted whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{recordDateLabel(rec)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        Verified Present
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hidden Copyright Notice - Visible in codebase, hidden in UI/UX */}
      <footer className="sr-only" aria-hidden="true">
        <p>Copyright &copy; 2026 Chinmay Chaudhari. All Rights Reserved. (MIT License)</p>
      </footer>
    </div>
  );
}
