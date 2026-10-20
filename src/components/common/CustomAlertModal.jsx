/**
 * @fileoverview Custom Campus Alert & Modal Notification System
 * Replaces crude browser alert() dialogs with aesthetic, theme-integrated modals.
 * Features tactile sound feedback, spring animation, and non-blocking recovery.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, CheckCircle2, Info, AlertTriangle, 
  X, Sparkles, ShieldCheck 
} from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects.js';

let alertTriggerFn = null;

/**
 * Global helper to trigger custom campus alert without browser alert()
 */
export function showCampusAlert({
  title = 'Campus Notice',
  message = '',
  type = 'info',
  confirmText = 'Understood',
  onConfirm = null,
  showCancel = false,
  cancelText = 'Cancel',
  onCancel = null
}) {
  if (alertTriggerFn) {
    alertTriggerFn({ title, message, type, confirmText, onConfirm, showCancel, cancelText, onCancel });
  } else {
    // Fallback: dispatch custom window event
    window.dispatchEvent(new CustomEvent('krc_campus_alert', {
      detail: { title, message, type, confirmText, onConfirm, showCancel, cancelText, onCancel }
    }));
  }
}

export default function CustomAlertModal() {
  const [alertData, setAlertData] = useState(null);

  useEffect(() => {
    alertTriggerFn = (data) => {
      soundEffects.playThonk();
      setAlertData(data);
    };

    const handleCustomEvent = (e) => {
      if (e.detail) {
        soundEffects.playThonk();
        setAlertData(e.detail);
      }
    };

    window.addEventListener('krc_campus_alert', handleCustomEvent);
    return () => {
      alertTriggerFn = null;
      window.removeEventListener('krc_campus_alert', handleCustomEvent);
    };
  }, []);

  if (!alertData) return null;

  const handleClose = () => {
    soundEffects.playClick();
    if (typeof alertData.onConfirm === 'function') {
      alertData.onConfirm();
    }
    setAlertData(null);
  };

  const handleCancel = () => {
    soundEffects.playClick();
    if (typeof alertData.onCancel === 'function') {
      alertData.onCancel();
    }
    setAlertData(null);
  };

  const getIconAndStyle = () => {
    switch (alertData.type) {
      case 'error':
        return {
          icon: <AlertCircle className="w-6 h-6 text-rose-400" />,
          badgeClass: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          buttonClass: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
          badgeClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
          badgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          buttonClass: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
        };
      default:
        return {
          icon: <Info className="w-6 h-6 text-indigo-400" />,
          badgeClass: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
          buttonClass: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
        };
    }
  };

  const { icon, badgeClass, buttonClass } = getIconAndStyle();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in select-none">
      <div 
        className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl text-left space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${badgeClass}`}>
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-text">
                {alertData.title || 'Campus System Notice'}
              </h3>
              <span className="text-[10px] font-mono text-muted">
                KRC Institute Verification
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-muted hover:text-text hover:bg-bg cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-1">
          <p className="text-xs sm:text-sm text-text/90 leading-relaxed font-light whitespace-pre-wrap">
            {alertData.message}
          </p>
        </div>

        <div className="pt-2 border-t border-border flex items-center justify-end gap-2">
          {alertData.showCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-text hover:bg-bg cursor-pointer transition border border-border"
            >
              {alertData.cancelText || 'Cancel'}
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition active:scale-95 shadow-md ${buttonClass}`}
          >
            {alertData.confirmText || 'Understood'}
          </button>
        </div>
      </div>
    </div>
  );
}
