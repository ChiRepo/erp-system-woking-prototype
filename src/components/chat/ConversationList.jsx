/**
 * @fileoverview Conversation List Component - Executive Slate (#3)
 * Slack & Linear enterprise layout with channel & direct message grouping,
 * verified student badges, presence indicator dots, and BM25 search.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Search, MessageSquare, Plus, Hash, 
  Lock, CheckCircle, ShieldCheck, UserPlus, 
  FolderPlus, Sparkles, X, Loader2, Sun, Moon 
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { auth } from '../../firebase';
import { studentChatService } from '../../services/studentChatService.js';
import { studentSearchService } from '../../services/studentSearchService.js';
import { studentSocialService } from '../../services/studentSocialService.js';
import { soundEffects } from '../../utils/soundEffects.js';
import DefaultAvatar from '../common/DefaultAvatar.jsx';
import { showCampusAlert } from '../common/CustomAlertModal.jsx';
import { resolveConversationPeer } from '../../services/conversationIdentity.js';
import { chatWorkspacePreferences } from '../../services/chatWorkspacePreferences.js';

export default function ConversationList({ 
  currentStudent, 
  activeChat,
  onSelectChat, 
  onCloseChat,
  beginChatAction = () => action => { action(); return true; },
  onOpenProfile 
}) {
  const { darkMode, toggleTheme } = useTheme();
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [channels, setChannels] = useState([]);
  const [stories, setStories] = useState([]);
  const [conversationError, setConversationError] = useState('');
  const [channelError, setChannelError] = useState('');
  const [connectionRevision, setConnectionRevision] = useState(0);
  const [workspace, setWorkspace] = useState({});
  const [directoryPeers, setDirectoryPeers] = useState([]);
  const [listFilter, setListFilter] = useState('');

  // Channel Creation Modal State
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChanName, setNewChanName] = useState('');
  const [newChanCategory, setNewChanCategory] = useState('Study Channel');
  const [newChanTopic, setNewChanTopic] = useState('');
  const [creatingChannel, setCreatingChannel] = useState(false);
  
  const currentUid = currentStudent?.uid || currentStudent?.prn;
  const searchDebounceRef = useRef(null);
  useEffect(() => studentSearchService.subscribeStudents(setDirectoryPeers, true), []);
  useEffect(() => {
    setWorkspace({});
    return chatWorkspacePreferences.subscribeAll(currentUid, (value, error) => {
      if (value) setWorkspace(value);
      if (error) setConversationError(error);
    });
  }, [currentUid, connectionRevision]);

  useEffect(() => {
    if (!currentUid) return;

    // 1. Subscribe to live private conversations
    const unsubscribe = studentChatService.subscribeToConversations(
      currentStudent?.uid, 
      (list, status = {}) => {
        setConversations(list || []);
        setConversationError(status.error || '');
      }, 
      currentStudent?.prn
    );

    // 2. Subscribe to live student community channels
    const unsubscribeChannels = studentChatService.subscribeToChannels((firestoreChannels, status = {}) => {
      setChannelError(status.error || '');
      const channelMap = new Map();

      const myIdentifiers = new Set([
        currentUid,
        currentStudent?.uid,
        currentStudent?.prn,
        currentStudent?.id,
        currentStudent?.email,
        auth?.currentUser?.uid,
        auth?.currentUser?.email
      ].filter(Boolean).map(x => String(x).toLowerCase().trim()));

      (firestoreChannels || []).forEach(c => {
        const isCreator = (c.creatorUid || c.createdBy) === currentUid;

        const isMember = Array.isArray(c.memberUids) ? c.memberUids.includes(currentUid) : (c.members || []).some(m => {
          if (!m) return false;
          const mIds = [m.uid, m.prn, m.id, m.email].filter(Boolean).map(x => String(x).toLowerCase().trim());
          return mIds.some(id => myIdentifiers.has(id));
        });

        if (isCreator || isMember) {
          channelMap.set(c.id, c);
        }
      });
      setChannels(Array.from(channelMap.values()));
    }, currentStudent);

    // 3. Listen to instant group left events
    const handleGroupLeft = (e) => {
      const { groupId } = e.detail || {};
      if (groupId) {
        setChannels(prev => prev.filter(c => c.id !== groupId));
      }
    };
    window.addEventListener('krc_group_left', handleGroupLeft);

    // 4. Listen to dynamic user name changes everywhere
    const handleUserNameChanged = (e) => {
      const { uid, newName } = e.detail || {};
      if (uid && newName) {
        setConversations(prev => prev.map(conv => {
          if ((conv.participants || []).includes(uid)) {
            const pNames = { ...(conv.participantNames || {}) };
            pNames[uid] = newName;
            const pDetails = { ...(conv.participantDetails || {}) };
            if (pDetails[uid]) {
              pDetails[uid] = { ...pDetails[uid], name: newName };
            }
            return {
              ...conv,
              participantNames: pNames,
              participantDetails: pDetails
            };
          }
          return conv;
        }));
      }
    };
    window.addEventListener('krc_user_name_changed', handleUserNameChanged);

    return () => {
      if (unsubscribe) unsubscribe();
      if (unsubscribeChannels) unsubscribeChannels();
      window.removeEventListener('krc_group_left', handleGroupLeft);
      window.removeEventListener('krc_user_name_changed', handleUserNameChanged);
    };
  }, [currentUid, currentStudent?.uid, currentStudent?.prn, currentStudent?.email, currentStudent?.id, connectionRevision]);

  useEffect(() => {
    let active = true;
    let revision = 0;
    const run = async () => {
      const request = ++revision;
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const results = await studentSearchService.search(searchQuery, currentStudent, 15);
        if (active && request === revision) setSearchResults(results);
      } finally {
        if (active && request === revision) setIsSearching(false);
      }
    };
    searchDebounceRef.current = setTimeout(run, 75);
    const unsubscribe = studentSearchService.subscribeStudents(run);
    return () => {
      active = false;
      ++revision;
      clearTimeout(searchDebounceRef.current);
      unsubscribe();
    };
  }, [searchQuery, currentStudent]);

  const handleSearchChange = e => setSearchQuery(e.target.value);

  const handleClearSearch = () => {
    clearTimeout(searchDebounceRef.current);
    setSearchQuery('');
    setIsSearching(false);
    setSearchResults([]);
  };

  const handleStartConversationWithStudent = async (targetStudent) => {
    const finish = beginChatAction();
    try {
      soundEffects.playThonk();
      const chat = await studentChatService.getOrCreateConversation(currentStudent, targetStudent);
      setConversations(prev => {
        const exists = prev.some(c => c.id === chat.id);
        return exists ? prev : [chat, ...prev];
      });
      finish(() => { onSelectChat(chat); handleClearSearch(); });
    } catch (err) {
      showCampusAlert({
        title: 'Conversation Notice',
        message: err.message || 'Could not initiate chat with student.',
        type: 'error'
      });
    }
  };

  const handleSelectChannel = (channel) => {
    soundEffects.playThonk();
    onSelectChat(channel);
  };

  const handleOpenCreateChannel = () => {
    soundEffects.playClick();
    setNewChanName('');
    setNewChanTopic('');
    setNewChanCategory('Study Channel');
    setShowCreateChannelModal(true);
  };

  const handleCreateChannelSubmit = async (e) => {
    e.preventDefault();
    if (!newChanName.trim() || creatingChannel) return;

    setCreatingChannel(true);
    const finish = beginChatAction();
    try {
      soundEffects.playThonk();
      const newChan = await studentChatService.createChannel({
        name: newChanName.trim(),
        topic: newChanTopic.trim(),
        category: newChanCategory,
        student: currentStudent
      });

      setChannels(prev => {
        const exists = prev.some(c => c.id === newChan.id);
        return exists ? prev : [newChan, ...prev];
      });

      setShowCreateChannelModal(false);
      setNewChanName('');
      setNewChanTopic('');
      finish(() => onSelectChat(newChan));
    } catch (err) {
      showCampusAlert({
        title: 'Channel Notice',
        message: err.message || 'Failed to create channel.',
        type: 'error'
      });
    } finally {
      setCreatingChannel(false);
    }
  };

  // Never re-inject sample classmates or render explicitly marked demo threads.
  const inSelectedList = chat => !listFilter || (listFilter === '__favorites'
    ? workspace[chat.id]?.favorite : workspace[chat.id]?.lists?.includes(listFilter));
  const favoritesFirst = (a, b) => Number(workspace[b.id]?.favorite === true) - Number(workspace[a.id]?.favorite === true);
  const directMessageList = conversations.filter(chat => !chat.isDemo && !chat.isMock && !chat.isSample && inSelectedList(chat)).sort(favoritesFirst);
  const channelList = channels.filter(inSelectedList).sort(favoritesFirst);
  const matchingChannels = channels.filter(channel => `${channel.name} ${channel.slug} ${channel.topic}`.toLowerCase().includes(searchQuery.trim().toLowerCase()));
  const listNames = [...new Set(Object.values(workspace).flatMap(preference => preference.lists || []))].sort();

  return (
    <div className="flex flex-col h-full dark:bg-slate-950 bg-white dark:text-slate-200 text-slate-800 select-none border-r dark:border-slate-800/80 border-slate-200 font-sans transition-colors duration-150">
      {/* Top Header: Messages + Theme Toggle + Compose Action */}
      <div className="p-3.5 border-b dark:border-slate-800 border-slate-200 flex items-center justify-between dark:bg-slate-900/60 bg-slate-50 shrink-0 transition-colors duration-150">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-extrabold tracking-tight dark:text-white text-slate-900">
            Messages
          </h2>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 font-bold">
            Campus
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick Theme Toggle */}
          <button
            type="button"
            onClick={(e) => {
              soundEffects.playClick();
              toggleTheme(e);
            }}
            className="p-1.5 rounded-lg dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
            title={`Switch to ${darkMode ? 'Light' : 'Dark'} mode`}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              // Focus search
              const el = document.getElementById('chat-search-input');
              if (el) el.focus();
            }}
            className="p-1.5 rounded-lg dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Compose / Search Classmates"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {(conversationError || channelError) && (
        <div role="alert" className="m-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
          {conversationError && <p>{conversationError}</p>}
          {channelError && <p>{channelError}</p>}
          <button type="button" className="mt-2 underline" onClick={() => setConnectionRevision(value => value + 1)}>Reconnect</button>
        </div>
      )}

      {/* Search Input */}
      <div className="px-3 py-2.5 border-b dark:border-slate-800/80 border-slate-200 dark:bg-slate-950/60 bg-white shrink-0 transition-colors duration-150">
        <div className="relative flex items-center w-full">
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 z-10">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="chat-search-input"
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search channels, peers, PRN..."
            className="w-full dark:bg-slate-900/90 bg-slate-100/90 border dark:border-slate-800 border-slate-300 dark:hover:border-slate-700 hover:border-slate-400 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-10 pr-9 py-2 text-xs dark:text-slate-100 text-slate-900 dark:placeholder:text-slate-500 placeholder:text-slate-400 transition-colors outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 p-1 rounded-md text-slate-400 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800/60 hover:bg-slate-200 cursor-pointer transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="px-3 py-2 border-b dark:border-slate-800 border-slate-200">
        <select aria-label="Filter conversations by private list" value={listFilter} onChange={event => setListFilter(event.target.value)}
          className="w-full rounded bg-transparent text-xs p-1">
          <option value="">All conversations</option>
          <option value="__favorites">Favourites</option>
          {listNames.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>
      {/* Search Results Mode */}
      {searchQuery.trim() || isSearching ? (
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {matchingChannels.length > 0 && <div className="space-y-1 pb-3">
            <p className="px-2 text-[10px] text-slate-500">Channels</p>
            {matchingChannels.map(channel => <button type="button" key={channel.id} onClick={() => { handleSelectChannel(channel); handleClearSearch(); }}
              className="w-full p-2 text-left text-xs rounded hover:bg-emerald-500/10"># {channel.name}</button>)}
          </div>}
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider dark:text-slate-400 text-slate-500 flex items-center justify-between">
            <span>Student Directory</span>
            <span>{searchResults.length} matches</span>
          </div>

          {searchResults.length === 0 ? (
            <div className="py-8 text-center dark:text-slate-500 text-slate-400 text-xs">
              <p className="font-semibold dark:text-slate-300 text-slate-700">No peers found</p>
              <p className="text-[11px] mt-0.5">Try searching by department or PRN</p>
            </div>
          ) : (
            searchResults.map((st) => (
              <button
                key={st.uid}
                type="button"
                onClick={() => handleStartConversationWithStudent(st)}
                className="w-full p-2 rounded-lg dark:hover:bg-slate-900 hover:bg-slate-100 border border-transparent dark:hover:border-slate-800 hover:border-slate-200 transition-all flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <DefaultAvatar
                    src={st.avatar}
                    user={st}
                    userId={st.uid}
                    className="w-8 h-8 rounded-lg shrink-0 border dark:border-slate-700 border-slate-300"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold dark:text-white text-slate-900 truncate">
                        {st.name}
                      </p>
                      <span className="px-1 py-0.2 rounded text-[9px] font-mono dark:bg-slate-800 bg-slate-200 dark:text-slate-300 text-slate-700">
                        {st.dept}
                      </span>
                    </div>
                    <p className="text-[10px] dark:text-slate-400 text-slate-500 truncate font-mono">
                      {st.prn}
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-bold group-hover:scale-105 transition-transform shrink-0">
                  Chat
                </span>
              </button>
            ))
          )}
        </div>
      ) : (
        /* Regular Grouped Workspace: Channels + Direct Messages */
        <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
          {/* ================================================================= */}
          {/* 1. CHANNELS GROUP */}
          {/* ================================================================= */}
          <div>
            <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold dark:text-slate-400 text-slate-500 tracking-wider">
              <span>Channels</span>
              <button
                type="button"
                onClick={handleOpenCreateChannel}
                className="p-1 rounded dark:hover:bg-slate-800 hover:bg-slate-200 dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 transition-colors cursor-pointer"
                title="Create Channel"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5 mt-1">
              {channelList.map((chan) => {
                const isSelected = activeChat?.id === chan.id;
                return (
                  <button
                    key={chan.id}
                    type="button"
                    onClick={() => handleSelectChannel(chan)}
                    className={`w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'dark:bg-slate-800 bg-emerald-500/10 dark:text-white text-emerald-950 font-bold border dark:border-slate-700 border-emerald-500/30 shadow-xs'
                        : 'dark:text-slate-300 text-slate-700 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <Hash className="w-3.5 h-3.5 dark:text-slate-400 text-slate-500 shrink-0" />
                    <span className="truncate flex-1">{workspace[chan.id]?.favorite ? '★ ' : ''}{chan.slug || chan.name}</span>
                    {chan.membersCount && (
                      <span className="text-[10px] font-mono dark:text-slate-400 text-slate-500 shrink-0">
                        {chan.membersCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================================================================= */}
          {/* 2. DIRECT MESSAGES GROUP */}
          {/* ================================================================= */}
          <div>
            <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold dark:text-slate-400 text-slate-500 tracking-wider">
              <span>Direct messages</span>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  const el = document.getElementById('chat-search-input');
                  if (el) el.focus();
                }}
                className="p-1 rounded dark:hover:bg-slate-800 hover:bg-slate-200 dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 transition-colors cursor-pointer"
                title="New Direct Message"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 mt-1">
              {directMessageList.length === 0 ? (
                <div className="px-2 py-3 text-center">
                  <p className="text-[11px] dark:text-slate-500 text-slate-400">{listFilter ? 'No direct messages in this list' : 'No direct messages yet'}</p>
                  <p className="text-[10px] dark:text-slate-600 text-slate-400 mt-0.5">{listFilter ? 'Choose All conversations to see your other chats.' : 'Use Search Feed to connect with peers'}</p>
                </div>
              ) : directMessageList.map((chat) => {
                const { uid: otherUid, details } = resolveConversationPeer(chat, currentStudent, directoryPeers);

                const isSelected = activeChat?.id === chat.id;

                return (
                  <div key={chat.id} className="relative group">
                  <button
                    type="button"
                    onClick={async () => {
                      const finish = beginChatAction();
                      try {
                        await studentChatService.openConversation(currentUid, chat.id);
                        finish(() => { soundEffects.playThonk(); onSelectChat(chat); });
                      } catch (error) { setConversationError(error.message); }
                    }}
                    className={`w-full p-2 pr-8 rounded-lg flex items-center gap-2.5 transition-all text-left cursor-pointer group ${
                      isSelected
                        ? 'dark:bg-slate-800 bg-emerald-500/10 dark:text-white text-emerald-950 font-bold border dark:border-slate-700 border-emerald-500/30 shadow-xs'
                        : 'dark:hover:bg-slate-800 hover:bg-slate-100 dark:text-slate-300 text-slate-700'
                    }`}
                  >
                    {/* Avatar with Status Indicator */}
                    <div className="relative shrink-0">
                      <DefaultAvatar
                        src={details.avatar}
                        user={details}
                        userId={otherUid}
                        className="w-7 h-7 rounded-full border dark:border-slate-700 border-slate-300"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-medium dark:text-slate-100 text-slate-900 truncate dark:group-hover:text-white group-hover:text-black flex items-center gap-1">
                          {workspace[chat.id]?.favorite ? '★ ' : ''}{details.name}
                        </span>
                      </div>
                      <p className="text-[10px] dark:text-slate-400 text-slate-500 truncate">
                        {chat.lastMessage || 'Encrypted chat'}
                      </p>
                    </div>
                  </button>
                  <button type="button" title={`Close conversation with ${details.name}`} aria-label={`Close conversation with ${details.name}`} className="absolute right-1 top-3 rounded p-1 text-muted hover:text-text" onClick={async () => {
                    const finish = beginChatAction({ close: true });
                    try {
                      await studentChatService.closeConversation(currentUid, chat.id);
                      finish(() => {
                        if (onCloseChat) onCloseChat(chat.id);
                        else if (isSelected) onSelectChat(null);
                      });
                    } catch (error) { setConversationError(error.message); }
                  }}><X className="w-3.5 h-3.5" /></button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================================================================= */}
          {/* 3. AUXILIARY CHANNELS / COLLABS ACTIONS */}
          {/* ================================================================= */}
          <div className="pt-2 border-t dark:border-slate-800 border-slate-200 space-y-1">
            <button
              type="button"
              onClick={handleOpenCreateChannel}
              className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800/80 hover:bg-slate-100 transition-colors cursor-pointer text-left"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Collabs</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateChannel}
              className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800/80 hover:bg-slate-100 transition-colors cursor-pointer text-left"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add a channel</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE COMMUNITY CHANNEL / STUDY GROUP MODAL */}
      {/* ========================================================================= */}
      {showCreateChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="dark:bg-slate-900 bg-white border dark:border-slate-700 border-slate-200 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800 border-slate-200">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold dark:text-white text-slate-900">Create Campus Channel</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateChannelModal(false)}
                className="dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 p-1 rounded-lg dark:hover:bg-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChannelSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block dark:text-slate-300 text-slate-700 font-semibold mb-1">
                  Channel Name <span className="text-emerald-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newChanName}
                  onChange={(e) => setNewChanName(e.target.value)}
                  placeholder="e.g. Algorithms & LeetCode, Robotics Club"
                  className="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-700 border-slate-300 rounded-lg px-3 py-2 dark:text-white text-slate-900 dark:placeholder:text-slate-500 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block dark:text-slate-300 text-slate-700 font-semibold mb-1">
                  Category
                </label>
                <select
                  value={newChanCategory}
                  onChange={(e) => setNewChanCategory(e.target.value)}
                  className="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-700 border-slate-300 rounded-lg px-3 py-2 dark:text-white text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                >
                  <option value="Study Channel">Academic Study Channel</option>
                  <option value="Study Group">Academic Study Group (Legacy)</option>
                  <option value="Technical Club">Technical & Coding Club</option>
                  <option value="Department Forum">Department Forum</option>
                  <option value="Project Collab">Semester Project Collab</option>
                  <option value="Campus Life">Campus Living & Housing</option>
                </select>
              </div>

              <div>
                <label className="block dark:text-slate-300 text-slate-700 font-semibold mb-1">
                  Topic / Purpose
                </label>
                <input
                  type="text"
                  value={newChanTopic}
                  onChange={(e) => setNewChanTopic(e.target.value)}
                  placeholder="e.g. Weekly problem discussions and resources"
                  className="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-700 border-slate-300 rounded-lg px-3 py-2 dark:text-white text-slate-900 dark:placeholder:text-slate-500 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t dark:border-slate-800 border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateChannelModal(false)}
                  className="px-3 py-1.5 rounded-lg border dark:border-slate-700 border-slate-300 dark:text-slate-300 text-slate-700 dark:hover:bg-slate-800 hover:bg-slate-100 text-xs font-medium cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newChanName.trim() || creatingChannel}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 cursor-pointer transition-all shadow-xs"
                >
                  {creatingChannel ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Channel</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
