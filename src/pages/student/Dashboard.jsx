/**
 * @fileoverview STUDENT Dashboard Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { useState, useEffect } from 'react';
import { studentScheduleCohort } from '../../utils/scheduleIdentity';
import { Link } from 'react-router-dom';
import { 
  CalendarCheck2, BookOpen, IndianRupee, Award, 
  TrendingUp, ShieldCheck, CheckCircle2, Clock, QrCode, 
  ArrowRight, Hash, Play, MapPin, Bell, Navigation, User, Key
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentAcademicData } from '../../hooks/useStudentAcademicData';
import { academicHighlights, recordDateLabel } from '../../utils/academicRecords';
import { attendanceService } from '../../services/attendanceService';
import { timetableService, computeLectureLiveState, WEEK_DAYS, getCurrentDayName } from '../../services/timetableService';
import { locationService, LOCATION_PRESETS } from '../../services/locationService';
import { credentialService } from '../../services/credentialService';
import ChangePasswordModal from '../../components/ChangePasswordModal';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { dept, sem } = studentScheduleCohort(user);
  const academic = useStudentAcademicData(user?.uid, ['profile','attendance','academicSummary','feeSummary']);
  const summary = academicHighlights({academicSummary:academic.data.academicSummary,feeSummary:academic.data.feeSummary,enrolledCourses:academic.data.academicSummary?.enrolledCourses});
  const me = {
    name: user?.displayName || user?.name || 'Student',
    prn: user?.prn || 'Not assigned',
    dept: dept || 'Not assigned',
    sem: sem || 'Not assigned',
    cgpa: summary.cgpa == null ? 'Not published' : summary.cgpa.toFixed(2)
  };
  const studentUid = user?.uid;

  const analytics = attendanceService.calculateAnalyticsFromHistory(academic.data.attendance);
  const [now, setNow] = useState(new Date());
  const [proximityAlert, setProximityAlert] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(locationService.getCurrentLocation());
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isStartingPassword, setIsStartingPassword] = useState(() => 
    credentialService.isStartingPassword(user?.email)
  );

  const currentDayName = getCurrentDayName(now);
  const todayLecturesRaw = timetableService.getStudentLectures(dept, sem, currentDayName);

  useEffect(() => {
    const timer = setInterval(() => {
      const cur = new Date();
      setNow(cur);

      // Check proximity alert
      const { activeLecture, nextUpcomingLecture } = timetableService.getStudentActiveOrNextLecture(dept, sem, cur);
      const targetLec = activeLecture || nextUpcomingLecture;
      if (targetLec) {
        const evalAlert = locationService.checkAndTriggerProximityAlerts(targetLec, cur);
        setProximityAlert(evalAlert?.activeAlert || null);
      } else {
        setProximityAlert(null);
      }
    }, 1000);

    const unsubLoc = locationService.subscribe((loc) => {
      setCurrentLocation(loc);
    });

    return () => {
      clearInterval(timer);
      unsubLoc();
    };
  }, [studentUid, dept, sem]);

  useEffect(() => {
    if (user?.email) {
      setIsStartingPassword(credentialService.isStartingPassword(user.email));
    }
  }, [user]);

  const handleLocationPresetChange = (presetId) => {
    locationService.setLocation(presetId);
    const loc = locationService.getCurrentLocation();
    setCurrentLocation(loc);
    const { activeLecture, nextUpcomingLecture } = timetableService.getStudentActiveOrNextLecture(dept, sem, new Date());
    const targetLec = activeLecture || nextUpcomingLecture;
    if (targetLec) {
      const evalAlert = locationService.checkAndTriggerProximityAlerts(targetLec, new Date());
      setProximityAlert(evalAlert?.activeAlert || null);
    } else {
      setProximityAlert(null);
    }
  };

  // Compute live states for today's lectures
  const todayLectures = todayLecturesRaw.map(lec => ({
    ...lec,
    ...computeLectureLiveState(lec, now)
  }));

  const activeNow = todayLectures.find(l => l.isLive);
  const nextUp = todayLectures.find(l => l.isUpcoming);

  const distanceMeters = locationService.getDistanceFromCampus(currentLocation);
  const isOutside = locationService.isOutsideGeofence(currentLocation);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Starting Password Security Alert Banner */}
      {isStartingPassword && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-xl text-xs space-y-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <Key className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-text">Default Starting Password Active</p>
              <p className="text-muted leading-relaxed">
                You are currently using an initial administrative starting password. Please update your password to secure your student portal account.
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
                <span className="font-bold text-sm sm:base">{proximityAlert.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-bg/80 border border-border">
                  Alert at {proximityAlert.timestamp}
                </span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-text">
                {proximityAlert.message}
              </p>
              <div className="flex items-center gap-3 pt-1 text-xs text-muted flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-text">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> Current Distance: {distanceMeters}m from KRC IT Campus
                </span>
                <span>•</span>
                <span>Classroom attendance requires you to be within 100m</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setProximityAlert(null)}
            className="absolute top-4 right-4 text-muted hover:text-text p-1"
            aria-label="Dismiss Alert"
          >
            ×
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Welcome back, {me.name}</h1>
          <p className="text-muted text-sm mt-1">
            {me.prn} · {me.dept} ({me.sem}) · KRC Institute of Technology
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
            to="/student/timetable" 
            className="px-3.5 py-2 bg-surface border border-border text-text hover:bg-bg rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <Clock className="w-4 h-4 text-muted" /> Full Timetable
          </Link>
          <Link 
            to="/student/attendance?scan=true" 
            className="px-4 py-2 bg-text text-bg rounded-lg text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5 shadow-sm shrink-0 touch-manipulation"
          >
            <QrCode className="w-4 h-4" /> Scan Attendance QR
          </Link>
        </div>
      </div>

      {/* Location Status & Geofence Simulator Widget */}
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
              100m Campus Geofence Active · Single-fire 15-min and started alerts configured.
            </p>
          </div>
        </div>

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
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Live Attendance KPI */}
        <div className="bg-surface p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-border shadow-sm flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Live Attendance</p>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-text">
              {academic.loading ? 'Loading…' : 'Not published'}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Exam status not published
            </p>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
        </div>

        {/* CGPA */}
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Cumulative CGPA</p>
            <h3 className="text-3xl font-extrabold text-text">{me.cgpa}</h3>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-medium">Published academic summary</p>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 border border-blue-500/20">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Enrolled Courses */}
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Registered Courses</p>
            <h3 className="text-3xl font-extrabold text-text">{summary.enrolledCourses ? `${summary.enrolledCourses.length} Subjects` : 'Not published'}</h3>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-medium">Enrollment records</p>
          </div>
          <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600 border border-purple-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Fee Status */}
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Annual Fee Status</p>
            <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{summary.feeStatus || (summary.due == null ? 'Not published' : summary.due > 0 ? 'Outstanding' : 'No recorded dues')}</h3>
            <p className="text-[11px] text-muted mt-1 font-medium">Student accounts summary</p>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-600 border border-amber-500/20">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Hero Widget: Live Ongoing Lecture with Dynamic Playback Progress */}
      {activeNow && (
        <div className="p-5 sm:p-6 rounded-xl sm:rounded-2xl border border-emerald-500/40 bg-surface shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-text">
                Live Ongoing Lecture Right Now
              </span>
            </div>
            <span className="text-xs font-mono text-muted">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-text">
                  {activeNow.courseCode}: {activeNow.courseName}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20">
                  IN SESSION
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted mt-1 flex-wrap">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-blue-500" /> {activeNow.facultyName}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-500" /> {activeNow.room}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500" /> Slot: {activeNow.time}</span>
              </div>
            </div>

            <Link
              to="/student/attendance"
              className="px-4 py-2 bg-text text-bg rounded-lg text-xs font-bold hover:opacity-90 transition flex items-center justify-center gap-1.5 shrink-0"
            >
              <QrCode className="w-3.5 h-3.5" /> Scan Attendance
            </Link>
          </div>

          {/* Real-time Playback Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono font-semibold text-text flex items-center gap-1.5">
                <Play className="w-3 h-3 fill-current text-emerald-500" />
                Playback: {activeNow.playbackFormatted}
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {activeNow.progressPercent}%
              </span>
            </div>
            <div className="w-full bg-bg h-2 rounded-full overflow-hidden border border-border">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${activeNow.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Graphs & Detailed Attendance Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
        
        {/* Left 7 Columns: Live Attendance Trend Graph */}
        <div className="lg:col-span-7 bg-surface p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-border shadow-sm space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <h3 className="text-base font-bold text-text">Weekly Attendance Trend &amp; Analytics</h3>
              </div>
              <p className="text-xs text-muted mt-0.5">Your saved attendance records update automatically.</p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold flex-wrap">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Recorded attendance
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <span className="w-2.5 h-1 bg-muted"></span> Published totals required
              </div>
            </div>
          </div>

          <div className="h-56 sm:h-64 w-full pt-2 min-w-0">
            {analytics.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.trendData}>
                  <defs>
                    <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.4} vertical={false} />
                  <XAxis dataKey="week" stroke="currentColor" className="text-muted" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={[60, 100]} stroke="currentColor" className="text-muted" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--surface)', 
                      borderColor: 'var(--border)', 
                      borderRadius: '8px', 
                      color: 'var(--text)',
                      fontSize: '12px'
                    }}
                    formatter={(val) => [`${val}%`, 'Attendance Rate']}
                  />
                  <Area type="monotone" dataKey="attendance" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#attendanceGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted">
                {academic.loading ? 'Loading attendance records…' : 'Attendance totals have not been published.'}
              </div>
            )}
          </div>

          {/* Subject-wise Progress Bars */}
          <div className="pt-4 border-t border-border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text">Subject-Wise Attendance Breakdown</h4>
            <div className="space-y-2.5">
              {analytics?.subjects.map((sub) => (
                <div key={sub.code} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-text">{sub.code}: {sub.name}</span>
                    <span className="font-mono text-muted">{sub.attendedLectures} recorded check-in(s)</span>
                  </div>
                  <div className="w-full bg-bg h-2 rounded-full overflow-hidden border border-border">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        sub.percentage >= 85 ? 'bg-emerald-500' :
                        sub.percentage >= 75 ? 'bg-blue-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${sub.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Recent Verified Receipts & Today's Schedule */}
        <div className="lg:col-span-5 space-y-6 min-w-0">
          
          {/* Recent Recorded Attendance Check-ins (Tamper-Proof Proof) */}
          <div className="bg-surface p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-text">Recorded Attendance Check-ins</h3>
                <p className="text-[11px] text-muted">Saved attendance entries for your account.</p>
              </div>
              <Link 
                to="/student/attendance" 
                className="text-[11px] font-semibold text-text hover:underline flex items-center gap-1 shrink-0"
              >
                Full Audit Log <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {!academic.loading && analytics.recentLogs.length === 0 && <p role="status" className="text-xs text-muted">No attendance check-ins recorded.</p>}
              {analytics?.recentLogs.slice(0, 4).map((rec) => (
                <div key={rec.attendanceId} className="p-3 rounded-xl bg-bg border border-border space-y-1 hover:border-text/30 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-text truncate">{rec.courseId} - {rec.courseName}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Present
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span className="truncate">{rec.faculty} ({rec.lectureHall})</span>
                    <span className="shrink-0">{recordDateLabel(rec).split(',')[0]}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-muted pt-1 border-t border-border">
                    <Hash className="w-3 h-3 shrink-0" />
                    <span className="truncate">Receipt: {rec.receiptHash}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Timetable with Lively Status Badges */}
          <div className="bg-surface p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-border shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text">Today's Class Schedule ({currentDayName})</h3>
              <Link to="/student/timetable" className="text-xs text-muted hover:text-text">
                View Week
              </Link>
            </div>
            
            <div className="space-y-2">
              {todayLectures.map((s, idx) => (
                <div 
                  key={s.id || idx} 
                  className={`p-3 bg-bg rounded-xl border flex items-center justify-between transition ${
                    s.isLive ? 'border-emerald-500/60 shadow-sm' : 'border-border'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-text">{s.courseCode}: {s.courseName}</p>
                      {s.isLive && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted">{s.facultyName} · {s.room}</p>
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
