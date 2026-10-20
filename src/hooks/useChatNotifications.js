import { useEffect, useRef, useState } from 'react';
import { studentChatService } from '../services/studentChatService.js';
import { resolveConversationPeer } from '../services/conversationIdentity.js';
import { sameStudentIdentity } from '../services/studentDirectory.js';
import { chatNotificationPreferences, messageNoticeAllowed } from '../services/chatNotificationPreferences.js';
import { soundEffects } from '../utils/soundEffects.js';

export function useChatNotifications(student, enabled, activeChatId) {
  const [notice, setNotice] = useState(null);
  const visibleId = useRef(activeChatId);
  visibleId.current = activeChatId;
  useEffect(() => {
    setNotice(null);
    if (!student?.uid || !enabled) return;
    const uid = student.uid;
    let preferences = chatNotificationPreferences.get(uid);
    const timer = { current: null };
    const consume = () => {
      let initial = true;
      const seen = new Map();
      return (threads, status = {}) => {
        if (status.error) return;
        for (const thread of threads) {
          const previous = seen.get(thread.id) || 0;
          const timestamp = thread.lastTimestamp || 0;
          seen.set(thread.id, timestamp);
          if (initial || timestamp <= previous || !thread.lastSender || thread.lastSender === uid) continue;
          if (visibleId.current === thread.id && document.visibilityState === 'visible') continue;
          const policy = chatNotificationPreferences.getChannel(uid, thread.id);
          if (!messageNoticeAllowed(policy, thread, student)) continue;
          if (preferences.audio) soundEffects.playNotification();
          if (!preferences.banners) continue;
          const name = thread.isChannel ? thread.name : resolveConversationPeer(thread, student).details.name;
          setNotice({ thread, label: preferences.hideNames ? 'New campus message' : thread.isChannel ? `New message in ${name}` : `New message from ${name}` });
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setNotice(null), 8000);
        }
        initial = false;
      };
    };
    const directUpdates = consume();
    const channelUpdates = consume();
    const stopPreferences = chatNotificationPreferences.subscribe(uid, value => { preferences = value; });
    const stopDirect = studentChatService.subscribeToConversations(uid, directUpdates, { includeClosed: true });
    const stopChannels = studentChatService.subscribeToChannels((channels, status) => channelUpdates(channels.filter(channel =>
      channel.creatorUid === uid || channel.createdBy === uid || (Array.isArray(channel.memberUids) ? channel.memberUids.includes(uid) : channel.members?.some(member => sameStudentIdentity(member, student)))), status), student);
    return () => { stopPreferences(); stopDirect(); stopChannels(); clearTimeout(timer.current); };
  }, [student?.uid, enabled]);
  return [notice, () => setNotice(null)];
}
