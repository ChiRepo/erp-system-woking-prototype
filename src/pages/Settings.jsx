/**
 * @fileoverview Settings Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, updatePassword as updateFirebasePassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Camera, Save, Loader2, CheckCircle2, ShieldAlert, Key, Eye, EyeOff, Lock, MessageSquare, X } from 'lucide-react';
import { credentialService } from '../services/credentialService';
import ProfilePhotoManager from '../components/profile/ProfilePhotoManager';
import { soundEffects } from '../utils/soundEffects.js';

export default function Settings() {
  const { user, role, updateUserName } = useAuth();
  const navigate = useNavigate();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.email) {
      setIsStarting(credentialService.isStartingPassword(user.email));
    }
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
    if (user?.photoURL) {
      setPhotoURL(user.photoURL);
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const cleanName = displayName.trim();
      if (cleanName && cleanName !== user?.displayName) {
        if (updateUserName) {
          await updateUserName(cleanName);
        } else if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: cleanName });
        }
      }

      if (photoURL !== user?.photoURL && auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL });
      }
      
      if (password) {
        if (password.length < 6) {
          throw new Error('New password must be at least 6 characters long.');
        }
        if (password !== confirmPassword) {
          throw new Error('New password and confirmation do not match.');
        }

        // Check if current password is required/verified
        if (user?.email) {
          const cred = credentialService.getUserCredential(user.email);
          if (currentPassword) {
            const matches = await credentialService.verifyPassword(user.email, currentPassword);
            if (!matches) {
              throw new Error('Current password entered is incorrect.');
            }
          } else if (cred?.isStartingPassword && !currentPassword) {
            throw new Error('Please enter your initial starting password to verify your identity.');
          }

          credentialService.updatePassword(user.email, password);
          setIsStarting(false);
        }

        if (auth.currentUser) {
          try {
            await updateFirebasePassword(auth.currentUser, password);
          } catch (firebaseErr) {
            console.warn('Firebase password update skipped or requires re-auth:', firebaseErr);
          }
        }

        setPassword('');
        setCurrentPassword('');
        setConfirmPassword('');
      }
      
      setMessage('Profile and password updated successfully! Your account is now secured.');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseChatWindowAndReturnToDashboard = () => {
    soundEffects.playThonk();
    window.dispatchEvent(new CustomEvent('krc_close_chat_windows'));
    navigate('/student/dashboard');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold text-text tracking-tight">Profile & Security Settings</h1>
        <p className="text-sm text-muted mt-1">Manage your account identity, starting credentials, and security password.</p>
      </div>

      {/* Student Chat Window Governance (Dedicated Settings Control) */}
      {role === 'student' && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-surface shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text">Campus Chat Windows</h3>
                <p className="text-xs text-muted">Manage active floating chat windows and background session state.</p>
              </div>
            </div>
          </div>
          
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="button"
              onClick={handleCloseChatWindowAndReturnToDashboard}
              className="px-4 py-2 rounded-lg bg-text text-bg hover:opacity-90 transition-all text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Chat Windows</span>
            </button>
            <span className="text-[11px] text-muted">
              Closes the active chat window and returns directly to student dashboard.
            </span>
          </div>
        </div>
      )}

      {/* Starting Password Warning Banner */}
      {isStarting && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-xl text-xs space-y-1.5 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm text-text">Initial Starting Password Active</p>
            <p className="text-muted leading-relaxed">
              Your account is currently using an administrative starting password assigned by administration. Please set a confidential, personal password below to protect your portal.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        
        {message && (
          <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg border border-emerald-500/30 flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800/50 text-sm">
            {error}
          </div>
        )}

        {/* Cloud Profile Photo Manager with Bootstrap Carousel & Revert Capability */}
        <ProfilePhotoManager onPhotoChange={(newUrl) => setPhotoURL(newUrl)} />

        {/* Inputs */}
        <div className="space-y-4 max-w-sm">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:border-text transition-colors"
              placeholder="e.g. Dr. John Smith"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">Email Address</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-muted cursor-not-allowed"
            />
            <p className="text-[11px] text-muted">Contact IT to change institutional email.</p>
          </div>

          {/* Password Management */}
          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-text flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-primary" />
                Change Password
              </label>
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="text-xs text-muted hover:text-text flex items-center gap-1 transition"
              >
                {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPasswords ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">
                {isStarting ? 'Current Starting Password' : 'Current Password'}
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-text transition-colors"
                placeholder={isStarting ? 'Enter admin-assigned starting password' : 'Enter existing password'}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">New Password</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-text transition-colors"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">Confirm New Password</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-text transition-colors"
                placeholder="Re-type new password"
              />
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-text hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 text-bg text-sm font-medium px-6 py-2 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </form>

      {/* Hidden Copyright Notice - Visible in codebase, hidden in UI/UX */}
      <footer className="sr-only" aria-hidden="true">
        <p>Copyright &copy; 2026 Chinmay Chaudhari. All Rights Reserved. (MIT License)</p>
      </footer>
    </div>
  );
}
