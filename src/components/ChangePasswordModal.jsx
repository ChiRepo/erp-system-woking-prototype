import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Key, Eye, EyeOff, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { credentialService } from '../services/credentialService';
import { firestoreService } from '../services/firestoreService';
import { updatePassword as updateFirebasePassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function ChangePasswordModal({ isOpen, onClose, userEmail, isStarting = false, onSuccess }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setLoading(true);

    try {
      if (userEmail) {
        const cred = credentialService.getUserCredential(userEmail);
        if (currentPassword) {
          const isValid = await credentialService.verifyPassword(userEmail, currentPassword);
          if (!isValid) {
            setError('Current password is incorrect.');
            setLoading(false);
            return;
          }
        } else if (cred?.isStartingPassword && !currentPassword) {
          setError('Please provide your initial starting password to verify identity.');
          setLoading(false);
          return;
        }

        credentialService.updatePassword(userEmail, newPassword);
      }

      if (auth.currentUser) {
        try {
          await updateFirebasePassword(auth.currentUser, newPassword);
          await firestoreService.setUserProfile(auth.currentUser.uid, {
            mustChangePassword: false,
            isStartingPassword: false
          });
        } catch (firebaseErr) {
          console.warn('Firebase password update skipped/requires re-auth:', firebaseErr);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
        setSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-text text-bg rounded-lg">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-text">
                  {isStarting ? 'Set Permanent Password' : 'Change Password'}
                </h3>
                <p className="text-xs text-muted">Update your portal login credentials</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-md text-muted hover:text-text hover:bg-bg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800/50 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg border border-emerald-500/30 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Password updated successfully! Account secured.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">
                {isStarting ? 'Current Starting Password' : 'Current Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={isStarting ? 'e.g. Student@2026' : 'Enter existing password'}
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text pr-10 font-mono focus:outline-none focus:border-text transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-text transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-text transition"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-3.5 py-2 border border-border rounded-lg text-xs font-medium text-muted hover:text-text hover:bg-bg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || success}
                className="px-4 py-2 bg-text text-bg rounded-lg text-xs font-bold hover:opacity-90 transition flex items-center gap-2"
              >
                {loading && (
                  <div className="spinner-border spinner-border-sm text-light inline-block w-3.5 h-3.5 border-2 rounded-full animate-spin border-t-transparent" />
                )}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
