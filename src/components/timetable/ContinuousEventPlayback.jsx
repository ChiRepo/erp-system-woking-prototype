import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Play, Pause, RotateCcw, QrCode, Sparkles, 
  Clock, MapPin, User, BookOpen, Layers,
  Radio, MoveHorizontal
} from 'lucide-react';
import { 
  timetableService, WEEK_DAYS, timeStringToMinutes, 
  getCurrentDayIndex, getCurrentDayName 
} from '../../services/timetableService';
import { liveTimelineCursor } from '../../utils/scheduleIdentity';
import { useTheme } from '../../contexts/ThemeContext';

// Constants for continuous timeline layout
const START_HOUR = 8; // 08:00 AM
const END_HOUR = 20;  // 08:00 PM (12 hours per day)
const HOURS_PER_DAY = END_HOUR - START_HOUR;
const MINUTES_PER_DAY = HOURS_PER_DAY * 60; // 720 minutes
const PX_PER_MINUTE = 2.4; // 144px per hour -> smooth, expansive horizontal space
const DAY_WIDTH = MINUTES_PER_DAY * PX_PER_MINUTE; // 1728px per day

// Category tracks inspired by the Welkin Moon Event Calendar in the reference
const EVENT_TRACKS = [
  { id: 'theory', name: 'Core Theory & Lectures', shortName: 'Lectures', color: 'from-indigo-600/30 to-blue-600/20', borderColor: 'border-indigo-500/40', badge: 'Lectures' },
  { id: 'lab', name: 'Labs & Practical Studios', shortName: 'Labs', color: 'from-cyan-600/30 to-teal-600/20', borderColor: 'border-cyan-500/40', badge: 'Practical' },
  { id: 'tutorial', name: 'Tutorials & Seminars', shortName: 'Tutorials', color: 'from-purple-600/30 to-pink-600/20', borderColor: 'border-purple-500/40', badge: 'Tutorials' },
  { id: 'campus', name: 'Campus Life & Hackathons', shortName: 'Events', color: 'from-amber-600/30 to-rose-600/20', borderColor: 'border-amber-500/40', badge: 'Events' },
];

