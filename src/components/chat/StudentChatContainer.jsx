/**
 * @fileoverview Student Chat Container Component
 * Master responsive shell for in-campus student chatting.
 * Features fluid spring transitions (mass: 0.4, damping: 12), right-to-left drawer on desktop,
 * docked sheet on mobile, dynamic full-screen expansion toggle, in-chat theme adaptation,
 * and strict clearance gate.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Maximize2, Minimize2, X, Minus, MessageSquare, 
  Sun, Moon, ShieldAlert, Sparkles, User, Lock, ExternalLink, RefreshCw 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { studentChatService } from '../../services/studentChatService.js';
import { soundEffects } from '../../utils/soundEffects.js';
import ConversationList from './ConversationList.jsx';
import ChatRoom from './ChatRoom.jsx';
import StudentSocialProfileModal from './StudentSocialProfileModal.jsx';
import { useChatSelection } from '../../hooks/useChatSelection.js';
import { useStudentChatClearance } from '../../hooks/useStudentChatClearance.js';

export default function StudentChatContainer({ 
  isOpen, 
  onClose,
  initialTargetStudent = null 
}) {
  const { user, role } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [isFullScreen, setIsFullScreen] = useState(false);
  const { activeChat, selectChat: setActiveChat, closeChat, beginChatAction, cancelChatAction } = useChatSelection();
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { hasClearance, checkingClearance, clearanceError, recheckClearance } = useStudentChatClearance(user, { enabled: role === 'student' && isOpen });

  const studentUid = user?.uid || user?.prn;

  // Listen to custom window-close event fired from Settings.jsx
  useEffect(() => {
    const handleCloseFromSettings = () => {
      onClose();
    };
    window.addEventListener('krc_close_chat_windows', handleCloseFromSettings);
    return () => {
      window.removeEventListener('krc_close_chat_windows', handleCloseFromSettings);
    };
  }, [onClose]);

  const handleRecheckClearance = () => {
    soundEffects.playThonk();
    recheckClearance();
  };

  // Handle initial target student
  useEffect(() => {
    if (!initialTargetStudent || !isOpen || !user) return;
    const finish = beginChatAction();
    let active = true;
    studentChatService.getOrCreateConversation(user, initialTargetStudent).then((chat) => {
      if (active) finish(() => setActiveChat(chat));
    }).catch((err) => {
      console.warn('[Chat] Could not auto-open chat:', err);
    });
    return () => { active = false; };
  }, [initialTargetStudent, isOpen, user]);

  useEffect(() => { if (!isOpen) cancelChatAction(); }, [isOpen, cancelChatAction]);

  if (!isOpen) return null;

  // Strict role gate: Only students can ever see or interact with the chat container
  if (role !== 'student') {
    return null;
  }

  const handleOpenProfile = (targetUser) => {
    cancelChatAction();
    setSelectedProfileUser(targetUser || user);
    setShowProfileModal(true);
  };

  const springTransition = {
    type: 'spring',
    mass: 0.4,
    damping: 12,
    stiffness: 120
  };

  return (
    <>
      {/* Dimmed backdrop when in full-screen or on mobile */}
      {(isFullScreen || window.innerWidth < 768) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
          onClick={onClose}
        />
      )}

      {/* Main Responsive Chat Window / Drawer */}
      <motion.aside
        layout
        initial={
          window.innerWidth >= 768
            ? { x: '100%', opacity: 0 } // Slide from right to left on desktop
            : { y: '100%', opacity: 0 } // Slide from bottom on mobile
        }
        animate={
          isFullScreen
            ? { x: 0, y: 0, opacity: 1 }
            : { x: 0, y: 0, opacity: 1 }
        }
        exit={
          window.innerWidth >= 768
            ? { x: '100%', opacity: 0 }
            : { y: '100%', opacity: 0 }
        }
        transition={springTransition}
        className={`fixed z-50 bg-surface border-border flex flex-col shadow-2xl transition-all overflow-hidden ${
          isFullScreen
            ? 'inset-0 w-screen h-[100dvh] rounded-none border-none'
            : 'bottom-0 right-0 w-full sm:w-[450px] max-w-[100vw] h-[85dvh] sm:h-[650px] max-h-[92dvh] rounded-t-2xl sm:rounded-tl-2xl sm:rounded-bl-2xl border-t sm:border-l sm:border-t'
        }`}
      >
        {/* Master Window Header */}
        <div className="p-3 bg-gradient-to-r from-surface via-bg/40 to-surface border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-text text-bg shadow-xs">
              <MessageSquare className="w-4 h-4 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs tracking-tight text-text truncate">
                  Campus Messenger
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Student Only
                </span>
              </div>
              <p className="text-[10px] text-muted truncate">
                {activeChat ? 'Active Encrypted Conversation' : 'In-Campus Student Hub'}
              </p>
            </div>
          </div>

          {/* Window Control Buttons */}
          <div className="flex items-center gap-1">
            {/* Fluid In-Chat Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-bg transition-colors cursor-pointer"
              title={`Switch to ${darkMode ? 'Light' : 'Dark'} mode`}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-blue-500" />
              )}
            </button>

            {/* View Own Profile -> Dedicated Social Profile Page */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playThonk();
                onClose();
                navigate('/student/chat', { state: { targetStudent: user } });
              }}
              className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-bg transition-colors cursor-pointer"
              title="Open Dedicated Profile Page"
            >
              <User className="w-4 h-4" />
            </button>

            {/* Transition into Dedicated Chatting Page */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playThonk();
                onClose();
                navigate('/student/chat', { state: { initialChat: activeChat } });
              }}
              className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-bg transition-colors cursor-pointer"
              title="Expand into Dedicated Chatting Page"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Close Window */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Close Chat Window"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
          {checkingClearance ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-muted">
              <Sparkles className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs font-semibold">Verifying campus chat clearance...</span>
            </div>
          ) : !hasClearance ? (
            /* Locked State for Students Without Admin Clearance */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 bg-bg/40">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-bold text-text">Campus Chat Access Restricted</h3>
                <p className="text-xs text-muted leading-relaxed">
                  {clearanceError || 'College administration has not granted chat clearance for your account. This security measure prevents outsiders from contacting students.'}
                </p>
              </div>
              <div className="p-3 bg-surface border border-border rounded-xl text-[11px] text-muted text-left w-full max-w-xs space-y-1">
                <p className="font-semibold text-text flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" /> Administrative Policy:
                </p>
                <p>Please contact IT Administration to enable "Allow Chatting" for your student PRN profile.</p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <button
                  type="button"
                  onClick={handleRecheckClearance}
                  disabled={checkingClearance}
                  className="w-full py-2 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingClearance ? 'animate-spin' : ''}`} />
                  Re-check Clearance
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 px-4 rounded-xl bg-surface border border-border text-xs font-semibold text-muted hover:text-text hover:bg-bg transition-all cursor-pointer"
                >
                  Return to Workspace
                </button>
              </div>
            </div>
          ) : activeChat ? (
            /* Active Conversation View */
            <ChatRoom
              chat={activeChat}
              currentStudent={user}
              onBack={chatId => typeof chatId === 'string' ? closeChat(chatId) : setActiveChat(null)}
              onOpenProfile={handleOpenProfile}
              onSelectChat={setActiveChat}
              beginChatAction={beginChatAction}
            />
          ) : (
            /* Conversations List & Student Search View */
            <ConversationList
              currentStudent={user}
              onSelectChat={(chat) => setActiveChat(chat)}
              beginChatAction={beginChatAction}
              onCloseChat={closeChat}
              onOpenProfile={handleOpenProfile}
            />
          )}
        </div>
      </motion.aside>

      {/* Student Social Media Profile Modal */}
      <StudentSocialProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        studentUser={selectedProfileUser || user}
        isOwnProfile={!selectedProfileUser || (selectedProfileUser.uid || selectedProfileUser.prn) === studentUid}
        onStartChat={(target) => {
          const finish = beginChatAction();
          setShowProfileModal(false);
          studentChatService.getOrCreateConversation(user, target).then(chat => finish(() => setActiveChat(chat))).catch(console.warn);
        }}
      />
    </>
  );
}
