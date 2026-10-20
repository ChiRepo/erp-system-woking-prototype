import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, Pause, Clock, Radio, Sparkles, 
  ChevronRight, Calendar, MapPin, SlidersHorizontal 
} from 'lucide-react';
import { getEventLiveStatus } from '../../data/liveEventsData';

export default function LiveEventScroller({ 
  events = [], 
  onSelectEvent = () => {},
  selectedEventId = null,
  activeMinutes = 720, // Default 12:00 PM
  onMinutesChange = () => {}
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tickerSpeed, setTickerSpeed] = useState(35); // seconds per loop

  // Convert minutes into 12-hour formatted time (e.g. 750 -> 12:30 PM)
  const formatTimeFromMinutes = (mins) => {
    const hours24 = Math.floor(mins / 60);
    const m = mins % 60;
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    return `${hours12}:${m < 10 ? '0' : ''}${m} ${period}`;
  };

  // Auto-play time simulation when toggled
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      onMinutesChange(prev => {
        const next = prev + 5;
        return next > 1320 ? 480 : next; // Loop from 08:00 AM to 10:00 PM
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isPlaying, onMinutesChange]);

  const activeEventsCount = useMemo(() => {
    return events.filter(e => {
      const status = getEventLiveStatus(e, activeMinutes);
      return status.status === 'live';
    }).length;
  }, [events, activeMinutes]);

  // Jump to actual real-time minute of day
  const handleJumpToNow = () => {
    const now = new Date();
    const currentM = now.getHours() * 60 + now.getMinutes();
    // Clamp between 08:00 AM (480) and 10:00 PM (1320)
    const clamped = Math.max(480, Math.min(1320, currentM));
    onMinutesChange(clamped);
    setIsPlaying(false);
  };

  return (
    <div className="w-full bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
      {/* Header with Live Ticker Badge & Quick Preset Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
          <h3 className="font-bold text-sm sm:text-base text-text tracking-tight flex items-center gap-2">
            <span>Live Campus Timetable Scroller</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/20">
              {activeEventsCount} Active Now
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Time Presets */}
          <div className="hidden sm:flex items-center gap-1 bg-bg p-1 rounded-lg border border-border text-xs">
            <button
              onClick={() => onMinutesChange(600)} // 10:00 AM
              className={`px-2 py-1 rounded transition-colors ${activeMinutes === 600 ? 'bg-surface font-bold shadow-sm text-text' : 'text-muted hover:text-text'}`}
            >
              Morning
            </button>
            <button
              onClick={() => onMinutesChange(840)} // 02:00 PM
              className={`px-2 py-1 rounded transition-colors ${activeMinutes === 840 ? 'bg-surface font-bold shadow-sm text-text' : 'text-muted hover:text-text'}`}
            >
              Afternoon
            </button>
            <button
              onClick={() => onMinutesChange(1080)} // 06:00 PM
              className={`px-2 py-1 rounded transition-colors ${activeMinutes === 1080 ? 'bg-surface font-bold shadow-sm text-text' : 'text-muted hover:text-text'}`}
            >
              Evening
            </button>
          </div>

          <button
            onClick={handleJumpToNow}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 active:scale-95"
            title="Reset Scrubber to Current Real-World Clock"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Now</span>
          </button>

          <button
            onClick={() => setIsPlaying(p => !p)}
            className={`p-1.5 rounded-lg border text-xs font-medium transition-all ${
              isPlaying 
                ? 'bg-rose-500 text-white border-rose-600' 
                : 'bg-bg hover:bg-surface text-text border-border'
            }`}
            title={isPlaying ? 'Pause auto-timeline playback' : 'Play continuous timeline playback'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Continuous Marquee Ticker: Smooth auto-scrolling upcoming events ribbon */}
      <div className="relative w-full overflow-hidden rounded-xl bg-bg/80 border border-border/80 py-2.5">
        <div className="flex space-x-4 animate-marquee whitespace-nowrap">
          {events.concat(events).map((event, idx) => {
            const status = getEventLiveStatus(event, activeMinutes);
            const isSelected = selectedEventId === event.id;

            return (
              <button
                key={`${event.id}-${idx}`}
                onClick={() => onSelectEvent(event.id)}
                className={`inline-flex items-center gap-3 px-3.5 py-1.5 rounded-lg border text-xs transition-all shrink-0 cursor-pointer ${
                  isSelected 
                    ? 'bg-surface border-emerald-500 ring-2 ring-emerald-500/20 shadow-md scale-105' 
                    : 'bg-surface/80 border-border hover:border-text/40'
                }`}
              >
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${status.color}`}>
                  {status.label}
                </span>

                <span className="font-semibold text-text truncate max-w-[180px]">
                  {event.shortTitle}
                </span>

                <span className="text-muted flex items-center gap-1 text-[11px]">
                  <Clock className="w-3 h-3 text-muted" />
                  {event.timeDisplay}
                </span>

                <span className="text-[11px] text-muted flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-500" />
                  {event.venue.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Time-Scrubber Slider Bar */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted flex items-center gap-1.5 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
            <span>Interactive Time-Scrubber:</span>
            <strong className="text-text font-bold text-sm bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 text-blue-600 dark:text-blue-400">
              {formatTimeFromMinutes(activeMinutes)}
            </strong>
          </span>

          <span className="text-[11px] text-muted hidden sm:inline">
            Slide to view campus itinerary at any hour (08:00 AM – 10:00 PM)
          </span>
        </div>

        <div className="relative flex items-center">
          <input
            type="range"
            min={480} // 08:00 AM
            max={1320} // 10:00 PM
            step={15} // 15-minute intervals
            value={activeMinutes}
            onChange={(e) => {
              setIsPlaying(false);
              onMinutesChange(Number(e.target.value));
            }}
            className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-emerald-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted px-1 font-mono">
          <span>08:00 AM</span>
          <span>11:00 AM</span>
          <span>02:00 PM</span>
          <span>05:00 PM</span>
          <span>08:00 PM</span>
          <span>10:00 PM</span>
        </div>
      </div>
    </div>
  );
}
