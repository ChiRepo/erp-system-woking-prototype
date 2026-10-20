import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, Sparkles, Video, Camera, PlayCircle, 
  Image as ImageIcon, Music, Ticket, ExternalLink,
  Flame, Clapperboard, Film
} from 'lucide-react';

/**
 * Floating Media Badges configured on non-overlapping orbital trajectories
 * Each item has a distinct starting angle and orbit radius to ensure zero collision.
 */
const ORBITAL_MEDIA_ITEMS = [
  {
    id: 'media_video_cam',
    icon: Video,
    label: 'Live Stream',
    color: 'from-rose-500/20 to-red-500/30 text-rose-500 border-rose-500/40',
    angleOffset: 0,
    radius: 54,
    duration: 5,
    direction: 1
  },
  {
    id: 'media_photo_snap',
    icon: Camera,
    label: 'Photo Reel',
    color: 'from-amber-500/20 to-orange-500/30 text-amber-500 border-amber-500/40',
    angleOffset: 60,
    radius: 70,
    duration: 6,
    direction: -1
  },
  {
    id: 'media_video_play',
    icon: PlayCircle,
    label: '4K Broadcast',
    color: 'from-blue-500/20 to-indigo-500/30 text-blue-500 border-blue-500/40',
    angleOffset: 120,
    radius: 60,
    duration: 5.5,
    direction: 1
  },
  {
    id: 'media_photo_gallery',
    icon: ImageIcon,
    label: 'Campus Snaps',
    color: 'from-emerald-500/20 to-teal-500/30 text-emerald-500 border-emerald-500/40',
    angleOffset: 180,
    radius: 76,
    duration: 6.5,
    direction: -1
  },
  {
    id: 'media_music_gala',
    icon: Music,
    label: 'Concert Audio',
    color: 'from-purple-500/20 to-pink-500/30 text-purple-500 border-purple-500/40',
    angleOffset: 240,
    radius: 56,
    duration: 4.8,
    direction: 1
  },
  {
    id: 'media_film_clip',
    icon: Clapperboard,
    label: 'Festival Reels',
    color: 'from-cyan-500/20 to-blue-500/30 text-cyan-500 border-cyan-500/40',
    angleOffset: 300,
    radius: 68,
    duration: 5.8,
    direction: -1
  }
];

export default function LiveEventsButton({ 
  variant = 'sidebar', 
  className = '',
  onClick = () => {} 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);

  // Minimal version for Landing Page (least amount of information as requested)
  if (variant === 'minimal') {
    return (
      <a
        href="/events"
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${className}`}
        title="Open Live Campus Events in New Tab"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        <span>Live Events</span>
        <ExternalLink className="w-3 h-3 opacity-70" />
      </a>
    );
  }

  // Topbar compact pill version
  if (variant === 'topbar') {
    return (
      <a
        href="/events"
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-all duration-200 group cursor-pointer ${className}`}
        title="Live Campus Events (Opens in new tab)"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        <span className="hidden sm:inline">Events</span>
        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </a>
    );
  }

  // Public Navbar button variant
  if (variant === 'navbar') {
    return (
      <div 
        ref={containerRef}
        className="relative inline-flex items-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Orbital Floating Media Particles on Hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.25 }}
              className="absolute -inset-10 pointer-events-none z-50 flex items-center justify-center overflow-visible"
            >
              {/* Subtle orbital glow aura */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-amber-500/10 blur-xl animate-pulse" />

              {/* Orbital Ring Guide */}
              <div className="absolute w-36 h-36 rounded-full border border-dashed border-rose-500/20 animate-spin-slow pointer-events-none" />

              {/* Non-overlapping orbiting media icons */}
              {ORBITAL_MEDIA_ITEMS.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    animate={{
                      rotate: item.direction > 0 ? [item.angleOffset, item.angleOffset + 360] : [item.angleOffset, item.angleOffset - 360],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: item.duration,
                      ease: 'linear',
                    }}
                    style={{
                      position: 'absolute',
                      width: `${item.radius * 2}px`,
                      height: `${item.radius * 2}px`,
                    }}
                    className="flex items-start justify-center"
                  >
                    <motion.div
                      animate={{
                        rotate: item.direction > 0 ? [-item.angleOffset, -item.angleOffset - 360] : [-item.angleOffset, -item.angleOffset + 360],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: item.duration,
                        ease: 'linear',
                      }}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface/90 backdrop-blur-md border shadow-md ${item.color}`}
                    >
                      <IconComponent className="w-3 h-3" />
                      <span className="text-[9px] font-bold whitespace-nowrap">{item.label}</span>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <a
          href="/events"
          target="_blank"
          rel="noopener noreferrer"
          className={`relative z-10 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-rose-500/15 via-purple-500/15 to-amber-500/15 hover:from-rose-500/25 hover:via-purple-500/25 hover:to-amber-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:border-rose-500/50 shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 group cursor-pointer ${className}`}
          title="Open Live Events in New Tab"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          <span className="tracking-wide">Live Events</span>
          <ExternalLink className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </a>
      </div>
    );
  }

  // Sidebar category/item variant for Admin, Faculty, Student workspaces
  return (
    <div 
      ref={containerRef}
      className="relative w-full my-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Orbital Floating Media Particles on Hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.25 }}
            className="absolute -top-10 left-0 right-0 bottom-0 pointer-events-none z-50 flex items-center justify-center overflow-visible"
          >
            {/* Ambient Aura */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-rose-500/15 via-purple-500/10 to-amber-500/10 blur-xl animate-pulse" />

            {/* Non-overlapping orbiting media badges */}
            {ORBITAL_MEDIA_ITEMS.map((item) => {
              const IconComponent = item.icon;
              return (
                <motion.div
                  key={item.id}
                  animate={{
                    rotate: item.direction > 0 ? [item.angleOffset, item.angleOffset + 360] : [item.angleOffset, item.angleOffset - 360],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: item.duration,
                    ease: 'linear',
                  }}
                  style={{
                    position: 'absolute',
                    width: `${item.radius * 2.1}px`,
                    height: `${item.radius * 1.4}px`,
                  }}
                  className="flex items-start justify-center"
                >
                  <motion.div
                    animate={{
                      rotate: item.direction > 0 ? [-item.angleOffset, -item.angleOffset - 360] : [-item.angleOffset, -item.angleOffset + 360],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: item.duration,
                      ease: 'linear',
                    }}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface/95 backdrop-blur-md border shadow-lg ${item.color}`}
                  >
                    <IconComponent className="w-2.5 h-2.5" />
                    <span className="text-[9px] font-bold whitespace-nowrap">{item.label}</span>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Sidebar Item Card */}
      <a
        href="/events"
        target="_blank"
        rel="noopener noreferrer"
        className={`relative z-10 w-full flex items-center justify-between p-2.5 rounded-xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-purple-500/5 to-transparent hover:from-rose-500/20 hover:via-purple-500/15 text-text hover:text-text shadow-sm transition-all duration-200 group cursor-pointer ${className}`}
        title="Open Campus Live Events in New Tab"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative p-1.5 rounded-lg bg-rose-500/20 text-rose-500 border border-rose-500/30 group-hover:scale-110 transition-transform">
            <Radio className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-text truncate">Campus Live Events</span>
              <span className="px-1 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white">
                Live
              </span>
            </div>
            <span className="text-[10px] text-muted truncate">
              Festivals, Hackathons & Map
            </span>
          </div>
        </div>

        <ExternalLink className="w-3.5 h-3.5 text-muted group-hover:text-rose-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-1" />
      </a>
    </div>
  );
}