export default function ContinuousEventPlayback({ onScanQr, dept, sem }) {
  const { darkMode } = useTheme();

  // Current real-world time
  const [realTime, setRealTime] = useState(new Date());
  
  // Playback simulation engine
  const [isLiveSync, setIsLiveSync] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 5x, 15x, 60x (1 min/sec)
  const [simulatedMinutes, setSimulatedMinutes] = useState(() => liveTimelineCursor(new Date()).position);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const viewportRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(1000);

  // Responsive container width tracking for seamless mobile/tablet/desktop adaptation
  useEffect(() => {
    const updateSize = () => {
      if (viewportRef.current) {
        setContainerWidth(viewportRef.current.clientWidth);
      } else {
        setContainerWidth(window.innerWidth);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });

    if (viewportRef.current) {
      ro.observe(viewportRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateSize);
      ro.disconnect();
    };
  }, []);

  const isMobile = containerWidth < 640;
  const isTablet = containerWidth >= 640 && containerWidth < 1024;

  // Responsive dimensions
  const categoryColWidth = isMobile ? 112 : (isTablet ? 168 : 224);
  const stiffBarOffsetPx = isMobile 
    ? Math.max(categoryColWidth + 24, Math.round(containerWidth * 0.44))
    : (isTablet ? 240 : 280);

  // Real-time ticking interval every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setRealTime(now);

      if (isLiveSync) {
        setSimulatedMinutes(liveTimelineCursor(now).position);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isLiveSync]);

  // Simulation playback loop
  useEffect(() => {
    if (!isPlaying || isLiveSync) return;

    const interval = setInterval(() => {
      setSimulatedMinutes(prev => {
        const totalWeekMinutes = 7 * MINUTES_PER_DAY;
        const next = prev + (playbackSpeed * 0.5); // advance based on speed
        return next >= totalWeekMinutes ? 0 : next;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, isLiveSync, playbackSpeed]);

  // Compute current day & time from simulatedMinutes
  const currentDayIndex = isLiveSync ? getCurrentDayIndex(realTime) : Math.min(6, Math.max(0, Math.floor(simulatedMinutes / MINUTES_PER_DAY)));
  const currentDayName = WEEK_DAYS[currentDayIndex] || 'Monday';
  const currentMinuteInDay = simulatedMinutes % MINUTES_PER_DAY;
  const currentTotalMinute = isLiveSync ? liveTimelineCursor(realTime).minute : (START_HOUR * 60) + currentMinuteInDay;
  const currentHour = Math.floor(currentTotalMinute / 60);
  const currentMinute = Math.floor(currentTotalMinute % 60);
  const formattedTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

  // Calendar dates for the current week (Monday through Sunday)
  const weekDates = useMemo(() => {
    const now = new Date();
    const currentDay = getCurrentDayIndex(now); // Mon=0 .. Sun=6
    return WEEK_DAYS.map((dayName, idx) => {
      const d = new Date(now);
      d.setDate(now.getDate() - currentDay + idx);
      return {
        dayName,
        dateNumber: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        fullDate: d
      };
    });
  }, []);

  // Map each lecture into continuous timeline coordinates and assign to track
  const mappedEvents = useMemo(() => {
    return timetableService.getStudentLectures(dept, sem).map((lec) => {
      const dayIndex = WEEK_DAYS.indexOf(lec.day);
      if (dayIndex === -1) return null;

      const startMin = timeStringToMinutes(lec.start) - (START_HOUR * 60);
      const endMin = timeStringToMinutes(lec.end) - (START_HOUR * 60);
      const durationMin = lec.durationMinutes || (endMin - startMin);

      // Global minute offset in continuous week
      const globalStartMin = dayIndex * MINUTES_PER_DAY + Math.max(0, startMin);
      const globalEndMin = globalStartMin + durationMin;

      // Track assignment
      let trackId = 'theory';
      const typeLower = (lec.type || '').toLowerCase();
      const nameLower = (lec.courseName || '').toLowerCase();
      if (typeLower.includes('lab') || typeLower.includes('practical') || nameLower.includes('lab')) {
        trackId = 'lab';
      } else if (typeLower.includes('tutorial') || typeLower.includes('mentor') || typeLower.includes('study')) {
        trackId = 'tutorial';
      } else if (typeLower.includes('colloquium') || nameLower.includes('hackathon') || nameLower.includes('robotics')) {
        trackId = 'campus';
      }

      // Track index: 0, 1, 2, 3
      const trackIdx = EVENT_TRACKS.findIndex(t => t.id === trackId);

      return {
        ...lec,
        dayIndex,
        globalStartMin,
        globalEndMin,
        trackId,
        trackIdx: trackIdx >= 0 ? trackIdx : 0,
        leftPx: globalStartMin * PX_PER_MINUTE,
        widthPx: Math.max(120, durationMin * PX_PER_MINUTE)
      };
    }).filter(Boolean);
  }, [dept, sem]);

  // Compute live state of events based on current simulatedMinutes
  const evaluatedEvents = useMemo(() => {
    return mappedEvents.map(ev => {
      const live = liveTimelineCursor(realTime);
      const isPast = isLiveSync
        ? ev.dayIndex < live.dayIndex || (ev.dayIndex === live.dayIndex && live.minute >= timeStringToMinutes(ev.end))
        : simulatedMinutes >= ev.globalEndMin;
      const isFuture = isLiveSync
        ? ev.dayIndex > live.dayIndex || (ev.dayIndex === live.dayIndex && live.minute < timeStringToMinutes(ev.start))
        : simulatedMinutes < ev.globalStartMin;
      const isLive = !isPast && !isFuture;

      let progress = 0;
      if (isPast) progress = 100;
      else if (isLive) {
        const elapsed = isLiveSync ? live.minute - timeStringToMinutes(ev.start) : simulatedMinutes - ev.globalStartMin;
        const total = ev.globalEndMin - ev.globalStartMin;
        progress = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
      }

      return {
        ...ev,
        isLive,
        isPast,
        isFuture,
        progress
      };
    });
  }, [mappedEvents, simulatedMinutes, isLiveSync, realTime]);

  // Current active live event intersecting the stiff time bar
  const activeNowEvent = evaluatedEvents.find(e => e.isLive);

  // The background timetable scrolls LEFT:
  const scrollOffsetPx = (simulatedMinutes * PX_PER_MINUTE) - stiffBarOffsetPx;

  // Jump to specific day
  const handleJumpToDay = (dayIndex) => {
    setIsLiveSync(false);
    setIsPlaying(false);
    const targetMin = dayIndex * MINUTES_PER_DAY + (90); // 90 min from 08:00 = 09:30 AM
    setSimulatedMinutes(targetMin);
  };

  // Jump to NOW (Real Time)
  const handleJumpToNow = () => {
    setIsLiveSync(true);
    setIsPlaying(false);
    const now = new Date();
    setRealTime(now);
    setSimulatedMinutes(liveTimelineCursor(now).position);
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-border dark:border-indigo-500/30 bg-surface dark:bg-[#080d1a] text-text dark:text-white shadow-xl dark:shadow-[0_0_40px_rgba(79,70,229,0.15)] overflow-hidden select-none relative transition-colors duration-200">
      
      {/* =========================================================================
          COSMIC HEADER BANNER (Genshin Welkin Moon Event Calendar Aesthetic)
          ========================================================================= */}
      <div className="relative p-4 sm:p-6 bg-gradient-to-r from-slate-100 via-indigo-50/70 to-cyan-50/50 dark:from-[#0d1527] dark:via-[#141b36] dark:to-[#0a1122] border-b border-border dark:border-indigo-500/20 overflow-hidden">
        {/* Celestial star speckles & blur glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-10 w-96 h-32 bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Calendar Title & Version Emblem */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 dark:border-cyan-400/40 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3 h-3 text-cyan-600 dark:text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                Continuous 7-Day Live Playback
              </span>
              <span className="text-xs text-muted dark:text-white/50">|</span>
              <span className="text-xs font-mono text-indigo-700 dark:text-indigo-300 font-semibold flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-500 dark:text-emerald-400 animate-pulse" />
                {isLiveSync ? 'Synced to Real-World Clock' : 'Simulation Mode'}
              </span>
            </div>

            <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 dark:from-white dark:via-indigo-100 dark:to-cyan-200 bg-clip-text text-transparent flex items-center gap-2">
              {sem || 'Enrollment'} Academic Event Calendar
            </h2>
            <p className="text-xs text-muted dark:text-indigo-200/70 max-w-2xl">
              Continuous timeline with fixed stiff live-time bar and autonomous leftward timetable scrolling across all 7 days of the week.
            </p>
          </div>

          {/* Interactive Playback Control Console */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap bg-surface/80 dark:bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-border dark:border-white/10 shrink-0">
            {/* Real-Time Live Sync Button */}
            <button
              onClick={handleJumpToNow}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 touch-manipulation ${
                isLiveSync 
                  ? 'bg-emerald-500 text-black shadow-[0_0_15px_#10b981]' 
                  : 'bg-bg dark:bg-white/10 text-text dark:text-white/80 hover:bg-surface dark:hover:bg-white/20 border border-border dark:border-white/10'
              }`}
              title="Lock playback to live real-time clock"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>NOW LIVE</span>
            </button>

            {/* Play / Pause Toggle */}
            <button
              onClick={() => {
                setIsLiveSync(false);
                setIsPlaying(!isPlaying);
              }}
              className="p-2 rounded-xl bg-bg dark:bg-white/10 hover:bg-surface dark:hover:bg-white/20 active:scale-95 text-text dark:text-white transition touch-manipulation border border-border dark:border-white/10"
              title={isPlaying ? 'Pause Playback' : 'Play Simulation'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            {/* Speed Multipliers */}
            <div className="flex items-center bg-bg dark:bg-white/5 rounded-xl p-0.5 border border-border dark:border-white/10 text-[11px] font-mono">
              {[1, 5, 15, 60].map((spd) => (
                <button
                  key={spd}
                  onClick={() => {
                    setIsLiveSync(false);
                    setPlaybackSpeed(spd);
                    setIsPlaying(true);
                  }}
                  className={`px-2 py-1 rounded-lg font-bold transition-all ${
                    playbackSpeed === spd && !isLiveSync && isPlaying
                      ? 'bg-indigo-600 text-white dark:bg-indigo-500 shadow-sm'
                      : 'text-muted hover:text-text dark:text-white/60 dark:hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Attendance QR Trigger Link */}
            <Link
              to="/student/attendance"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-90 text-white dark:text-black font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,211,238,0.3)] transition"
            >
              <QrCode className="w-3.5 h-3.5 stroke-[2.2]" />
              <span className="hidden sm:inline">Scan QR</span>
            </Link>
          </div>
        </div>

        {/* Day Quick-Selector Tabs Bar (Monday -> Sunday) */}
        <div className="mt-4 pt-3 border-t border-border/80 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 touch-pan-x">
            {weekDates.map((d, idx) => {
              const isSelectedDay = currentDayIndex === idx;
              return (
                <button
                  key={d.dayName}
                  onClick={() => handleJumpToDay(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 touch-manipulation ${
                    isSelectedDay
                      ? 'bg-indigo-600 text-white dark:bg-indigo-500/30 dark:text-cyan-300 border border-indigo-600 dark:border-cyan-400/50 shadow-md'
                      : 'bg-surface dark:bg-white/5 text-muted dark:text-white/70 hover:text-text dark:hover:bg-white/10 border border-border dark:border-transparent'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono ${
                    isSelectedDay ? 'bg-white/20 text-white' : 'bg-bg dark:bg-white/10 text-muted dark:text-white/70'
                  }`}>
                    {d.dateNumber}
                  </span>
                  <span>{d.dayName.slice(0, 3)}</span>
                  {isSelectedDay && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Time Scrubber Slider (Adaptive for all screens) */}
          <div className="flex items-center gap-2 w-full sm:w-auto min-w-[200px] sm:min-w-[240px]">
            <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="text-[11px] font-mono font-semibold text-indigo-700 dark:text-cyan-300 whitespace-nowrap">
              {currentDayName.slice(0, 3)} {formattedTime}
            </span>
            <input
              type="range"
              min="0"
              max={7 * MINUTES_PER_DAY - 1}
              value={simulatedMinutes}
              onChange={(e) => {
                setIsLiveSync(false);
                setSimulatedMinutes(parseFloat(e.target.value));
              }}
              className="w-full h-1.5 bg-slate-300 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-cyan-400"
              title="Scrub timeline across the entire week"
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          CONTINUOUS CALENDAR VIEWPORT WITH STIFF LIVE TIME BAR
          ========================================================================= */}
      <div 
        ref={viewportRef}
        className="relative w-full overflow-hidden bg-slate-50/70 dark:bg-[#070b16] min-h-[380px] sm:min-h-[440px] select-none"
      >
        {/* Left Fixed Category Column (Pinned) */}
        <div 
          className="absolute top-0 bottom-0 left-0 z-30 bg-white/95 dark:bg-[#0a0f20]/95 backdrop-blur-md border-r border-border dark:border-indigo-500/20 flex flex-col shadow-lg"
          style={{ width: `${categoryColWidth}px` }}
        >
          {/* Header Corner */}
          <div className="h-16 border-b border-border dark:border-indigo-500/20 px-2.5 sm:px-3.5 flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 truncate">
              <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span className="truncate">{isMobile ? 'Tracks' : 'Event Tracks'}</span>
            </span>
            <span className="text-[10px] font-mono text-muted dark:text-white/50 shrink-0">7 Days</span>
          </div>

          {/* 4 Category Lanes Labels */}
          {EVENT_TRACKS.map((track) => (
            <div 
              key={track.id}
              className="flex-1 border-b border-border/60 dark:border-white/5 px-2.5 sm:px-3.5 flex flex-col justify-center gap-0.5 hover:bg-slate-100/50 dark:hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${track.color} shrink-0`} />
                <span className="font-bold text-xs text-text dark:text-white truncate">
                  {isMobile ? track.shortName : track.name}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-muted dark:text-white/40 pl-3.5 sm:pl-4 truncate">
                {track.badge}
              </span>
            </div>
          ))}
        </div>

        {/* =====================================================================
            THE STIFF TIME BAR WITH LIVING TRAILING WAKE EFFECT
            ===================================================================== */}
        <div 
          className="absolute top-0 bottom-0 z-20 pointer-events-none"
          style={{ left: `${stiffBarOffsetPx}px` }}
        >
          {/* 1. The Living Trailing Wake Effect (Behind the bar, fading backwards to the left) */}
          <div 
            className="absolute top-0 bottom-0 right-0 pointer-events-none opacity-90 animate-living-wake"
            style={{
              width: isMobile ? '120px' : (isTablet ? '180px' : '220px'),
              background: darkMode
                ? 'linear-gradient(to left, rgba(34, 211, 238, 0.48) 0%, rgba(56, 189, 248, 0.28) 25%, rgba(168, 85, 247, 0.16) 55%, rgba(99, 102, 241, 0.05) 80%, transparent 100%)'
                : 'linear-gradient(to left, rgba(6, 182, 212, 0.42) 0%, rgba(14, 165, 233, 0.24) 25%, rgba(99, 102, 241, 0.12) 55%, transparent 100%)',
            }}
          >
            {/* Animated trailing energy waves (pulsing wake streaks) */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.15)_50%,transparent_100%)] animate-pulse" />
            <div className="absolute top-1/4 left-0 right-0 h-px bg-cyan-400/40 blur-[1px]" />
            <div className="absolute top-2/4 left-0 right-0 h-px bg-indigo-400/40 blur-[1px]" />
            <div className="absolute top-3/4 left-0 right-0 h-px bg-emerald-400/40 blur-[1px]" />
          </div>

          {/* 2. The Stiff Neon Vertical Bar Line */}
          <div className="relative h-full w-[2.5px] bg-gradient-to-b from-cyan-400 via-emerald-400 to-indigo-500 shadow-[0_0_15px_#22d3ee,0_0_25px_#38bdf8]">
            
            {/* Glowing Head Marker Badge */}
            <div className="absolute -top-1 -left-20 w-40 flex flex-col items-center">
              <div className="px-2.5 py-1 rounded-full bg-slate-900 dark:bg-[#0a1024] border border-cyan-400 text-white font-mono text-[10px] font-extrabold shadow-[0_0_20px_rgba(34,211,238,0.5)] flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-cyan-300">{formattedTime}</span>
                <span className="text-white/60">LIVE</span>
              </div>
              <div className="w-2 h-2 rotate-45 bg-cyan-400 shadow-[0_0_10px_#22d3ee] -mt-1" />
            </div>

            {/* Glowing Bottom Cap */}
            <div className="absolute bottom-0 -left-1.5 w-4 h-4 rounded-full bg-cyan-400 blur-[2px] animate-pulse" />
          </div>
        </div>

        {/* =====================================================================
            BACKGROUND CONTINUOUS TIMETABLE (SCROLLS TO THE LEFT UNDER STIFF BAR)
            ===================================================================== */}
        <div 
          className="relative transition-transform duration-300 ease-out will-change-transform flex flex-col"
          style={{ 
            width: `${7 * DAY_WIDTH}px`,
            transform: `translateX(-${scrollOffsetPx}px)` 
          }}
        >
          {/* Top Continuous Timeline Axis: 7 Days & Hours */}
          <div className="h-16 border-b border-border dark:border-indigo-500/20 bg-slate-100/90 dark:bg-[#0a0f22]/90 flex">
            {WEEK_DAYS.map((dayName, dayIdx) => {
              const dateInfo = weekDates[dayIdx];
              const isCurrentDay = currentDayIndex === dayIdx;

              return (
                <div 
                  key={dayName}
                  className={`relative flex flex-col justify-between border-r border-border dark:border-indigo-500/20 px-4 py-2 ${
                    isCurrentDay ? (darkMode ? 'bg-indigo-950/20' : 'bg-indigo-100/30') : ''
                  }`}
                  style={{ width: `${DAY_WIDTH}px` }}
                >
                  {/* Day & Month Header Banner */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-text dark:text-white tracking-wide uppercase">
                      {dateInfo.monthName} · {dayName}
                    </span>
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-[10px] font-mono font-bold text-indigo-700 dark:text-cyan-300 flex items-center justify-center shadow-xs">
                      {dateInfo.dateNumber}
                    </span>
                    {isCurrentDay && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold">
                        TODAY
                      </span>
                    )}
                  </div>

                  {/* Hourly Ticks Axis (08:00 to 20:00) */}
                  <div className="flex justify-between items-center text-[10px] font-mono text-muted dark:text-white/50 pt-1 border-t border-border/50 dark:border-white/5">
                    {Array.from({ length: HOURS_PER_DAY + 1 }).map((_, hIdx) => {
                      const hourVal = START_HOUR + hIdx;
                      return (
                        <span key={hourVal} className="text-center" style={{ width: `${100 / HOURS_PER_DAY}%` }}>
                          {String(hourVal).padStart(2, '0')}:00
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Category Tracks Canvas (4 Rows matching EVENT_TRACKS) */}
          <div className="relative" style={{ height: '360px' }}>
            {/* Background Grid Lines across the entire week */}
            <div className="absolute inset-0 flex pointer-events-none">
              {Array.from({ length: 7 * HOURS_PER_DAY }).map((_, idx) => (
                <div 
                  key={idx} 
                  className="h-full border-r border-border/40 dark:border-white/[0.04]"
                  style={{ width: `${60 * PX_PER_MINUTE}px` }}
                />
              ))}
            </div>

            {/* Horizontal Track Lanes */}
            {EVENT_TRACKS.map((track) => (
              <div 
                key={track.id}
                className="w-full border-b border-border/50 dark:border-white/[0.06] relative"
                style={{ height: '90px' }}
              />
            ))}

            {/* ===============================================================
                RENDER HORIZONTAL CAPSULE EVENT CARDS (Welkin Moon Aesthetic)
                =============================================================== */}
            {evaluatedEvents.map((ev) => {
              const topOffset = ev.trackIdx * 90 + 10;
              const heightPx = 70;

              return (
                <motion.div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`absolute rounded-2xl border transition-all cursor-pointer p-2.5 flex items-center justify-between gap-3 shadow-md ${
                    ev.isLive 
                      ? 'bg-gradient-to-r from-indigo-50 via-cyan-50 to-emerald-50 dark:from-indigo-900/90 dark:via-purple-900/90 dark:to-cyan-900/90 border-cyan-500 dark:border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.35)] ring-2 ring-cyan-400 dark:ring-1 dark:ring-cyan-300'
                      : ev.isPast
                        ? 'bg-slate-100/80 dark:bg-slate-900/60 border-border dark:border-white/10 opacity-70 hover:opacity-90 text-muted dark:text-white/60'
                        : 'bg-white dark:bg-gradient-to-r dark:from-[#0d1630]/90 dark:to-[#121c3d]/90 border-border dark:border-indigo-500/30 hover:border-cyan-500 dark:hover:border-cyan-400/60 text-text dark:text-white shadow-xs'
                  }`}
                  style={{
                    left: `${ev.leftPx}px`,
                    width: `${ev.widthPx}px`,
                    top: `${topOffset}px`,
                    height: `${heightPx}px`
                  }}
                  title={`${ev.courseCode} - ${ev.courseName} (${ev.time})`}
                >
                  {/* Left Icon Emblem Orb */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-xs ${
                      ev.isLive 
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-600 dark:text-cyan-300 animate-pulse'
                        : 'bg-surface dark:bg-white/10 border-border dark:border-white/20 text-text dark:text-white'
                    }`}>
                      <BookOpen className="w-4 h-4 stroke-[2]" />
                    </div>

                    {/* Event Title & Subtitle */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-text dark:text-white truncate">
                          {ev.courseCode}
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full font-mono bg-bg dark:bg-white/10 text-muted dark:text-white/80 border border-border dark:border-white/10">
                          {ev.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted dark:text-indigo-200/80 font-medium truncate mt-0.5">
                        {ev.courseName}
                      </p>
                    </div>
                  </div>

                  {/* Right Room & Status Pill */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {ev.isLive ? (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-400 text-black font-extrabold text-[9px] shadow-[0_0_8px_#22d3ee] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                        NOW LIVE ({ev.progress}%)
                      </span>
                    ) : ev.isPast ? (
                      <span className="text-[9px] font-mono text-muted dark:text-white/40">COMPLETED</span>
                    ) : (
                      <span className="text-[9px] font-mono text-indigo-600 dark:text-cyan-300 font-semibold">UPCOMING</span>
                    )}

                    <span className="text-[10px] text-muted dark:text-white/60 truncate max-w-[120px] flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                      {ev.room.split('(')[0]}
                    </span>
                  </div>

                  {/* Playback Progress underline */}
                  {ev.isLive && (
                    <div className="absolute bottom-0 left-3 right-3 h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-300"
                        style={{ width: `${ev.progress}%` }}
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM LIVE HUD BAR: REAL-TIME TICKER, CURRENT EVENT & CONTROLS
          ========================================================================= */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-slate-100 to-indigo-50/70 dark:from-[#0a0f22] dark:to-[#0d142b] border-t border-border dark:border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Active Lecture Under Cursor */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-600 dark:text-cyan-300">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0">
            {activeNowEvent ? (
              <div>
                <span className="text-muted dark:text-white/60 text-[11px] block">Currently Intersecting Live Stiff Bar:</span>
                <span className="font-bold text-sm text-indigo-700 dark:text-cyan-300 truncate block">
                  {activeNowEvent.courseCode} · {activeNowEvent.courseName}
                </span>
                <span className="text-[11px] text-muted dark:text-white/70">
                  {activeNowEvent.room} · {activeNowEvent.facultyName} ({activeNowEvent.progress}% Elapsed)
                </span>
              </div>
            ) : (
              <div>
                <span className="text-muted dark:text-white/60 text-[11px] block">Academic Timeline Status:</span>
                <span className="font-bold text-sm text-text dark:text-white">No active class at {formattedTime} ({currentDayName})</span>
                <span className="text-[11px] text-muted dark:text-white/50">Next scheduled event scrolls towards the stiff bar from right</span>
              </div>
            )}
          </div>
        </div>

        {/* Real-World Clock & Reset Button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="px-3 py-1.5 rounded-xl bg-surface dark:bg-white/5 border border-border dark:border-white/10 text-right">
            <span className="text-[10px] text-muted dark:text-white/50 block">Real-World Clock</span>
            <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
              {realTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <button
            onClick={handleJumpToNow}
            className="px-3.5 py-2 rounded-xl bg-surface dark:bg-white/10 hover:bg-bg dark:hover:bg-white/20 active:scale-95 text-text dark:text-white font-bold text-xs border border-border dark:border-white/15 transition flex items-center gap-1.5 touch-manipulation shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Reset to Now</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          EVENT DETAIL MODAL (Light & Dark Theme Adaptive)
          ========================================================================= */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-surface dark:bg-[#0d152c] border border-border dark:border-cyan-500/40 rounded-3xl p-6 shadow-2xl text-text dark:text-white space-y-4 relative"
            >
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-5 right-5 p-1 rounded-full text-muted hover:text-text dark:text-white/60 dark:hover:text-white bg-bg dark:bg-white/10 hover:bg-surface dark:hover:bg-white/20 transition"
              >
                ✕
              </button>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 dark:border-cyan-400/40 text-[10px] font-mono font-bold">
                  {selectedEvent.day} · {selectedEvent.time}
                </span>
                {selectedEvent.isLive && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black font-extrabold text-[10px] animate-pulse">
                    LIVE NOW ({selectedEvent.progress}%)
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-text dark:text-white">
                  {selectedEvent.courseCode} — {selectedEvent.courseName}
                </h3>
                <p className="text-xs text-muted dark:text-indigo-200/70 mt-1">
                  Type: {selectedEvent.type} · Department of {selectedEvent.dept}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-bg dark:bg-white/5 border border-border dark:border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted dark:text-white/60 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> Instructor:
                  </span>
                  <span className="font-semibold text-text dark:text-white">{selectedEvent.facultyName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted dark:text-white/60 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> Classroom / Venue:
                  </span>
                  <span className="font-semibold text-text dark:text-white">{selectedEvent.room}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted dark:text-white/60 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Duration:
                  </span>
                  <span className="font-semibold text-text dark:text-white">{selectedEvent.durationMinutes} Minutes</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Link
                  to="/student/attendance"
                  className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white dark:text-black font-bold text-xs rounded-xl hover:opacity-90 transition flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20"
                >
                  <QrCode className="w-4 h-4 stroke-[2.2]" />
                  <span>Scan Lecture Attendance</span>
                </Link>

                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2.5 bg-bg dark:bg-white/10 hover:bg-surface dark:hover:bg-white/20 text-text dark:text-white font-bold text-xs rounded-xl border border-border dark:border-white/15 transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
