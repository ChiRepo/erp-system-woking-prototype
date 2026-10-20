import {isDemoStudent} from '../services/studentDirectory.js';

/** Campus-published fields only. Never spread an enrollment into a peer record. */
export function studentDirectoryProjection(profile, uid = profile?.uid) {
  if (!uid || profile?.uid !== uid || String(profile.role).toLowerCase() !== 'student' || !profile.prn || isDemoStudent(profile)) return null;
  const name = String(profile.name || profile.displayName || profile.fullName || '').trim();
  if (!name) return null;
  const text = value => typeof value === 'string' ? value : '';
  return {
    uid, role:'student', name, displayName:name, fullName:name,
    prn:text(profile.prn), email:text(profile.email).trim().toLowerCase(),
    googleEmail:text(profile.googleEmail).trim().toLowerCase(),
    dept:text(profile.dept), sem:text(profile.sem), allowChatting:profile.allowChatting !== false,
    photoURL:profile.photoURL || null, roll:text(profile.roll || profile.rollNumber || profile.rollNo),
    username:text(profile.username), updatedAt:profile.updatedAt || new Date().toISOString()
  };
}
