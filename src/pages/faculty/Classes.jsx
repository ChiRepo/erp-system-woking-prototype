/**
 * @fileoverview FACULTY Classes Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { useState, useEffect } from 'react';
import { 
  BookOpen, Users, Clock, MapPin, CheckCircle, 
  ArrowRight, Play, Calendar, UserCheck, Layers 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { facultyScheduleId } from '../../utils/scheduleIdentity';
import { 
  timetableService, WEEK_DAYS, computeLectureLiveState, getCurrentDayName 
} from '../../services/timetableService';

export default function FacultyClasses() {
  const { user } = useAuth();
  const facultyId = facultyScheduleId(user);

  const [activeDay, setActiveDay] = useState(() => getCurrentDayName());
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter lectures assigned to this faculty for the selected day
  const rawDayLectures = timetableService.getFacultyLectures(facultyId, activeDay);
  const facultyLectures = rawDayLectures;

  const isToday = activeDay === getCurrentDayName(now);

  const lectures = facultyLectures.map(lec => {
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text">My Teaching Schedule &amp; Assigned Classes</h1>
          <p className="text-muted text-xs sm:text-sm mt-1">
            Semester V lecture assignments, syllabus completion, and real-time attendance management.
          </p>
        </div>
        <Link 
          to="/faculty/attendance"
          className="inline-flex items-center gap-2 px-4 py-2 bg-text text-bg rounded-lg text-xs font-bold hover:opacity-90 transition shadow-sm shrink-0"
        >
          <UserCheck className="w-4 h-4" /> Open Attendance Station <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Weekday Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        {WEEK_DAYS.map((day) => {
          const isSelected = activeDay === day;
          const isTodayTab = day === getCurrentDayName(now);

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

      {/* Class Schedule Cards */}
      <div className="space-y-4">
        {lectures.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border p-8 text-center text-muted text-sm">
            No lectures assigned to you on {activeDay}. Use this period for research, evaluation, or mentoring.
          </div>
        ) : (
          lectures.map((lec, idx) => (
            <div
              key={lec.id || idx}
              className={`bg-surface rounded-xl sm:rounded-2xl border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition shadow-sm ${
                lec.isLive 
                  ? 'border-emerald-500/60 ring-1 ring-emerald-500/30' 
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
                  ) : (
                    <span className="text-xs text-muted bg-bg px-2 py-0.5 rounded border border-border">
                      {lec.statusLabel || 'Scheduled'}
                    </span>
                  )}

                  <span className="text-[11px] text-muted bg-bg px-2 py-0.5 rounded border border-border">
                    {lec.type}
                  </span>
                </div>

                <h3 className="font-bold text-text text-base sm:text-lg">
                  {lec.courseCode}: {lec.courseName}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-500" /> {lec.room}</span>
                  <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-purple-500" /> {lec.sem} ({lec.dept})</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-blue-500" /> 60 Enrolled Students</span>
                </div>

                {lec.isLive && (
                  <div className="pt-2 space-y-1 max-w-md">
                    <div className="flex justify-between text-[11px] font-mono text-muted">
                      <span className="flex items-center gap-1">
                        <Play className="w-3 h-3 text-emerald-500 fill-current" />
                        {lec.playbackFormatted}
                      </span>
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

              <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg border border-border text-xs font-mono font-semibold text-text">
                  <Clock className="w-3.5 h-3.5 text-muted" />
                  <span>{lec.time}</span>
                </div>

                <Link
                  to="/faculty/attendance"
                  className="px-3.5 py-1.5 rounded-lg bg-text text-bg text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5"
                >
                  Broadcast QR <ArrowRight className="w-3.5 h-3.5" />
                </Link>
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
