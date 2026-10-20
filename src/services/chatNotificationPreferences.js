const defaults = { audio: true, banners: true, hideNames: false };
const eventName = 'krc_chat_notifications_changed';
const keyFor = uid => `krc_chat_notifications_${uid}`;
const read = uid => {
  try { return JSON.parse(localStorage.getItem(keyFor(uid)) || '{}'); } catch { return {}; }
};
const write = (uid, data) => {
  if (!uid) throw new Error('Sign in to save notification preferences.');
  localStorage.setItem(keyFor(uid), JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(eventName, { detail: { uid } }));
};

export function channelNotificationPolicy(mode, now = Date.now()) {
  return { mode: mode || 'all', until: mode === '8h' ? now + 8 * 3600000 : mode === '1w' ? now + 7 * 86400000 : 0 };
}

export function messageNoticeAllowed(policy, thread, student, now = Date.now()) {
  if (policy?.mode === 'always' || policy?.until > now) return false;
  if (policy?.mode !== 'mentions') return true;
  const tags = [student?.uid, student?.prn, student?.handle, student?.username, student?.email?.split('@')[0]]
    .filter(Boolean).map(value => String(value).replace(/^@/, '').toLowerCase());
  return (thread.lastMentions || []).some(tag => tags.includes(tag));
}

// Device preferences are private to this account in this browser. They do not grant access.
export const chatNotificationPreferences = {
  get(uid) { return { ...defaults, ...read(uid).settings }; },
  update(uid, changes) { const data = read(uid); write(uid, { ...data, settings: { ...this.get(uid), ...changes } }); },
  getChannel(uid, channelId) { return read(uid).channels?.[channelId] || { mode: 'all', until: 0 }; },
  setChannel(uid, channelId, mode) {
    const data = read(uid);
    write(uid, { ...data, channels: { ...data.channels, [channelId]: channelNotificationPolicy(mode) } });
  },
  subscribe(uid, callback) {
    const notify = event => {
      if (event.type === 'storage' ? event.key === keyFor(uid) : event.detail?.uid === uid) callback(this.get(uid));
    };
    callback(this.get(uid));
    window.addEventListener(eventName, notify);
    window.addEventListener('storage', notify);
    return () => { window.removeEventListener(eventName, notify); window.removeEventListener('storage', notify); };
  }
};
