import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase.js';

function time(value) {
  if (typeof value?.toMillis === 'function') return value.toMillis();
  return typeof value === 'number' ? value : Date.parse(value || '') || 0;
}

export function createJoinedChannelRepository(watch) {
  return {
    subscribe(uid, callback) {
      if (!uid) { callback([], { error: null }); return () => {}; }
      let active = true;
      const streams = new Map();
      const errors = new Map();
      const emit = () => {
        if (!active || streams.size !== 3) return;
        const channels = new Map();
        for (const records of streams.values()) for (const channel of records) {
          const previous = channels.get(channel.id);
          if (!previous || time(channel.updatedAt || channel.createdAt) >= time(previous.updatedAt || previous.createdAt)) channels.set(channel.id, channel);
        }
        callback([...channels.values()].sort((a, b) => time(b.createdAt) - time(a.createdAt) || a.id.localeCompare(b.id)),
          { error: [...errors.values()].find(Boolean) || null });
      };
      // Creator queries retain legacy channels until their owner backfills UID
      // membership. A campus-wide newest-N window never defines a joined list.
      const stops = ['memberUids', 'creatorUid', 'createdBy'].map(field => {
        const onError = () => {
          streams.set(field, []);
          errors.set(field, 'Channels could not be loaded. Reconnect to try again.');
          emit();
        };
        try {
          return watch(field, field === 'memberUids' ? 'array-contains' : '==', uid, records => {
            streams.set(field, records);
            errors.delete(field);
            emit();
          }, onError);
        } catch { onError(); return () => {}; }
      });
      return () => { active = false; stops.forEach(stop => stop?.()); };
    }
  };
}

export const joinedChannelRepository = createJoinedChannelRepository((field, operator, uid, next, onError) =>
  onSnapshot(query(collection(db, 'student_channels'), where(field, operator, uid)), snapshot =>
    next(snapshot.docs.map(item => ({ ...item.data(), id: item.id, isChannel: true }))), onError));
