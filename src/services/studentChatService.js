import { firestoreService } from './firestoreService.js';
import { sameStudentIdentity } from './studentDirectory.js';
import { studentDirectoryProjection } from '../utils/studentDirectoryProjection.js';
/**
 * @fileoverview Student Chat Service
 * Core real-time messaging engine for in-campus student communications.
 * Features WebCrypto AES-GCM encryption, traffic balancing, 15-line packaging,
 * anti-spam burst protection, and strict administrative clearance verification.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

import { db, auth } from '../firebase.js';
import { 
  collection, doc, getDoc, setDoc, updateDoc, 
  query, where, onSnapshot,
  addDoc, serverTimestamp, getDocs, deleteDoc, runTransaction, writeBatch 
} from 'firebase/firestore';
import { studentE2EE } from './studentE2EE.js';
import { securityVault } from './securityVault.js';
import { chatMessageRepository } from './chatMessageRepository.js';
import { visibleConversationThreads } from './chatThreadState.js';
import { channelCreatorUid, canManageChannel, channelAccessFields, changeChannelMember, activeChannelMembers } from './channelPolicy.js';
import { joinedChannelRepository } from './joinedChannelRepository.js';
import { chatHistoryRepository } from './chatHistoryRepository.js';

export class StudentChatService {
  constructor(messageRepository = chatMessageRepository, channelRepository = joinedChannelRepository, historyRepository = chatHistoryRepository) {
    this.messageRepository = messageRepository;
    this.channelRepository = channelRepository;
    this.historyRepository = historyRepository;
    this._activeListeners = new Map();
    this._recentSendTimes = [];
    this._cachedClearance = new Map();
  }

  /**
   * Clears the in-memory clearance cache so changes take effect immediately
   */
  clearClearanceCache() {
    this._cachedClearance.clear();
  }

  /**
   * Verifies if the student has administrative clearance to chat.
   * Multi-source resolution: checks Firestore user doc, PRN doc, email query,
   * local database directory, and demo students directory.
   */
  async verifyStudentClearance(studentUid, userObj = null) {
    if (!auth.currentUser || (userObj?.role && userObj.role !== 'student')) return false;
    const identity = { ...userObj, uid: studentUid || userObj?.uid };
    if (!identity.uid) return false;
    try {
      const students = await firestoreService.getStudents();
      const student = students.find(s => sameStudentIdentity(s, identity));
      return !!student && student.allowChatting !== false;
    } catch (error) {
      console.warn('[Chat] Clearance verification unavailable:', error.code);
      return false;
    }
  }

  /**
   * Subscribes to the student's conversation threads
   */
  /**
   * Subscribes to the student's conversation threads with real-time live database synchronization.
   * Avoids composite index restrictions by querying array-contains and sorting in-memory.
   */
  subscribeToConversations(studentUid, callback, options = {}) {
    if (!studentUid) return () => {};
    let threads = [], preferences = {}, readyThreads = false, readyPreferences = false;
    const errors = {};
    const emit = () => {
      if (readyThreads && readyPreferences) callback(visibleConversationThreads(threads, preferences, options?.includeClosed === true), { error: Object.values(errors).find(Boolean) || null });
    };
    const threadStop = onSnapshot(query(collection(db, 'student_chats'), where('participants', 'array-contains', studentUid)), snapshot => {
      threads = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
      readyThreads = true; errors.threads = null; emit();
    }, () => { threads = []; readyThreads = true; errors.threads = 'Private conversations could not be loaded. Reconnect to try again.'; emit(); });
    const preferenceStop = onSnapshot(collection(db, 'users', studentUid, 'chat_preferences'), snapshot => {
      preferences = Object.fromEntries(snapshot.docs.map(item => [item.id, item.data()]));
      readyPreferences = true; errors.preferences = null; emit();
    }, () => { readyPreferences = true; errors.preferences = 'Your chat preferences could not be loaded. Reconnect to try again.'; emit(); });
    // Each component owns its listeners; Search Feed must not cancel the message-list listener.
    return () => { threadStop(); preferenceStop(); };
  }

  async openConversation(studentUid, chatId) {
    if (studentUid !== auth.currentUser?.uid) throw new Error('Sign in again to open this conversation.');
    await setDoc(doc(db, 'users', studentUid, 'chat_preferences', chatId), { closed: false, lastViewedAt: Date.now() }, { merge: true });
  }

  async closeConversation(studentUid, chatId) {
    if (studentUid !== auth.currentUser?.uid) throw new Error('Sign in again to close this conversation.');
    await setDoc(doc(db, 'users', studentUid, 'chat_preferences', chatId), { closed: true, closedAt: Date.now() }, { merge: true });
  }

  /**
   * Gets or creates a 1-on-1 private student conversation with unique AES-GCM key
   */
  async getOrCreateConversation(currentStudent, targetStudent) {
    const students = await firestoreService.getStudents();
    const sender = students.find(student => sameStudentIdentity(student, currentStudent));
    const target = students.find(student => sameStudentIdentity(student, targetStudent));
    if (!sender || !target || sender.allowChatting === false || target.allowChatting === false) {
      throw new Error('Both students must be enrolled with campus chat access.');
    }
    const currentUid = sender.uid;
    const targetUid = target.uid;

    if (!currentUid || currentUid !== auth.currentUser?.uid || !targetUid || sameStudentIdentity(sender, target)) {
      throw new Error('Invalid conversation participants.');
    }

    // Check existing conversation
    const q = query(
      collection(db, 'student_chats'),
      where('participants', 'array-contains', currentUid)
    );

    const snap = await getDocs(q);
    const existing = snap.docs.find(d => {
      const p = d.data().participants || [];
      return p.includes(targetUid);
    });

    if (existing) {
      await this.openConversation(currentUid, existing.id);
      return { id: existing.id, ...existing.data() };
    }

    // Generate new high-entropy conversation key
    const conversationKey = await studentE2EE.generateConversationKey();

    const senderName = sender.name || sender.displayName;
    const targetName = target.name || target.displayName;

    const participantNames = {
      [currentUid]: senderName,
      [targetUid]: targetName
    };

    const allParticipants = [currentUid, targetUid];

    const newChat = {
      participants: allParticipants,
      participantNames,
      participantDetails: {
        [currentUid]: {
          name: senderName,
          uid: currentUid,
          prn: sender.prn,
          dept: sender.dept || '',
          avatar: sender.photoURL || sender.avatar || null
        },
        [targetUid]: {
          name: targetName,
          uid: targetUid,
          prn: target.prn,
          dept: target.dept || '',
          avatar: target.photoURL || target.avatar || null
        }
      },
      conversationKey,
      lastMessage: 'Private chat started',
      lastTimestamp: Date.now(),
      createdAt: Date.now()
    };

    const chatId = `dm_${[currentUid, targetUid].sort().join('__')}`;
    const ref = doc(db, 'student_chats', chatId);
    const persisted = await runTransaction(db, async transaction => {
      const existing = await transaction.get(ref);
      if (existing.exists()) return { id: existing.id, ...existing.data() };
      transaction.set(ref, newChat);
      return { id: chatId, ...newChat };
    });
    await this.openConversation(currentUid, chatId);
    return persisted;
  }

  /**
   * Subscribes to real-time messages within a conversation and auto-decrypts them
   */
  subscribeToMessages(chatId, conversationKey, callback, maxLimit = 50) {
    if (!chatId) return () => {};
    return this.historyRepository.subscribe({ chatId, conversationKey, isChannel: false, pageSize: maxLimit }, callback);
  }

  getMessageHistory(chatId, { isChannel = false, conversationKey, signal } = {}) {
    return this.historyRepository.readAll({ chatId, isChannel, conversationKey }, { signal });
  }

  /**
   * Subscribes to real-time student community channels & study groups
   */
  subscribeToChannels(callback, student = auth.currentUser) {
    const uid = typeof student === 'string' ? student : student?.uid;
    return this.channelRepository.subscribe(uid, (firestoreChannels, status) => {
      for (const channel of firestoreChannels) {
        if (!Array.isArray(channel.memberUids) && channelCreatorUid(channel) === auth.currentUser?.uid) {
          this.ensureChannelAccess(channel.id, { uid: auth.currentUser.uid }).catch(error => {
            console.warn('[Chat] Channel membership upgrade failed:', error.code || error.message);
          });
        }
      }
      callback(firestoreChannels, status);
    });
  }

  /**
   * Creates a new verified campus community channel or study channel in Firestore
   */
  async createChannel({ name, topic = '', category = 'Study Channel', description = '', student = null }) {
    if (!name || !name.trim()) {
      throw new Error('Channel name is required.');
    }
    const cleanName = name.trim();
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const uid = student?.uid;
    if (!uid || uid !== auth.currentUser?.uid) throw new Error('Sign in again to create a channel.');
    const studentName = student?.name || student?.displayName || 'Student';

    const createdTime = Date.now();
    const creationTimeStr = new Date(createdTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    const initialAuditLog = [
      {
        id: `audit_create_${createdTime}`,
        title: `Channel created by ${studentName}`,
        type: 'create',
        actor: uid,
        actorName: studentName,
        timestamp: createdTime,
        time: creationTimeStr
      }
    ];

    const newChannel = {
      name: cleanName,
      slug: slug || `channel-${Date.now()}`,
      topic: topic.trim() || `Channel #${slug}`,
      category: category || 'Study Channel',
      description: description.trim() || `Campus collaboration channel for #${slug}`,
      createdBy: uid,
      creatorUid: uid,
      creatorPrn: student?.prn || uid,
      createdByName: studentName,
      isChannel: true,
      createdAt: createdTime,
      membersCount: 1,
      memberUids: [uid],
      adminUids: [uid],
      bannedMembers: [],
      auditLog: initialAuditLog,
      members: [
        {
          uid: uid,
          id: uid,
          name: studentName,
          email: student?.email || '',
          prn: student?.prn || uid,
          dept: student?.dept || 'CSE',
          status: 'online',
          verified: true,
          isAdmin: true,
          isCreator: true,
          permanentAdmin: true,
          avatar: student?.photoURL || null,
          joinedAt: createdTime
        }
      ]
    };

    const docRef = await addDoc(collection(db, 'student_channels'), newChannel);

    return {
      id: docRef.id,
      ...newChannel
    };
  }

  /**
   * Subscribes to real-time messages within a community channel,
   * with user-scoped clear chat tombstone filtering.
   */
  subscribeToChannelMessages(channelId, callback, maxLimit = 60, currentStudentUid = null) {
    if (!channelId) return () => {};
    return this.historyRepository.subscribe({ chatId: channelId, isChannel: true, pageSize: maxLimit }, callback);
  }

  /**
   * Sends a message with anti-spam rate limiting, client-side encryption, and photo attachment support
   */
  async sendMessage(chatId, senderUid, {
    text = '', type = 'text', src = '', mediaUrl = '', fileName = '',
    fileSize = null, conversationKey = '', isChannel = false, senderDetails = null
  }) {
    if (!chatId || !senderUid) throw new Error('A conversation and signed-in sender are required.');
    if (type === 'text' && !String(text).trim()) throw new Error('Enter a message before sending.');
    if (type === 'text' && text.length > 5000) {
      throw new Error('Message exceeds the maximum allowable length (5,000 characters).');
    }
    const now = Date.now();
    this._recentSendTimes = this._recentSendTimes.filter(t => now - t < 3000);
    if (this._recentSendTimes.length >= 6) {
      throw new Error('Anti-spam rate limit: Please wait a moment before sending more messages.');
    }

    let storedText = text;
    if (!isChannel && type === 'text') {
      if (!conversationKey) throw new Error('The conversation encryption key is unavailable. Reopen the conversation and try again.');
      storedText = await studentE2EE.encrypt(text, conversationKey, chatId);
    }
    const message = {
      from: senderUid,
      fromName: senderDetails?.name || senderDetails?.displayName || 'Student',
      fromPrn: senderDetails?.prn || '',
      avatar: senderDetails?.avatar || senderDetails?.photoURL || null,
      type, text: storedText,
      src: src || mediaUrl || '', mediaUrl: mediaUrl || src || '',
      fileName, fileSize, timestamp: now, status: 'sent'
    };
    const summary = {
      lastMessage: type === 'text' ? '🔒 Encrypted message' : (type === 'gif' ? '🎬 Shared a GIF' : '📷 Shared a photo'),
      lastTimestamp: now,
      lastSender: senderUid,
      lastMentions: isChannel ? [...String(text).toLowerCase().matchAll(/@([a-z0-9_.-]+)/g)].map(match => match[1]) : []
    };
    // Persistence errors must reach the composer. No fabricated sent message or plaintext fallback.
    this._recentSendTimes.push(now);
    return this.messageRepository.write({ chatId, senderUid, isChannel, message, summary });
  }

  /**
   * Utility for 15-line packaging with progressive "Read more" chunks
   */
  packageLongMessage(text) {
    if (!text || typeof text !== 'string') {
      return { isPackaged: false, initialChunk: '', totalLines: 0, allChunks: [] };
    }

    const lines = text.split('\n');
    if (lines.length <= 15) {
      return {
        isPackaged: false,
        initialChunk: text,
        totalLines: lines.length,
        allChunks: [text]
      };
    }

    // Slice into chunks of 15 lines
    const chunks = [];
    for (let i = 0; i < lines.length; i += 15) {
      chunks.push(lines.slice(i, i + 15).join('\n'));
    }

    return {
      isPackaged: true,
      initialChunk: chunks[0],
      totalLines: lines.length,
      allChunks: chunks
    };
  }

  /**
   * Adds new members to an existing community channel in Firestore
   */
  async addChannelMembers(channelId, newMembers, adderStudent = null) {
    if (!channelId || !Array.isArray(newMembers) || !newMembers.length) throw new Error('Select students to add.');
    const directory = await firestoreService.getStudents();
    const resolved = newMembers.map(member => directory.find(student => sameStudentIdentity(student, member)));
    if (resolved.some(student => !student?.uid || student.allowChatting === false)) throw new Error('Only enrolled students with chat access can join.');
    const enrolled = [...new Map(resolved.map(student => [student.uid, student])).values()];
    const updated = await this.mutateChannel(channelId, adderStudent, channel => {
      const existing = new Set((channel.members || []).map(member => member.uid));
      const banned = new Set(channel.bannedMembers || []);
      if (enrolled.some(student => banned.has(student.uid) || banned.has(student.prn))) throw new Error('A selected student is banned from this channel.');
      const added = enrolled.filter(student => !existing.has(student.uid)).map(student => {
        existing.add(student.uid);
        return { uid: student.uid, id: student.uid, name: student.name || student.fullName || student.displayName,
          prn: student.prn, email: student.email || '', dept: student.dept || '', isAdmin: false,
          avatar: student.photoURL || student.avatar || null, joinedAt: Date.now() };
      });
      const members = [...(channel.members || []), ...added];
      const actorName = adderStudent.name || adderStudent.displayName;
      return { members, auditLog: [...(channel.auditLog || []), ...added.map((member, index) => ({
        id: `audit_add_${Date.now()}_${index}`, title: `${member.name} added by ${actorName}`,
        type: 'add_member', actor: adderStudent.uid, actorName, target: member.uid, targetName: member.name,
        timestamp: Date.now(), time: new Date().toLocaleString()
      }))] };
    });
    return updated.members;
  }

  /**
   * Generates a time-expiring encrypted invitation token for a channel
   */
  async generateChannelInviteToken({ channelId, durationHours = 24 }) {
    const uid = auth.currentUser?.uid;
    const duration = Number(durationHours);
    if (!channelId || !uid || !Number.isFinite(duration) || duration <= 0 || duration > 168) throw new Error('Choose an invite duration up to one week.');
    const channel = await this.ensureChannelAccess(channelId, { uid });
    const token = `KRC-INVITE-${crypto.randomUUID()}`;
    const expiresAt = Date.now() + duration * 3600000;
    await setDoc(doc(db, 'student_channel_invites', token), {
      channelId, channelName: channel.name, createdBy: uid, createdAt: Date.now(), expiresAt
    });
    return { token, expiresAt, inviteUrl: `${window.location.origin}/student/chat?invite=${encodeURIComponent(token)}` };
  }

  async validateAndJoinChannelInvite(token, student) {
    if (!/^KRC-INVITE-[a-f0-9-]{36}$/i.test(token || '')) throw new Error('This invitation is invalid. Ask a channel administrator for a new link.');
    if (!student?.uid || student.uid !== auth.currentUser?.uid) throw new Error('Sign in with your enrolled student account.');
    const directory = await firestoreService.getStudents();
    const enrolled = directory.find(peer => peer.uid === student.uid && peer.allowChatting !== false);
    if (!enrolled) throw new Error('Campus chat access is required to join.');
    return runTransaction(db, async transaction => {
      const invite = await transaction.get(doc(db, 'student_channel_invites', token));
      if (!invite.exists() || invite.data().expiresAt <= Date.now()) throw new Error('This invitation has expired or was revoked.');
      const payload = invite.data();
      const channelRef = doc(db, 'student_channels', payload.channelId);
      const snapshot = await transaction.get(channelRef);
      if (!snapshot.exists()) throw new Error('This channel no longer exists.');
      const channel = snapshot.data();
      if ((channel.bannedMembers || []).some(id => id === enrolled.uid || id === enrolled.prn)) throw new Error('You cannot rejoin this channel while banned.');
      if ((channel.memberUids || []).includes(enrolled.uid)) return { ...payload, channel: { id: snapshot.id, isChannel: true, ...channel } };
      const member = { uid: enrolled.uid, id: enrolled.uid, name: enrolled.name || enrolled.fullName || enrolled.displayName,
        prn: enrolled.prn, email: enrolled.email || '', dept: enrolled.dept || '', avatar: enrolled.photoURL || enrolled.avatar || null,
        isAdmin: false, isCreator: false, permanentAdmin: false, joinedAt: Date.now() };
      const memberUids = [...(channel.memberUids || []), enrolled.uid];
      const changes = { members: [...(channel.members || []), member], memberUids, membersCount: memberUids.length, updatedAt: Date.now() };
      // The server checks this private join proof and the persisted invite in the same atomic transaction.
      transaction.set(doc(db, 'student_channels', snapshot.id, 'join_requests', enrolled.uid), { token, uid: enrolled.uid, createdAt: Date.now() });
      transaction.update(channelRef, changes);
      return { ...payload, channel: { id: snapshot.id, isChannel: true, ...channel, ...changes } };
    });
  }

  async leaveChannel(channelId, student) {
    if (!student?.uid || student.uid !== auth.currentUser?.uid) throw new Error('Sign in again to leave this channel.');
    const ref = doc(db, 'student_channels', channelId);
    await runTransaction(db, async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error('This channel no longer exists.');
      const channel = snapshot.data();
      if (channelCreatorUid(channel) === student.uid) throw new Error('The channel creator must remain a member.');
      const memberUids = (channel.memberUids || []).filter(uid => uid !== student.uid);
      transaction.update(ref, { memberUids, adminUids: (channel.adminUids || []).filter(uid => uid !== student.uid), membersCount: memberUids.length, updatedAt: Date.now() });
    });
    localStorage.removeItem(`krc_group_exited_${channelId}_${student.uid}`);
    window.dispatchEvent(new CustomEvent('krc_group_left', { detail: { userId: student.uid, groupId: channelId } }));
  }

  /**
   * Identifies if a target member is the immutable creator of a channel
   */
  isChannelCreator(channel, member) {
    return !!member?.uid && member.uid === channelCreatorUid(channel);
  }

  async mutateChannel(channelId, actor, change) {
    if (!actor?.uid || actor.uid !== auth.currentUser?.uid) throw new Error('Sign in again to manage this channel.');
    const ref = doc(db, 'student_channels', channelId);
    return runTransaction(db, async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error('This channel no longer exists.');
      const stored = snapshot.data();
      const channel = { ...stored, members: activeChannelMembers(stored) };
      if (!canManageChannel(channel, actor.uid)) throw new Error('Only channel administrators can make this change.');
      const changes = change(channel);
      const updated = { ...channel, ...changes };
      const payload = { ...changes, members: updated.members, ...channelAccessFields(updated), updatedAt: Date.now() };
      transaction.update(ref, payload);
      return { id: channelId, ...channel, ...payload };
    });
  }

  async ensureChannelAccess(channelId, actor) {
    return this.mutateChannel(channelId, actor, () => ({}));
  }

  async manageChannelMember(channelId, member, actor, action, reason = '') {
    const updated = await this.mutateChannel(channelId, actor, channel => {
      const target = channel.members.find(item => item.uid === member?.uid);
      if (!target) throw new Error('This student is no longer a channel member.');
      const actorName = actor.name || actor.displayName;
      const timestamp = Date.now();
      const labels = { kick: 'removed', ban: 'banned', promote: 'promoted', demote: 'demoted' };
      return { ...changeChannelMember(channel, target.uid, action), auditLog: [...(channel.auditLog || []), {
        id: `audit_${action}_${timestamp}`, title: `${target.name} ${labels[action]} by ${actorName}`,
        type: `${action}_member`, actor: actor.uid, actorName, target: target.uid, targetName: target.name,
        timestamp, time: new Date(timestamp).toLocaleString(), ...(reason ? { reason } : {})
      }] };
    });
    // Membership in the central channel is authoritative. Never write to another user's private folder.
    return updated;
  }

  async kickChannelMember(channelId, member, actor) {
    return (await this.manageChannelMember(channelId, member, actor, 'kick')).members;
  }

  async banChannelMember(channelId, member, actor, reason = '') {
    const updated = await this.manageChannelMember(channelId, member, actor, 'ban', reason);
    return { updatedMembers: updated.members, updatedBannedMembers: updated.bannedMembers };
  }

  async promoteChannelMemberToAdmin(channelId, member, actor) {
    return (await this.manageChannelMember(channelId, member, actor, 'promote')).members;
  }

  async demoteChannelAdmin(channelId, member, actor) {
    return (await this.manageChannelMember(channelId, member, actor, 'demote')).members;
  }

  async reportChannel(channelId, student, reason) {
    if (!channelId || !student?.uid || student.uid !== auth.currentUser?.uid || !reason?.trim()) throw new Error('Sign in to save a channel report.');
    // The reporter and existing campus administrators can read this private record.
    const ref = await addDoc(collection(db, 'users', student.uid, 'chats', channelId, 'reports'), {
      channelId, reporterUid: student.uid, reporterName: student.name || student.displayName,
      reason: reason.trim().slice(0, 500), createdAt: Date.now(), status: 'submitted'
    });
    return ref.id;
  }

  /** Save canonical own-account names atomically; readers enrich history from this directory. */
  async propagateUserNameChange(uid, newName, oldName = '', profilePatch = {}) {
    const cleanName = String(newName || '').trim().replace(/\s+/g, ' ');
    if (!uid || uid !== auth.currentUser?.uid || !cleanName) throw new Error('Sign in and enter your full student name.');
    if (cleanName.length > 120) throw new Error('Your name must be at most 120 characters.');
    const names = { name: cleanName, displayName: cleanName, fullName: cleanName };
    await runTransaction(db,async transaction=>{
      const ref=doc(db,'users',uid),snapshot=await transaction.get(ref);
      if(!snapshot.exists())throw new Error('Your enrolled profile could not be found.');
      transaction.set(ref,names,{merge:true});
      const peer=studentDirectoryProjection({...snapshot.data(),...names,updatedAt:new Date().toISOString()},uid);
      if(peer)transaction.set(doc(db,'student_directory',uid),peer);
      if(profilePatch.syncStudentProfile!==false)transaction.set(doc(db,'student_social_profiles',uid),{
        ...names,...(typeof profilePatch.bio==='string'?{bio:profilePatch.bio.trim().slice(0,1000)}:{})
      },{merge:true});
    });
    window.dispatchEvent(new CustomEvent('krc_user_name_changed', { detail: { uid, newName: cleanName, timestamp: Date.now() } }));
    return cleanName;
  }

  /**
   * Teardown all active subscriptions
   */
  cleanupAllListeners() {
    this._activeListeners.forEach((unsub) => {
      try { unsub(); } catch (e) {}
    });
    this._activeListeners.clear();
  }

  _cleanupListener(key) {
    if (this._activeListeners.has(key)) {
      try { this._activeListeners.get(key)(); } catch (e) {}
      this._activeListeners.delete(key);
    }
  }

  _getDemoConversations() {
    return [];
  }
}

export const studentChatService = new StudentChatService();
