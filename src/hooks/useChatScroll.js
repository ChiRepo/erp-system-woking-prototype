import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { compareMessages } from '../services/chatHistoryRepository.js';

/** Preserve the visible message across prepends/updates; follow incoming messages only near the bottom. */
export function useChatScroll(messages, identity) {
  const viewportRef = useRef(null);
  const followRef = useRef(true);
  const pending = useRef(null);
  const previous = useRef({ identity, last: null });
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const prepareUpdate = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || followRef.current) { pending.current = null; return; }
    const top = viewport.getBoundingClientRect().top;
    const message = [...viewport.querySelectorAll('[data-message-id]')]
      .find(element => element.getBoundingClientRect().bottom > top);
    pending.current = { id: message?.dataset.messageId, offset: message?.getBoundingClientRect().top - top, scrollTop: viewport.scrollTop };
  }, []);
  const scrollToBottom = useCallback(() => {
    followRef.current = true;
    setHasNewMessages(false);
    const viewport = viewportRef.current;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, []);
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const changedRoom = previous.current.identity !== identity;
    if (changedRoom) { followRef.current = true; pending.current = null; setHasNewMessages(false); }
    if (viewport) {
      if (followRef.current) viewport.scrollTop = viewport.scrollHeight;
      else if (pending.current) {
        const anchor = pending.current;
        // A scroll after the snapshot was received is newer user intent.
        if (Math.abs(viewport.scrollTop - anchor.scrollTop) < 2) {
          const message = [...viewport.querySelectorAll('[data-message-id]')].find(element => element.dataset.messageId === anchor.id);
          viewport.scrollTop = message ? viewport.scrollTop + message.getBoundingClientRect().top - viewport.getBoundingClientRect().top - anchor.offset : anchor.scrollTop;
        }
      }
    }
    const last = messages.at(-1);
    if (!changedRoom && !followRef.current && previous.current.last && last && compareMessages(last, previous.current.last) > 0) setHasNewMessages(true);
    previous.current = { identity, last };
    pending.current = null;
  }, [messages, identity]);
  const onScroll = useCallback(event => {
    const viewport = event.currentTarget;
    followRef.current = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 64;
    if (followRef.current) setHasNewMessages(false);
  }, []);
  const onMediaLoad = useCallback(() => {
    if (followRef.current) scrollToBottom();
  }, [scrollToBottom]);
  return { viewportRef, prepareUpdate, scrollToBottom, onScroll, onMediaLoad, hasNewMessages };
}
