import { collection, doc, query, where, onSnapshot, setDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import { db, auth } from '../firebase.js';

const pairId = (a, b) => [a, b].sort().join('__');
const empty = () => ({ following: [], followers: [], friends: [], incoming: [], outgoing: [] });
function requireActor(uid, target) {
  if (!uid || uid !== auth.currentUser?.uid || !target || uid === target) throw new Error('A different enrolled student is required.');
}

export const studentRelationshipService = {
  subscribe(uid, callback) {
    if (!uid) { callback(empty()); return () => {}; }
    const state = empty();
    const errors = {};
    const emit = () => callback({ ...state, error: Object.values(errors).find(Boolean) || null });
    const listen = (key, q, apply) => onSnapshot(q, snapshot => {
      errors[key] = null;
      apply(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
      emit();
    }, () => { errors[key] = 'Connections could not be loaded. Please reconnect.'; emit(); });
    const stops = [
      listen('following', query(collection(db, 'student_follows'), where('fromUid', '==', uid)), rows => { state.following = [...new Set(rows.map(row => row.toUid))]; }),
      listen('followers', query(collection(db, 'student_follows'), where('toUid', '==', uid)), rows => { state.followers = [...new Set(rows.map(row => row.fromUid))]; }),
      listen('friends', query(collection(db, 'student_friendships'), where('members', 'array-contains', uid)), rows => {
        state.friends = [...new Set(rows.filter(row => row.status === 'accepted').map(row => row.members.find(id => id !== uid)))];
        state.incoming = [...new Set(rows.filter(row => row.status === 'pending' && row.requesterUid !== uid).map(row => row.requesterUid))];
        state.outgoing = [...new Set(rows.filter(row => row.status === 'pending' && row.requesterUid === uid).map(row => row.members.find(id => id !== uid)))];
      })
    ];
    return () => stops.forEach(stop => stop());
  },

  // Public campus follow counts do not require access to private friend requests.
  subscribeFollowCounts(uid, callback) {
    const state = { followers: 0, following: 0 };
    const stops = ['fromUid', 'toUid'].map(field => onSnapshot(query(collection(db, 'student_follows'), where(field, '==', uid)), snapshot => {
      state[field === 'fromUid' ? 'following' : 'followers'] = snapshot.size;
      callback({ ...state });
    }, () => callback({ ...state, error: 'Follow counts unavailable.' })));
    return () => stops.forEach(stop => stop());
  },

  async setFollowing(uid, targetUid, following) {
    requireActor(uid, targetUid);
    const ref = doc(db, 'student_follows', `${uid}__${targetUid}`);
    if (following) await setDoc(ref, { fromUid: uid, toUid: targetUid, createdAt: Date.now() });
    else await deleteDoc(ref);
  },

  async requestFriend(uid, targetUid) {
    requireActor(uid, targetUid);
    const ref = doc(db, 'student_friendships', pairId(uid, targetUid));
    await runTransaction(db, async transaction => {
      const existing = await transaction.get(ref);
      if (existing.exists()) return;
      transaction.set(ref, { members: [uid, targetUid].sort(), requesterUid: uid, status: 'pending', createdAt: Date.now() });
    });
  },

  async acceptFriend(uid, requesterUid) {
    requireActor(uid, requesterUid);
    const ref = doc(db, 'student_friendships', pairId(uid, requesterUid));
    await runTransaction(db, async transaction => {
      const existing = await transaction.get(ref);
      if (!existing.exists() || existing.data().requesterUid !== requesterUid || !existing.data().members.includes(uid)) throw new Error('This friend request is no longer available.');
      transaction.update(ref, { status: 'accepted', acceptedAt: Date.now() });
    });
  },

  async cancelFriendRequest(uid, targetUid) {
    requireActor(uid, targetUid);
    await deleteDoc(doc(db, 'student_friendships', pairId(uid, targetUid)));
  }
};
