import { useCallback, useEffect, useRef, useState } from 'react';

// All entry points share one revision so a slow database acknowledgment cannot
// replace a more recent navigation choice, even when the old view stays mounted.
export function useChatSelection() {
  const [activeChat, commitChat] = useState(null);
  const revision = useRef(0);
  const selectionVersion = useRef(0);
  const selected = useRef(null);
  const cancelChatAction = useCallback(() => { revision.current += 1; }, []);
  useEffect(() => () => { cancelChatAction(); selectionVersion.current += 1; }, [cancelChatAction]);
  const beginChatAction = useCallback((options = {}) => {
    const request = ++revision.current;
    const selection = selectionVersion.current;
    return action => {
      // Switching tabs cancels an open; a saved close may still clear the same
      // hidden room. Selecting another room (including reopening this one) wins.
      if (options.close ? selection !== selectionVersion.current : request !== revision.current) return false;
      action();
      return true;
    };
  }, []);
  const selectChat = useCallback(chat => {
    cancelChatAction();
    selectionVersion.current += 1;
    selected.current = chat;
    commitChat(chat);
  }, [cancelChatAction]);
  const closeChat = useCallback(chatId => {
    if (selected.current?.id !== chatId) return;
    selectionVersion.current += 1;
    selected.current = null;
    commitChat(null);
  }, []);
  return { activeChat, selectChat, closeChat, beginChatAction, cancelChatAction };
}
