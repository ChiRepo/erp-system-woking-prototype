/**
 * @fileoverview STUDENT Attendance Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { useState, useEffect } from 'react';
import { useStudentAcademicData } from '../../hooks/useStudentAcademicData';
import { studentScheduleCohort } from '../../utils/scheduleIdentity';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import QRScanner from '../../components/attendance/QRScanner';
import { useAuth } from '../../contexts/AuthContext';
import { attendanceService } from '../../services/attendanceService';
import { recordDateLabel } from '../../utils/academicRecords';
import { timetableService } from '../../services/timetableService';
import { locationService, LOCATION_PRESETS } from '../../services/locationService';
import { 
  CalendarCheck2, ShieldCheck, CheckCircle2, QrCode, 
  Clock, Hash, FileCheck, Search, Filter, AlertCircle, 
  ArrowUpRight, X, RefreshCw, MapPin, Bell, Navigation
} from 'lucide-react';

export default function StudentAttendance() {
  const { user } = useAuth();
  const { dept, sem } = studentScheduleCohort(user);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const studentUid = user?.uid;
  const academic = useStudentAcademicData(studentUid, ['profile','attendance']);
  const studentProfile = academic.data.profile;

  const [showScanner, setShowScanner] = useState(searchParams.get('scan') === 'true');

  const history = academic.data.attendance;
  const analytics = attendanceService.calculateAnalyticsFromHistory(history);
  const [latestReceipt, setLatestReceipt] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const isRefreshing = academic.loading;
  const refreshNotice = '';
  
  // Proximity & Timetable States
  const [proximityAlert, setProximityAlert] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(locationService.getCurrentLocation());
  const [activeLecture, setActiveLecture] = useState(null);

  const loadAttendance = academic.retry;

  useEffect(() => {
    const resolveLecture = () => {
      const result = timetableService.getStudentActiveOrNextLecture(dept, sem, new Date());
      const lecture = result.activeLecture || result.nextUpcomingLecture;
      setActiveLecture(lecture);
      setProximityAlert(lecture ? locationService.checkAndTriggerProximityAlerts(lecture,new Date())?.activeAlert || null : null);
    };
    resolveLecture();
    // Subscribe to location changes
    const unsubLocation = locationService.subscribe((loc) => {
      setCurrentLocation(loc);
      if (activeLecture) {
        const evalAlert = locationService.checkAndTriggerProximityAlerts(activeLecture, new Date());
        setProximityAlert(evalAlert?.activeAlert || null);
      } else {
        setProximityAlert(null);
      }
    });

    // Periodic evaluation of lecture times & geofence (every 10 seconds)
    const interval = setInterval(() => {
      const { activeLecture: activeLec, nextUpcomingLecture } = timetableService.getStudentActiveOrNextLecture(dept, sem, new Date());
      const targetLec = activeLec || nextUpcomingLecture;
      setActiveLecture(targetLec);
      if (targetLec) {
        const evalAlert = locationService.checkAndTriggerProximityAlerts(targetLec, new Date());
        setProximityAlert(evalAlert?.activeAlert || null);
      } else {
        setProximityAlert(null);
      }
    }, 10000);

    return () => {
      unsubLocation();
      clearInterval(interval);
    };
  }, [studentUid, activeLecture?.id, user?.uid, dept, sem]);

  const handleScanSuccess = async (courseId, rawToken) => {
    const currentStudent = studentProfile || {
      name: user?.displayName || user?.email?.split('@')[0] || 'Student',
      prn: user?.prn || '',
      dept
    };

    const record = await attendanceService.markAttendance({
      courseId,
      rawToken,
      user,
      studentInfo: currentStudent
    });
    setLatestReceipt(record);
    setShowScanner(false);
    
    return record;
  };

  const handleLocationPresetChange = (presetId) => {
    locationService.setLocation(presetId);
    const loc = locationService.getCurrentLocation();
    setCurrentLocation(loc);
    if (activeLecture) {
      const evalAlert = locationService.checkAndTriggerProximityAlerts(activeLecture, new Date());
      setProximityAlert(evalAlert?.activeAlert || null);
    } else {
      setProximityAlert(null);
    }
  };

  const filteredHistory = (history || []).filter(item => {
    if (!item) return false;
    const q = String(searchFilter || '').toLowerCase().trim();
    const matchesSearch = !q ||
      String(item.courseName || '').toLowerCase().includes(q) ||
      String(item.courseId || '').toLowerCase().includes(q) ||
      String(item.faculty || '').toLowerCase().includes(q) ||
      String(item.receiptHash || '').toLowerCase().includes(q);
    const matchesCourse = courseFilter === 'ALL' || item.courseId === courseFilter;
    return matchesSearch && matchesCourse;
  });

  const distanceMeters = locationService.getDistanceFromCampus(currentLocation);
  const isOutside = locationService.isOutsideGeofence(currentLocation);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Campus Proximity Warning Banner (Single-Fire Alerts for 15m Warning & Started) */}
      {proximityAlert && (
        <div className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border shadow-sm relative animate-in fade-in slide-in-from-top-3 ${
          proximityAlert.severity === 'danger'
            ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-400'
        }`}>
          <div className="flex items-start gap-3">
            <Bell className={`w-5 h-5 shrink-0 mt-0.5 animate-bounce ${
              proximityAlert.severity === 'danger' ? 'text-red-500' : 'text-amber-500'
            }`} />
            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base">{proximityAlert.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-bg/80 border border-border">
                  Alert at {proximityAlert.timestamp}
                </span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-text">
                {proximityAlert.message}
              </p>
              <div className="flex items-center gap-3 pt-1 text-xs text-muted">
                <span className="flex items-center gap-1 font-semibold text-text">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> Current Distance: {distanceMeters}m from KRC IT Campus
                </span>
                <span>•</span>
                <span>Geo-fence perimeter requirement: Within 100m of classroom</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setProximityAlert(null)}
            className="absolute top-4 right-4 text-muted hover:text-text p-1"
            aria-label="Dismiss Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header with Refresh Records Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text">My Attendance Records</h1>
          <p className="text-muted text-xs sm:text-sm mt-1">
            Saved attendance entries for your enrolled account.
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Refresh Records Button */}
          <button 
            onClick={loadAttendance}
            disabled={isRefreshing}
            className="px-3.5 py-2.5 bg-surface border border-border text-text hover:bg-bg rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shrink-0 touch-manipulation disabled:opacity-50"
            title="Read database collection and refresh student attendance history"
          >
            {isRefreshing ? (
              <span className="spinner-border spinner-border-sm text-emerald-500 shrink-0" role="status" aria-hidden="true"></span>
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>{isRefreshing ? 'Reading DB...' : 'Refresh Records'}</span>
          </button>

          {/* Scan Lecture QR Button */}
          <button 
            onClick={() => setShowScanner(!showScanner)}
            className="px-4 py-2.5 bg-text text-bg rounded-lg text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm shrink-0 touch-manipulation"
          >
            <QrCode className="w-4 h-4" />
            {showScanner ? 'Close Scanner' : 'Scan Lecture QR'}
          </button>
        </div>
      </div>

      {/* Sync Notification Notice */}
      {refreshNotice && (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-medium flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{refreshNotice}</span>
          </div>
          <span className="text-[10px] font-mono text-muted">{new Date().toLocaleTimeString()}</span>
        </div>
      )}

      {/* Campus GPS Proximity Status Bar */}
      <div className="bg-surface border border-border rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${isOutside ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-text">Campus GPS Position:</span>
              <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                isOutside 
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-500/20' 
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20'
              }`}>
                {isOutside ? `Outside Campus (${distanceMeters}m away)` : `Inside Classroom (${distanceMeters}m)`}
              </span>
            </div>
            <p className="text-[11px] text-muted mt-0.5">
              Current Geofence: KRC IT Ambegaon BK (100m perimeter). Alerts fire if outside 15m before class and at start.
            </p>
          </div>
        </div>

        {/* GPS Distance Simulator Switcher */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-[11px] text-muted shrink-0">Test Proximity:</span>
          <select 
            value={currentLocation.presetId}
            onChange={(e) => handleLocationPresetChange(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-bg border border-border rounded-lg text-text focus:outline-none focus:border-text w-full md:w-auto font-medium"
          >
            {LOCATION_PRESETS.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {academic.error && <p role="alert" className="text-sm text-red-500">{academic.error} <button onClick={academic.retry}>Retry</button></p>}
      {/* Real-time KPI Statistics */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-surface border border-border rounded-xl p-4 sm:p-5">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">Overall Attendance</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-text">{academic.loading ? 'Loading…' : 'Not published'}</span>
              <span className="text-xs text-emerald-500 font-medium">Recorded check-ins</span>
            </div>
            <p className="text-[11px] text-muted mt-2">
              {analytics.verifiedAttended} present check-in(s) recorded; total held sessions not published
            </p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">Exam Eligibility</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Not published</span>
            </div>
            <p className="text-[11px] text-muted mt-2">
              Exam eligibility requires a published attendance total.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">Attendance Entries</span>
            <div className="flex items-center gap-1.5 text-text font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Your account</span>
            </div>
            <p className="text-[11px] text-muted mt-2">
              {history.length} attendance entries in your account
            </p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">Record References</span>
            <div className="flex items-center gap-1.5 text-text font-bold text-sm">
              <FileCheck className="w-4 h-4 text-blue-500" />
              <span>Saved identifiers</span>
            </div>
            <p className="text-[11px] text-muted mt-2">
              Check recorded timestamps and references with your faculty.
            </p>
          </div>
        </div>
      )}

      {/* Fullscreen Blurry QR Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <QRScanner 
            key="student-attendance-scanner-modal"
            isFullscreen={true}
            initialToken={searchParams.get('token') || ''}
            onClose={() => setShowScanner(false)}
            onScanSuccess={(courseId, token) => handleScanSuccess(courseId, token)} 
          />
        )}
      </AnimatePresence>

      {/* Latest Receipt Banner (Conflict-Proof Proof) */}
      {latestReceipt?.studentUid === studentUid && (
        <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-3 relative">
          <button 
            onClick={() => setLatestReceipt(null)}
            className="absolute top-4 right-4 text-muted hover:text-text p-1.5 touch-manipulation"
            aria-label="Dismiss Receipt"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Attendance Confirmed &amp; Stored to Database!</span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Your attendance for <strong>{latestReceipt.courseName} ({latestReceipt.courseId})</strong> with <strong>{latestReceipt.faculty}</strong> has been logged to your personal user folder and the college audit ledger.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1 text-xs">
            <div className="p-2.5 rounded-lg bg-bg border border-border">
              <span className="text-[10px] text-muted block uppercase">Record Reference</span>
              <span className="font-mono font-bold text-text break-all">{latestReceipt.receiptHash || latestReceipt.attendanceId}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-bg border border-border">
              <span className="text-[10px] text-muted block uppercase">Exact Timestamp</span>
              <span className="font-medium text-text">{recordDateLabel(latestReceipt)}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-bg border border-border">
              <span className="text-[10px] text-muted block uppercase">Verification Status</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Attendance entry</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-surface p-3 sm:p-4 rounded-xl border border-border flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by course, faculty or receipt hash..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:border-text"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-muted shrink-0" />
          <select 
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="w-full sm:w-auto text-xs px-3 py-2 bg-bg border border-border rounded-lg text-text focus:outline-none focus:border-text"
          >
            <option value="ALL">All recorded courses</option>
            {analytics.subjects.map(c => (
              <option key={c.code} value={c.code}>{c.code}: {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Verified History Audit Table */}
      <div className="bg-surface rounded-xl sm:rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-text">Recorded Attendance History</h3>
            <p className="text-xs text-muted mt-0.5">
              Saved attendance records for your account. Contact your faculty to resolve discrepancies.
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-bg border border-border text-muted shrink-0 self-start sm:self-auto">
            {filteredHistory.length} Record(s) Found
          </span>
        </div>

        <div className="overflow-x-auto table-responsive">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg/60 border-b border-border text-muted font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Date &amp; Time</th>
                <th className="p-3.5">Course Code &amp; Title</th>
                <th className="p-3.5">Faculty / Professor</th>
                <th className="p-3.5">Lecture Room</th>
                <th className="p-3.5">Record Reference</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-muted">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-muted">
                    No attendance records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((rec) => (
                  <tr key={rec.attendanceId} className="hover:bg-bg/40 transition-colors">
                    <td className="p-3.5 font-medium text-text whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted" />
                        <span>{recordDateLabel(rec)}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-text whitespace-nowrap">
                      <div>
                        <span>{rec.courseId}</span>
                        <span className="font-normal text-muted ml-1.5">{rec.courseName}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-text whitespace-nowrap">{rec.faculty}</td>
                    <td className="p-3.5 font-mono text-[11px]">{rec.lectureHall}</td>
                    <td className="p-3.5 font-mono text-[11px] text-text whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Hash className="w-3 h-3 text-muted" />
                        <span className="bg-bg px-1.5 py-0.5 rounded border border-border">{rec.receiptHash || rec.attendanceId}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Present
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Hidden Copyright Notice - Visible in codebase, hidden in UI/UX */}
      <footer className="sr-only" aria-hidden="true">
        <p>Copyright &copy; 2026 Chinmay Chaudhari. All Rights Reserved. (MIT License)</p>
      </footer>
    </div>
  );
}
