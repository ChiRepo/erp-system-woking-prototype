import { auth, db } from '../firebase.js';
import { addDoc, arrayUnion, collection, deleteDoc, doc, getDoc, runTransaction, updateDoc } from 'firebase/firestore';

export function createSocialPostRepository({ currentUid, create, read, remove, appendComment, toggleLike }) {
  const requireAuthor = uid => {
    if (!uid || currentUid() !== uid) throw new Error('Sign in with your own student account to continue.');
  };
  return {
    requireAuthor,
    async publish(data) {
      requireAuthor(data.authorUid);
      if (!data.mediaUrl?.trim()) throw new Error('Choose an image or video before publishing.');
      const id = await create(data);
      return { id, ...data };
    },
    async delete(postId, uid) {
      requireAuthor(uid);
      if (!postId) throw new Error('Choose a post to delete.');
      const post = await read(postId);
      if (!post) return true;
      if (post.authorUid !== uid) throw new Error('You can only delete posts published by your account.');
      await remove(postId);
      return true;
    },
    async comment(postId, data) {
      requireAuthor(data.authorUid);
      const text = String(data.text || '').trim();
      if (!postId || !text || text.length > 2000) throw new Error('Enter a comment of up to 2,000 characters.');
      const comment = { ...data, text, id: crypto.randomUUID(), createdAt: Date.now() };
      await appendComment(postId, comment);
      return comment;
    },
    async like(postId, uid) {
      requireAuthor(uid);
      if (!postId) throw new Error('Choose a post to like.');
      return toggleLike(postId, uid);
    }
  };
}

export const socialPostRepository = createSocialPostRepository({
  currentUid: () => auth.currentUser?.uid,
  create: async data => (await addDoc(collection(db, 'student_posts'), data)).id,
  read: async id => { const snapshot = await getDoc(doc(db, 'student_posts', id)); return snapshot.exists() ? snapshot.data() : null; },
  remove: id => deleteDoc(doc(db, 'student_posts', id)),
  appendComment: (id, comment) => updateDoc(doc(db, 'student_posts', id), { comments: arrayUnion(comment) }),
  toggleLike: (id, uid) => runTransaction(db, async transaction => {
    const ref = doc(db, 'student_posts', id);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('This post no longer exists.');
    const likes = snapshot.data().likes || [];
    transaction.update(ref, { likes: likes.includes(uid) ? likes.filter(item => item !== uid) : [...likes, uid] });
  })
});
