/**
 * @fileoverview Web Audio API Tactile Sound Engine
 * Synthesizes procedural mechanical clicks and thonks with zero external audio assets.
 * Provides tactile, physical, clicky haptic-audio feedback for chat transitions and buttons.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

class SoundEffectsEngine {
  constructor() {
    this.audioCtx = null;
    this.enabled = true;
    try {
      const stored = localStorage.getItem('krc_chat_sound_enabled');
      if (stored !== null) {
        this.enabled = stored === 'true';
      }
    } catch (e) {
      this.enabled = true;
    }
  }

  _getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  isEnabled() {
    return this.enabled;
  }

  setEnabled(val) {
    this.enabled = !!val;
    try {
      localStorage.setItem('krc_chat_sound_enabled', String(this.enabled));
    } catch (e) {}
  }

  // Message sound is controlled independently from interaction sound preferences.
  playNotification() {
    try {
      const ctx = this._getAudioContext();
      if (!ctx) return;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.frequency.setValueAtTime(660, ctx.currentTime);
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.25);
    } catch { /* The browser can defer audio until the next user interaction. */ }
  }

  /**
   * Deep, mechanical, physical dampened "thonk" for tab transitions & window expansions
   */
  playThonk() {
    if (!this.enabled) return;
    try {
      const ctx = this._getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.06);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  /**
   * Crisp, high-frequency tactile "click" for buttons, toggles, and Read More expansion
   */
  playClick() {
    if (!this.enabled) return;
    try {
      const ctx = this._getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.025);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch (e) {}
  }

  /**
   * Tactile pop for message send and reel like actions
   */
  playPop() {
    if (!this.enabled) return;
    try {
      const ctx = this._getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.04);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.055);
    } catch (e) {}
  }
}

export const soundEffects = new SoundEffectsEngine();
