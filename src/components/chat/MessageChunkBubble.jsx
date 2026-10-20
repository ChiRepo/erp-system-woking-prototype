/**
 * @fileoverview Message Chunk Bubble Component
 * Renders message text with automatic 15-line progressive packaging.
 * Features fluid animated looping expansion with a clicky "Read more" button.
 * Prevents DOM layout thrashing, lag, and spam wall overflows.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
import { studentChatService } from '../../services/studentChatService.js';
import { soundEffects } from '../../utils/soundEffects.js';

export default function MessageChunkBubble({ text = '', isSender = false }) {
  // Line-chunk packaging (15 lines per package)
  const packaging = useMemo(() => {
    return studentChatService.packageLongMessage(text);
  }, [text]);

  // Tracks how many 15-line chunks have been revealed (starts at 1)
  const [revealedChunkCount, setRevealedChunkCount] = useState(1);

  // If text has <= 15 lines, render plain text with zero extra overhead
  if (!packaging.isPackaged) {
    return (
      <div className="whitespace-pre-wrap break-words text-sm leading-relaxed font-normal">
        {text}
      </div>
    );
  }

  const totalChunks = packaging.allChunks.length;
  const hasMore = revealedChunkCount < totalChunks;

  // Combine revealed chunks
  const visibleText = packaging.allChunks.slice(0, revealedChunkCount).join('\n');

  const handleReadMore = () => {
    soundEffects.playClick();
    setRevealedChunkCount(prev => Math.min(prev + 1, totalChunks));
  };

  return (
    <div className="space-y-2">
      <div className="whitespace-pre-wrap break-words text-sm leading-relaxed font-normal">
        {visibleText}
      </div>

      <AnimatePresence>
        {hasMore && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-1 border-t border-current/15"
          >
            <button
              type="button"
              onClick={handleReadMore}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all transform active:scale-95 touch-manipulation cursor-pointer ${
                isSender
                  ? 'bg-white/20 hover:bg-white/30 text-white'
                  : 'bg-primary/10 hover:bg-primary/20 text-primary dark:text-emerald-400'
              }`}
              title="Expand next 15 lines of message"
            >
              <span>Read more</span>
              <ChevronDown className="w-3.5 h-3.5 animate-bounce-subtle" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
