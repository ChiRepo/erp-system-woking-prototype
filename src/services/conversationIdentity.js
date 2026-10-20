import { studentIdentityKeys } from './studentDirectory.js';

// Historical threads contain both UID and PRN for each participant.
export function resolveConversationPeer(chat, currentStudent, directory = []) {
  const ownIds = new Set(studentIdentityKeys(currentStudent));
  const clean = value => String(value || '').trim().toLowerCase();
  const details = chat?.participantDetails || {};
  for (const [id, participant] of Object.entries(details)) {
    const strongIds = [participant.uid, participant.authUid, participant.email, participant.googleEmail].map(clean).filter(Boolean);
    if (ownIds.has(clean(id)) || strongIds.some(key => ownIds.has(key))) {
      ownIds.add(clean(id));
      studentIdentityKeys(participant).forEach(key => ownIds.add(key));
    }
  }
  const candidates = [...Object.keys(details), ...Object.keys(chat?.participantNames || {}), ...(chat?.participants || [])];
  const uid = candidates.find(id => id && !ownIds.has(clean(id))) || '';
  const savedPeer = details[uid] || {};
  const enrolled = directory.find(student => student.uid === uid);
  const peer = enrolled ? { ...savedPeer, ...enrolled, avatar: enrolled.customAvatar || enrolled.photoURL || enrolled.avatar || savedPeer.avatar } : savedPeer;
  return {
    uid,
    details: {
      ...peer,
      name: peer.name || peer.fullName || peer.displayName || chat?.participantNames?.[uid] || chat?.participantName || chat?.name || 'Student',
      prn: peer.prn || uid,
      dept: peer.dept || '',
      status: peer.status || 'unknown'
    }
  };
}
