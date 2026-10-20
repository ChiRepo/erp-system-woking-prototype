/**
 * @fileoverview Student Chat Button Component
 * Positioned in the sidebar directly above the Campus Pulse / Live Events button.
 * Exclusively visible to students. Opens the fluid right-to-left chat drawer.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Sparkles, Lock, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { soundEffects } from '../../utils/soundEffects.js';

export default function StudentChatButton({ 
  onClick = () => {},
  className = '',
  unreadCount = 0 
}) {
  const { role } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e) => {
    soundEffects.playThonk();
    onClick(e);
  };

  // Strict role constraint: Faculty and Admins are banned
  if (role !== 'student') {
    return null;
  }

  return (
    <div 
      className={`relative w-full my-1.5 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle Hover Aura */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-indigo-500/15 blur-md pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Main Clickable Button */}
      <button
        type="button"
        onClick={handleClick}
        className="relative z-10 w-full flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent hover:from-emerald-500/20 hover:via-teal-500/15 text-text shadow-xs transition-all duration-200 group cursor-pointer active:scale-[0.98]"
        title="Open Student In-Campus Messenger"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-4 h-4 stroke-[2]" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="flex flex-col text-left min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-text truncate">Campus Chat</span>
              <span className="px-1 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white">
                Students
              </span>
            </div>
            <span className="text-[10px] text-muted truncate">
              Encrypted Real-Time Messaging
            </span>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-muted group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
      </button>
    </div>
  );
}
