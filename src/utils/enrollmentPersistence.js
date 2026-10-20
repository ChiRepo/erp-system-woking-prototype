import { registeredRole } from './authPolicy.js';

// Persist only canonical enrollment fields before granting a restored/first-login portal role.
export async function persistEnrollmentProfile(uid, profile, saveProfile) {
  if (!uid || registeredRole(profile) === 'guest') throw new Error('A registered enrollment is required.');
  const fields = ['role', 'prn', 'id', 'employeeId', 'name', 'fullName', 'displayName', 'email', 'googleEmail', 'dept', 'sem', 'allowChatting'];
  const enrollment = Object.fromEntries(fields.filter(key => profile[key] !== undefined).map(key => [key, profile[key]]));
  const saved = await saveProfile(uid, { ...enrollment, uid }, true);
  if (saved !== true) throw new Error('Institutional enrollment could not be saved. Please sign in again.');
}
