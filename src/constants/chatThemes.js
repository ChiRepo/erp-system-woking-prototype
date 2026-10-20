/**
 * @fileoverview Premium UI/UX Archetypes for Student Campus Chat & Social
 * Strict design guidelines: Zero glassy effects, zero blurry acrylic overlays.
 * Solid, authoritative, tactile engineering aesthetics with bespoke layouts for
 * Chat Shell, Profile, and Settings.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

export const CHAT_ARCHETYPES = {
  monolith: {
    id: 'monolith',
    name: 'Monolith Industrial',
    badge: 'Mechanical Studio',
    tagline: 'Bold high-contrast borders, tactile 3D mechanical buttons, split dossier profile.',
    description: 'Engineered for maximum tactile feedback, crisp architectural 2px borders, physical drop-offset click states, and brutalist clarity.',
    classes: {
      shell: 'dark:bg-zinc-950 bg-zinc-50 dark:text-zinc-100 text-zinc-900 font-sans',
      surface: 'dark:bg-zinc-900 bg-white border-2 dark:border-zinc-700 border-zinc-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.12)] dark:shadow-[4px_4px_0px_0px_#18181b]',
      surfaceMuted: 'dark:bg-zinc-950 bg-zinc-100 border dark:border-zinc-800 border-zinc-200',
      header: 'dark:bg-zinc-900 bg-white border-b-2 dark:border-zinc-700 border-zinc-300',
      sidebar: 'dark:bg-zinc-950 bg-white border-r-2 dark:border-zinc-700 border-zinc-300',
      card: 'dark:bg-zinc-900 bg-white border-2 dark:border-zinc-700 border-zinc-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[3px_3px_0px_0px_#09090b]',
      buttonPrimary: 'bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold border-2 border-zinc-950 shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all',
      buttonSecondary: 'dark:bg-zinc-800 bg-zinc-100 dark:hover:bg-zinc-700 hover:bg-zinc-200 dark:text-zinc-100 text-zinc-900 font-medium border-2 dark:border-zinc-600 border-zinc-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all',
      buttonDanger: 'bg-rose-600 hover:bg-rose-500 text-white font-bold border-2 border-zinc-950 shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all',
      input: 'dark:bg-zinc-950 bg-white border-2 dark:border-zinc-700 border-zinc-300 focus:border-amber-400 dark:text-zinc-100 text-zinc-900 placeholder:text-zinc-400 rounded-none',
      badge: 'border-2 dark:border-zinc-700 border-zinc-300 dark:bg-zinc-900 bg-zinc-100 dark:text-zinc-200 text-zinc-800 font-mono text-[10px] uppercase tracking-wider',
      activeTab: 'bg-amber-400 text-zinc-950 font-bold border-2 border-zinc-950 shadow-[2px_2px_0px_0px_#000]',
      inactiveTab: 'dark:bg-zinc-900 bg-zinc-100 dark:text-zinc-400 text-zinc-600 dark:hover:text-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-800 hover:bg-zinc-200 border-2 dark:border-zinc-800 border-zinc-200',
      bubbleMine: 'bg-amber-400 text-zinc-950 font-medium border-2 border-zinc-950 shadow-[2px_2px_0px_0px_#000] rounded-none',
      bubbleTheirs: 'dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-100 text-zinc-900 border-2 dark:border-zinc-700 border-zinc-300 rounded-none',
    }
  },

  nordic: {
    id: 'nordic',
    name: 'Nordic Editorial',
    badge: 'Minimal Studio',
    tagline: 'Swiss typographic clarity, razor-sharp 1px dividers, magazine-spread profile.',
    description: 'Understated Scandinavian minimalism with generous whitespace, high-contrast monospace & sans hierarchy, and whisper-quiet tactile response.',
    classes: {
      shell: 'dark:bg-[#0f1115] bg-[#fafafa] dark:text-[#eceef2] text-zinc-900 font-sans',
      surface: 'dark:bg-[#15181e] bg-white border dark:border-zinc-800 border-zinc-200 shadow-sm',
      surfaceMuted: 'dark:bg-[#0f1115] bg-zinc-100 border dark:border-zinc-800 border-zinc-200',
      header: 'dark:bg-[#15181e] bg-white border-b dark:border-zinc-800 border-zinc-200',
      sidebar: 'dark:bg-[#0f1115] bg-white border-r dark:border-zinc-800 border-zinc-200',
      card: 'dark:bg-[#15181e] bg-white border dark:border-zinc-800 border-zinc-200',
      buttonPrimary: 'dark:bg-zinc-100 bg-zinc-900 dark:hover:bg-white hover:bg-zinc-800 dark:text-zinc-900 text-white font-semibold border dark:border-zinc-300 border-zinc-800 active:scale-[0.98] transition-transform',
      buttonSecondary: 'dark:bg-zinc-800 bg-zinc-100 dark:hover:bg-zinc-700 hover:bg-zinc-200 dark:text-zinc-200 text-zinc-800 font-medium border dark:border-zinc-700 border-zinc-300 active:scale-[0.98] transition-transform',
      buttonDanger: 'dark:bg-red-900/60 bg-red-100 dark:hover:bg-red-900 hover:bg-red-200 dark:text-red-200 text-red-700 font-medium border dark:border-red-700 border-red-300 active:scale-[0.98] transition-transform',
      input: 'dark:bg-[#0f1115] bg-white border dark:border-zinc-800 border-zinc-300 focus:border-zinc-500 dark:text-zinc-100 text-zinc-900 placeholder:text-zinc-400 rounded-md',
      badge: 'border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900 bg-zinc-100 dark:text-zinc-300 text-zinc-600 text-[10px] tracking-wide',
      activeTab: 'dark:bg-zinc-100 bg-zinc-900 dark:text-zinc-900 text-white font-medium shadow-xs',
      inactiveTab: 'dark:text-zinc-400 text-zinc-600 dark:hover:text-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-800 hover:bg-zinc-100',
      bubbleMine: 'dark:bg-zinc-200 bg-zinc-900 dark:text-zinc-900 text-white font-medium rounded-xl',
      bubbleTheirs: 'dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-100 text-zinc-900 border dark:border-zinc-800 border-zinc-200 rounded-xl',
    }
  },

  corporate: {
    id: 'corporate',
    name: 'Executive Slate',
    badge: 'Campus',
    tagline: 'Deep slate-900 architecture, high-density multi-pane layout, professional portfolio.',
    description: 'Desktop-grade workspace inspired by Slack & Linear: structured navigation rail, clean data density, and authentic engineering utility.',
    classes: {
      shell: 'dark:bg-slate-950 bg-slate-50 dark:text-slate-100 text-slate-900 font-sans',
      surface: 'dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200 shadow-sm',
      surfaceMuted: 'dark:bg-slate-950 bg-slate-100/80 dark:border-slate-800 border-slate-200',
      header: 'dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200',
      sidebar: 'dark:bg-slate-950 bg-white dark:border-slate-800 border-slate-200',
      card: 'dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200 shadow-xs',
      buttonPrimary: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold border border-emerald-400 shadow-xs active:scale-[0.98] transition-all',
      buttonSecondary: 'dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 dark:text-slate-100 text-slate-800 border dark:border-slate-700 border-slate-300 active:scale-[0.98] transition-all',
      buttonDanger: 'bg-red-600 hover:bg-red-500 text-white font-bold border border-red-700 active:scale-[0.98] transition-all',
      input: 'dark:bg-slate-950 bg-white dark:border-slate-800 border-slate-300 focus:border-emerald-500 dark:text-slate-100 text-slate-900 placeholder:text-slate-400 rounded-lg',
      badge: 'border dark:border-slate-700 border-slate-200 dark:bg-slate-800 bg-slate-100 dark:text-emerald-400 text-emerald-600 font-mono text-[10px] uppercase',
      activeTab: 'bg-emerald-500 text-slate-950 font-bold shadow-xs',
      inactiveTab: 'dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900 dark:hover:bg-slate-800 hover:bg-slate-100',
      bubbleMine: 'bg-emerald-600 text-white font-medium rounded-2xl rounded-tr-sm',
      bubbleTheirs: 'dark:bg-slate-800 bg-slate-100 dark:text-slate-100 text-slate-900 border dark:border-slate-800 border-slate-200 rounded-2xl rounded-tl-sm',
    }
  }
};

export const DEFAULT_ARCHETYPE_ID = 'corporate';

export function getStoredArchetypeId() {
  try {
    const val = localStorage.getItem('krc_chat_archetype');
    if (val && CHAT_ARCHETYPES[val]) return val;
  } catch (e) {}
  return DEFAULT_ARCHETYPE_ID;
}

export function setStoredArchetypeId(id) {
  try {
    if (CHAT_ARCHETYPES[id]) {
      localStorage.setItem('krc_chat_archetype', id);
    }
  } catch (e) {}
}
