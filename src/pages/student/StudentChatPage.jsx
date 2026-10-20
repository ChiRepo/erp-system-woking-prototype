/**
 * @fileoverview Dedicated Student Campus Chat & Social Platform Page
 * Master full-page destination for student-only messaging, BM25 & ML search feed,
 * dynamic social profiles, and archetype preferences.
 * 60fps glitch-free transitions, mobile responsive lock with fixed bottom navigation,
 * and expiring channel invitation token handling.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  MessageSquare, Search, User, Settings as SettingsIcon, 
  LogOut, ShieldCheck, ShieldAlert, Sparkles, Sun, Moon, 
  Layers, Lock, RefreshCw, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { studentChatService } from '../../services/studentChatService.js';
import { CHAT_ARCHETYPES, getStoredArchetypeId } from '../../constants/chatThemes.js';
import { soundEffects } from '../../utils/soundEffects.js';
import { showCampusAlert } from '../../components/common/CustomAlertModal.jsx';

import HomeChatView from '../../components/chat/views/HomeChatView.jsx';
import SearchFeedView from '../../components/chat/views/SearchFeedView.jsx';
import DedicatedProfileView from '../../components/chat/views/DedicatedProfileView.jsx';
import DedicatedSettingsView from '../../components/chat/views/DedicatedSettingsView.jsx';
import ErrorBoundary from '../../components/common/ErrorBoundary.jsx';
import { useChatNotifications } from '../../hooks/useChatNotifications.js';
import { useChatSelection } from '../../hooks/useChatSelection.js';
import { useStudentChatClearance } from '../../hooks/useStudentChatClearance.js';

export default function StudentChatPage() {
  const { user, role } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeView, setActiveView] = useState('home');
  const [archetypeId, setArchetypeId] = useState(getStoredArchetypeId());
  const { activeChat, selectChat: setActiveChat, closeChat, beginChatAction, cancelChatAction } = useChatSelection();
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const { hasClearance, checkingClearance, clearanceError, recheckClearance } = useStudentChatClearance(user, { enabled: role === 'student' });

  const studentUid = user?.uid || user?.prn;
  const currentArchetype = CHAT_ARCHETYPES[archetypeId] || CHAT_ARCHETYPES.monolith;
  const [messageNotice, dismissMessageNotice] = useChatNotifications(user, hasClearance && !checkingClearance, activeView === 'home' ? activeChat?.id : null);

  // Strict role check
  useEffect(() => {
    if (role && role !== 'student' && role !== 'admin') {
      navigate('/login', { replace: true });
    }
  }, [role, navigate]);

  // Check state from navigation and handle expiring encrypted invite links
  useEffect(() => {
    if (location.state?.initialChat) {
      setActiveChat(location.state.initialChat);
      setActiveView('home');
    }
    if (location.state?.targetStudent) {
      setSelectedProfileUser(location.state.targetStudent);
      setActiveView('profile');
    }

    // Handle invite parameter in URL: e.g. /student/chat?invite=KRC-INVITE-...
    const searchParams = new URLSearchParams(location.search);
    const inviteToken = searchParams.get('invite');
    if (inviteToken && user) {
      const finish = beginChatAction();
      studentChatService.validateAndJoinChannelInvite(inviteToken, user)
        .then((payload) => {
          showCampusAlert({
            title: 'Joined Group Channel',
            message: `You have joined #${payload.channelName || 'Campus Channel'}.`,
            type: 'success'
          });
          finish(() => {
            setActiveChat(payload.channel);
            setActiveView('home');
            navigate('/student/chat', { replace: true });
          });
        })
        .catch((err) => {
          showCampusAlert({
            title: 'Invite Expired or Invalid',
            message: err.message || 'This invitation link has expired or is no longer accessible.',
            type: 'error'
          });
        });
    }
  }, [location.state, location.search, user]);

  const handleRecheckClearance = () => {
    soundEffects.playThonk();
    recheckClearance();
  };

  const handleTabSwitch = (viewKey) => {
    cancelChatAction();
    soundEffects.playThonk();
    if (viewKey === 'profile') {
      setSelectedProfileUser(user);
    }
    setActiveView(viewKey);
  };

  const handleOpenProfile = (target) => {
    cancelChatAction();
    soundEffects.playThonk();
    setSelectedProfileUser(target || user);
    setActiveView('profile');
  };

  const handleStartChatFromFeed = (chat) => {
    soundEffects.playThonk();
    setActiveChat(chat);
    setActiveView('home');
  };

  const handleCloseChatWindows = () => {
    soundEffects.playThonk();
    navigate('/student/dashboard', { replace: true });
  };

  if (checkingClearance) {
    return (
      <div className={`h-[100dvh] w-screen flex flex-col items-center justify-center ${currentArchetype.classes.shell}`}>
        <Sparkles className="w-8 h-8 animate-spin text-amber-400 mb-3" />
        <h3 className="font-mono text-xs uppercase tracking-widest text-text font-bold">
          Verifying Campus Security Clearance...
        </h3>
      </div>
    );
  }

  if (!hasClearance) {
    return (
      <div className={`h-[100dvh] w-screen flex flex-col items-center justify-center p-6 text-center ${currentArchetype.classes.shell}`}>
        <div className={`p-8 rounded-none ${currentArchetype.classes.card} max-w-md w-full space-y-4`}>
          <div className="w-14 h-14 rounded-none bg-rose-600/20 border-2 border-rose-600 text-rose-500 mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-text">Campus Chat Access Restricted</h2>
          <p className="text-xs text-muted leading-relaxed">
            {clearanceError || 'Your student account is not cleared for campus chat. If administration has authorized your account, use Re-check Admin Clearance to reconnect.'}
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleRecheckClearance}
              disabled={checkingClearance}
              className={`w-full py-2.5 px-4 rounded-none ${currentArchetype.classes.buttonPrimary} text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-98`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingClearance ? 'animate-spin' : ''}`} />
              Re-check Admin Clearance
            </button>
            <button
              type="button"
              onClick={handleCloseChatWindows}
              className="w-full py-2 px-4 rounded-none border border-border hover:bg-surface text-xs font-semibold text-muted hover:text-text cursor-pointer transition-colors"
            >
              Return to Student Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { key: 'home', label: 'Messages', icon: MessageSquare },
    { key: 'search', label: 'Search Feed', icon: Search },
    { key: 'profile', label: 'Social Profile', icon: User },
    { key: 'settings', label: 'Preferences', icon: SettingsIcon }
  ];

  return (
    <div className={`h-[100dvh] w-screen flex flex-col sm:flex-row overflow-hidden ${currentArchetype.classes.shell} select-none transition-colors`}>
      {/* ========================================================================= */}
      {/* MASTER NAVIGATION RAIL (Fixed Bottom on Mobile, Left Rail on Desktop) */}
      {/* ========================================================================= */}
      <nav className={`w-full sm:w-20 lg:w-64 shrink-0 flex sm:flex-col justify-between ${currentArchetype.classes.sidebar} p-2 sm:p-4 z-30 transition-colors border-t sm:border-t-0 sm:border-r border-inherit fixed sm:static bottom-0 left-0 right-0 backdrop-blur-md`}>
        {/* Top Brand Header (Desktop) */}
        <div className="hidden sm:flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm border border-emerald-400 shadow-sm">
              KC
            </div>
            <div className="hidden lg:block min-w-0">
              <h2 className="font-black text-xs tracking-tight text-text truncate">
                KRC CAMPUS
              </h2>
              <span className="text-[10px] font-mono text-emerald-400 block -mt-0.5">
                STUDENT MESH
              </span>
            </div>
          </div>


        </div>

        {/* Central Nav Links */}
        <div className="flex sm:flex-col justify-around sm:justify-start gap-1 sm:gap-2 flex-1 sm:mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleTabSwitch(item.key)}
                className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? currentArchetype.classes.activeTab
                    : currentArchetype.classes.inactiveTab
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5 shrink-0 stroke-[2]" />
                <span className="hidden lg:inline truncate">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Auxiliary Controls */}
        <div className="hidden sm:flex flex-col gap-2 pt-4 border-t border-inherit">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={(e) => {
              soundEffects.playClick();
              toggleTheme(e);
            }}
            className={`flex items-center gap-3 p-2.5 rounded-lg ${currentArchetype.classes.buttonSecondary} text-xs font-semibold cursor-pointer`}
            title={`Switch to ${darkMode ? 'Light' : 'Dark'} mode`}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400 shrink-0" /> : <Moon className="w-4 h-4 text-blue-400 shrink-0" />}
            <span className="hidden lg:inline">
              {darkMode ? 'Light Theme' : 'Dark Theme'}
            </span>
          </button>

          {/* Close Chat Window / Return to Dashboard Button */}
          <button
            type="button"
            onClick={handleCloseChatWindows}
            className={`flex items-center gap-3 p-2.5 rounded-lg ${currentArchetype.classes.buttonDanger} text-xs font-bold cursor-pointer`}
            title="Close Chat Windows & Return to Dashboard"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline truncate">
              Close Chat Windows
            </span>
          </button>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* MAIN VIEWPORT STAGE (60fps Synchronous Transitions, Zero Layout Flicker) */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative pb-16 sm:pb-0">
        {messageNotice && <div role="status" className="absolute top-4 right-4 z-50 flex gap-3 items-center rounded-xl bg-slate-800 text-white border border-slate-600 shadow-xl p-4 text-sm max-w-sm">
          <button type="button" onClick={async () => {
            const finish = beginChatAction();
            try {
              if (!messageNotice.thread.isChannel) await studentChatService.openConversation(studentUid, messageNotice.thread.id);
              finish(() => { setActiveChat(messageNotice.thread); setActiveView('home'); dismissMessageNotice(); });
            } catch (error) { showCampusAlert({ title: 'Could not open chat', message: error.message, type: 'error' }); }
          }} className="text-left">{messageNotice.label}</button>
          <button type="button" aria-label="Dismiss message notification" onClick={dismissMessageNotice}><X className="w-4 h-4" /></button>
        </div>}
        {/* Messages View - Kept active to maintain listeners & scroll */}
        <div className={`flex-1 flex flex-col h-full w-full overflow-hidden ${activeView === 'home' ? 'flex' : 'hidden'}`}>
          <HomeChatView
            currentStudent={user}
            activeChat={activeChat}
            setActiveChat={setActiveChat}
            beginChatAction={beginChatAction}
            onCloseChat={closeChat}
            onOpenProfile={handleOpenProfile}
            archetype={currentArchetype}
          />
        </div>

        {/* Search Feed View */}
        <div className={`flex-1 flex flex-col h-full w-full overflow-hidden ${activeView === 'search' ? 'flex' : 'hidden'}`}>
          <SearchFeedView
            currentStudent={user}
            onStartChat={handleStartChatFromFeed}
            beginChatAction={beginChatAction}
            onViewProfile={handleOpenProfile}
            archetype={currentArchetype}
          />
        </div>

        {/* Dedicated Social Profile View */}
        <div className={`flex-1 flex flex-col h-full w-full overflow-hidden ${activeView === 'profile' ? 'flex' : 'hidden'}`}>
          <ErrorBoundary
            title="Profile View"
            message="Unable to render social profile at this time. Return to messages."
            onRecovery={() => { cancelChatAction(); setActiveView('home'); }}
          >
            {activeView === 'profile' && (
              <DedicatedProfileView
                targetStudent={selectedProfileUser || user}
                currentStudent={user}
                onBack={() => { cancelChatAction(); setActiveView('home'); }}
                onStartChat={handleStartChatFromFeed}
                beginChatAction={beginChatAction}
                archetype={currentArchetype}
              />
            )}
          </ErrorBoundary>
        </div>

        {/* Preferences / Settings View */}
        <div className={`flex-1 flex flex-col h-full w-full overflow-hidden ${activeView === 'settings' ? 'flex' : 'hidden'}`}>
          <DedicatedSettingsView
            currentStudent={user}
            conversation={activeChat}
            currentArchetypeId={archetypeId}
            onSelectArchetype={setArchetypeId}
            onCloseChat={handleCloseChatWindows}
            onBack={() => setActiveView('home')}
            archetype={currentArchetype}
          />
        </div>
      </main>
    </div>
  );
}
