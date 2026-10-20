import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase.js';

// A send is acknowledged only after its message and thread summary commit together.
export const chatMessageRepository = {
  async write({ chatId, senderUid, isChannel, message, summary }) {
    const parent = isChannel ? 'student_channels' : 'student_chats';
    const messageRef = doc(collection(db, parent, chatId, 'messages'));
    const batch = writeBatch(db);
    batch.set(messageRef, message);
    batch.update(doc(db, parent, chatId), { ...summary, lastMessageId: messageRef.id });

    const folder = isChannel ? 'groups' : 'chats';
    batch.set(doc(db, 'users', senderUid, folder, chatId, 'messages', messageRef.id), {
      ...message,
      id: messageRef.id,
      userCopyOwner: senderUid
    });
    await batch.commit();
    return { id: messageRef.id, ...message };
  }
};
