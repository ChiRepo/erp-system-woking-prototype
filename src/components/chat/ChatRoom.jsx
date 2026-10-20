/**
 * @fileoverview Chat Room Component - Executive Slate (#3) + WhatsApp Web Group Settings
 * Enterprise chat room with channel/DM support, verified student badges,
 * E2EE encryption status, 15-line packaged message bubbles, photo attachments,
 * WhatsApp Web-style group settings drawer with admin member addition,
 * expiring encrypted invite links, and mobile auto-collapsing header.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Send, Sparkles, Image as ImageIcon, 
  ShieldCheck, Loader2, Smile, Lock, AlertCircle, 
  Users, Paperclip, Check, ChevronDown, Hash, 
  Maximize2, X, Download, UserPlus, Link, Clock,
  Copy, CheckCheck, Settings, Info, ChevronRight, User,
  Phone, Video, Search, Star, Bell, Palette, Shield,
  Heart, FolderPlus, List, MinusCircle, LogOut, ThumbsDown,
  Edit3, Camera, FileText, PhoneOff, Mic, MicOff, VideoOff,
  Volume2, VolumeX, Sun, Moon, UserMinus, Ban, ShieldAlert, Crown, MoreVertical, Plus
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { auth, db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { studentChatService } from '../../services/studentChatService.js';
import { studentSearchService } from '../../services/studentSearchService.js';
import { cloudStorageService } from '../../services/cloudStorageService.js';
import { soundEffects } from '../../utils/soundEffects.js';
import MessageChunkBubble from './MessageChunkBubble.jsx';
import KlipyGifPicker from './KlipyGifPicker.jsx';
import DefaultAvatar from '../common/DefaultAvatar.jsx';
import { showCampusAlert } from '../common/CustomAlertModal.jsx';
import { resolveConversationPeer } from '../../services/conversationIdentity.js';
import { studentIdentityKeys } from '../../services/studentDirectory.js';
import { chatNotificationPreferences } from '../../services/chatNotificationPreferences.js';
import { canManageChannel, channelCreatorUid, activeChannelMembers } from '../../services/channelPolicy.js';
import { chatWorkspacePreferences, messagesAfterHiddenHistory } from '../../services/chatWorkspacePreferences.js';
import { useChatScroll } from '../../hooks/useChatScroll.js';
import { messageTime } from '../../services/chatHistoryRepository.js';
import { messageDeletionRepository, canDeleteMessageForEveryone } from '../../services/messageDeletionRepository.js';
import MessageDeleteAction from './MessageDeleteAction.jsx';
import StarredChatMessages from './StarredChatMessages.jsx';

export default function ChatRoom({ 
  chat, 
  currentStudent, 
  onBack,
  onOpenProfile = () => {},
  onSelectChat,
  beginChatAction = () => action => { action(); return true; }
}) {
  const { darkMode, toggleTheme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [historyStatus, setHistoryStatus] = useState({ hasMore: false, loadingOlder: false });
  const historySubscription = useRef(null);
  const [exportingHistory, setExportingHistory] = useState(false);
  const exportController = useRef(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showUserList, setShowUserList] = useState(true);
  const [errorNotice, setErrorNotice] = useState('');

  // WhatsApp Web-style Group Settings Drawer & Modals state
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showInviteLinkModal, setShowInviteLinkModal] = useState(false);
  const [inviteDurationHours, setInviteDurationHours] = useState(24);
  const [generatedInvite, setGeneratedInvite] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const inviteCopyTimer = useRef(null);
  useEffect(() => () => clearTimeout(inviteCopyTimer.current), []);
  const [directorySearch, setDirectorySearch] = useState('');
  const [selectedDirectoryStudents, setSelectedDirectoryStudents] = useState([]);
  const [addingMembers, setAddingMembers] = useState(false);

  // WhatsApp Features State (Matching reference screenshots)
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showMemberSearch, setShowMemberSearch] = useState(false);
  const [showStarredModal, setShowStarredModal] = useState(false);
  const [showNotificationSettingsModal, setShowNotificationSettingsModal] = useState(false);
  const [mutedDuration, setMutedDuration] = useState(() => chatNotificationPreferences.getChannel(currentStudent?.uid, chat?.id).mode);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [chatTheme, setChatTheme] = useState(() => localStorage.getItem(`krc_theme_${currentStudent?.uid}_${chat?.id}`) || 'default');
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [workspace, setWorkspace] = useState({});
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [customListName, setCustomListName] = useState('');
  const [userMemberTag, setUserMemberTag] = useState(() => localStorage.getItem(`krc_tag_${chat?.id}_${currentStudent?.uid || currentStudent?.prn}`) || '');
  const [showMemberTagModal, setShowMemberTagModal] = useState(false);
  const [showMemberChangesModal, setShowMemberChangesModal] = useState(false);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const [showExitGroupConfirm, setShowExitGroupConfirm] = useState(false);
  const [showReportGroupModal, setShowReportGroupModal] = useState(false);
  const [reportingChannel, setReportingChannel] = useState(false);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [similarName, setSimilarName] = useState('');
  const [creatingSimilar, setCreatingSimilar] = useState(false);
  const [showEditDescriptionModal, setShowEditDescriptionModal] = useState(false);
  const [showMediaGalleryModal, setShowMediaGalleryModal] = useState(false);
  const [newDescriptionText, setNewDescriptionText] = useState(chat?.description || '');
  const [savingDescription, setSavingDescription] = useState(false);

  // Member Management States (Kick, Ban, Promote, Demote)
  const [selectedMemberForAction, setSelectedMemberForAction] = useState(null);
  const [showMemberActionModal, setShowMemberActionModal] = useState(false);
  const [showKickConfirm, setShowKickConfirm] = useState(false);
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const [banReasonText, setBanReasonText] = useState('Violation of campus channel community guidelines');
  const [memberActionLoading, setMemberActionLoading] = useState(false);

  // Mobile Auto-Collapsing Header state
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const lastScrollTopRef = useRef(0);
  const userInteractingRef = useRef(false);

  // Live Avatar Map for Real-Time Dynamic Profile Picture Updates
  const [liveAvatarMap, setLiveAvatarMap] = useState({});

  useEffect(() => {
    const handleAvatarUpdate = (e) => {
      const { uid, avatarUrl } = e.detail || {};
      if (uid && avatarUrl !== undefined) {
        setLiveAvatarMap(prev => ({
          ...prev,
          [uid]: avatarUrl,
          [String(uid).toLowerCase()]: avatarUrl
        }));
      }
    };

    const handleStorageUpdate = (e) => {
      if (e.key && e.key.startsWith('krc_student_avatar_')) {
        const uid = e.key.replace('krc_student_avatar_', '');
        setLiveAvatarMap(prev => ({
          ...prev,
          [uid]: e.newValue || '',
          [String(uid).toLowerCase()]: e.newValue || ''
        }));
      }
    };

    window.addEventListener('krc_avatar_updated', handleAvatarUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('krc_avatar_updated', handleAvatarUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  const getSenderAvatar = (uid, fallback) => {
    if (!uid) return fallback || '';
    const cleanUid = String(uid).toLowerCase();
    if (liveAvatarMap[cleanUid] !== undefined) return liveAvatarMap[cleanUid];
    if (liveAvatarMap[uid] !== undefined) return liveAvatarMap[uid];
    const cached = localStorage.getItem(`krc_student_avatar_${uid}`) || localStorage.getItem(`krc_student_avatar_${cleanUid}`);
    if (cached) return cached;
    return fallback || '';
  };
  
  const fileInputRef = useRef(null);
  const currentUid = currentStudent?.uid || currentStudent?.prn;
  const { viewportRef: messageScrollAreaRef, prepareUpdate, scrollToBottom, onScroll: trackMessageScroll,
    onMediaLoad, hasNewMessages } = useChatScroll(messages, `${currentUid}:${chat?.id}`);
  useEffect(() => {
    setExportingHistory(false);
    return () => exportController.current?.abort();
  }, [chat?.id, currentUid]);
  const isFavorite = workspace.favorite === true;
  const visibleMessages = messagesAfterHiddenHistory(messages, workspace.hiddenBefore, workspace.hiddenMessages);
  useEffect(() => {
    setWorkspace({});
    return chatWorkspacePreferences.subscribe(currentUid, chat?.id, (value, error) => {
      if (value) setWorkspace(value);
      if (error) setErrorNotice(error);
    });
  }, [currentUid, chat?.id]);
  const saveWorkspace = async change => {
    if (savingWorkspace) return false;
    setSavingWorkspace(true);
    try { await chatWorkspacePreferences.change(currentUid, chat.id, change); return true; }
    catch (error) { setErrorNotice(error.message || 'Could not save your chat preferences.'); return false; }
    finally { setSavingWorkspace(false); }
  };
  const toggleStar = message => saveWorkspace(previous => {
    const stars = { ...(previous.stars || {}) };
    if (stars[message.id]) delete stars[message.id];
    else stars[message.id] = Object.fromEntries(Object.entries(message).filter(([key, value]) =>
      ['id', 'from', 'fromName', 'text', 'type', 'src', 'mediaUrl', 'timestamp'].includes(key) && value !== undefined));
    return { ...previous, stars };
  });
  useEffect(() => chatNotificationPreferences.subscribe(currentUid, () => {
    const policy = chatNotificationPreferences.getChannel(currentUid, chat?.id);
    setMutedDuration(policy.until && policy.until <= Date.now() ? 'all' : policy.mode);
  }), [currentUid, chat?.id, showNotificationSettingsModal]);

  // Determine if this is a channel or a 1-on-1 direct message
  const isChannel = chat?.isChannel || chat?.id?.startsWith('channel_') || chat?.category === 'Study Group' || chat?.category === 'Study Channel' || Boolean(chat?.slug);
  const [directoryPool, setDirectoryPool] = useState([]);
  
  // Resolve other student details if DM
  const { uid: otherUid, details: otherDetails } = useMemo(() => resolveConversationPeer(chat, currentStudent, directoryPool), [chat, currentStudent, directoryPool]);

  // Helper to determine if a member object represents the currently logged in student
  const isSelf = useCallback(member => {
    if (!member) return false;
    const mine = new Set(studentIdentityKeys(currentStudent));
    const uid = member.uid || member.authUid;
    if (uid) return mine.has(String(uid).trim().toLowerCase());
    return studentIdentityKeys(member).some(id => mine.has(id));
  }, [currentStudent]);

  const initialMembers = isChannel
    ? activeChannelMembers(chat)
    : [
        { 
          uid: currentUid,
          name: currentStudent?.displayName || currentStudent?.name || 'You', 
          prn: currentStudent?.prn || 'PRN-Student', 
          dept: currentStudent?.dept || 'CSE', 
          status: 'online', 
          verified: true 
        },
        { 
          uid: otherUid,
          name: otherDetails.name, 
          prn: otherDetails.prn, 
          dept: otherDetails.dept || 'CSE', 
          status: otherDetails.status || 'online', 
          verified: true 
        }
      ];

  const [channelMembers, setChannelMembers] = useState(initialMembers);
  const [liveChannel, setLiveChannel] = useState(chat);
  const [channelAuditLog, setChannelAuditLog] = useState(chat?.auditLog || []);

  // Member pickers use the same live enrollment source as search, including empty snapshots.
  useEffect(() => studentSearchService.subscribeStudents(pool => {
    setDirectoryPool(Array.isArray(pool) ? pool : []);
  }, true), []);

  // Synchronize channelMembers whenever active chat changes
  useEffect(() => {
    if (!chat) return;
    if (isChannel) {
      return;
    } else {
      setChannelMembers([
        { 
          uid: currentUid,
          name: currentStudent?.displayName || currentStudent?.name || 'You', 
          prn: currentStudent?.prn || 'PRN-Student', 
          dept: currentStudent?.dept || 'CSE', 
          status: 'online', 
          verified: true 
        },
        { 
          uid: otherUid,
          name: otherDetails.name, 
          prn: otherDetails.prn, 
          dept: otherDetails.dept || 'CSE', 
          status: otherDetails.status || 'online', 
          verified: true 
        }
      ]);
    }
  }, [chat?.id, isChannel, currentUid, currentStudent, otherUid, otherDetails]);

  useEffect(() => {
    if (!isChannel) return;
    setLiveChannel(chat);
    setChannelMembers(activeChannelMembers(chat));
    setChannelAuditLog(chat.auditLog || []);
  }, [chat?.id, isChannel]);

  // Real-time listener for community channel document updates (members, auditLog, topic, description)
  useEffect(() => {
    if (!isChannel || !chat?.id) return;

    const chanDocRef = doc(db, 'student_channels', chat.id);
    const unsubscribe = onSnapshot(chanDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setLiveChannel({ id: snap.id, ...data });
        if (Array.isArray(data.members)) {
          setChannelMembers(activeChannelMembers(data));
        }
        if (Array.isArray(data.auditLog)) {
          setChannelAuditLog(data.auditLog);
        }
      }
    }, (err) => {
      console.warn('[Chat] Channel real-time listener notice:', err.message);
    });

    return () => unsubscribe();
  }, [chat?.id, chat?.conversationKey, isChannel, currentUid]);

  // Channel authority is tied to the authenticated UID, never a display name or a missing field.
  const isMemberCreator = useCallback(member => !!member?.uid && member.uid === channelCreatorUid(liveChannel), [liveChannel]);
  const isCurrentStudentAdmin = isChannel && canManageChannel(liveChannel, currentUid);
  const hasChannelAccess = !isChannel || (!(liveChannel?.bannedMembers || []).includes(currentUid) &&
    (channelCreatorUid(liveChannel) === currentUid || (liveChannel.memberUids || channelMembers.map(member => member.uid)).includes(currentUid)));

  const isChannelAdmin = isCurrentStudentAdmin;

  useEffect(() => {
    if (!chat?.id) return;
    let active = true;
    setMessages([]);
    setLoading(true);
    setErrorNotice('');
    setHistoryStatus({ hasMore: false, loadingOlder: false });
    if (isChannel && !hasChannelAccess) {
      setLoading(false);
      return;
    }
    const receive = (incoming, status = {}) => {
      if (!active) return;
      prepareUpdate();
      setMessages(incoming || []);
      setHistoryStatus(status);
      setLoading(false);
    };
    const unsubscribe = isChannel
      ? studentChatService.subscribeToChannelMessages(chat.id, receive, 60, currentUid)
      : studentChatService.subscribeToMessages(chat.id, chat.conversationKey, receive);
    historySubscription.current = unsubscribe;
    const handleUserNameChanged = event => {
      const { uid, newName } = event.detail || {};
      if (uid && newName) {
        prepareUpdate();
        setMessages(previous => previous.map(message => message.from === uid ? { ...message, fromName: newName } : message));
      }
    };
    window.addEventListener('krc_user_name_changed', handleUserNameChanged);
    return () => {
      active = false;
      unsubscribe?.();
      if (historySubscription.current === unsubscribe) historySubscription.current = null;
      window.removeEventListener('krc_user_name_changed', handleUserNameChanged);
    };
  }, [chat?.id, chat?.conversationKey, currentUid, isChannel, hasChannelAccess, prepareUpdate]);

  const loadOlderMessages = () => {
    setErrorNotice('');
    historySubscription.current?.loadOlder?.();
  };

  // Mobile scroll listener: hides header when scrolling down, restores when scrolling up
  const handleScrollMessages = (e) => {
    trackMessageScroll(e);
    const currentScroll = e.target.scrollTop;
    if (window.innerWidth < 640) {
      if (currentScroll <= 15) {
        setIsHeaderHidden(false);
      } else if (userInteractingRef.current) {
        if (currentScroll > lastScrollTopRef.current + 15 && currentScroll > 60) {
          setIsHeaderHidden(true);
        } else if (currentScroll < lastScrollTopRef.current - 10) {
          setIsHeaderHidden(false);
        }
      }
    }
    lastScrollTopRef.current = currentScroll;
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!text.trim() || sending) return;
    if (!hasChannelAccess) { setErrorNotice('Your channel membership no longer permits sending.'); return; }
    const draft = text;
    const messageContent = draft.trim();
    setSending(true);
    setErrorNotice('');
    try {
      await studentChatService.sendMessage(chat.id, currentUid, {
        text: messageContent,
        type: 'text',
        conversationKey: chat.conversationKey,
        isChannel,
        senderDetails: currentStudent
      });
      setText(current => current === draft ? '' : current);
      soundEffects.playThonk();
      scrollToBottom();
    } catch (err) {
      setErrorNotice(err.message || 'Failed to send message. Your draft has been kept.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSendGif = async (gifUrl) => {
    if (!gifUrl || sending) return;
    setSending(true);
    setErrorNotice('');
    try {
      await studentChatService.sendMessage(chat.id, currentUid, {
        type: 'gif', src: gifUrl, conversationKey: chat.conversationKey,
        isChannel, senderDetails: currentStudent
      });
      soundEffects.playPop();
      setShowGifPicker(false);
      scrollToBottom();
    } catch (err) {
      setErrorNotice(err.message || 'The GIF could not be sent. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate that the file is an image
    if (file.type && !file.type.startsWith('image/')) {
      setErrorNotice('Please select a valid image file (PNG, JPG, WEBP, GIF).');
      setTimeout(() => setErrorNotice(''), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadingPhoto(true);
    soundEffects.playClick();

    try {
      const uploadResult = await cloudStorageService.uploadStudentPhoto(file, currentUid, chat?.id);
      const photoUrl = uploadResult?.url || uploadResult?.publicUrl || uploadResult?.s3Url;

      if (!photoUrl) {
        throw new Error('The uploaded photo is unavailable. Please try again.');
      }

      await studentChatService.sendMessage(chat.id, currentUid, {
        type: 'image', src: photoUrl, mediaUrl: photoUrl,
        fileName: file.name, fileSize: file.size,
        conversationKey: chat.conversationKey, isChannel, senderDetails: currentStudent
      });

      soundEffects.playThonk();
      scrollToBottom();
    } catch (err) {
      console.error('[Chat] Photo upload failed:', err);
      setErrorNotice(err.message || 'Could not upload the photo. Please try again.');
      setTimeout(() => setErrorNotice(''), 4000);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Admin: Generate Expiring Encrypted Invite Link
  const handleGenerateInvite = async () => {
    soundEffects.playThonk();
    try {
      const invite = await studentChatService.generateChannelInviteToken({
        channelId: chat.id,
        channelName: chat.name || `#${chat.slug}`,
        createdBy: currentUid,
        durationHours: inviteDurationHours
      });
      setGeneratedInvite(invite);
    } catch (err) {
      showCampusAlert({
        title: 'Invite Error',
        message: err.message || 'Could not create an invitation link.',
        type: 'error'
      });
    }
  };

  const handleCopyInviteLink = async () => {
    if (!generatedInvite?.inviteUrl) return;
    soundEffects.playPop();
    try {
      await navigator.clipboard.writeText(generatedInvite.inviteUrl);
      setCopiedLink(true);
      clearTimeout(inviteCopyTimer.current);
      inviteCopyTimer.current = setTimeout(() => setCopiedLink(false), 2500);
    } catch { setErrorNotice('Could not copy the invitation. Select the link and copy it manually.'); }
  };

  // Admin: Add Members from Directory
  const handleAddSelectedMembers = async () => {
    if (selectedDirectoryStudents.length === 0) return;
    soundEffects.playThonk();
    setAddingMembers(true);

    try {
      const updated = await studentChatService.addChannelMembers(
        chat.id, 
        selectedDirectoryStudents, 
        currentStudent
      );
      if (updated) {
        setChannelMembers(updated);
      }
      setShowAddMembersModal(false);
      setSelectedDirectoryStudents([]);
      showCampusAlert({
        title: 'Members Added',
        message: `Successfully added ${selectedDirectoryStudents.length} members to #${chat.slug || chat.name}!`,
        type: 'success'
      });
    } catch (err) {
      showCampusAlert({
        title: 'Add Members Notice',
        message: err.message || 'Failed to add members.',
        type: 'error'
      });
    } finally {
      setAddingMembers(false);
    }
  };

  // Member Management Action Handlers
  const handleOpenMemberActions = (member) => {
    setSelectedMemberForAction(member);
    setShowMemberActionModal(true);
  };

  const handlePromoteAdmin = async (member) => {
    if (!member || !chat?.id) return;
    setMemberActionLoading(true);
    try {
      await studentChatService.promoteChannelMemberToAdmin(chat.id, member, currentStudent);
      soundEffects.playPop();
      setShowMemberActionModal(false);
      setSelectedMemberForAction(null);
      showCampusAlert({
        title: 'Admin Role Assigned',
        message: `${member.name} has been promoted to Channel Admin.`,
        type: 'success'
      });
    } catch (err) {
      soundEffects.playThonk();
      showCampusAlert({
        title: 'Action Failed',
        message: err.message || 'Failed to promote member.',
        type: 'error'
      });
    } finally {
      setMemberActionLoading(false);
    }
  };

  const handleDemoteAdmin = async (member) => {
    if (!member || !chat?.id) return;
    // Check if target is creator
    if (isMemberCreator(member)) {
      setShowMemberActionModal(false);
      soundEffects.playThonk();
      showCampusAlert({
        title: 'Permanent Admin Protection',
        message: 'Action Prohibited: The channel creator owns this channel and cannot be removed or demoted from the admin role.',
        type: 'error',
        confirmText: 'Understood'
      });
      return;
    }

    setMemberActionLoading(true);
    try {
      await studentChatService.demoteChannelAdmin(chat.id, member, currentStudent);
      soundEffects.playPop();
      setShowMemberActionModal(false);
      setSelectedMemberForAction(null);
      showCampusAlert({
        title: 'Admin Role Removed',
        message: `${member.name} is no longer a Channel Admin.`,
        type: 'info'
      });
    } catch (err) {
      soundEffects.playThonk();
      showCampusAlert({
        title: 'Action Failed',
        message: err.message || 'Failed to demote admin.',
        type: 'error'
      });
    } finally {
      setMemberActionLoading(false);
    }
  };

  const handleConfirmKick = async () => {
    if (!selectedMemberForAction || !chat?.id) return;
    if (isMemberCreator(selectedMemberForAction)) {
      setShowKickConfirm(false);
      soundEffects.playThonk();
      showCampusAlert({
        title: 'Permanent Admin Protection',
        message: 'Action Prohibited: The channel creator owns this channel and cannot be removed, demoted, or kicked by other admins.',
        type: 'error',
        confirmText: 'Understood'
      });
      return;
    }

    setMemberActionLoading(true);
    try {
      await studentChatService.kickChannelMember(chat.id, selectedMemberForAction, currentStudent);
      soundEffects.playPop();
      setShowKickConfirm(false);
      showCampusAlert({
        title: 'Member Kicked',
        message: `${selectedMemberForAction.name} has been removed from this channel.`,
        type: 'info'
      });
      setSelectedMemberForAction(null);
    } catch (err) {
      soundEffects.playThonk();
      showCampusAlert({
        title: 'Kick Failed',
        message: err.message || 'Unable to kick member.',
        type: 'error'
      });
    } finally {
      setMemberActionLoading(false);
    }
  };

  const handleConfirmBan = async () => {
    if (!selectedMemberForAction || !chat?.id) return;
    if (isMemberCreator(selectedMemberForAction)) {
      setShowBanConfirm(false);
      soundEffects.playThonk();
      showCampusAlert({
        title: 'Permanent Admin Protection',
        message: 'Action Prohibited: The channel creator owns this channel and cannot be removed, demoted, kicked, or banned by other admins.',
        type: 'error',
        confirmText: 'Understood'
      });
      return;
    }

    setMemberActionLoading(true);
    try {
      await studentChatService.banChannelMember(
        chat.id, 
        selectedMemberForAction, 
        currentStudent, 
        banReasonText || 'Permanently banned by channel admin'
      );
      soundEffects.playPop();
      setShowBanConfirm(false);
      showCampusAlert({
        title: 'Member Permanently Banned',
        message: `${selectedMemberForAction.name} has been banned and removed from this channel.`,
        type: 'info'
      });
      setSelectedMemberForAction(null);
    } catch (err) {
      soundEffects.playThonk();
      showCampusAlert({
        title: 'Ban Failed',
        message: err.message || 'Unable to ban member.',
        type: 'error'
      });
    } finally {
      setMemberActionLoading(false);
    }
  };

  // Filter campus directory for "Add Members" (excludes students already in this channel)
  const filteredDirectoryPool = useMemo(() => {
    const existingIds = new Set(
      (channelMembers || []).flatMap(m => [m.uid, m.prn, m.id, m.email].filter(Boolean).map(x => String(x).toLowerCase().trim()))
    );

    return (directoryPool || []).filter(s => {
      if (!s) return false;
      const sIds = [s.uid, s.prn, s.id, s.email].filter(Boolean).map(x => String(x).toLowerCase().trim());
      const isAlreadyMember = sIds.some(id => existingIds.has(id));
      if (isAlreadyMember) return false;

      const q = String(directorySearch || '').toLowerCase().trim();
      if (!q) return true;
      return (
        String(s.name || '').toLowerCase().includes(q) ||
        String(s.prn || '').toLowerCase().includes(q) ||
        String(s.dept || '').toLowerCase().includes(q) ||
        String(s.email || '').toLowerCase().includes(q)
      );
    });
  }, [directoryPool, channelMembers, directorySearch]);

  // WhatsApp Features Handlers & Calculations
  const formatCreatedDate = () => {
    if (chat?.createdAt) {
      try {
        const d = new Date(chat.createdAt);
        return {
          date: `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`,
          time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        };
      } catch (e) {}
    }
    const d = new Date();
    return {
      date: `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`,
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    };
  };
  const creationInfo = formatCreatedDate();

  // Dynamic Real-Time Member Changes Audit Log (latest first)
  const displayAuditLogs = useMemo(() => {
    if (Array.isArray(channelAuditLog) && channelAuditLog.length > 0) {
      return [...channelAuditLog].filter(entry => entry.type !== 'key_gen').sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }
    const creatorName = chat.createdByName || currentStudent?.displayName || currentStudent?.name || 'Administrator';
    return [
      {
        id: 'audit_create',
        title: `Channel created by ${creatorName}`,
        time: `${creationInfo.date} ${creationInfo.time}`,
        type: 'create',
        timestamp: chat.createdAt || Date.now()
      }
    ];
  }, [channelAuditLog, chat.createdByName, chat.createdAt, creationInfo, currentStudent]);

  // Media Previews for the Media Strip (Starts 100% empty - no dummy records)
  const chatMedia = useMemo(() => {
    return visibleMessages.filter(m => (m.type === 'image' || m.type === 'gif' || m.mediaUrl || m.src) && !m.isSystem && !m.deletedForEveryone);
  }, [visibleMessages]);
  const mediaPreviews = useMemo(() => chatMedia.slice(0, 4), [chatMedia]);
  useEffect(() => {
    if (previewPhotoUrl && !chatMedia.some(message => (message.src || message.mediaUrl) === previewPhotoUrl)) setPreviewPhotoUrl(null);
  }, [chatMedia, previewPhotoUrl]);

  // Deduplicate members list by unique key (uid / prn / name)
  const deduplicatedMembers = useMemo(() => {
    const seen = new Set();
    const result = [];
    (channelMembers || []).forEach(m => {
      if (!m) return;
      const key = String(m.uid || m.prn || m.name || '').trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        const enrolled = directoryPool.find(student => student.uid === m.uid);
        result.push(enrolled ? { ...m, name: enrolled.name || enrolled.fullName || enrolled.displayName || m.name } : m);
      }
    });
    return result;
  }, [channelMembers, directoryPool]);

  // Filtered other members (excluding current logged in student who is shown under 'You')
  const filteredOtherMembers = useMemo(() => {
    return deduplicatedMembers.filter(m => {
      if (!m || isSelf(m)) return false;
      const q = String(memberSearchQuery || '').toLowerCase().trim();
      if (!q) return true;
      return (
        String(m.name || '').toLowerCase().includes(q) ||
        String(m.prn || '').toLowerCase().includes(q) ||
        String(m.bio || '').toLowerCase().includes(q) ||
        String(m.dept || '').toLowerCase().includes(q)
      );
    });
  }, [deduplicatedMembers, isSelf, memberSearchQuery]);

  // Total unique member count in the channel
  const totalMemberCount = useMemo(() => {
    return deduplicatedMembers.length;
  }, [deduplicatedMembers.length]);

  const handleExportChat = async () => {
    if (exportingHistory) return;
    const controller = new AbortController();
    exportController.current = controller;
    setExportingHistory(true);
    setErrorNotice('');
    try {
      const history = await studentChatService.getMessageHistory(chat.id, {
        isChannel, conversationKey: chat.conversationKey, signal: controller.signal
      });
      if (controller.signal.aborted) return;
      const chatTitle = chat.name || chat.slug || otherDetails.name || 'campus_chat';
      const lines = [
        'KRC Campus Messenger — Chat export',
        `Conversation: ${chatTitle}`,
        `Exported: ${new Date().toLocaleString()}`,
        'Saved messages available when export started. Messages hidden for your account are excluded.',
        ''
      ];
      messagesAfterHiddenHistory(history, workspace.hiddenBefore, workspace.hiddenMessages).forEach(message => {
        const time = new Date(messageTime(message.timestamp)).toLocaleString();
        const sender = directoryPool.find(student => student.uid === message.from)?.name || message.fromName || (message.from === currentUid ? currentStudent?.name || 'You' : 'Member');
        const content = message.deletedForEveryone ? '[Message deleted]' : message.text || (message.type === 'image' ? `[Photo: ${message.fileName || 'image'}]` : message.type === 'gif' ? `[GIF: ${message.src}]` : '[Attachment]');
        lines.push(`[${time}] ${sender}: ${content}`);
      });
      const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Campus_Chat_${chatTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      soundEffects.playPop();
      showCampusAlert({ title: 'Chat Export Complete', message: `Saved chat history exported to ${link.download}`, type: 'success' });
    } catch (error) {
      if (!controller.signal.aborted) setErrorNotice(error.message || 'Chat history could not be exported. Check your connection and try again.');
    } finally {
      if (exportController.current === controller) setExportingHistory(false);
    }
  };

  const handleClearChat = async () => {
    if (await saveWorkspace(previous => ({ ...previous, hiddenBefore: Date.now() }))) setShowClearChatConfirm(false);
  };

  const handleExitGroup = async () => {
    const finish = beginChatAction({ close: true });
    try {
      await studentChatService.leaveChannel(chat.id, currentStudent);
      setShowExitGroupConfirm(false);
      setShowGroupSettings(false);
      finish(() => onBack?.(chat.id));
    } catch (error) {
      setShowExitGroupConfirm(false);
      setErrorNotice(error.message || 'Could not leave this channel. Please try again.');
    }
  };

  const handleReportGroup = async reason => {
    if (reportingChannel) return;
    setReportingChannel(true);
    try {
      const reference = await studentChatService.reportChannel(chat.id, currentStudent, reason);
      setShowReportGroupModal(false);
      showCampusAlert({ title: 'Report saved', message: `Your report is saved in your account and accessible to campus administrators. Reference: ${reference}`, type: 'success' });
    } catch (error) { setErrorNotice(error.message || 'Your report could not be saved.'); }
    finally { setReportingChannel(false); }
  };

  const handleToggleFavourite = () => saveWorkspace(previous => ({ ...previous, favorite: !previous.favorite }));

  const handleSaveMemberTag = (tag) => {
    soundEffects.playClick();
    setUserMemberTag(tag);
    localStorage.setItem(`krc_tag_${chat.id}_${currentStudent?.uid || currentStudent?.prn}`, tag);
    setShowMemberTagModal(false);
    showCampusAlert({
      title: 'Member Tag Updated',
      message: `Your tag set to "${tag}".`,
      type: 'success'
    });
  };

  const handleSaveDescription = async (desc) => {
    if (savingDescription) return;
    setSavingDescription(true);
    try {
      const channel = await studentChatService.mutateChannel(chat.id, currentStudent, () => ({ description: desc.trim().slice(0, 200) }));
      setLiveChannel(channel);
      setShowEditDescriptionModal(false);
    } catch (error) {
      showCampusAlert({ title: 'Could not save description', message: error.message, type: 'error' });
    } finally { setSavingDescription(false); }
  };

  const openDescriptionEditor = () => {
    if (!isChannelAdmin) return;
    setNewDescriptionText(liveChannel?.description || '');
    setShowEditDescriptionModal(true);
  };

  const handleCreateSimilarGroup = () => {
    setSimilarName(`${liveChannel.name || chat.name} (copy)`);
    setShowSimilarModal(true);
  };

  const createSimilarChannel = async event => {
    event.preventDefault();
    if (creatingSimilar || !similarName.trim()) return;
    setCreatingSimilar(true);
    const finish = beginChatAction();
    let created;
    try {
      created = await studentChatService.createChannel({ name: similarName.trim(), topic: liveChannel.topic,
        category: liveChannel.category, description: liveChannel.description || '', student: currentStudent });
      const others = deduplicatedMembers.filter(member => member.uid !== currentUid);
      if (others.length) await studentChatService.addChannelMembers(created.id, others, currentStudent);
      setShowSimilarModal(false);
      finish(() => { if (onSelectChat) onSelectChat(created); else onBack?.(chat.id); });
    } catch (error) {
      if (created) {
        setShowSimilarModal(false);
        showCampusAlert({ title: 'Channel created; member setup incomplete', message: `The new channel was saved, but members could not be added: ${error.message}. Open it from Messages to finish adding members.`, type: 'warning' });
      } else setErrorNotice(error.message || 'Could not create this channel.');
    } finally { setCreatingSimilar(false); }
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden relative dark:bg-[#0b0f17] bg-[#f0f2f5] transition-colors duration-150">
      {/* ========================================================================= */}
      {/* MAIN CHAT STAGE */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Bar with Mobile Auto-Collapsing & WhatsApp Web Group Trigger */}
        <div 
          className={`px-4 py-3 border-b dark:border-slate-800 border-slate-200 dark:bg-slate-950/90 bg-white/95 backdrop-blur-md flex items-center justify-between shrink-0 shadow-sm transition-all duration-200 z-10 ${
            isHeaderHidden 
              ? '-translate-y-full opacity-0 pointer-events-none max-h-0 py-0 border-none' 
              : 'translate-y-0 opacity-100 max-h-20'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="p-1 -ml-1 rounded dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800 hover:bg-slate-100 transition-colors md:hidden cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Clickable Header: In Channels, clicks open WhatsApp Web Group Settings */}
            <div 
              onClick={() => {
                if (isChannel) {
                  soundEffects.playThonk();
                  setShowGroupSettings(true);
                }
              }}
              className={`flex items-center gap-2.5 min-w-0 ${isChannel ? 'cursor-pointer group p-1 -m-1 rounded-lg dark:hover:bg-slate-800/60 hover:bg-slate-100 transition' : ''}`}
              title={isChannel ? 'Click to open WhatsApp Web channel settings & manage members' : ''}
            >
              <div className="w-8 h-8 rounded-full dark:bg-slate-800 bg-slate-100 border dark:border-slate-700 border-slate-300 flex items-center justify-center shrink-0 dark:text-slate-300 text-slate-700 font-bold text-xs group-hover:border-indigo-400 transition overflow-hidden">
                {isChannel ? (
                  <Hash className="w-4 h-4 text-indigo-400" />
                ) : (
                  <DefaultAvatar 
                    src={getSenderAvatar(otherUid, otherDetails.avatar)} 
                    user={{ ...otherDetails, uid: otherUid }} 
                    userId={otherUid}
                    name={otherDetails.name} 
                    className="w-full h-full object-cover" 
                  />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold dark:text-white text-slate-900 truncate group-hover:text-indigo-400 transition-colors">
                    {isChannel ? (chat.name || `#${chat.slug}`) : otherDetails.name}
                  </h3>
                  {isChannel && (
                    <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                      {totalMemberCount} {totalMemberCount === 1 ? 'member' : 'members'}
                    </span>
                  )}
                </div>
                {chat.topic && (
                  <p className="text-[11px] dark:text-slate-400 text-slate-500 truncate max-w-xs sm:max-w-md hidden sm:block">
                    {chat.topic}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Center / Right Header Badges & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick In-Chat Theme Toggle */}
            <button
              type="button"
              onClick={(e) => {
                soundEffects.playClick();
                toggleTheme(e);
              }}
              className="p-1.5 rounded-lg border dark:border-slate-800 border-slate-300 dark:bg-slate-900/80 bg-slate-100 dark:text-slate-300 text-slate-700 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800 hover:bg-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
              title={`Switch to ${darkMode ? 'Light' : 'Dark'} mode`}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-500" />}
            </button>

            {/* WhatsApp Web Settings Drawer Button */}
            {isChannel ? (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playThonk();
                  setShowGroupSettings(true);
                }}
                className="px-2.5 py-1 rounded-lg dark:bg-indigo-600/20 bg-indigo-50 dark:hover:bg-indigo-600/30 hover:bg-indigo-100 dark:text-indigo-300 text-indigo-700 dark:hover:text-white border dark:border-indigo-500/30 border-indigo-200 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
                title="Open WhatsApp Web Channel Settings"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Channel Info</span>
              </button>
            ) : null}

            {!isChannel && <button type="button" title="Close direct message" className="p-1.5 rounded border border-border text-muted hover:text-text" onClick={async () => {
              const finish = beginChatAction({ close: true });
              try {
                await studentChatService.closeConversation(currentUid, chat.id);
                finish(() => onBack?.(chat.id));
              } catch (error) { setErrorNotice(error.message); }
            }}><X className="w-4 h-4" /></button>}

            {/* Gold E2EE Encrypted Chip */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg dark:bg-amber-500/10 bg-amber-50 dark:text-amber-300 text-amber-800 border dark:border-amber-500/30 border-amber-200 text-[11px] font-semibold">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">{isChannel ? 'Campus channel' : 'Encrypted text'}</span>
            </div>

            {/* Toggle User List Rail Button (Desktop) */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setShowUserList(!showUserList);
              }}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer hidden lg:flex items-center ${
                showUserList
                  ? 'dark:bg-slate-800 bg-slate-200 dark:border-slate-700 border-slate-300 dark:text-white text-slate-900'
                  : 'dark:bg-slate-950 bg-white dark:border-slate-800 border-slate-200 dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800 hover:bg-slate-100'
              }`}
              title="Toggle directory"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {(errorNotice || historyStatus.error) && (
          <div className="px-4 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorNotice || historyStatus.error}</span>
          </div>
        )}

        {workspace.hiddenBefore > 0 && (
          <div className="flex items-center justify-between px-4 py-2 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-300">
            <span>Earlier messages are hidden for your account.</span>
            <button type="button" disabled={savingWorkspace} onClick={() => saveWorkspace(previous => ({ ...previous, hiddenBefore: 0 }))}
              className="underline">Restore history</button>
          </div>
        )}
        {Object.values(workspace.hiddenMessages || {}).some(value => value === true) && (
          <div className="flex items-center justify-between px-4 py-2 text-xs bg-slate-500/10 dark:text-slate-300 text-slate-600">
            <span>Some messages are deleted only for you.</span>
            <button type="button" disabled={savingWorkspace} onClick={() => saveWorkspace(previous => ({ ...previous, hiddenMessages: {} }))} className="underline">Restore messages hidden for me</button>
          </div>
        )}
        {/* Message Thread Scroll Area with Mobile Auto-Collapsing Detection */}
        <div 
          ref={messageScrollAreaRef}
          onScroll={handleScrollMessages}
          onLoadCapture={onMediaLoad}
          aria-label="Chat message history"
          role="region"
          onTouchStart={() => { userInteractingRef.current = true; }}
          onTouchMove={() => { userInteractingRef.current = true; }}
          onWheel={() => { userInteractingRef.current = true; }}
          className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar transition-colors duration-150 ${
            chatTheme === 'midnight' 
              ? 'dark:bg-[#020617] bg-slate-900' 
              : chatTheme === 'emerald' 
              ? 'dark:bg-[#064e3b]/30 bg-emerald-50' 
              : chatTheme === 'slate' 
              ? 'dark:bg-[#0f172a] bg-slate-100' 
              : 'dark:bg-[#0b141a] bg-[#efeae2]'
          }`}
        >
          {!loading && historyStatus.hasMore && (
            <div className="flex justify-center">
              <button type="button" onClick={loadOlderMessages} disabled={historyStatus.loadingOlder}
                className="px-4 py-2 rounded-full text-xs font-semibold dark:bg-slate-800 bg-white dark:text-slate-200 text-slate-700 border dark:border-slate-700 border-slate-300 disabled:opacity-50">
                {historyStatus.loadingOlder ? 'Loading older messages…' : 'Load older messages'}
              </button>
            </div>
          )}
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 dark:text-slate-400 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              <span className="text-xs">Decrypting campus messages...</span>
            </div>
          ) : visibleMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center dark:text-slate-400 text-slate-500 gap-2">
              <div className="p-3 rounded-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 shadow-sm">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-xs font-bold dark:text-white text-slate-900">Private Campus Workspace</p>
              <p className="text-[11px] dark:text-slate-400 text-slate-600 max-w-sm leading-relaxed">
                {isChannel ? 'Channel messages are stored in the campus message database.' : 'Direct text messages are encrypted before saving. Conversation keys are stored with the chat data.'}
              </p>
            </div>
          ) : (
            visibleMessages.map((msg) => {
              const isSender = msg.from === currentUid;
              const senderName = directoryPool.find(student => student.uid === msg.from)?.name || msg.fromName || (isSender ? currentStudent?.name || 'You' : otherDetails.name);
              const formattedTime = msg.timestamp 
                ? (typeof msg.timestamp === 'string' 
                    ? msg.timestamp 
                    : new Date(messageTime(msg.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
                : 'Now';

              return (
                <div 
                  key={msg.id}
                  data-message-id={msg.id}
                  className={`w-full flex ${isSender ? 'justify-end' : 'justify-start items-start gap-2.5'} group mb-2 transition-all`}
                >
                  {/* Received message avatar */}
                  {!isSender && (
                    <div 
                      onClick={() => onOpenProfile({ name: senderName, uid: msg.from, prn: msg.fromPrn, avatar: getSenderAvatar(msg.from, msg.avatar) })}
                      className="w-7 h-7 rounded-full overflow-hidden dark:bg-slate-800 bg-slate-200 border dark:border-slate-700 border-slate-300 shrink-0 mt-0.5 cursor-pointer hover:border-indigo-400 transition-colors"
                      title={`View profile of ${senderName}`}
                    >
                      <DefaultAvatar 
                        src={getSenderAvatar(msg.from, msg.avatar)} 
                        user={{ uid: msg.from, prn: msg.fromPrn, name: senderName }} 
                        userId={msg.from}
                        name={senderName} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  )}

                  {/* Dynamic Hugging Message Bubble */}
                  <div 
                    className={`w-fit max-w-[85%] sm:max-w-[72%] rounded-2xl px-3.5 py-2 shadow-xs transition-colors duration-150 relative text-left break-words ${
                      isSender
                        ? 'dark:bg-[#005c4b] bg-[#d9fdd3] dark:text-white text-slate-900 rounded-tr-xs border dark:border-transparent border-emerald-200/50 shadow-xs'
                        : 'dark:bg-[#202c33] bg-white dark:text-slate-100 text-slate-900 rounded-tl-xs border dark:border-slate-700/60 border-slate-200/90 shadow-xs'
                    }`}
                  >
                    {/* Channel Sender Header (Only for received group messages) */}
                    {!isSender && isChannel && (
                      <div className="flex items-center gap-1.5 mb-1 select-none">
                        <span 
                          onClick={() => onOpenProfile({ name: senderName, uid: msg.from, prn: msg.fromPrn, avatar: getSenderAvatar(msg.from, msg.avatar) })}
                          className="text-[11px] font-bold text-emerald-500 hover:underline cursor-pointer"
                        >
                          {senderName}
                        </span>
                        <span className="w-3 h-3 rounded-full bg-blue-600 text-white flex items-center justify-center text-[7px] font-black" title="Verified In-Campus Student">
                          ✓
                        </span>
                      </div>
                    )}

                    {/* Text Message with 15-line packaging */}
                    {msg.deletedForEveryone && <p className="text-sm italic opacity-75">This message was deleted</p>}
                    {!msg.deletedForEveryone && msg.type === 'text' && (
                      <MessageChunkBubble
                        text={msg.text}
                        isSender={isSender}
                      />
                    )}

                    {/* Image / Photo Attachment Render */}
                    {!msg.deletedForEveryone && msg.type === 'image' && (msg.src || msg.mediaUrl) && (
                      <div className={`rounded-lg overflow-hidden my-1 max-w-sm border p-1 group/img relative ${
                        isSender ? 'dark:border-emerald-600/40 border-emerald-300 bg-black/10' : 'dark:border-slate-700/80 border-slate-200 bg-slate-100/60'
                      }`}>
                        <img
                          src={msg.src || msg.mediaUrl}
                          alt={msg.fileName || 'Chat photo attachment'}
                          className="w-full h-auto max-h-72 rounded-md object-cover cursor-pointer hover:opacity-95 transition-opacity"
                          loading="lazy"
                          onClick={() => setPreviewPhotoUrl(msg.src || msg.mediaUrl)}
                        />
                        <div className={`px-1.5 py-1 flex items-center justify-between text-[10px] ${
                          isSender ? 'dark:text-emerald-200/80 text-emerald-800' : 'dark:text-slate-400 text-slate-500'
                        }`}>
                          <span className="truncate max-w-[180px] font-mono">{msg.fileName || 'photo.jpg'}</span>
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoUrl(msg.src || msg.mediaUrl)}
                            className={`${isSender ? 'dark:text-white text-emerald-900 hover:underline' : 'dark:text-slate-300 text-slate-700 hover:text-black'} flex items-center gap-1 cursor-pointer font-medium`}
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>Expand</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* GIF Render */}
                    {!msg.deletedForEveryone && msg.type === 'gif' && msg.src && (
                      <div className="rounded-lg overflow-hidden my-1 max-w-sm">
                        <img
                          src={msg.src}
                          alt="Klipy GIF"
                          className="w-full h-auto rounded-lg object-contain"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Dynamic Timestamp & Delivery Status */}
                    <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-mono select-none ${
                      isSender ? 'dark:text-emerald-200/80 text-emerald-800' : 'dark:text-slate-400 text-slate-500'
                    }`}>
                      <MessageDeleteAction
                        canDeleteForEveryone={canDeleteMessageForEveryone({ uid: currentUid, message: msg, thread: isChannel ? liveChannel : chat, isChannel })}
                        onDeleteForEveryone={() => messageDeletionRepository.removeForEveryone({ chatId: chat.id, messageId: msg.id, isChannel })}
                        onDeleteForMe={() => saveWorkspace(previous => ({ ...previous, hiddenMessages: { ...(previous.hiddenMessages || {}), [msg.id]: true } }))}
                      />
                      <button type="button" disabled={savingWorkspace || msg.deletedForEveryone} onClick={() => toggleStar(msg)}
                        aria-label={`${workspace.stars?.[msg.id] ? 'Unstar' : 'Star'} message`}
                        className="p-1 rounded hover:bg-black/10 focus-visible:outline" title={workspace.stars?.[msg.id] ? 'Unstar message' : 'Star message'}>
                        <Star className={`w-3 h-3 ${workspace.stars?.[msg.id] ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                      <span>{formattedTime}</span>
                      {isSender && (
                        <span className="dark:text-emerald-300 text-emerald-600 font-bold" aria-label="Saved" title="Saved to the conversation">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div aria-hidden="true" />
        </div>

        {hasNewMessages && (
          <button type="button" onClick={scrollToBottom} className="self-center px-4 py-2 my-1 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-md">
            New messages ↓
          </button>
        )}
        {/* Message Composer */}
        <div className="p-3 sm:p-4 border-t dark:border-slate-800 border-slate-200 dark:bg-slate-950 bg-[#f0f2f5] shrink-0 transition-colors duration-150">
          <form onSubmit={handleSend} className="relative dark:bg-slate-900 bg-white border dark:border-slate-700 border-slate-300 rounded-xl px-3 py-2 flex items-center gap-2 focus-within:border-emerald-500 transition-colors">
            {/* Hidden Photo File Input for Encrypted Storage */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Input Textarea */}
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!hasChannelAccess}
              placeholder={isChannel ? `Message #${chat.slug || chat.name}...` : `Send message to ${otherDetails.name}...`}
              className="flex-1 bg-transparent text-xs dark:text-slate-100 text-slate-900 dark:placeholder:text-slate-500 placeholder:text-slate-400 focus:outline-none"
            />

            {/* Actions Bar inside Composer */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Photo Upload Icon */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  fileInputRef.current?.click();
                }}
                disabled={uploadingPhoto || !hasChannelAccess}
                className="p-1.5 rounded dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
                title="Add photo to chat"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
              </button>

              {/* Klipy GIF Button */}
              <button
                type="button"
                onClick={() => setShowGifPicker(true)}
                disabled={!hasChannelAccess}
                className="px-2 py-1 rounded dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 dark:text-slate-300 text-slate-700 dark:hover:text-white hover:text-slate-900 text-[10px] font-black font-mono border dark:border-slate-700 border-slate-300 cursor-pointer transition-colors"
                title="Klipy GIF"
              >
                GIF
              </button>

              {/* Emoji Icon */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setText(prev => prev + ' 🚀');
                }}
                className="p-1.5 rounded dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Insert emoji"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* Send Plane Button */}
              <button
                type="submit"
                disabled={!text.trim() || sending || !hasChannelAccess}
                className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-40 transition-all cursor-pointer font-bold shrink-0 shadow-xs"
                title="Send"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* WHATSAPP WEB-STYLE GROUP SETTINGS DRAWER (Matching Reference Images 1, 2, 3) */}
      {/* ========================================================================= */}
      {showGroupSettings && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in"
          onClick={() => setShowGroupSettings(false)}
        >
          <div 
            className="w-full sm:w-[420px] md:w-[450px] h-full dark:bg-[#111b21] bg-[#f0f2f5] border-l dark:border-slate-800 border-slate-200 dark:text-slate-100 text-slate-800 flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200 transition-colors duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="h-14 px-4 dark:bg-[#111b21] bg-white border-b dark:border-slate-800/80 border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowGroupSettings(false)}
                  className="p-1.5 rounded-full dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800/60 hover:bg-slate-100 cursor-pointer transition"
                  aria-label="Close channel info"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-base font-semibold dark:text-white text-slate-900 tracking-wide">Channel info</h3>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar select-none divide-y dark:divide-slate-800/60 divide-slate-200/80">
              {/* IMAGE 1: Top Channel Profile & Quick Action Buttons */}
              <div className="flex flex-col items-center pt-7 pb-5 px-4 dark:bg-[#111b21] bg-white">
                {/* Large Circular Channel Avatar */}
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => {
                    if (chat.avatar || chat.photoURL) {
                      soundEffects.playPop();
                      setPreviewPhotoUrl(chat.avatar || chat.photoURL);
                    }
                  }}
                  title="Click to view full photo"
                >
                  <div className="w-28 h-28 rounded-full overflow-hidden border-2 dark:border-slate-700/60 border-slate-300 shadow-xl dark:bg-slate-800 bg-slate-100 flex items-center justify-center">
                    {chat.avatar || chat.photoURL ? (
                      <img src={chat.avatar || chat.photoURL} alt={chat.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-bold">
                        {chat.name ? chat.name.charAt(0).toUpperCase() : <Users className="w-12 h-12" />}
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-medium transition-opacity">
                    <Camera className="w-6 h-6 mb-1 text-emerald-400" />
                    <span>View Photo</span>
                  </div>
                </div>

                {/* Channel Title with Info Icon */}
                <div className="mt-4 flex items-center justify-center gap-2 max-w-full">
                  <h2 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight truncate max-w-[280px]">
                    {chat.name || `#${chat.slug}`}
                  </h2>
                  <button 
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      openDescriptionEditor();
                    }}
                    className="p-1 dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 cursor-pointer transition"
                    title="Channel details"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>

                {/* Subtitle: Channel · X members */}
                <p className="text-sm dark:text-slate-400 text-slate-500 mt-1">
                  Channel &bull; <span className="text-[#00a884] font-semibold">{totalMemberCount} {totalMemberCount === 1 ? 'member' : 'members'}</span>
                </p>

                {/* 4 Circular Action Buttons: Voice, Video, Add, Search */}
                <div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-xs">
                  {/* Add */}
                  <div className="flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        if (isChannelAdmin) setShowAddMembersModal(true);
                      }}
                      className="w-12 h-12 rounded-full dark:bg-slate-900/90 bg-slate-100 dark:hover:bg-slate-800 hover:bg-slate-200 border dark:border-slate-800 border-slate-300 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition active:scale-95 cursor-pointer shadow-xs"
                      title="Add Members"
                      disabled={!isChannelAdmin}
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                    <span className="text-xs dark:text-slate-300 text-slate-700 font-medium">Add</span>
                  </div>

                  {/* Search */}
                  <div className="flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        setShowMemberSearch(prev => !prev);
                      }}
                      className="w-12 h-12 rounded-full dark:bg-slate-900/90 bg-slate-100 dark:hover:bg-slate-800 hover:bg-slate-200 border dark:border-slate-800 border-slate-300 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition active:scale-95 cursor-pointer shadow-xs"
                      title="Search In Channel"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                    <span className="text-xs dark:text-slate-300 text-slate-700 font-medium">Search</span>
                  </div>
                </div>
              </div>

              {/* Channel Description Card */}
              <div className="py-3.5 px-4 dark:bg-[#111b21] bg-white flex items-center justify-between dark:hover:bg-slate-900/30 hover:bg-slate-50 transition">
                <div className="min-w-0 pr-3">
                  <p className="text-sm dark:text-slate-200 text-slate-700 leading-snug break-words">
                    {liveChannel?.description || 'No description provided'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openDescriptionEditor}
                  className="p-1 dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 shrink-0 cursor-pointer"
                  title="Edit description"
                  disabled={!isChannelAdmin}
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              {/* Media, links and docs Strip */}
              <div className="dark:bg-[#111b21] bg-white py-3.5 px-4">
                <div 
                  className="flex items-center justify-between cursor-pointer hover:opacity-90 transition mb-3"
                  onClick={() => setShowMediaGalleryModal(true)}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 dark:text-slate-400 text-slate-500" />
                    <span className="text-sm font-medium dark:text-slate-200 text-slate-800">Media, links and docs</span>
                  </div>
                  <div className="flex items-center gap-1 dark:text-slate-400 text-slate-500 text-xs">
                    <span>{chatMedia.length}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* 4 Thumbnails or Clean Empty Placeholder */}
                {chatMedia.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {mediaPreviews.map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => {
                          soundEffects.playPop();
                          setPreviewPhotoUrl(item.src || item.mediaUrl);
                        }}
                        className="aspect-square rounded-lg dark:bg-slate-900 bg-slate-100 border dark:border-slate-800 border-slate-200 overflow-hidden cursor-pointer hover:opacity-80 transition relative group"
                      >
                        <img src={item.src || item.mediaUrl} alt="media preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2.5 px-3 rounded-xl dark:bg-slate-900/50 bg-slate-100/60 border dark:border-slate-800/80 border-slate-200 text-center text-xs dark:text-slate-400 text-slate-500 font-medium">
                    No media, links, or docs shared yet
                  </div>
                )}
              </div>

              {/* Settings Action List */}
              <div className="dark:bg-[#111b21] bg-white py-1">
                {/* Starred messages */}
                <div 
                  onClick={() => setShowStarredModal(true)} 
                  className="flex items-center justify-between py-3.5 px-4 dark:hover:bg-slate-900/60 hover:bg-slate-50 cursor-pointer transition"
                >
                  <div className="flex items-center gap-4">
                    <Star className="w-5 h-5 dark:text-slate-400 text-slate-500" />
                    <span className="text-sm font-normal dark:text-slate-200 text-slate-800">Starred messages</span>
                  </div>
                  <ChevronRight className="w-4 h-4 dark:text-slate-500 text-slate-400" />
                </div>

                {/* Notification settings */}
                <div 
                  onClick={() => setShowNotificationSettingsModal(true)} 
                  className="flex items-center justify-between py-3.5 px-4 dark:hover:bg-slate-900/60 hover:bg-slate-50 cursor-pointer transition"
                >
                  <div className="flex items-center gap-4">
                    <Bell className="w-5 h-5 dark:text-slate-400 text-slate-500" />
                    <div>
                      <span className="text-sm font-normal dark:text-slate-200 text-slate-800">Notification settings</span>
                      {mutedDuration !== 'all' && <p className="text-xs text-amber-500">{mutedDuration === 'mentions' ? 'Mentions only' : `Muted (${mutedDuration})`}</p>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 dark:text-slate-500 text-slate-400" />
                </div>

                {/* Chat theme */}
                <div 
                  onClick={() => setShowThemeModal(true)} 
                  className="flex items-center justify-between py-3.5 px-4 dark:hover:bg-slate-900/60 hover:bg-slate-50 cursor-pointer transition"
                >
                  <div className="flex items-center gap-4">
                    <Palette className="w-5 h-5 dark:text-slate-400 text-slate-500" />
                    <span className="text-sm font-normal dark:text-slate-200 text-slate-800">Chat theme</span>
                  </div>
                  <ChevronRight className="w-4 h-4 dark:text-slate-500 text-slate-400" />
                </div>

                {/* Encryption */}
                <div 
                  onClick={() => setShowEncryptionModal(true)} 
                  className="flex items-center justify-between py-3.5 px-4 dark:hover:bg-slate-900/60 hover:bg-slate-50 cursor-pointer transition"
                >
                  <div className="flex items-start gap-4">
                    <Lock className="w-5 h-5 dark:text-slate-400 text-slate-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-normal dark:text-slate-200 text-slate-800">Encryption</p>
                      <p className="text-xs dark:text-slate-400 text-slate-500 leading-snug">Learn how campus messages are stored.</p>
                    </div>
                  </div>
                </div>

                {/* Create a similar channel */}
                <div 
                  onClick={handleCreateSimilarGroup} 
                  className="flex items-center justify-between py-3.5 px-4 dark:hover:bg-slate-900/60 hover:bg-slate-50 cursor-pointer transition"
                >
                  <div className="flex items-start gap-4">
                    <Users className="w-5 h-5 dark:text-slate-400 text-slate-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-normal dark:text-slate-200 text-slate-800">Create a similar channel</p>
                      <p className="text-xs dark:text-slate-400 text-slate-500 leading-snug">Start with the same members. You can add or remove people.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* IMAGE 2: Members Header & Member List */}
              <div className="dark:bg-[#111b21] bg-white pt-3 pb-1">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm font-medium dark:text-slate-400 text-slate-500">{totalMemberCount} {totalMemberCount === 1 ? 'member' : 'members'}</span>
                  <button
                    type="button"
                    onClick={() => setShowMemberSearch(prev => !prev)}
                    className="p-1 dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 cursor-pointer"
                    title="Search members"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>

                {/* Inline Member Search Filter */}
                {showMemberSearch && (
                  <div className="px-4 py-2">
                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 dark:text-slate-400 text-slate-500 absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        placeholder="Search members..."
                        className="w-full dark:bg-slate-900 bg-slate-100 border dark:border-slate-800 border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs dark:text-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {/* Add member row */}
                {isChannelAdmin && <div
                  onClick={() => {
                    soundEffects.playClick();
                    setShowAddMembersModal(true);
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 dark:hover:bg-slate-900/60 hover:bg-slate-50 cursor-pointer transition"
                >
                  <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-slate-950 font-bold shrink-0">
                    <UserPlus className="w-5 h-5 text-slate-950" />
                  </div>
                  <span className="text-sm font-medium dark:text-slate-200 text-slate-800">Add member</span>
                </div>}

                {/* Member 1: You */}
                <div className="flex items-center justify-between px-4 py-2.5 dark:hover:bg-slate-900/60 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden dark:bg-slate-800 bg-slate-200 shrink-0">
                      <DefaultAvatar 
                        src={currentStudent?.photoURL} 
                        user={currentStudent} 
                        userId={currentUid}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium dark:text-white text-slate-900 truncate">You</span>
                        {isMemberCreator({ uid: currentUid, prn: currentStudent?.prn, name: currentStudent?.displayName || currentStudent?.name }) ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded dark:bg-amber-950/80 bg-amber-100 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-500 shrink-0" /> Channel Creator
                          </span>
                        ) : isChannelAdmin ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded dark:bg-emerald-950/80 bg-emerald-100 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            Channel admin
                          </span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMemberTagModal(true)}
                        className="text-xs text-[#00a884] hover:underline cursor-pointer block text-left"
                      >
                        {userMemberTag || 'Add member tag'}
                      </button>
                      <p className="text-xs dark:text-slate-400 text-slate-500 truncate max-w-[200px]">
                        {currentStudent?.bio || 'Available'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Other Members */}
                {filteredOtherMembers.map((member, idx) => {
                  const isTargetCreator = isMemberCreator(member);
                  const isMemberAdmin = isTargetCreator || member.prn === chat?.createdBy || member.name === chat?.createdByName || Boolean(member.isAdmin);
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        soundEffects.playThonk();
                        if (isChannelAdmin) {
                          handleOpenMemberActions(member);
                        } else {
                          onOpenProfile({
                            ...member,
                            avatar: getSenderAvatar(member.prn || member.uid, member.avatar)
                          });
                        }
                      }}
                      className="flex items-center justify-between px-4 py-2.5 dark:hover:bg-slate-900/60 hover:bg-slate-50 cursor-pointer transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden dark:bg-slate-800 bg-slate-200 shrink-0">
                          <DefaultAvatar 
                            src={getSenderAvatar(member.prn || member.uid, member.avatar)} 
                            user={member} 
                            userId={member.prn || member.uid}
                            name={member.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium dark:text-white text-slate-900 group-hover:text-emerald-500 transition truncate">
                            {member.name}
                          </p>
                          <p className="text-xs dark:text-slate-400 text-slate-500 truncate max-w-[200px]">
                            {member.bio || member.dept || 'Available'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isTargetCreator ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded dark:bg-amber-950/80 bg-amber-100 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-500 shrink-0" /> Channel Creator
                          </span>
                        ) : isMemberAdmin ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded dark:bg-emerald-950/80 bg-emerald-100 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            Channel admin
                          </span>
                        ) : null}

                        {isChannelAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              soundEffects.playClick();
                              handleOpenMemberActions(member);
                            }}
                            className="p-1 rounded-md dark:hover:bg-slate-800 hover:bg-slate-200 dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 transition cursor-pointer"
                            title="Manage member options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Bottom List Options (from Image 2) */}
                <div 
                  onClick={() => setShowMemberChangesModal(true)} 
                  className="flex items-center gap-4 px-4 py-3 dark:hover:bg-slate-900/60 hover:bg-slate-50 cursor-pointer transition border-t dark:border-slate-800/60 border-slate-200 mt-1"
                >
                  <List className="w-5 h-5 dark:text-slate-400 text-slate-500" />
                  <span className="text-sm font-normal dark:text-slate-200 text-slate-800">See member changes</span>
                </div>

                <div 
                  onClick={handleToggleFavourite} 
                  className="flex items-center gap-4 px-4 py-3 dark:hover:bg-slate-900/60 hover:bg-slate-50 cursor-pointer transition"
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'text-rose-500 fill-rose-500' : 'dark:text-slate-400 text-slate-500'}`} />
                  <span className="text-sm font-normal dark:text-slate-200 text-slate-800">{isFavorite ? 'Favourited' : 'Add to favourites'}</span>
                </div>

                <div 
                  onClick={() => setShowAddToListModal(true)} 
                  className="flex items-center gap-4 px-4 py-3 dark:hover:bg-slate-900/60 hover:bg-slate-50 cursor-pointer transition"
                >
                  <FolderPlus className="w-5 h-5 dark:text-slate-400 text-slate-500" />
                  <span className="text-sm font-normal dark:text-slate-200 text-slate-800">Add to list</span>
                </div>
              </div>

              {/* IMAGE 3: Danger Zone Actions & Footer */}
              <div className="dark:bg-[#111b21] bg-white py-2">
                {/* Export chat */}
                <div 
                  onClick={handleExportChat} disabled={exportingHistory} 
                  className="flex items-center gap-4 px-4 py-3 dark:hover:bg-slate-900/60 hover:bg-slate-50 cursor-pointer transition"
                >
                  <Download className="w-5 h-5 dark:text-slate-400 text-slate-500" />
                  <span className="text-sm font-normal dark:text-slate-200 text-slate-800">{exportingHistory ? 'Preparing export…' : 'Export chat'}</span>
                </div>

                {/* Clear chat (Red) */}
                <div 
                  onClick={() => setShowClearChatConfirm(true)} 
                  className="flex items-center gap-4 px-4 py-3 dark:hover:bg-slate-900/60 hover:bg-slate-50 cursor-pointer transition"
                >
                  <MinusCircle className="w-5 h-5 text-rose-500" />
                  <span className="text-sm font-medium text-rose-500">Hide earlier messages</span>
                </div>

                {/* Exit channel (Red) */}
                <div 
                  onClick={() => setShowExitGroupConfirm(true)} 
                  className="flex items-center gap-4 px-4 py-3 dark:hover:bg-slate-900/60 hover:bg-slate-50 cursor-pointer transition"
                >
                  <LogOut className="w-5 h-5 text-rose-500" />
                  <span className="text-sm font-medium text-rose-500">Exit channel</span>
                </div>

                {/* Report channel (Red) */}
                <div 
                  onClick={() => setShowReportGroupModal(true)} 
                  className="flex items-center gap-4 px-4 py-3 dark:hover:bg-slate-900/60 hover:bg-slate-50 cursor-pointer transition"
                >
                  <ThumbsDown className="w-5 h-5 text-rose-500" />
                  <span className="text-sm font-medium text-rose-500">Report channel</span>
                </div>
              </div>

              {/* Channel Created Footer */}
              <div className="py-6 px-4 text-center text-xs dark:text-slate-500 text-slate-400 font-normal leading-relaxed dark:bg-[#111b21] bg-[#f0f2f5]">
                Channel created by {chat.createdByName || currentStudent?.displayName || currentStudent?.name || 'Administrator'}, on {creationInfo.date} at {creationInfo.time}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD MEMBERS DIRECTLY FROM DIRECTORY */}
      {/* ========================================================================= */}
      {showAddMembersModal && isChannelAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-left max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-indigo-400" /> Add Members to #{chat.slug || chat.name}
                </h3>
                <p className="text-[11px] font-mono text-slate-400">Select classmates from the campus directory</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMembersModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button type="button" onClick={() => {
              setShowAddMembersModal(false);
              setGeneratedInvite(null);
              setShowInviteLinkModal(true);
            }} className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300">
              <Link className="w-4 h-4" /> Invite with an expiring link
            </button>

            {/* Search Input */}
            <div>
              <input
                type="text"
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                placeholder="Search students by name, PRN, or dept..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Student Multi-Select List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar max-h-64 pr-1">
              {filteredDirectoryPool.length > 0 ? (
                filteredDirectoryPool.map((student) => {
                  const studentId = student.uid || student.id || student.prn;
                  const isSelected = selectedDirectoryStudents.some(s => (s.uid || s.id || s.prn) === studentId);

                  return (
                    <div
                      key={studentId}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedDirectoryStudents(prev => prev.filter(s => (s.uid || s.id || s.prn) !== studentId));
                        } else {
                          setSelectedDirectoryStudents(prev => [...prev, student]);
                        }
                      }}
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500/50'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0 overflow-hidden">
                          <DefaultAvatar 
                            src={getSenderAvatar(studentId, student.avatar)} 
                            user={student} 
                            userId={studentId}
                            name={student.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white truncate">{student.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{student.prn} &bull; {student.dept}</p>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                        isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center space-y-1 text-slate-400">
                  <p className="text-xs font-semibold text-slate-300">No students available to add</p>
                  <p className="text-[11px] text-slate-500">
                    {directorySearch.trim() ? 'No matches for your search' : 'All eligible campus students are already in this channel.'}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-xs font-mono text-slate-400">
                {selectedDirectoryStudents.length} selected
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMembersModal(false)}
                  className="px-4 py-2 border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium cursor-pointer transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleAddSelectedMembers}
                  disabled={addingMembers || selectedDirectoryStudents.length === 0}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition active:scale-95 shadow-md shadow-indigo-600/20"
                >
                  {addingMembers ? 'Adding...' : `Add Selected`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GENERATE EXPIRING ENCRYPTED INVITE LINK */}
      {/* ========================================================================= */}
      {showInviteLinkModal && isChannelAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Link className="w-4 h-4 text-indigo-400" /> Expiring Invite Link
                </h3>
                <p className="text-[11px] font-mono text-slate-400">Create an invitation link that expires automatically</p>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteLinkModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Expiration Duration Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-200">
                Link Expiration Duration (Sender Choice):
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '1 Hour', hours: 1 },
                  { label: '24 Hours', hours: 24 },
                  { label: '7 Days', hours: 168 }
                ].map((dur) => (
                  <button
                    key={dur.hours}
                    type="button"
                    onClick={() => {
                      setInviteDurationHours(dur.hours);
                      setGeneratedInvite(null);
                    }}
                    className={`p-2 rounded-xl text-xs font-medium border text-center transition cursor-pointer ${
                      inviteDurationHours === dur.hours
                        ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate or Show Link */}
            {!generatedInvite ? (
              <button
                type="button"
                onClick={handleGenerateInvite}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition shadow-md shadow-indigo-600/20 active:scale-95"
              >
                Generate Invitation Link
              </button>
            ) : (
              <div className="space-y-3 p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-mono text-indigo-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Expires: {new Date(generatedInvite.expiresAt).toLocaleString()}
                  </span>
                  <span className="text-emerald-400">Expires automatically</span>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 break-all select-all">
                  {generatedInvite.inviteUrl}
                </div>

                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 shadow-md shadow-emerald-600/20"
                >
                  {copiedLink ? (
                    <>
                      <CheckCheck className="w-4 h-4" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Invitation Link</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-500 leading-relaxed font-light">
                Anyone with this link will be added to #{chat.slug || chat.name}. Once expired, the link automatically becomes invalid and inaccessible.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RIGHT RAIL: USER LIST DIRECTORY (Desktop Layout) */}
      {/* ========================================================================= */}
      {showUserList && (
        <div className="hidden lg:flex w-60 shrink-0 flex-col h-full dark:bg-slate-950 bg-white border-l dark:border-slate-800 border-slate-200 select-none transition-colors duration-150">
          <div className="p-3 border-b dark:border-slate-800 border-slate-200 flex items-center justify-between dark:bg-slate-900/40 bg-slate-50/80">
            <h4 className="text-xs font-bold uppercase tracking-wider dark:text-slate-400 text-slate-500">
              Participants
            </h4>
            <span className="text-[10px] font-mono dark:text-slate-400 text-slate-500">
              {totalMemberCount}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {deduplicatedMembers.map((m, idx) => {
              const isCurrentUser = isSelf(m);
              return (
                <div
                  key={idx}
                  onClick={() => {
                    soundEffects.playThonk();
                    onOpenProfile(m);
                  }}
                  className="w-full p-2 rounded-lg dark:hover:bg-slate-900 hover:bg-slate-100 transition-colors flex items-center justify-between group cursor-pointer"
                  title={`View Nordic Profile for ${m.name}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-7 h-7 rounded-full dark:bg-slate-800 bg-slate-100 border dark:border-slate-700 border-slate-300 flex items-center justify-center text-xs font-bold dark:text-slate-200 text-slate-700">
                        {(m.name || 'U')[0]}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border dark:border-slate-950 border-white" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-medium dark:text-slate-200 text-slate-800 truncate dark:group-hover:text-white group-hover:text-slate-950">
                        {isCurrentUser ? `${m.name} (You)` : m.name}
                      </p>
                      <p className="text-[10px] dark:text-slate-400 text-slate-500 font-mono truncate">
                        {m.prn}
                      </p>
                    </div>
                  </div>

                  {/* Blue Verified Shield Badge */}
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-black shrink-0" title="Verified Campus Student">
                    ✓
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Klipy GIF Picker Modal */}
      <KlipyGifPicker
        isOpen={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelectGif={handleSendGif}
      />

      {/* Photo Lightbox Preview Modal */}
      {previewPhotoUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-none"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden p-2 flex flex-col items-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between px-3 py-2 border-b border-slate-800">
              <span className="text-xs text-slate-400">Chat photo</span>
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 overflow-auto flex items-center justify-center max-h-[80vh]">
              <img
                src={previewPhotoUrl}
                alt="Enlarged chat asset"
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* 1. WHATSAPP VOICE & VIDEO CALL MODAL */}
      {/* 2. STARRED MESSAGES MODAL */}
      {showStarredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111b21] border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Starred Messages
              </h3>
              <button type="button" onClick={() => setShowStarredModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            {Object.values(workspace.stars || {}).length > 0 ? (
              <StarredChatMessages stars={workspace.stars} hiddenMessages={workspace.hiddenMessages}
                chatId={chat.id} isChannel={isChannel} conversationKey={chat.conversationKey}
                saving={savingWorkspace} onUnstar={toggleStar}
                resolveName={message => directoryPool.find(student => student.uid === message.from)?.name || message.fromName || 'Student'} />
            ) : <div className="py-8 text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-amber-400">
                <Star className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-white">No starred messages yet</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                Use the star beside a message to save it privately to your account.
              </p>
            </div>}
          </div>
        </div>
      )}

      {/* 3. NOTIFICATION SETTINGS MODAL */}
      {showNotificationSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111b21] border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" /> Notification Settings
              </h3>
              <button type="button" onClick={() => setShowNotificationSettingsModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { id: 'all', label: 'All Messages (Sound & Banners)' },
                { id: 'mentions', label: 'Mentions Only (@PRN or @handle)' },
                { id: '8h', label: 'Mute for 8 Hours' },
                { id: '1w', label: 'Mute for 1 Week' },
                { id: 'always', label: 'Mute Always' }
              ].map((opt) => (
                <button type="button" role="radio" aria-checked={mutedDuration === opt.id}
                  key={String(opt.id)}
                  onClick={() => {
                    try {
                      chatNotificationPreferences.setChannel(currentUid, chat.id, opt.id);
                      setShowNotificationSettingsModal(false);
                    } catch { setErrorNotice('Could not save notification preferences in this browser.'); }
                  }}
                  className={`w-full text-left p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    mutedDuration === opt.id 
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-semibold' 
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <span>{opt.label}</span>
                  {mutedDuration === opt.id && <Check className="w-4 h-4 text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. CHAT THEME MODAL */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111b21] border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-400" /> Chat Theme
              </h3>
              <button type="button" onClick={() => setShowThemeModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'default', label: 'Classic WhatsApp', bg: 'bg-[#111b21]' },
                { id: 'midnight', label: 'Midnight Obsidian', bg: 'bg-[#020617]' },
                { id: 'emerald', label: 'Emerald Forest', bg: 'bg-[#064e3b]' },
                { id: 'slate', label: 'Deep Cyber Slate', bg: 'bg-[#0f172a]' }
              ].map((th) => (
                <div
                  key={th.id}
                  onClick={() => {
                    soundEffects.playPop();
                    setChatTheme(th.id);
                    localStorage.setItem(`krc_theme_${chat?.id}`, th.id);
                    setShowThemeModal(false);
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition ${
                    chatTheme === th.id
                      ? 'border-emerald-500 bg-emerald-950/20 text-white font-bold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full border border-slate-700 shadow-inner ${th.bg}`} />
                  <span className="text-[11px] text-center">{th.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. ENCRYPTION VERIFICATION MODAL */}
      {showEncryptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111b21] border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="flex justify-end">
              <button type="button" onClick={() => setShowEncryptionModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Message Storage</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isChannel ? 'Channel text is stored in the campus message database and uses campus account access rules.' : 'Direct text is encrypted before saving. Conversation keys are stored with the chat data. You can compare the selected conversation’s key fingerprint in Preferences.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. MEMBER TAG MODAL */}
      {showMemberTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111b21] border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" /> Set Your Member Tag
              </h3>
              <button type="button" onClick={() => setShowMemberTagModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                defaultValue={userMemberTag}
                id="member-tag-input"
                placeholder="e.g. Captain, Study Lead, Presenter..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                maxLength={30}
              />
              <div className="flex flex-wrap gap-1.5">
                {['Study Lead', 'Presenter', 'Organizer', 'Notes Taker', 'Captain'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('member-tag-input');
                      if (el) el.value = tag;
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:text-white hover:border-slate-700 cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowMemberTagModal(false)} className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300 text-xs">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('member-tag-input');
                    handleSaveMemberTag(el?.value || '');
                  }}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                >
                  Save Tag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MEMBER CHANGES AUDIT MODAL */}
      {showMemberChangesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111b21] border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <List className="w-4 h-4 text-emerald-400" /> Member Changes Audit
              </h3>
              <button type="button" onClick={() => setShowMemberChangesModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs max-h-72 overflow-y-auto custom-scrollbar pr-1">
              {displayAuditLogs.map((ev, idx) => {
                const isKey = ev.type === 'key_gen';
                const isAdd = ev.type === 'add_member' || ev.type === 'join_invite';
                const isLeave = ev.type === 'leave_member';
                const isCreate = ev.type === 'create';
                const isKick = ev.type === 'kick_member';
                const isBan = ev.type === 'ban_member';
                const isPromote = ev.type === 'promote_admin';
                const isDemote = ev.type === 'demote_admin';

                return (
                  <div key={ev.id || idx} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2">
                      {isCreate && <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      {isKey && <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      {isAdd && <UserPlus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      {isLeave && <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                      {isKick && <UserMinus className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      {isBan && <Ban className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                      {isPromote && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      {isDemote && <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      <p className="text-white font-medium">{ev.title}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono pl-5.5">
                      {ev.time || (ev.timestamp ? new Date(ev.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recently')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 8. ADD TO LIST MODAL */}
      {showAddToListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111b21] border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-emerald-400" /> Add to Custom List
              </h3>
              <button type="button" onClick={() => setShowAddToListModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {['Academics', 'Projects', 'Campus', ...new Set(workspace.lists || [])].filter((name, index, all) => all.indexOf(name) === index).map((listName) => (
                <div
                  key={listName}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 cursor-pointer transition flex items-center justify-between text-slate-200"
                >
                  <span>{listName}</span>
                  <button type="button" disabled={savingWorkspace} aria-label={`${workspace.lists?.includes(listName) ? 'Remove from' : 'Add to'} ${listName}`}
                    onClick={() => saveWorkspace(previous => ({ ...previous, lists: previous.lists?.includes(listName)
                      ? previous.lists.filter(name => name !== listName) : [...(previous.lists || []), listName] }))}>
                    {workspace.lists?.includes(listName) ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              ))}
              <form className="flex gap-2 pt-2" onSubmit={async event => {
                event.preventDefault();
                const name = customListName.trim();
                if (name && await saveWorkspace(previous => ({ ...previous, lists: [...new Set([...(previous.lists || []), name])] }))) setCustomListName('');
              }}>
                <input aria-label="New list name" maxLength={40} value={customListName} onChange={event => setCustomListName(event.target.value)}
                  className="min-w-0 flex-1 bg-slate-900 border border-slate-700 rounded p-2" placeholder="New list name" />
                <button disabled={savingWorkspace || !customListName.trim()} className="text-emerald-400">Create</button>
              </form>
              <p className="text-slate-400 text-[11px]">Your lists are private and available in the message rail.</p>
            </div>
          </div>
        </div>
      )}

      {/* 9. CLEAR CHAT CONFIRMATION MODAL */}
      {showClearChatConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111b21] border border-rose-500/30 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-left">
            <div className="flex items-center gap-2.5 text-rose-500">
              <MinusCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-white">Hide earlier messages?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Earlier messages will be hidden for your account. You can restore them at any time; no messages or media will be deleted.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearChatConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearChat}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition active:scale-95 shadow-md shadow-rose-600/30"
              >
                Hide Messages
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. EXIT CHANNEL CONFIRMATION MODAL */}
      {showExitGroupConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111b21] border border-rose-500/30 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-left">
            <div className="flex items-center gap-2.5 text-rose-500">
              <LogOut className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-white">Exit &quot;{chat.name || 'Channel'}&quot;?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The channel will leave your message list. Shared history is preserved; an administrator or valid invitation can add you again.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExitGroupConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExitGroup}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition active:scale-95 shadow-md shadow-rose-600/30"
              >
                Exit Channel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSimilarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={createSimilarChannel} className="bg-[#111b21] rounded-2xl border border-slate-700 p-5 max-w-sm w-full space-y-4 text-white">
            <h3 className="font-semibold">Create a similar channel</h3>
            <p className="text-xs text-slate-400">Creates a new channel with the current members. Existing messages stay in this channel. You will manage the new channel.</p>
            <input aria-label="New channel name" value={similarName} onChange={event => setSimilarName(event.target.value)} maxLength={80} required
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm" />
            <div className="flex justify-end gap-3 text-xs">
              <button type="button" disabled={creatingSimilar} onClick={() => setShowSimilarModal(false)}>Cancel</button>
              <button disabled={creatingSimilar || !similarName.trim()} className="text-emerald-400">{creatingSimilar ? 'Creating…' : 'Create channel'}</button>
            </div>
          </form>
        </div>
      )}
      {/* 11. REPORT CHANNEL MODAL */}
      {showReportGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111b21] border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 text-rose-400">
                <ThumbsDown className="w-4 h-4" /> Report Channel
              </h3>
              <button type="button" onClick={() => setShowReportGroupModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300">Select the reason for reporting this channel:</p>
            <div className="space-y-2 text-xs">
              {['Spam or commercial advertisements', 'Harassment or abusive language', 'Academic integrity violation', 'Inappropriate or harmful media'].map((reason, idx) => (
                <button type="button" disabled={reportingChannel}
                  key={idx}
                  onClick={() => handleReportGroup(reason)}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-950/20 cursor-pointer transition text-slate-200"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 12. EDIT DESCRIPTION MODAL */}
      {showEditDescriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111b21] border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-400" /> Channel Description
              </h3>
              <button type="button" onClick={() => setShowEditDescriptionModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <textarea
                value={newDescriptionText}
                onChange={(e) => setNewDescriptionText(e.target.value)}
                placeholder="Add channel description..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 min-h-[90px]"
                maxLength={200}
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{newDescriptionText.length}/200</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowEditDescriptionModal(false)} className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300 text-xs">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveDescription(newDescriptionText)}
                    disabled={savingDescription}
                    className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                  >
                    {savingDescription ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 13. MEDIA GALLERY MODAL */}
      {showMediaGalleryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#111b21] border border-slate-800 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl text-left max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-400" /> Media, links and docs
                </h3>
                <p className="text-xs text-slate-400">{chat.name || 'Channel'}</p>
              </div>
              <button type="button" onClick={() => setShowMediaGalleryModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
              {chatMedia.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {chatMedia.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        soundEffects.playPop();
                        setPreviewPhotoUrl(item.src || item.mediaUrl);
                      }}
                      className="aspect-square rounded-xl bg-slate-900 border border-slate-800 overflow-hidden cursor-pointer hover:opacity-85 transition relative group"
                    >
                      <img src={item.src || item.mediaUrl} alt="media" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-300">No media, links, or docs</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Photos, documents, and media attachments sent in this channel will be saved and organized here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 14. MEMBER ACTIONS SHEET / MODAL */}
      {showMemberActionModal && selectedMemberForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="dark:bg-[#111b21] bg-white border dark:border-slate-800 border-slate-200 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800 border-slate-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full overflow-hidden dark:bg-slate-800 bg-slate-200 shrink-0">
                  <DefaultAvatar 
                    src={getSenderAvatar(selectedMemberForAction.prn || selectedMemberForAction.uid, selectedMemberForAction.avatar)} 
                    user={selectedMemberForAction} 
                    userId={selectedMemberForAction.prn || selectedMemberForAction.uid}
                    name={selectedMemberForAction.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold dark:text-white text-slate-900 truncate">
                    {selectedMemberForAction.name}
                  </h3>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] dark:text-slate-400 text-slate-500 font-mono">
                      {selectedMemberForAction.prn || selectedMemberForAction.dept || 'Campus Member'}
                    </span>
                    {isMemberCreator(selectedMemberForAction) ? (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded dark:bg-amber-950/80 bg-amber-100 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5 text-amber-500" /> Channel Creator
                      </span>
                    ) : selectedMemberForAction.isAdmin ? (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded dark:bg-emerald-950/80 bg-emerald-100 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        Admin
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  soundEffects.playClick();
                  setShowMemberActionModal(false);
                  setSelectedMemberForAction(null);
                }} 
                className="dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 p-1 rounded-lg hover:dark:bg-slate-800 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              {/* Option 1: Promote or Demote Admin */}
              {selectedMemberForAction.isAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    handleDemoteAdmin(selectedMemberForAction);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium dark:text-amber-400 text-amber-600 dark:hover:bg-slate-800/80 hover:bg-amber-50 transition cursor-pointer text-left border border-transparent hover:border-amber-500/20"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
                  <div>
                    <p className="font-semibold">Dismiss as Admin</p>
                    <p className="text-[10px] dark:text-slate-400 text-slate-500 font-normal">Remove admin management permissions</p>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    handlePromoteAdmin(selectedMemberForAction);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium dark:text-emerald-400 text-emerald-600 dark:hover:bg-slate-800/80 hover:bg-emerald-50 transition cursor-pointer text-left border border-transparent hover:border-emerald-500/20"
                >
                  <Crown className="w-4 h-4 shrink-0 text-amber-400" />
                  <div>
                    <p className="font-semibold">Make Channel Admin</p>
                    <p className="text-[10px] dark:text-slate-400 text-slate-500 font-normal">Grant admin controls and member management</p>
                  </div>
                </button>
              )}

              {/* Option 2: Kick Member */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  if (isMemberCreator(selectedMemberForAction)) {
                    setShowMemberActionModal(false);
                    soundEffects.playThonk();
                    showCampusAlert({
                      title: 'Permanent Admin Protection',
                      message: 'Action Prohibited: The channel creator owns this channel and cannot be removed, demoted, or kicked by other admins.',
                      type: 'error',
                      confirmText: 'Understood'
                    });
                    return;
                  }
                  setShowMemberActionModal(false);
                  setShowKickConfirm(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium dark:text-amber-400 text-amber-600 dark:hover:bg-slate-800/80 hover:bg-amber-50 transition cursor-pointer text-left border border-transparent hover:border-amber-500/20"
              >
                <UserMinus className="w-4 h-4 shrink-0 text-amber-500" />
                <div>
                  <p className="font-semibold">Kick from Channel</p>
                  <p className="text-[10px] dark:text-slate-400 text-slate-500 font-normal">Remove from channel and revoke access key</p>
                </div>
              </button>

              {/* Option 3: Permanently Ban Member */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  if (isMemberCreator(selectedMemberForAction)) {
                    setShowMemberActionModal(false);
                    soundEffects.playThonk();
                    showCampusAlert({
                      title: 'Permanent Admin Protection',
                      message: 'Action Prohibited: The channel creator owns this channel and cannot be removed, demoted, kicked, or banned by other admins.',
                      type: 'error',
                      confirmText: 'Understood'
                    });
                    return;
                  }
                  setShowMemberActionModal(false);
                  setShowBanConfirm(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium dark:text-rose-400 text-rose-600 dark:hover:bg-slate-800/80 hover:bg-rose-50 transition cursor-pointer text-left border border-transparent hover:border-rose-500/20"
              >
                <Ban className="w-4 h-4 shrink-0 text-rose-500" />
                <div>
                  <p className="font-semibold">Ban Member Permanently</p>
                  <p className="text-[10px] dark:text-slate-400 text-slate-500 font-normal">Remove this member and prevent rejoining</p>
                </div>
              </button>

              {/* Option 4: View Profile */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setShowMemberActionModal(false);
                  onOpenProfile({
                    ...selectedMemberForAction,
                    avatar: getSenderAvatar(selectedMemberForAction.prn || selectedMemberForAction.uid, selectedMemberForAction.avatar)
                  });
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium dark:text-slate-300 text-slate-700 dark:hover:bg-slate-800/80 hover:bg-slate-100 transition cursor-pointer text-left border border-transparent"
              >
                <User className="w-4 h-4 shrink-0 dark:text-slate-400 text-slate-500" />
                <div>
                  <p className="font-semibold">View Student Profile</p>
                  <p className="text-[10px] dark:text-slate-400 text-slate-500 font-normal">Inspect campus academic details & folder</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 15. KICK CONFIRMATION MODAL */}
      {showKickConfirm && selectedMemberForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="dark:bg-[#111b21] bg-white border dark:border-slate-800 border-slate-200 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <UserMinus className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold dark:text-white text-slate-900">Kick Member?</h3>
                <p className="text-xs dark:text-slate-400 text-slate-500">Remove from #{chat?.slug || chat?.name || 'channel'}</p>
              </div>
            </div>
            <p className="text-xs dark:text-slate-300 text-slate-600 leading-relaxed">
              Are you sure you want to remove <span className="font-semibold text-emerald-500">{selectedMemberForAction.name}</span> from this channel? Their access to channel messages will be removed. They can be added again later by a channel administrator.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setShowKickConfirm(false);
                  setSelectedMemberForAction(null);
                }}
                className="px-3.5 py-1.5 rounded-lg dark:bg-slate-800 bg-slate-100 dark:text-slate-300 text-slate-700 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={memberActionLoading}
                onClick={handleConfirmKick}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md flex items-center gap-1.5"
              >
                {memberActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Kick Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 16. PERMANENT BAN CONFIRMATION MODAL */}
      {showBanConfirm && selectedMemberForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="dark:bg-[#111b21] bg-white border dark:border-slate-800 border-slate-200 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-500">Permanently Ban Member?</h3>
                <p className="text-xs dark:text-slate-400 text-slate-500">Irrevocable channel exclusion</p>
              </div>
            </div>
            <p className="text-xs dark:text-slate-300 text-slate-600 leading-relaxed">
              This removes <span className="font-semibold text-rose-400">{selectedMemberForAction.name}</span> and blocks rejoining through invitations. Shared message history is preserved.
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium dark:text-slate-400 text-slate-500">Ban Reason / Violation:</label>
              <input
                type="text"
                value={banReasonText}
                onChange={(e) => setBanReasonText(e.target.value)}
                placeholder="Reason for ban..."
                className="w-full dark:bg-slate-900 bg-slate-50 border dark:border-slate-800 border-slate-300 rounded-xl px-3 py-1.5 text-xs dark:text-white text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setShowBanConfirm(false);
                  setSelectedMemberForAction(null);
                }}
                className="px-3.5 py-1.5 rounded-lg dark:bg-slate-800 bg-slate-100 dark:text-slate-300 text-slate-700 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={memberActionLoading}
                onClick={handleConfirmBan}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md flex items-center gap-1.5"
              >
                {memberActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Ban Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
