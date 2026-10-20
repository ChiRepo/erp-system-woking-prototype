import { useState, useEffect } from 'react';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';

export default function LiveClock({ 
  className = '', 
  compact = false, 
  showSeconds = true,
  theme = 'glass' // 'glass' | 'minimal' | 'cosmic'
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format parts with full precision
  const dayName = time.toLocaleDateString('en-US', { weekday: 'long' });
  const dayNameShort = time.toLocaleDateString('en-US', { weekday: 'short' });
  const dateNum = time.getDate();
  const monthName = time.toLocaleDateString('en-US', { month: 'long' });
  const monthNameShort = time.toLocaleDateString('en-US', { month: 'short' });
  const year = time.getFullYear();

  const timeString = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined,
    hour12: true
  });

  if (theme === 'cosmic') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0d1326]/90 border border-cyan-500/30 text-white shadow-[0_0_15px_rgba(34,211,238,0.2)] font-mono ${className}`}>
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
        <span className="font-bold text-xs tracking-wider text-cyan-300">{timeString}</span>
        <span className="text-white/40 text-[11px] font-sans">|</span>
        <span className="text-xs font-sans text-white/90">
          <span className="font-semibold text-white">{dayName}</span>, {dateNum} {monthName} {year}
        </span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs text-muted ${className}`}>
        <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span className="font-mono font-bold text-text">{timeString}</span>
        <span>·</span>
        <span className="truncate">{dayNameShort}, {dateNum} {monthNameShort} {year}</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-surface/90 dark:bg-surface/70 border border-border dark:border-white/10 shadow-sm backdrop-blur-md text-xs transition-all ${className}`}>
      {/* Glowing Live Beacon */}
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 hidden sm:inline-block" />
        <span className="font-mono font-bold text-text tracking-tight text-[11px] sm:text-xs">
          {timeString}
        </span>
      </div>

      <span className="text-border dark:text-white/20 select-none">|</span>

      {/* Real-time Day/Date & Month/Year */}
      <div className="flex items-center gap-1 text-[11px] sm:text-xs text-text font-medium truncate">
        <CalendarIcon className="w-3.5 h-3.5 text-muted shrink-0 hidden md:inline-block" />
        <span className="font-semibold text-text">{dayName},</span>
        <span className="font-bold text-emerald-600 dark:text-emerald-400">{dateNum}</span>
        <span className="text-muted">{monthName}</span>
        <span className="font-mono font-semibold text-text">{year}</span>
      </div>
    </div>
  );
}
