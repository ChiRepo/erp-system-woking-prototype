import { auth, db } from '../firebase.js';
import { collection, doc, onSnapshot, runTransaction } from 'firebase/firestore';

// These preferences live in the signed-in student's existing private chat folder.
export const chatWorkspacePreferences = {
  subscribe(uid, chatId, callback) {
    if (!uid || !chatId || auth.currentUser?.uid !== uid) { callback({}); return () => {}; }
    return onSnapshot(doc(db, 'users', uid, 'chats', chatId), snapshot => callback(snapshot.data()?.workspace || {}),
      () => callback(null, 'Your chat preferences could not be loaded.'));
  },
  subscribeAll(uid, callback) {
    if (!uid || auth.currentUser?.uid !== uid) { callback({}); return () => {}; }
    return onSnapshot(collection(db, 'users', uid, 'chats'), snapshot => callback(Object.fromEntries(
      snapshot.docs.map(item => [item.id, item.data().workspace || {}])
    )), () => callback(null, 'Your chat preferences could not be loaded.'));
  },
  async change(uid, chatId, change) {
    if (!chatId || !uid || auth.currentUser?.uid !== uid) throw new Error('Sign in again to update your chat preferences.');
    const ref = doc(db, 'users', uid, 'chats', chatId);
    return runTransaction(db, async transaction => {
      const snapshot = await transaction.get(ref);
      const stored = snapshot.data() || {};
      const workspace = change(stored.workspace || {});
      transaction.set(ref, { ...stored, workspace });
      return workspace;
    });
  }
};

export function messagesAfterHiddenHistory(messages, hiddenBefore = 0, hiddenMessages = {}) {
  return messages.filter(message => (!hiddenBefore || Number(message.timestamp || 0) > hiddenBefore) && hiddenMessages[message.id] !== true);
}
