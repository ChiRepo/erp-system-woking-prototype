/**
 * @fileoverview Dedicated Chat Settings & Preferences View - Concept #1
 * Features 3-in-1 UI Archetype wireframe preview cards, tactile Web Audio mechanical toggles,
 * E2EE cryptographic key fingerprint status, and prominent red "Close Chat Windows" button.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Volume2, VolumeX, Shield, Lock, 
  Sparkles, Layers, LogOut, CheckCircle2, Play, 
  Copy, Check, Bell, BellOff, Sliders, Sun, Moon 
} from 'lucide-react';
import { CHAT_ARCHETYPES, setStoredArchetypeId } from '../../../constants/chatThemes.js';
import { soundEffects } from '../../../utils/soundEffects.js';
import { useTheme } from '../../../contexts/ThemeContext.jsx';
import { studentE2EE } from '../../../services/studentE2EE.js';
import { chatNotificationPreferences } from '../../../services/chatNotificationPreferences.js';

export default function DedicatedSettingsView({
  currentStudent,
  conversation,
  currentArchetypeId,
  onSelectArchetype,
  onCloseChat,
  onBack,
  archetype
}) {
  const { darkMode, toggleTheme } = useTheme();
  const [soundEnabled, setSoundEnabled] = useState(soundEffects.isEnabled());
  const [notifications, setNotifications] = useState(() => chatNotificationPreferences.get(currentStudent?.uid));
  const [notificationError, setNotificationError] = useState('');
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [e2eeFingerprint, setE2eeFingerprint] = useState('');
  const [fingerprintNotice, setFingerprintNotice] = useState('Select a direct conversation to view its key fingerprint.');
  const copyTimer = useRef(null);

  useEffect(() => chatNotificationPreferences.subscribe(currentStudent?.uid, setNotifications), [currentStudent?.uid]);
  const toggleNotification = key => {
    try {
      chatNotificationPreferences.update(currentStudent?.uid, { [key]: !notifications[key] });
      setNotificationError('');
    } catch { setNotificationError('Could not save preferences in this browser.'); }
  };

  useEffect(() => {
    let active = true;
    setE2eeFingerprint('');
    setCopiedFingerprint(false);
    clearTimeout(copyTimer.current);
    if (!conversation?.conversationKey) {
      setFingerprintNotice('Select a direct conversation to view its key fingerprint.');
    } else {
      setFingerprintNotice('Loading conversation key fingerprint…');
      studentE2EE.getKeyFingerprint(conversation.conversationKey).then(fingerprint => {
        if (!active) return;
        setE2eeFingerprint(fingerprint);
        setFingerprintNotice('Compare this fingerprint with your peer through another trusted channel.');
      }).catch(() => {
        if (active) setFingerprintNotice('The conversation key fingerprint is unavailable. Reopen the conversation.');
      });
    }
    return () => { active = false; clearTimeout(copyTimer.current); };
  }, [conversation?.id, conversation?.conversationKey]);

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    soundEffects.setEnabled(nextVal);
    setSoundEnabled(nextVal);
    if (nextVal) {
      soundEffects.playPop();
    }
  };

  const handleChooseArchetype = (id) => {
    soundEffects.playThonk();
    setStoredArchetypeId(id);
    onSelectArchetype(id);
  };

  const handleCopyFingerprint = async () => {
    if (!e2eeFingerprint) return;
    soundEffects.playClick();
    try {
      await navigator.clipboard.writeText(e2eeFingerprint);
      setCopiedFingerprint(true);
      copyTimer.current = setTimeout(() => setCopiedFingerprint(false), 2000);
    } catch {
      setFingerprintNotice('Could not copy. Select the fingerprint and copy it manually.');
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col overflow-y-auto dark:bg-slate-950 bg-slate-50 dark:text-white text-slate-900 font-sans p-4 sm:p-6 lg:p-8 custom-scrollbar select-none transition-colors duration-150">
      <div className="max-w-5xl w-full mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b dark:border-slate-800 border-slate-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                onBack();
              }}
              className="p-1.5 rounded-lg border dark:border-slate-700 border-slate-300 dark:bg-slate-900 bg-white hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-200 text-slate-700 hover:text-black dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-xs"
              title="Return to messages"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black dark:text-white text-slate-900 tracking-tight">
                Chat Settings and Preferences
              </h1>
              <p className="text-xs dark:text-slate-400 text-slate-500">
                Manage theme modes, layout archetypes, tactile physics, and WebCrypto keys.
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded dark:bg-slate-900 bg-white border dark:border-slate-700 border-slate-200 dark:text-slate-300 text-slate-700 font-mono text-xs shadow-xs">
            STUDENT PREFERENCES
          </span>
        </div>

        {/* ========================================================================= */}
        {/* 1. CHAT APPEARANCE & THEMES (Mode Switcher + 3 Preview Cards) */}
        {/* ========================================================================= */}
        <div className="p-6 rounded-xl dark:bg-slate-900/60 bg-white border dark:border-slate-800 border-slate-200 space-y-5 shadow-xs transition-colors duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold dark:text-white text-slate-900 tracking-tight">
                Chat Appearance & Themes
              </h2>
              <p className="text-xs dark:text-slate-400 text-slate-500">
                Choose between high-contrast dark or crisp light mode, and switch layout archetypes.
              </p>
            </div>

            {/* Tactile Dark / Light Mode Toggle Pill */}
            <div className="flex items-center p-1 rounded-xl dark:bg-slate-950 bg-slate-100 border dark:border-slate-800 border-slate-200 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  if (darkMode) {
                    soundEffects.playClick();
                    toggleTheme(e);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !darkMode
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light Mode</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  if (!darkMode) {
                    soundEffects.playClick();
                    toggleTheme(e);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  darkMode
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span>Dark Mode</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* 1. Monolith Industrial Card */}
            <button
              type="button"
              onClick={() => handleChooseArchetype('monolith')}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer group ${
                currentArchetypeId === 'monolith'
                  ? 'border-amber-400 dark:bg-slate-900 bg-amber-50/50 ring-2 ring-amber-400/50 shadow-md'
                  : 'dark:border-slate-800 border-slate-200 dark:bg-slate-950 bg-slate-50 dark:hover:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div>
                <span className="text-[11px] font-mono dark:text-slate-400 text-slate-500 block mb-2">
                  UI Archetype Theme
                </span>
                {/* Wireframe Mockup Preview */}
                <div className="w-full h-28 rounded-lg dark:bg-zinc-950 bg-zinc-900 border-2 dark:border-zinc-700 border-zinc-600 p-2 flex flex-col justify-between overflow-hidden relative shadow-inner">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
                    <div className="w-3 h-3 bg-amber-400" />
                    <div className="w-12 h-1.5 bg-zinc-700" />
                  </div>
                  <div className="space-y-1.5 my-1">
                    <div className="w-2/3 h-4 bg-zinc-800 border border-zinc-700" />
                    <div className="w-3/4 h-5 bg-amber-400/20 border border-amber-400/40 ml-auto" />
                  </div>
                  <div className="w-full h-4 bg-zinc-900 border border-zinc-700 flex items-center px-1">
                    <div className="w-2 h-2 bg-amber-400" />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t dark:border-slate-800/80 border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold dark:text-white text-slate-900">
                  Monolith Industrial
                </span>
                {currentArchetypeId === 'monolith' && (
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                )}
              </div>
            </button>

            {/* 2. Nordic Editorial Card */}
            <button
              type="button"
              onClick={() => handleChooseArchetype('nordic')}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer group ${
                currentArchetypeId === 'nordic'
                  ? 'border-indigo-500 dark:bg-slate-900 bg-indigo-50/50 ring-2 ring-indigo-500/50 shadow-md'
                  : 'dark:border-slate-800 border-slate-200 dark:bg-slate-950 bg-slate-50 dark:hover:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div>
                <span className="text-[11px] font-mono dark:text-slate-400 text-slate-500 block mb-2">
                  UI Archetype Theme
                </span>
                {/* Wireframe Mockup Preview */}
                <div className="w-full h-28 rounded-lg dark:bg-[#0f1115] bg-zinc-900 border border-zinc-700 p-2 flex flex-col justify-between overflow-hidden relative shadow-inner">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
                    <div className="w-16 h-1.5 bg-zinc-700" />
                    <div className="w-2 h-2 rounded-full bg-zinc-500" />
                  </div>
                  <div className="text-center my-auto">
                    <div className="text-[11px] font-light tracking-widest text-white uppercase">
                      Nordic Editorial
                    </div>
                  </div>
                  <div className="w-full h-3 border border-zinc-700 rounded flex items-center px-1" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t dark:border-slate-800/80 border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold dark:text-white text-slate-900">
                  Nordic Editorial
                </span>
                {currentArchetypeId === 'nordic' && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                )}
              </div>
            </button>

            {/* 3. Executive Slate Card */}
            <button
              type="button"
              onClick={() => handleChooseArchetype('corporate')}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer group ${
                currentArchetypeId === 'corporate'
                  ? 'border-emerald-500 dark:bg-slate-900 bg-emerald-50/50 ring-2 ring-emerald-500/50 shadow-md'
                  : 'dark:border-slate-800 border-slate-200 dark:bg-slate-950 bg-slate-50 dark:hover:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div>
                <span className="text-[11px] font-mono dark:text-slate-400 text-slate-500 block mb-2">
                  UI Archetype Theme
                </span>
                {/* Wireframe Mockup Preview */}
                <div className="w-full h-28 rounded-lg dark:bg-[#0f172a] bg-slate-900 border border-slate-700 p-2 flex flex-col justify-between overflow-hidden relative shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <div className="w-8 h-1 bg-slate-700" />
                    </div>
                    <div className="w-6 h-1 bg-amber-400/80" />
                  </div>
                  <div className="grid grid-cols-3 gap-1 my-1">
                    <div className="h-10 bg-slate-950 border border-slate-800 p-0.5 space-y-1">
                      <div className="w-full h-1 bg-slate-700" />
                      <div className="w-3/4 h-1 bg-slate-800" />
                    </div>
                    <div className="col-span-2 h-10 bg-slate-900 p-1 space-y-1">
                      <div className="w-1/2 h-2 rounded bg-slate-800" />
                      <div className="w-3/4 h-2 rounded bg-emerald-900/60 ml-auto" />
                    </div>
                  </div>
                  <div className="w-full h-3 bg-slate-950 border border-slate-800 rounded flex items-center px-1" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t dark:border-slate-800/80 border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold dark:text-white text-slate-900">
                  Executive Slate
                </span>
                {currentArchetypeId === 'corporate' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. AUDIO & NOTIFICATIONS (Tactile Switches & Web Audio API) */}
        {/* ========================================================================= */}
        <div className="p-6 rounded-xl dark:bg-slate-900/60 bg-white border dark:border-slate-800 border-slate-200 space-y-6 shadow-xs transition-colors duration-150">
          <h2 className="text-base font-bold dark:text-white text-slate-900 tracking-tight">
            Audio & Notifications
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Notification Toggles */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider dark:text-slate-400 text-slate-500">
                Enable Notifications
              </h3>

              {[['audio', 'Message sounds'], ['banners', 'In-app message banners'], ['hideNames', 'Hide names in message banners']].map(([key, label]) => <div key={key} className="flex items-center justify-between py-1 gap-3">
                <span className="text-xs dark:text-slate-200 text-slate-700">{label}</span>
                <button type="button" role="switch" aria-label={label} aria-checked={notifications[key]} onClick={() => toggleNotification(key)} className={`w-11 h-6 flex items-center rounded-full p-1 shrink-0 cursor-pointer transition-colors ${notifications[key] ? 'bg-emerald-600' : 'dark:bg-slate-800 bg-slate-300'}`}>
                  <span className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${notifications[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>)}
              <p className="text-xs dark:text-slate-400 text-slate-500">Applies while the messaging page is open. Saved for your account on this browser. Loading existing history does not trigger alerts.</p>
              {notificationError && <p role="alert" className="text-xs text-rose-500">{notificationError}</p>}
            </div>

            {/* Right Column: Web Audio Tactile Switches */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider dark:text-slate-400 text-slate-500">
                Web Audio
              </h3>

              <div className="flex items-start justify-between py-1 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold dark:text-slate-200 text-slate-800 block">
                    Tactile Web Audio (Mechanical Clicks)
                  </span>
                  <p className="text-[11px] dark:text-slate-400 text-slate-500 leading-relaxed">
                    Provides haptic audio feedback for button interactions.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleSound}
                  role="switch"
                  aria-label="Interaction sounds"
                  aria-checked={soundEnabled}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                    soundEnabled ? 'bg-emerald-600' : 'dark:bg-slate-800 bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      soundEnabled ? 'translate-x-5 bg-white' : 'translate-x-0 bg-slate-400'
                    }`}
                  />
                </button>
              </div>

              {/* Audio Sampler */}
              <div className="pt-2 border-t dark:border-slate-800/80 border-slate-200 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => soundEffects.playThonk()}
                  className="px-2.5 py-1 rounded dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 text-[11px] font-mono dark:text-slate-200 text-slate-700 cursor-pointer flex items-center gap-1 transition-colors border dark:border-slate-700 border-slate-300"
                >
                  <Play className="w-3 h-3 text-emerald-500" />
                  <span>Test Thonk (80Hz)</span>
                </button>
                <button
                  type="button"
                  onClick={() => soundEffects.playClick()}
                  className="px-2.5 py-1 rounded dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 text-[11px] font-mono dark:text-slate-200 text-slate-700 cursor-pointer flex items-center gap-1 transition-colors border dark:border-slate-700 border-slate-300"
                >
                  <Play className="w-3 h-3 text-emerald-500" />
                  <span>Test Click (1.2kHz)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. E2EE CRYPTOGRAPHIC SETTINGS & CLOSE CHAT WINDOW ACTION */}
        {/* ========================================================================= */}
        <div className="p-6 rounded-xl dark:bg-slate-900/60 bg-white border dark:border-slate-800 border-slate-200 shadow-xs transition-colors duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Column: E2EE Key Fingerprint */}
            <div className="lg:col-span-7 space-y-2">
              <h2 className="text-base font-bold dark:text-white text-slate-900 tracking-tight">
                Direct Message Encryption
              </h2>

              <div>
                <span className="text-[11px] dark:text-slate-400 text-slate-500 block mb-1">
                  Selected Conversation Key Fingerprint
                </span>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono dark:text-slate-300 text-slate-700 dark:bg-slate-950 bg-slate-100 px-3 py-1.5 rounded border dark:border-slate-800 border-slate-200 truncate select-all flex-1">
                    {e2eeFingerprint || 'No conversation key selected'}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyFingerprint}
                    disabled={!e2eeFingerprint}
                    className="p-1.5 rounded dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 dark:text-slate-300 text-slate-700 dark:hover:text-white hover:text-black cursor-pointer transition-colors border dark:border-slate-700 border-slate-300"
                    title={copiedFingerprint ? 'Fingerprint copied' : 'Copy Fingerprint'}
                  >
                    {copiedFingerprint ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <p role="status" className="text-xs dark:text-slate-400 text-slate-500">{fingerprintNotice}</p>
              </div>
            </div>

            {/* Right Column: Prominent Red Button as in Concept #1 */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playThonk();
                  onCloseChat();
                }}
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-[#e62b2b] hover:bg-[#d42020] text-white font-bold text-sm tracking-wide shadow-lg active:scale-98 cursor-pointer flex items-center justify-center gap-2 transition-transform"
              >
                <LogOut className="w-4 h-4" />
                <span>Close Chat Windows (Return to Dashboard)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
