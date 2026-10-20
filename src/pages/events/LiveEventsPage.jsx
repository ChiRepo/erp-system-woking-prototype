/**
 * @fileoverview EVENTS LiveEventsPage Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, Sun, Moon, ArrowLeft, Radio, 
  MapPin, Clock, Calendar, Users, Sparkles, 
  Ticket, Video, CheckCircle2, ChevronRight,
  Filter, Share2, Compass, Play, X, QrCode,
  Flame, Award, ShieldCheck, Heart, MessageSquare
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import LiveClock from '../../components/common/LiveClock';
import CampusEventMap from '../../components/events/CampusEventMap';
import LiveEventScroller from '../../components/events/LiveEventScroller';
import { showCampusAlert } from '../../components/common/CustomAlertModal';
import { 
  LIVE_CAMPUS_EVENTS, EVENT_CATEGORIES, 
  EVENT_VENUES, getEventLiveStatus 
} from '../../data/liveEventsData';

export default function LiveEventsPage() {
  const { darkMode, toggleTheme } = useTheme();

  // Selected Category filter
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Selected Event & Venue for map synchronization
  const [selectedEventId, setSelectedEventId] = useState(LIVE_CAMPUS_EVENTS[0].id);
  const [selectedVenueId, setSelectedVenueId] = useState(LIVE_CAMPUS_EVENTS[0].venue.id);

  // Time scrubber state (minutes from 00:00, default 14:30 = 02:30 PM)
  const [activeMinutes, setActiveMinutes] = useState(870);

  // Modals state
  const [passModalEvent, setPassModalEvent] = useState(null);
  const [streamModalEvent, setStreamModalEvent] = useState(null);
  const [studentPassName, setStudentPassName] = useState('Student Member');
  const [copiedLink, setCopiedLink] = useState(false);

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'all') return LIVE_CAMPUS_EVENTS;
    return LIVE_CAMPUS_EVENTS.filter(e => e.category === selectedCategory);
  }, [selectedCategory]);

  const activeEvent = useMemo(() => {
    return LIVE_CAMPUS_EVENTS.find(e => e.id === selectedEventId) || LIVE_CAMPUS_EVENTS[0];
  }, [selectedEventId]);

  // Synchronize venue when event changes
  const handleSelectEvent = (eventId) => {
    setSelectedEventId(eventId);
    const evt = LIVE_CAMPUS_EVENTS.find(e => e.id === eventId);
    if (evt?.venue?.id) {
      setSelectedVenueId(evt.venue.id);
    }
  };

  const handleSelectVenue = (venueId) => {
    setSelectedVenueId(venueId);
    const evt = LIVE_CAMPUS_EVENTS.find(e => e.venue?.id === venueId);
    if (evt) {
      setSelectedEventId(evt.id);
    }
  };

  // Countdown timer to the flagship evening keynote (18:00)
  const [countdown, setCountdown] = useState({ hours: 3, minutes: 24, seconds: 12 });
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-bg text-text transition-colors duration-200 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Universal Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-xl bg-bg hover:bg-surface border border-border text-muted hover:text-text transition-all active:scale-95"
            title="Return to Main Website"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-rose-500 text-white shadow-md">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-text">
                  KRC Campus Live
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  Live Broadcast
                </span>
              </div>
              <p className="text-[11px] text-muted hidden sm:block">
                Festivals · Tech Summits · Real-Time Itineraries · Ambegaon, Pune
              </p>
            </div>
          </div>
        </div>

        {/* Center Live Clock */}
        <div className="hidden md:flex items-center">
          <LiveClock />
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleShare}
            className="p-2 rounded-xl border border-border bg-bg hover:bg-surface text-muted hover:text-text text-xs font-medium transition-all flex items-center gap-1.5"
            title="Share Events Link"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-border bg-bg hover:bg-surface text-muted hover:text-text transition-all"
            aria-label="Toggle Dark / Light Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Hero Broadcast Announcement Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500/15 via-purple-500/10 to-amber-500/10 border border-rose-500/30 p-6 sm:p-8 shadow-xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                <span>CAMPUS GALA & TECH SUMMIT 2026 IS LIVE</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-text tracking-tight leading-tight">
                Experience Real-Time College Festivals, Hackathons & Arenas
              </h1>

              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Explore real-time schedules, multi-track itineraries, geo-tagged campus building navigation, and interactive live stream broadcasts across KRC Institute of Technology.
              </p>
            </div>

            {/* Live Keynote Countdown Card */}
            <div className="bg-surface/90 backdrop-blur-md border border-border p-5 rounded-2xl shadow-lg flex flex-col items-center sm:items-start shrink-0 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Next Grand Keynote Begins In:</span>
              </div>

              <div className="flex items-center gap-2 text-center font-mono font-black">
                <div className="bg-bg px-3 py-2 rounded-xl border border-border">
                  <span className="text-xl sm:text-2xl text-text">{String(countdown.hours).padStart(2, '0')}</span>
                  <span className="block text-[9px] text-muted uppercase font-sans">Hours</span>
                </div>
                <span className="text-xl text-muted">:</span>
                <div className="bg-bg px-3 py-2 rounded-xl border border-border">
                  <span className="text-xl sm:text-2xl text-text">{String(countdown.minutes).padStart(2, '0')}</span>
                  <span className="block text-[9px] text-muted uppercase font-sans">Mins</span>
                </div>
                <span className="text-xl text-muted">:</span>
                <div className="bg-bg px-3 py-2 rounded-xl border border-border">
                  <span className="text-xl sm:text-2xl text-rose-500">{String(countdown.seconds).padStart(2, '0')}</span>
                  <span className="block text-[9px] text-muted uppercase font-sans">Secs</span>
                </div>
              </div>

              <button
                onClick={() => setStreamModalEvent(LIVE_CAMPUS_EVENTS[0])}
                className="w-full mt-1 py-2 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Watch Live Broadcast Feed</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Timetable Scroller & Interactive Time-Scrubber */}
        <LiveEventScroller
          events={LIVE_CAMPUS_EVENTS}
          selectedEventId={selectedEventId}
          onSelectEvent={handleSelectEvent}
          activeMinutes={activeMinutes}
          onMinutesChange={setActiveMinutes}
        />

        {/* Main Grid: Interactive Map (Left) & Categorized Itineraries (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Interactive Geo-Tagged Real Map (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-text flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-500" />
                <span>Geo-Tagged Campus Map</span>
              </h2>
              <span className="text-[11px] text-muted">
                Click pins to focus venues
              </span>
            </div>

            {/* Map Component */}
            <div className="h-[420px] sm:h-[480px]">
              <CampusEventMap
                events={LIVE_CAMPUS_EVENTS}
                selectedVenueId={selectedVenueId}
                onSelectVenue={handleSelectVenue}
              />
            </div>

            {/* Selected Venue Quick Details Card */}
            {selectedVenueId && (
              <div className="p-4 rounded-2xl bg-surface border border-border shadow-md space-y-2">
                {(() => {
                  const venue = Object.values(EVENT_VENUES).find(v => v.id === selectedVenueId);
                  const venueEvents = LIVE_CAMPUS_EVENTS.filter(e => e.venue?.id === selectedVenueId);
                  if (!venue) return null;

                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: `${venue.color}20`, color: venue.color }}>
                          {venue.tag}
                        </span>
                        <span className="text-xs text-muted">
                          👥 Capacity: <strong>{venue.capacity}</strong>
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-text">
                        {venue.name}
                      </h4>
                      <p className="text-xs text-muted flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        {venue.zone} · Coordinates: {venue.lat}° N, {venue.lng}° E
                      </p>

                      <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                        <span className="font-semibold text-text">
                          {venueEvents.length} Event(s) Hosted Here Today
                        </span>
                        <button
                          onClick={() => {
                            if (venueEvents[0]) setSelectedEventId(venueEvents[0].id);
                          }}
                          className="text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1"
                        >
                          <span>View Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Categorized Itineraries & Schedules (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
              {EVENT_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-text text-bg shadow-md scale-105'
                      : 'bg-surface hover:bg-bg text-muted border border-border'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory === cat.id ? 'bg-bg/20 text-bg' : 'bg-muted/20 text-muted'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>

            {/* List of Event Cards */}
            <div className="space-y-4">
              {filteredEvents.map(event => {
                const liveStatus = getEventLiveStatus(event, activeMinutes);
                const isSelected = selectedEventId === event.id;

                return (
                  <div
                    key={event.id}
                    onClick={() => handleSelectEvent(event.id)}
                    className={`p-5 rounded-2xl bg-surface border transition-all duration-200 cursor-pointer shadow-md space-y-4 ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xl'
                        : 'border-border hover:border-text/30'
                    }`}
                  >
                    {/* Top Card Badge & Action Ribbon */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${liveStatus.color}`}>
                          {liveStatus.label}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-bg font-semibold text-muted border border-border">
                          {event.categoryLabel}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">
                          {event.badge}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{event.date}</span>
                      </div>
                    </div>

                    {/* Event Title & Description */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-text leading-snug">
                        {event.title}
                      </h3>
                      <p className="text-xs text-muted mt-1 leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    {/* Meta Info Bar: Venue, Time, Speaker */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-bg border border-border text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div className="truncate">
                          <span className="text-muted block text-[10px]">Location & Venue:</span>
                          <strong className="text-text font-bold truncate">{event.venue.name}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                        <div>
                          <span className="text-muted block text-[10px]">Scheduled Hours:</span>
                          <strong className="text-text font-bold">{event.timeDisplay}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Hourly Itinerary Milestone Track */}
                    <div className="space-y-2 pt-1">
                      <h4 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted" />
                        <span>Event Itinerary & Agenda:</span>
                      </h4>

                      <div className="space-y-1.5 pl-2 border-l-2 border-border/80">
                        {event.itinerary.map((item, idx) => (
                          <div 
                            key={idx}
                            className={`flex items-start justify-between text-xs py-1 px-2 rounded-lg transition-colors ${
                              item.status === 'live' 
                                ? 'bg-rose-500/10 border border-rose-500/20 font-bold text-rose-600 dark:text-rose-400' 
                                : item.status === 'completed'
                                ? 'text-muted line-through opacity-75'
                                : 'text-text'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-semibold text-muted shrink-0 w-16">
                                {item.time}
                              </span>
                              <span>{item.title}</span>
                            </div>

                            <span className="text-[10px] uppercase font-bold shrink-0 ml-2">
                              {item.status === 'live' ? '🔴 Live Now' : item.status === 'completed' ? '✓ Done' : 'Upcoming'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Triggers */}
                    <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVenueId(event.venue.id);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-border bg-bg hover:bg-surface text-xs font-semibold text-text transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <Compass className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Locate on Map</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStreamModalEvent(event);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-bg hover:bg-surface border border-rose-500/30 text-xs font-semibold text-rose-500 transition-all flex items-center gap-1.5 active:scale-95"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Watch Stream</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPassModalEvent(event);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-text text-bg hover:opacity-90 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>Get Free Student Pass</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Free Student Pass / RSVP Modal */}
      {passModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setPassModalEvent(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-bg text-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text">Official Student Access Pass</h3>
                <p className="text-xs text-muted">KRC Institute of Technology · Campus ID Verified</p>
              </div>
            </div>

            {/* Render Pass Card */}
            <div className="p-4 rounded-2xl bg-bg border-2 border-dashed border-border space-y-4 text-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
                  {passModalEvent.categoryLabel}
                </span>
                <h4 className="text-base font-extrabold text-text mt-1">
                  {passModalEvent.title}
                </h4>
                <p className="text-xs text-muted mt-0.5">
                  📍 {passModalEvent.venue.name} · {passModalEvent.timeDisplay}
                </p>
              </div>

              {/* Dynamic QR Code */}
              <div className="flex justify-center p-3 bg-white rounded-xl shadow-inner inline-block mx-auto">
                <QRCodeSVG
                  value={`KRC_EVENT_PASS:${passModalEvent.id}:${studentPassName}:GATE_A`}
                  size={140}
                  level="H"
                />
              </div>

              <div className="text-xs text-muted">
                <span className="block font-mono font-bold text-text">PASS ID: KRC-PASS-{passModalEvent.id.slice(-4).toUpperCase()}-2026</span>
                <span className="text-[11px]">Authorized Entry · Free Student Ticket</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text">Attendee Full Name:</label>
              <input
                type="text"
                value={studentPassName}
                onChange={(e) => setStudentPassName(e.target.value)}
                placeholder="Enter Student Name"
                className="w-full px-3 py-2 text-xs rounded-xl bg-bg border border-border text-text focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={() => {
                showCampusAlert({
                  title: 'Student Pass Confirmed',
                  message: `Student Pass confirmed for ${studentPassName}! Bring your verified QR digital pass to the entrance of ${passModalEvent.venue.name}.`,
                  type: 'success'
                });
                setPassModalEvent(null);
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Download Digital Pass</span>
            </button>
          </div>
        </div>
      )}

      {/* Simulated Live Stream Feed Modal */}
      {streamModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-surface border border-border rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col relative max-h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface/90">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <h3 className="font-bold text-sm sm:text-base text-text truncate">
                  Live Stream: {streamModalEvent.shortTitle}
                </h3>
              </div>

              <button
                onClick={() => setStreamModalEvent(null)}
                className="p-1.5 rounded-full hover:bg-bg text-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Simulation */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              <img
                src={streamModalEvent.bannerImage}
                alt="Live Broadcast"
                className="w-full h-full object-cover opacity-60"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-between p-4">
                <div className="flex items-center justify-between text-white text-xs">
                  <span className="px-2 py-0.5 rounded bg-rose-600 font-bold flex items-center gap-1.5">
                    <Radio className="w-3 h-3" /> LIVE 1080p
                  </span>
                  <span className="bg-black/60 px-2 py-0.5 rounded font-mono">
                    👥 1,482 Watching Now
                  </span>
                </div>

                <div className="space-y-1 text-white">
                  <div className="text-[11px] font-medium text-emerald-400">
                    🔴 Broadcasting from {streamModalEvent.venue.name}
                  </div>
                  <h4 className="text-base font-bold">
                    {streamModalEvent.currentActivity}
                  </h4>
                </div>
              </div>
            </div>

            {/* Simulated Live Chat Strip */}
            <div className="p-4 bg-bg border-t border-border flex-1 overflow-y-auto space-y-2 text-xs">
              <div className="text-[11px] font-bold text-muted flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                <span>Live Student Reactions:</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <strong className="text-text font-bold">Aarav K. (CS '27):</strong>
                  <span className="text-muted">The AI prototype demo looks insane! 🔥</span>
                </div>
                <div className="flex items-center gap-2">
                  <strong className="text-text font-bold">Priya S. (ENTC '26):</strong>
                  <span className="text-muted">Audio and lighting at the Auditorium is top tier tonight 🎶</span>
                </div>
                <div className="flex items-center gap-2">
                  <strong className="text-text font-bold">Rohan D. (Mech '28):</strong>
                  <span className="text-muted">RoboClash deathmatch starts in 15 mins! Heading to Central Quad now 🚀</span>
                </div>
              </div>
            </div>
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
