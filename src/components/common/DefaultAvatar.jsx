import { useState, useEffect, useCallback } from 'react';

/**
 * LinkedIn-Style Default Profile Avatar with Universal Real-Time Synchronization
 * 
 * Dynamically resolves user's avatar from props, user object, or local/cloud cache.
 * Automatically listens to 'krc_avatar_updated' events across the application so that
 * any avatar update reflects instantly and smoothly everywhere in real time.
 * If no photo exists or image fails to load, gracefully falls back to the theme-aware
 * LinkedIn vector silhouette.
 */
export default function DefaultAvatar({
  src,
  photoURL,
  avatar,
  alt = 'Profile Avatar',
  name = null,
  className = 'w-8 h-8 rounded-full',
  size = 32,
  user = null,
  userId = null,
  shape = 'circle'
}) {
  const targetUid = userId || user?.uid || user?.prn || user?.id || null;

  const resolveAvatar = useCallback(() => {
    // 1. Check local dynamic avatar cache for this specific user
    if (targetUid) {
      const cached = localStorage.getItem(`krc_student_avatar_${targetUid}`);
      if (cached) return cached;
    }
    // 2. Direct props
    if (src) return src;
    if (photoURL) return photoURL;
    if (avatar) return avatar;
    // 3. User object properties
    if (user?.customAvatar) return user.customAvatar;
    if (user?.photoURL) return user.photoURL;
    if (user?.avatar) return user.avatar;
    // 4. Fallback to active user avatar if no specific uid
    if (!targetUid) {
      const activeCached = localStorage.getItem('krc_active_user_avatar');
      if (activeCached) return activeCached;
    }
    return null;
  }, [src, photoURL, avatar, user, targetUid]);

  const [resolvedSrc, setResolvedSrc] = useState(resolveAvatar);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setResolvedSrc(resolveAvatar());
    setImageError(false);
  }, [resolveAvatar]);

  // Real-time synchronization listener for global avatar updates
  useEffect(() => {
    const handleAvatarUpdate = (e) => {
      const { uid, avatarUrl } = e.detail || {};
      if (avatarUrl === undefined) return;

      const isTargetMatch = targetUid && uid && (
        String(targetUid).toLowerCase() === String(uid).toLowerCase()
      );
      const isGenericActive = !targetUid && (!uid || uid === 'current');

      if (isTargetMatch || isGenericActive) {
        setResolvedSrc(avatarUrl || null);
        setImageError(false);
      }
    };

    const handleStorage = (e) => {
      if (targetUid && e.key === `krc_student_avatar_${targetUid}`) {
        setResolvedSrc(e.newValue || null);
        setImageError(false);
      }
    };

    window.addEventListener('krc_avatar_updated', handleAvatarUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('krc_avatar_updated', handleAvatarUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [targetUid]);

  const photoSrc = (!imageError && resolvedSrc) ? resolvedSrc : null;
  const displayName = name || user?.displayName || user?.name || user?.email || alt;

  // Render photo with smooth CSS transition
  if (photoSrc) {
    return (
      <img
        src={photoSrc}
        alt={displayName}
        className={`${className} object-cover object-center ring-1 ring-border shadow-sm transition-all duration-300 ease-out`}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    );
  }

  // LinkedIn-style standing person vector silhouette with theme-adaptive styling
  return (
    <div 
      className={`${className} relative overflow-hidden flex items-center justify-center bg-slate-200 dark:bg-zinc-800 ring-1 ring-border/80 shadow-sm transition-colors duration-300 select-none`}
      title={displayName}
      aria-label={displayName}
    >
      <svg
        viewBox="0 0 128 128"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Head */}
        <circle
          cx="64"
          cy="46"
          r="21"
          className="fill-slate-400 dark:fill-zinc-500 transition-colors duration-300"
        />

        {/* Shoulders & Upper Body Silhouette (LinkedIn proportions) */}
        <path
          d="M64 74 C41 74 24 90 21 113 C26 119 33 124 41 127 L87 127 C95 124 102 119 107 113 C104 90 87 74 64 74 Z"
          className="fill-slate-400 dark:fill-zinc-500 transition-colors duration-300"
        />
      </svg>
    </div>
  );
}
