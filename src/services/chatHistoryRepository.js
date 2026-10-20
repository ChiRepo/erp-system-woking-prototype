import { collection, query, orderBy, documentId, limitToLast, startAt, endBefore, onSnapshot, getDocsFromServer } from 'firebase/firestore';
import { db } from '../firebase.js';
import { studentE2EE } from './studentE2EE.js';

export const messageTime = value => typeof value?.toMillis === 'function' ? value.toMillis() :
  typeof value === 'number' ? value : Date.parse(value) || 0;
export const compareMessages = (a, b) => messageTime(a.timestamp) - messageTime(b.timestamp) ||
  (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

const sourceQuery = ({ chatId, isChannel, from, before, size }) => query(
  collection(db, isChannel ? 'student_channels' : 'student_chats', chatId, 'messages'),
  orderBy('timestamp', 'asc'), orderBy(documentId(), 'asc'),
  ...(from ? [startAt(from)] : []), ...(before ? [endBefore(before)] : []),
  ...(size ? [limitToLast(size)] : [])
);
const firestoreHistorySource = {
  watch(spec, next, fail) {
    return onSnapshot(sourceQuery(spec), { includeMetadataChanges: true }, snapshot =>
      next({ docs: snapshot.docs, fromCache: snapshot.metadata.fromCache }), fail);
  },
  async read(spec) { return (await getDocsFromServer(sourceQuery(spec))).docs; }
};
const mergeDocs = (...pages) => [...new Map(pages.flat().map(item => [item.id, item])).values()]
  .sort((a, b) => compareMessages({ ...a.data(), id: a.id }, { ...b.data(), id: b.id }));

/** Each open room owns its cursor and a continuous live range, so bursts cannot create gaps. */
export function createChatHistoryRepository(source = firestoreHistorySource, decrypt = (...args) => studentE2EE.decrypt(...args)) {
  const decode = async (docs, spec) => Promise.all(docs.map(async item => {
    const raw = item.data();
    if (raw.deletedForEveryone === true) return { id: item.id, from: raw.from, fromName: raw.fromName, timestamp: raw.timestamp, type: 'deleted', text: '', deletedForEveryone: true };
    const text = !spec.isChannel && raw.type === 'text' && raw.text?.startsWith('E2EE::')
      ? await decrypt(raw.text, spec.conversationKey, spec.chatId) : raw.text;
    return { ...raw, id: item.id, text };
  }));
  return {
    subscribe(spec, callback) {
      const size = Math.max(1, spec.pageSize || 50);
      let active = true, generation = 0, revision = 0, stop = null;
      let docs = [], lastMessages = [], boundary = null, established = false, hasMore = false, loadingOlder = false, error = null;
      const emit = async () => {
        const request = ++revision;
        const status = { hasMore, loadingOlder, error };
        try {
          const messages = await decode(docs, spec);
          if (active && request === revision) { lastMessages = messages; callback(messages, status); }
        } catch {
          if (active && request === revision) callback(lastMessages, { ...status, error: 'Messages could not be decoded. Reopen this conversation to retry.' });
        }
      };
      const watch = (from, initial = false) => {
        const request = ++generation;
        stop?.(); stop = null;
        const unsubscribe = source.watch({ ...spec, from, size: initial ? size + 1 : undefined }, snapshot => {
          if (!active || request !== generation) return;
          error = null;
          if (initial) {
            docs = snapshot.docs.slice(-size);
            if (!snapshot.fromCache) {
              hasMore = snapshot.docs.length > size;
              boundary = docs[0] || null;
              established = true;
              emit();
              // Once the boundary is known, keep every update after it, even after an offline burst.
              watch(boundary);
              return;
            }
          } else {
            // Incomplete cache emissions must not erase a page fetched from the server.
            docs = snapshot.fromCache ? mergeDocs(docs, snapshot.docs) : snapshot.docs;
          }
          emit();
        }, () => {
          if (!active || request !== generation) return;
          error = 'Messages could not be loaded. Check your connection and reopen the conversation.';
          emit();
        });
        if (active && request === generation) stop = unsubscribe;
        else unsubscribe();
      };
      const unsubscribe = () => { active = false; ++generation; ++revision; stop?.(); };
      unsubscribe.loadOlder = async () => {
        if (!active || !established || !hasMore || loadingOlder) return;
        loadingOlder = true; error = null; emit();
        try {
          const page = await source.read({ ...spec, before: boundary, size: size + 1 });
          if (!active) return;
          hasMore = page.length > size;
          const older = page.slice(-size);
          if (older.length) {
            boundary = older[0];
            docs = mergeDocs(older, docs);
            watch(boundary);
          }
        } catch {
          if (active) error = 'Older messages could not be loaded. Check your connection and try again.';
        } finally {
          if (active) { loadingOlder = false; emit(); }
        }
      };
      watch(null, true);
      return unsubscribe;
    },
    async readAll(spec, { signal } = {}) {
      const checkActive = () => { if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError'); };
      let before = null, docs = [];
      for (;;) {
        checkActive();
        const page = await source.read({ ...spec, before, size: 200 });
        checkActive();
        docs = mergeDocs(page, docs);
        if (page.length < 200) break;
        before = page[0];
      }
      const messages = await decode(docs, spec);
      checkActive();
      return messages;
    }
  };
}

export const chatHistoryRepository = createChatHistoryRepository();
