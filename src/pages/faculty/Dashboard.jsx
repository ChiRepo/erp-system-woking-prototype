/**
 * @fileoverview FACULTY Dashboard Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { useState, useEffect } from 'react';
import { 
  Users, BookOpen, CalendarCheck2, Clock, 
  MapPin, Play, QrCode, ArrowRight, UserCheck, Key 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { facultyScheduleId } from '../../utils/scheduleIdentity';
import { 
  timetableService, WEEK_DAYS, computeLectureLiveState, getCurrentDayName 
} from '../../services/timetableService';
import { credentialService } from '../../services/credentialService';
import ChangePasswordModal from '../../components/ChangePasswordModal';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const facultyId = facultyScheduleId(user);

  const [now, setNow] = useState(new Date());
  const assignedLectures = timetableService.getFacultyLectures(facultyId);
  const assignedCourseCount = new Set(assignedLectures.map(l => l.courseCode)).size;
  const [cachedStudents] = useState(() => {
    try {
      const saved = localStorage.getItem('krc_students');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const students = cachedStudents.filter(s => assignedLectures.some(l => l.dept === s.dept && l.sem === s.sem));
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isStartingPassword, setIsStartingPassword] = useState(() => 
    credentialService.isStartingPassword(user?.email)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.email) {
      setIsStartingPassword(credentialService.isStartingPassword(user.email));
    }
  }, [user]);

  const currentDayName = getCurrentDayName(now);
  const rawDayLectures = timetableService.getFacultyLectures(facultyId, currentDayName);
  const myTodayLectures = rawDayLectures.map(lec => ({
    ...lec,
    ...computeLectureLiveState(lec, now)
  }));

  const timetableResolution = timetableService.getFacultyOngoingLecture(facultyId, now);
  const activeClass = timetableResolution.ongoingLecture;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Starting Password Security Alert Banner */}
      {isStartingPassword && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-xl text-xs space-y-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <Key className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-text">Administrative Starting Password Active</p>
              <p className="text-muted leading-relaxed">
                Your account is currently using an administrative starting password. Please update your password to secure your faculty portal account.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shrink-0 transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Key className="w-3.5 h-3.5" /> Change Password
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Faculty Dashboard</h1>
          <p className="text-muted text-sm mt-1">
            Welcome back. Real-time class playback and attendance management.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-3.5 py-2 bg-surface border border-border text-text hover:bg-bg rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0"
            title="Change Account Password"
          >
            <Key className="w-3.5 h-3.5 text-amber-500" /> Password
          </button>
          <Link 
            to="/faculty/attendance" 
            className="px-4 py-2 bg-text text-bg rounded-lg text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <QrCode className="w-4 h-4" /> Open Attendance Station
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-xl border border-border flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">My Courses</p>
            <h3 className="text-2xl font-bold text-text">{assignedCourseCount}</h3>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"><BookOpen className="w-5 h-5 text-blue-500" /></div>
        </div>

        <div className="bg-surface p-5 rounded-xl border border-border flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Enrolled Students</p>
            <h3 className="text-2xl font-bold text-text">{students.length}</h3>
          </div>
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg"><Users className="w-5 h-5 text-green-500" /></div>
        </div>

        <div className="bg-surface p-5 rounded-xl border border-border flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Today's Lectures</p>
            <h3 className="text-2xl font-bold text-text">{myTodayLectures.length}</h3>
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg"><CalendarCheck2 className="w-5 h-5 text-purple-500" /></div>
        </div>

        <div className="bg-surface p-5 rounded-xl border border-border flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Avg Attendance</p>
            <h3 className="text-2xl font-bold text-text">Not recorded</h3>
          </div>
          <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg"><Clock className="w-5 h-5 text-orange-500" /></div>
        </div>
      </div>

      {/* Ongoing Class Hero Card */}
      {activeClass && (
        <div className="p-5 sm:p-6 rounded-xl sm:rounded-2xl border border-border bg-surface shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-text">
                {activeClass.isLive ? 'Currently Active Ongoing Lecture' : 'Next Scheduled Lecture Today'}
              </span>
            </div>
            <span className="font-mono text-xs text-muted">
              Live Time: {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-text">
                  {activeClass.courseCode}: {activeClass.courseName}
                </h3>
                {activeClass.isLive && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20">
                    LIVE NOW
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted mt-1 flex-wrap">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-500" /> {activeClass.room}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-500" /> {activeClass.time} ({activeClass.durationMinutes} min)</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-purple-500" /> 60 Enrolled Students</span>
              </div>
            </div>

            <Link
              to="/faculty/attendance"
              className="px-4 py-2 bg-text text-bg rounded-lg text-xs font-bold hover:opacity-90 transition flex items-center justify-center gap-1.5 shrink-0"
            >
              <QrCode className="w-3.5 h-3.5" /> Broadcast QR Code
            </Link>
          </div>

          {/* Progress bar if lecture is live */}
          {activeClass.isLive && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono font-semibold text-text flex items-center gap-1.5">
                  <Play className="w-3 h-3 fill-current text-emerald-500" />
                  Elapsed Playback: {activeClass.playbackFormatted}
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {activeClass.progressPercent}%
                </span>
              </div>
              <div className="w-full bg-bg h-2.5 rounded-full overflow-hidden border border-border">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${activeClass.progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid: Today's Schedule & Students Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today's Schedule */}
        <div className="bg-surface p-6 rounded-xl border border-border space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold text-text">Today's Teaching Schedule ({currentDayName})</h3>
            <Link to="/faculty/classes" className="text-xs text-muted hover:text-text">
              View Week
            </Link>
          </div>

          {myTodayLectures.length === 0 ? (
            <p className="text-xs text-muted py-4">No lectures scheduled for you today.</p>
          ) : (
            <div className="space-y-3">
              {myTodayLectures.map((s, i) => (
                <div key={i} className={`flex items-center justify-between p-3.5 bg-bg rounded-xl border transition ${
                  s.isLive ? 'border-emerald-500/60 shadow-sm' : 'border-border'
                }`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-text">{s.courseCode}: {s.courseName}</p>
                      {s.isLive && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted">{s.room} · {s.type}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono text-muted bg-surface px-2 py-1 rounded border border-border block">
                      {s.time}
                    </span>
                    {s.isLive && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                        Live Now ({s.progressPercent}%)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student Attendance Overview */}
        <div className="bg-surface p-6 rounded-xl border border-border space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold text-text">Students in Assigned Cohorts</h3>
            <span className="text-xs font-mono text-muted">Assigned classes</span>
          </div>
          
          <div className="space-y-3">
            {students.length > 0 ? (
              students.map((student, i) => (
                <div key={student.prn || i} className="flex items-center justify-between p-2 rounded-lg hover:bg-bg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-xs font-bold text-text">
                      {student.name ? student.name.charAt(0) : 'S'}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text">{student.name}</p>
                      <p className="text-[11px] text-muted">{student.prn} · {student.dept}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    (student.attendance ?? 0) >= 90 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20' : 
                    (student.attendance ?? 0) >= 75 ? 'bg-blue-50 text-blue-700 border border-blue-500/20' : 'bg-red-50 text-red-700'
                  }`}>
                    {student.attendance == null ? 'Not recorded' : `${student.attendance}%`}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-muted">
                No students in your assigned classes.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Direct Password Change Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        userEmail={user?.email}
        isStarting={isStartingPassword}
        onSuccess={() => {
          setIsStartingPassword(false);
        }}
      />

      {/* Hidden Copyright Notice - Visible in codebase, hidden in UI/UX */}
      <footer className="sr-only" aria-hidden="true">
        <p>Copyright &copy; 2026 Chinmay Chaudhari. All Rights Reserved. (MIT License)</p>
      </footer>
    </div>
  );
}
