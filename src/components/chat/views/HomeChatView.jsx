/**
 * @fileoverview Dedicated Home Chat View Component - Executive Slate (#3)
 * Multi-pane desktop workspace and fluid single-pane mobile chat experience.
 * Features Executive Slate channel grouping, verified student badges,
 * WebCrypto AES-GCM encryption badge, and 15-line packaging.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, ShieldCheck, Sparkles, Users, 
  ArrowLeft, Plus, Search, Lock, User 
} from 'lucide-react';
import ConversationList from '../ConversationList.jsx';
import ChatRoom from '../ChatRoom.jsx';
import { soundEffects } from '../../../utils/soundEffects.js';

export default function HomeChatView({
  currentStudent,
  activeChat,
  setActiveChat,
  beginChatAction,
  onCloseChat,
  onOpenProfile,
  archetype
}) {
  const handleSelectChat = (chat) => {
    soundEffects.playThonk();
    setActiveChat(chat);
  };

  const handleBackToList = (chatId) => {
    soundEffects.playClick();
    if (typeof chatId === 'string' && onCloseChat) onCloseChat(chatId);
    else setActiveChat(null);
  };

  return (
    <div className="flex-1 w-full h-full flex overflow-hidden dark:bg-slate-950 bg-slate-50 font-sans transition-colors duration-150">
      {/* Left Column: Conversations Directory & Channels (Hidden on mobile if chat is active) */}
      <div 
        className={`${
          activeChat ? 'hidden md:flex' : 'flex'
        } w-full md:w-[280px] lg:w-[320px] shrink-0 flex-col h-full dark:bg-slate-950 bg-white dark:border-slate-800 border-slate-200 transition-colors duration-150 overflow-hidden`}
      >
        <ConversationList
          currentStudent={currentStudent}
          activeChat={activeChat}
          onSelectChat={handleSelectChat}
          beginChatAction={beginChatAction}
          onCloseChat={onCloseChat}
          onOpenProfile={onOpenProfile}
        />
      </div>

      {/* Center & Right Column: Active Chat Room or Standby Workspace */}
      <div 
        className={`${
          !activeChat ? 'hidden md:flex' : 'flex'
        } flex-1 flex-col h-full overflow-hidden dark:bg-slate-900 bg-[#efeae2] transition-colors duration-150`}
      >
        <AnimatePresence mode="wait">
          {activeChat ? (
            <motion.div
              key={activeChat.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="flex-1 flex flex-col h-full overflow-hidden transform-gpu will-change-transform"
            >
              <ChatRoom
                chat={activeChat}
                currentStudent={currentStudent}
                onBack={handleBackToList}
                onOpenProfile={onOpenProfile}
                onSelectChat={handleSelectChat}
                beginChatAction={beginChatAction}
              />
            </motion.div>
          ) : (
            <motion.div
              key="standby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center dark:bg-slate-900 bg-slate-50 transition-colors"
            >
              <div className="p-6 rounded-xl dark:bg-slate-950 bg-white border dark:border-slate-800 border-slate-200 max-w-md w-full flex flex-col items-center text-center shadow-md">
                <div className="w-14 h-14 rounded-full dark:bg-slate-900 bg-emerald-50 border dark:border-slate-800 border-emerald-100 flex items-center justify-center mb-4">
                  <MessageSquare className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="text-base font-bold dark:text-white text-slate-900 mb-1">
                  Campus Workspace
                </h3>
                <p className="text-xs dark:text-slate-400 text-slate-600 leading-relaxed mb-6">
                  Select a channel or direct message from the left rail. Direct text messages are encrypted before saving.
                </p>

                <div className="flex flex-col gap-2 w-full text-left">
                  <div className="p-2.5 rounded-lg dark:bg-slate-900 bg-slate-50 border dark:border-slate-800 border-slate-200 flex items-center gap-3 text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="dark:text-slate-300 text-slate-700">Verified Student Badges Active</span>
                  </div>
                  <div className="p-2.5 rounded-lg dark:bg-slate-900 bg-slate-50 border dark:border-slate-800 border-slate-200 flex items-center gap-3 text-xs">
                    <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="dark:text-slate-300 text-slate-700">Faculty & Outsiders Strictly Banned</span>
                  </div>
                  <div className="p-2.5 rounded-lg dark:bg-slate-900 bg-slate-50 border dark:border-slate-800 border-slate-200 flex items-center gap-3 text-xs">
                    <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="dark:text-slate-300 text-slate-700">Klipy GIFs with Zero Object Storage</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
