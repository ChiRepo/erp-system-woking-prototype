/**
 * @fileoverview STUDENT Timetable Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { useState, useEffect } from 'react';
import { studentScheduleCohort } from '../../utils/scheduleIdentity';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Calendar, Clock, MapPin, User, BookOpen, 
  Play, Radio, QrCode, ArrowRight, Bell, AlertTriangle,
  CheckCircle2, Navigation, Layers, Sparkles
} from 'lucide-react';
import { 
  timetableService, WEEK_DAYS, computeLectureLiveState, getCurrentDayName, getCurrentDayIndex 
} from '../../services/timetableService';
import { 
  locationService, LOCATION_PRESETS 
} from '../../services/locationService';
import ContinuousEventPlayback from '../../components/timetable/ContinuousEventPlayback';

export default function StudentTimetable() {
  const { user } = useAuth();
  const { dept, sem } = studentScheduleCohort(user);
  const defaultDay = getCurrentDayName();
  
  const [viewMode, setViewMode] = useState('continuous'); // 'continuous' | 'daily'
  const [activeDay, setActiveDay] = useState(defaultDay);
  const [now, setNow] = useState(new Date());
  const [proximityAlert, setProximityAlert] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(locationService.getCurrentLocation());

  // Real-time ticking interval every second for smooth playback counter
  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = new Date();
      setNow(currentTime);

      // Check proximity alert for active or next class
      const { activeLecture, nextUpcomingLecture } = timetableService.getStudentActiveOrNextLecture(dept, sem, currentTime);
      const targetLec = activeLecture || nextUpcomingLecture;
      if (targetLec) {
        const evalAlert = locationService.checkAndTriggerProximityAlerts(targetLec, currentTime);
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
  }, [dept, sem]);

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

  // Get lectures for selected day with live computed status
  const todayName = getCurrentDayName(now);
  const rawLectures = timetableService.getStudentLectures(dept, sem, activeDay);
  const isToday = activeDay === todayName;

  const lectures = rawLectures.map(lec => {
    const liveState = isToday ? computeLectureLiveState(lec, now) : {
      status: 'UPCOMING',
      progressPercent: 0,
      elapsedMinutes: 0,
      isLive: false,
      isUpcoming: true,
      playbackFormatted: '00m 00s / ' + lec.durationMinutes + 'm',
      statusLabel: 'Scheduled'
    };
    return { ...lec, ...liveState };
  });

  // Find active lecture right now if viewing today
  const activeNowLecture = isToday ? lectures.find(l => l.isLive) : null;
  const nextUpLecture = isToday ? lectures.find(l => l.isUpcoming) : null;

  const distanceMeters = locationService.getDistanceFromCampus(currentLocation);
  const isOutside = locationService.isOutsideGeofence(currentLocation);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Campus Proximity Warning Banner (Triggered strictly once per lecture if outside >= 100m) */}
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
              <div className="flex items-center gap-3 pt-1 text-xs text-muted flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-text">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> Current Distance: {distanceMeters}m from KRC IT Campus
                </span>
                <span>•</span>
                <span>Geo-fence perimeter: &lt; 100m of classroom required for attendance</span>
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-text">{sem || 'Enrollment'} Weekly Timetable</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface border border-border text-muted font-medium">
              Academic Year 2025–26
            </span>
          </div>
          <p className="text-muted text-xs sm:text-sm mt-1">
            Real-time lecture tracking with continuous event playback and living time bar.
          </p>
        </div>

        {/* View Mode Switcher & Scan Attendance */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center bg-surface border border-border p-1 rounded-xl text-xs">
            <button
              onClick={() => setViewMode('continuous')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                viewMode === 'continuous'
                  ? 'bg-text text-bg shadow-sm'
                  : 'text-muted hover:text-text'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Continuous Live Playback</span>
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                viewMode === 'daily'
                  ? 'bg-text text-bg shadow-sm'
                  : 'text-muted hover:text-text'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Daily Cards</span>
            </button>
          </div>

          <Link
            to="/student/attendance"
            className="px-4 py-2 bg-text text-bg rounded-lg text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <QrCode className="w-4 h-4" /> Scan Attendance QR
          </Link>
        </div>
      </div>

      {/* =========================================================================
          CONTINUOUS LIVE EVENT PLAYBACK TIMELINE (Genshin Welkin Moon Aesthetic)
          ========================================================================= */}
      {viewMode === 'continuous' && (
        <ContinuousEventPlayback dept={dept} sem={sem} />
      )}

      {/* Campus GPS Proximity Status Bar */}
      <div className="bg-surface border border-border rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${isOutside ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-text">Your Campus Location:</span>
              <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                isOutside 
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-500/20' 
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20'
              }`}>
                {isOutside ? `Outside Campus (${distanceMeters}m away)` : `Inside Campus Perimeter (${distanceMeters}m)`}
              </span>
            </div>
            <p className="text-[11px] text-muted mt-0.5">
              Alerts trigger strictly once at 15 minutes prior to class and at class commencement if &gt; 100m away.
            </p>
          </div>
        </div>

        {/* GPS Distance Simulator Switcher */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-[11px] text-muted shrink-0">Simulate Location:</span>
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

      {/* Hero Card: Live Ongoing Lecture with Playback Progress Bar */}
      {isToday && (activeNowLecture || nextUpLecture) && (
        <div className="p-5 sm:p-6 rounded-xl sm:rounded-2xl border border-border bg-surface shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-sm font-bold text-text uppercase tracking-wider">
                {activeNowLecture ? 'Current Ongoing Lecture & Real-Time Playback' : 'Next Scheduled Lecture Today'}
              </h2>
            </div>
            <span className="font-mono text-xs text-muted">
              Current Time: {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {activeNowLecture ? (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl font-bold text-text">
                      {activeNowLecture.courseCode} — {activeNowLecture.courseName}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20">
                      LIVE NOW
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted mt-1 flex-wrap">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-blue-500" /> {activeNowLecture.facultyName}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-500" /> {activeNowLecture.room}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500" /> Slot: {activeNowLecture.time} ({activeNowLecture.durationMinutes} min)</span>
                  </div>
                </div>

                <Link
                  to="/student/attendance"
                  className="px-4 py-2 bg-text text-bg rounded-lg text-xs font-bold hover:opacity-90 transition flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto"
                >
                  <QrCode className="w-3.5 h-3.5" /> Scan Attendance
                </Link>
              </div>

              {/* Real-time Playback Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono font-semibold text-text flex items-center gap-1.5">
                    <Play className="w-3 h-3 fill-current text-emerald-500" />
                    Playback: {activeNowLecture.playbackFormatted}
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {activeNowLecture.progressPercent}%
                  </span>
                </div>
                <div className="w-full bg-bg h-2.5 rounded-full overflow-hidden border border-border">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${activeNowLecture.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted">Upcoming Next:</p>
                <h3 className="text-base font-bold text-text mt-0.5">
                  {nextUpLecture.courseCode} — {nextUpLecture.courseName}
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Starts at {nextUpLecture.start} ({nextUpLecture.room}) · Faculty: {nextUpLecture.facultyName}
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-lg bg-bg border border-border text-muted font-mono font-semibold shrink-0">
                Starts at {nextUpLecture.time}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Weekday Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        {WEEK_DAYS.map((day) => {
          const isSelected = activeDay === day;
          const isTodayTab = day === todayName;

          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 touch-manipulation ${
                isSelected 
                  ? 'bg-text text-bg shadow-sm' 
                  : 'bg-surface border border-border text-muted hover:text-text'
              }`}
            >
              <span>{day}</span>
              {isTodayTab && (
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-bg' : 'bg-emerald-500'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Lectures Schedule List */}
      <div className="space-y-3">
        {lectures.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border p-8 text-center text-muted text-sm">
            No classes scheduled for {activeDay}. Enjoy your self-study time!
          </div>
        ) : (
          lectures.map((lec, idx) => (
            <div
              key={lec.id || idx}
              className={`bg-surface rounded-xl sm:rounded-2xl border p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                lec.isLive 
                  ? 'border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30' 
                  : 'border-border hover:border-text/40'
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-bg border border-border text-text">
                    Slot {lec.slotId}
                  </span>
                  
                  {lec.isLive ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> LIVE NOW
                    </span>
                  ) : lec.status === 'COMPLETED' ? (
                    <span className="text-xs text-muted bg-bg px-2 py-0.5 rounded border border-border">
                      Completed
                    </span>
                  ) : (
                    <span className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded font-medium">
                      Scheduled
                    </span>
                  )}

                  <span className="text-[11px] text-muted bg-bg px-2 py-0.5 rounded border border-border">
                    {lec.type}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-text text-base sm:text-lg">
                    {lec.courseCode}: {lec.courseName}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-blue-500" /> {lec.facultyName}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-500" /> {lec.room}</span>
                  <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-purple-500" /> {lec.sem} ({lec.dept})</span>
                </div>

                {/* Progress bar if lecture is live */}
                {lec.isLive && (
                  <div className="pt-1.5 space-y-1 max-w-md">
                    <div className="flex justify-between text-[11px] font-mono text-muted">
                      <span>{lec.playbackFormatted}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{lec.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-bg h-2 rounded-full overflow-hidden border border-border">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-linear"
                        style={{ width: `${lec.progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Time Badge and Action */}
              <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg border border-border text-xs font-mono font-semibold text-text">
                  <Clock className="w-3.5 h-3.5 text-muted" />
                  <span>{lec.time}</span>
                </div>

                {lec.isLive && (
                  <Link
                    to="/student/attendance"
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    Attendance Open <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>


      {/* Hidden Copyright Notice - Visible in codebase, hidden in UI/UX */}
      <footer className="sr-only" aria-hidden="true">
        <p>Copyright &copy; 2026 Chinmay Chaudhari. All Rights Reserved. (MIT License)</p>
      </footer>
    </div>
  );
}
