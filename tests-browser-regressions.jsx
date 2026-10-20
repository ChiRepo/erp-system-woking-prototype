import {runMessageDeletionChecks} from './tests-browser-message-deletion.jsx';
import React, { useState, Profiler } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '/src/contexts/authSession.js';
import RoleGuard from '/src/guards/RoleGuard.jsx';
import { isAdminIdentity, registeredRole, dashboardPath, enrollmentAllowsSession } from '/src/utils/authPolicy.js';
import { mergeStudentDirectory } from '/src/services/studentDirectory.js';
import { StudentSearchService } from '/src/services/studentSearchService.js';
import SearchFeedView from '/src/components/chat/views/SearchFeedView.jsx';
import { normalizeFullName, createEnrollmentId } from '/src/utils/enrollmentIdentity.js';
import { CHAT_ARCHETYPES } from '/src/constants/chatThemes.js';
import { studentE2EE } from '/src/services/studentE2EE.js';
import { StudentChatService, studentChatService } from '/src/services/studentChatService.js';
import { studentSearchService } from '/src/services/studentSearchService.js';
import ChatRoom from '/src/components/chat/ChatRoom.jsx';
import { ThemeProvider } from '/src/contexts/ThemeContext.jsx';
import { resolveConversationPeer } from '/src/services/conversationIdentity.js';
import { visibleConversationThreads } from '/src/services/chatThreadState.js';
import { channelNotificationPolicy, messageNoticeAllowed, chatNotificationPreferences } from '/src/services/chatNotificationPreferences.js';
import { canManageChannel, changeChannelMember, channelAccessFields, activeChannelMembers } from '/src/services/channelPolicy.js';
import { chatWorkspacePreferences } from '/src/services/chatWorkspacePreferences.js';
import { createSocialPostRepository } from '/src/services/socialPostRepository.js';
import { StudentSocialService, studentSocialService } from '/src/services/studentSocialService.js';
import { studentRelationshipService } from '/src/services/studentRelationshipService.js';
import DedicatedProfileView from '/src/components/chat/views/DedicatedProfileView.jsx';
import CustomAlertModal from '/src/components/common/CustomAlertModal.jsx';
import { CloudStorageService, cloudStorageService } from '/src/services/cloudStorageService.js';
import { sanitizeEnrollmentData, sanitizeEnrollmentRoster } from '/src/utils/enrollmentCache.js';
import { useChatSelection } from '/src/hooks/useChatSelection.js';
import ConversationList from '/src/components/chat/ConversationList.jsx';
import { credentialService } from '/src/services/credentialService.js';
import { createJoinedChannelRepository } from '/src/services/joinedChannelRepository.js';
import { runChatHistoryChecks } from './tests-browser-chat-history.jsx';
import { runGoogleEntryChecks } from './tests-browser-google-entry.js';
import { runLoginContinuationChecks } from './tests-browser-login-continuation.jsx';
import { runTimetableChecks } from './tests-browser-timetable.js';
import { runScheduleIdentityChecks } from './tests-browser-schedule-identity.jsx';
import { runAcademicDataChecks } from './tests-browser-academic-data.jsx';
import { runClassroomAttendanceChecks } from './tests-browser-classroom-attendance.jsx';
import { runDirectoryPrivacyChecks } from './tests-browser-directory-privacy.jsx';
import { runChatClearanceChecks } from './tests-browser-chat-clearance.jsx';
import { runGoogleEnrollmentChecks } from './tests-browser-google-enrollment.jsx';
import { runAdminClearanceChecks } from './tests-browser-admin-clearance.jsx';
import '/src/styles/globals.css';

const base = { uid: 'auth-tanmay', _documentId: 'auth-tanmay', prn: 'PRN-2026-081', email: 'tanmay@krc.edu', googleEmail: 'tanmay.personal@example.test', name: 'Tanmay Deshpande', displayName: 'Tanmay Deshpande', dept: 'CSE', sem: 'Sem V', role: 'student', rollNumber: '42', allowChatting: true };
const peer = { uid: 'auth-riya', _documentId: 'auth-riya', prn: 'PRN-2026-082', email: 'riya@example.test', name: 'Riya Patil', dept: 'AI & DS', sem: 'Sem II', role: 'student', allowChatting: true };
const self = { uid: 'self-auth', prn: 'PRN-SELF', email: 'self@example.test', name: 'Current Student', role: 'student', dept: 'IT' };
const settle = () => new Promise(resolve => setTimeout(resolve, 30));
function repository(records = [base, peer]) {
  let current = records;
  let callback;
  return {
    getStudents: async () => mergeStudentDirectory(current),
    subscribeStudents(cb) { callback = cb; queueMicrotask(() => cb(mergeStudentDirectory(current), { loading: false, error: null })); return () => { callback = null; }; },
    emit(records, status = {}) { current = records; callback?.(mergeStudentDirectory(current), { loading: false, error: null, ...status }); }
  };
}
const uiRepository = repository();
const uiService = new StudentSearchService(uiRepository);
const guardRoot = createRoot(document.getElementById('guard-fixture'));
const report = document.getElementById('report');
let running = false;
async function run() {
  if (running) return;
  running = true;
  const runButton = document.getElementById('run-checks');
  runButton.disabled = true;
  document.getElementById('summary').textContent = 'Running…';
  report.replaceChildren();
  let passed = 0, failed = 0;
  const check = (label, condition) => {
    const li = document.createElement('li');
    li.textContent = `${condition ? 'PASS' : 'FAIL'} — ${label}`;
    li.style.color = condition ? '#047857' : '#b91c1c';
    report.append(li);
    condition ? passed++ : failed++;
  };
  try {
    check('Google administrator uses the exact requested email and active provider', isAdminIdentity('chinmayc3003@gmail.com', 'google.com', true));
    check('Email administrator uses password sign-in', isAdminIdentity('admin@krc.edu', 'password'));
    check('Admin Gmail through password is denied', !isAdminIdentity('chinmayc3003@gmail.com', 'password', true));
    check('Admin institutional email through Google is denied', !isAdminIdentity('admin@krc.edu', 'google.com', true));
    check('Unverified Google identity is denied', !isAdminIdentity('chinmayc3003@gmail.com', 'google.com', false));
    check('Former extra admin and admin-looking addresses are denied', ['chinmayc@gmail.com', 'jyotsnachaudhari999@gmail.com', 'admin@mitwpu.edu.in', 'outsider@admin.krc.edu'].every(email => !isAdminIdentity(email, 'google.com', true)));
    check('Unknown account resolves to the landing path', registeredRole({ role: 'guest' }) === 'guest' && dashboardPath('guest') === '/');
    check('An incomplete student placeholder does not establish enrollment', registeredRole({ role: 'student' }) === 'guest');
    check('Full-name normalization preserves both given and family names', normalizeFullName('  Tanmay   Deshpande ') === 'Tanmay Deshpande');
    check('New enrollment IDs do not depend on roster size', new Set(Array.from({ length: 1000 }, () => createEnrollmentId())).size === 1000);
    check('Entered full name belongs to a registered enrollment', registeredRole(base) === 'student');
    check('Institutional password sessions retain their enrolled student role', enrollmentAllowsSession(base, base.email, 'password'));
    check('A password session cannot use a different enrolled Google address as institutional identity', !enrollmentAllowsSession(base, base.googleEmail, 'password'));
    check('A verified Google session can resolve its explicitly enrolled Google address', enrollmentAllowsSession(base, base.googleEmail, 'google.com', true));
    check('Google enrollment requires a verified email in the active token', !enrollmentAllowsSession(base, base.googleEmail, 'google.com', false));
    check('An unknown verified Google address still has no enrollment', !enrollmentAllowsSession(base, 'unknown@example.test', 'google.com', true));
    check('Linked provider metadata cannot authorize an unsupported active sign-in provider', !enrollmentAllowsSession(base, base.email, 'custom', true));
    check('A stale copied profile cannot grant access to a mismatched account identity', !enrollmentAllowsSession(base, peer.email, 'password'));
    const facultyEnrollment = { role: 'faculty', employeeId: 'FAC-FIXTURE', email: 'faculty@example.test', googleEmail: 'faculty.google@example.test' };
    check('Faculty provider binding permits its own institutional password and verified Google sessions only',
      enrollmentAllowsSession(facultyEnrollment, facultyEnrollment.email, 'password') &&
      enrollmentAllowsSession(facultyEnrollment, facultyEnrollment.googleEmail, 'google.com', true) &&
      !enrollmentAllowsSession(facultyEnrollment, facultyEnrollment.googleEmail, 'password'));
    const legacyEnrollment = { ...base, startingPassword: 'fixture-only-secret', PASSWORD_HASH: 'fixture-hash',
      mustChangePassword: true, nested: { old_password: 'fixture-only-old', displayName: base.name, tags: ['student'] } };
    const sanitizedEnrollment = sanitizeEnrollmentData(legacyEnrollment);
    check('Enrollment cache sanitization removes nested legacy credentials while preserving full names and lifecycle flags',
      !JSON.stringify(sanitizedEnrollment).includes('fixture-only') && !('PASSWORD_HASH' in sanitizedEnrollment) &&
      sanitizedEnrollment.name === base.name && sanitizedEnrollment.nested.displayName === base.name && sanitizedEnrollment.mustChangePassword === true);
    const mergedRoster = sanitizeEnrollmentRoster([{ ...peer, startingPassword: 'fixture-only-new' }, legacyEnrollment]);
    check('Adding another enrollment cannot preserve an earlier row’s temporary password or mutate its source record',
      mergedRoster.length === 2 && !JSON.stringify(mergedRoster).includes('fixture-only') && legacyEnrollment.startingPassword === 'fixture-only-secret');
    check('The actual merged student directory removes nested credential values before publishing peers',
      !JSON.stringify(mergeStudentDirectory([legacyEnrollment])).includes('fixture-only'));
    const lifecycleKey = 'krc_account_security_lifecycle';
    const savedLifecycle = localStorage.getItem(lifecycleKey);
    try {
      credentialService.saveAllAccounts({ fixture: legacyEnrollment });
      check('Account lifecycle storage preserves onboarding flags without storing credential values',
        !localStorage.getItem(lifecycleKey).includes('fixture-only') && credentialService.getAllAccounts().fixture.mustChangePassword === true);
    } finally {
      if (savedLifecycle === null) localStorage.removeItem(lifecycleKey); else localStorage.setItem(lifecycleKey, savedLifecycle);
    }
    let socialWrites = 0, rejectSocial = true;
    const postsRepository = createSocialPostRepository({
      currentUid: () => base.uid,
      create: async () => { ++socialWrites; if (rejectSocial) throw new Error('Fixture post denied'); return 'persisted-post'; },
      read: async () => ({ authorUid: base.uid }),
      remove: async () => { ++socialWrites; if (rejectSocial) throw new Error('Fixture delete denied'); },
      appendComment: async () => { ++socialWrites; if (rejectSocial) throw new Error('Fixture comment denied'); },
      toggleLike: async () => { ++socialWrites; }
    });
    const social = new StudentSocialService(postsRepository);
    const localArtifactsBefore = localStorage.getItem('krc_campus_artifacts_cache');
    const mutations = [() => social.createArtifact({ authorUid: base.uid, authorName: base.name, title: 'Fixture post', mediaUrl: '/images/campus_main.jpg' }),
      () => social.deleteArtifact('fixture-post', base.uid),
      () => social.addComment('fixture-post', { authorUid: base.uid, authorName: base.name, text: 'Fixture comment' })];
    const socialResults = await Promise.allSettled(mutations.map(mutate => mutate()));
    check('Rejected post, comment and deletion writes never return local-only success', socialResults.every(result => result.status === 'rejected') && socialWrites === 3 && localStorage.getItem('krc_campus_artifacts_cache') === localArtifactsBefore);
    const beforeSpoof = socialWrites;
    const spoofResults = await Promise.allSettled([
      social.createArtifact({ authorUid: peer.uid, mediaUrl: '/images/campus_main.jpg' }),
      social.addComment('fixture-post', { authorUid: peer.uid, text: 'Spoofed fixture' }),
      social.deleteArtifact('fixture-post', peer.uid)
    ]);
    check('Another account cannot publish, comment or delete through the signed-in mutation service', spoofResults.every(result => result.status === 'rejected') && socialWrites === beforeSpoof);
    rejectSocial = false;
    const savedPost = await mutations[0]();
    const savedComment = await mutations[2]();
    check('Successful social writes return the persisted post ID and actual comment author', savedPost.id === 'persisted-post' && savedPost.authorName === base.name && savedComment.authorUid === base.uid && savedComment.text === 'Fixture comment');
    let transfers = 0, removals = 0;
    const photoKey = `users/${base.uid}/saved.png`;
    const media = new CloudStorageService({
      publicUrl: key => `/fixture-media/${key}`,
      upload: async () => { ++transfers; throw new Error('Fixture storage denied'); },
      list: async () => [],
      remove: async () => { ++removals; throw new Error('Fixture removal denied'); }
    }, () => base.uid);
    const mediaCacheKey = `krc_cloud_photos_${base.uid}`;
    const mediaCacheBefore = localStorage.getItem(mediaCacheKey);
    const savedCache = JSON.stringify([{ key: photoKey, url: `/fixture-media/${photoKey}` }]);
    try {
      localStorage.setItem(mediaCacheKey, savedCache);
      const file = new File([new Uint8Array([1, 2, 3])], 'fixture.png', { type: 'image/png' });
      const failedTransfers = await Promise.allSettled([
        media.uploadUserProfilePhoto(base.uid, file), media.uploadChatPhoto('fixture-chat', base.uid, file), media.uploadStudentArtifact(base.uid, file)
      ]);
      check('Rejected avatar, chat photo and artifact transfers never return cached success', failedTransfers.every(result => result.status === 'rejected') && transfers === 3 && localStorage.getItem(mediaCacheKey) === savedCache);
      const wrongOwner = await Promise.allSettled([media.uploadUserProfilePhoto(peer.uid, file)]);
      check('The photo service rejects another account before starting a transfer', wrongOwner[0].status === 'rejected' && transfers === 3);
      const deletion = await Promise.allSettled([media.deleteUserProfilePhoto(base.uid, photoKey)]);
      check('A rejected remote photo deletion preserves the saved library entry', deletion[0].status === 'rejected' && removals === 1 && localStorage.getItem(mediaCacheKey) === savedCache);
      const outside = await Promise.allSettled([media.deleteUserProfilePhoto(base.uid, `users/${peer.uid}/saved.png`)]);
      check('Deleting an object outside the signed-in photo folder never reaches storage', outside[0].status === 'rejected' && removals === 1);
      check('A remote photo listing does not resurrect cache-only objects', (await media.listUserProfilePhotos(base.uid)).length === 0);
    } finally {
      if (mediaCacheBefore === null) localStorage.removeItem(mediaCacheKey); else localStorage.setItem(mediaCacheKey, mediaCacheBefore);
    }
    const legacyThread = { participants: [base.uid, base.prn, peer.uid, peer.prn], participantDetails: { [base.uid]: base, [peer.uid]: peer } };
    check('Legacy participant PRNs cannot become the current student\'s peer', resolveConversationPeer(legacyThread, base).uid === peer.uid);
    check('Both participants see the other full name in a legacy thread', resolveConversationPeer(legacyThread, base).details.name === peer.name && resolveConversationPeer(legacyThread, peer).details.name === base.name);
    check('A historical PRN collision cannot hide a distinct peer account', resolveConversationPeer({ ...legacyThread, participantDetails: { [base.uid]: base, [peer.uid]: { ...peer, prn: base.prn } } }, base).uid === peer.uid);
    const channel = { creatorUid: base.uid, createdBy: base.uid, createdByName: base.name, members: [{ ...base, isAdmin: true }, { ...peer, name: base.name, isAdmin: false }], memberUids: [base.uid, peer.uid], adminUids: [base.uid] };
    check('Sharing the creator’s display name grants no channel administrator rights', !canManageChannel(channel, peer.uid) && canManageChannel(channel, base.uid));
    check('Missing channel creator fields do not grant administrator rights', !canManageChannel({}, peer.uid));
    check('Channel UID access fields represent the actual distinct members', channelAccessFields(channel).memberUids.length === 2 && channelAccessFields(channel).adminUids.join() === base.uid);
    let creatorProtected = false;
    try { changeChannelMember(channel, base.uid, 'demote'); } catch { creatorProtected = true; }
    check('The creator’s authenticated identity cannot be demoted', creatorProtected);
    const bannedChannel = { ...channel, ...changeChannelMember(channel, peer.uid, 'ban') };
    check('A ban removes message access and records the target UID', !bannedChannel.memberUids.includes(peer.uid) && bannedChannel.bannedMembers.includes(peer.uid));
    const promotedChannel = { ...channel, ...changeChannelMember(channel, peer.uid, 'promote') };
    check('Promoting a member updates the canonical administrator UID list', canManageChannel(promotedChannel, peer.uid));
    const demotedChannel = { ...promotedChannel, ...changeChannelMember(promotedChannel, peer.uid, 'demote') };
    check('Demoting a member removes administrator authority', !canManageChannel(demotedChannel, peer.uid));
    check('A departed member’s historical metadata does not restore membership', !activeChannelMembers({ ...channel, memberUids: [base.uid] }).some(member => member.uid === peer.uid));
    check('Rejoining as a regular member cannot inherit historical administrator flags', !canManageChannel({ ...promotedChannel, adminUids: [base.uid], members: [...promotedChannel.members, { ...peer, isAdmin: false }] }, peer.uid));
    let channelPool = [
      { id: 'old-joined-channel', createdAt: 1, memberUids: [base.uid], createdBy: peer.uid, creatorUid: peer.uid },
      ...Array.from({ length: 70 }, (_, index) => ({ id: `unrelated-channel-${index}`, createdAt: index + 2, memberUids: [peer.uid], creatorUid: peer.uid, createdBy: peer.uid }))
    ];
    const channelWatchers = new Map(), channelQueries = [];
    let scopedChannels = [], scopedStatus, channelEmissions = 0, stoppedChannelQueries = 0;
    const recordsFor = (field, uid) => channelPool.filter(item => field === 'memberUids' ? item.memberUids?.includes(uid) : item[field] === uid);
    const scopedChannelRepository = createJoinedChannelRepository((field, operator, uid, next, fail) => {
      channelQueries.push({ field, operator, uid });
      channelWatchers.set(field, { next, fail, uid });
      next(recordsFor(field, uid));
      return () => { stoppedChannelQueries++; };
    });
    const scopedChannelService = new StudentChatService({}, scopedChannelRepository);
    const stopScopedChannels = scopedChannelService.subscribeToChannels((channels, status) => {
      scopedChannels = channels; scopedStatus = status; channelEmissions++;
    }, base);
    try {
      check('An older joined channel remains visible despite more than fifty newer unrelated campus channels',
        scopedChannels.length === 1 && scopedChannels[0].id === 'old-joined-channel' && channelQueries.length === 3 &&
        channelQueries.every(item => item.uid === base.uid) && channelQueries.find(item => item.field === 'memberUids')?.operator === 'array-contains');
      const ownedChannel = { id: 'owned-legacy-channel', name: 'Earlier metadata', createdAt: 0, updatedAt: 1, createdBy: base.uid, creatorUid: base.uid };
      channelPool = [...channelPool, ownedChannel];
      for (const [field, watcher] of channelWatchers) watcher.next(recordsFor(field, watcher.uid));
      channelWatchers.get('creatorUid').next([{ ...ownedChannel, name: 'Latest metadata', updatedAt: 20 }]);
      check('Legacy creator queries yield one channel and an older duplicate cannot overwrite newer metadata',
        scopedChannels.filter(item => item.id === ownedChannel.id).length === 1 && scopedChannels.find(item => item.id === ownedChannel.id)?.name === 'Latest metadata');
      channelPool = channelPool.filter(item => item.id !== 'old-joined-channel');
      channelWatchers.get('memberUids').next(recordsFor('memberUids', base.uid));
      check('Realtime membership removal clears a departed channel while preserving other joined channels',
        !scopedChannels.some(item => item.id === 'old-joined-channel') && scopedChannels.some(item => item.id === ownedChannel.id));
      channelWatchers.get('createdBy').fail();
      const errorVisible = !!scopedStatus.error;
      channelWatchers.get('createdBy').next(recordsFor('createdBy', base.uid));
      const recovered = !scopedStatus.error;
      stopScopedChannels();
      const emissionsBeforeStop = channelEmissions;
      channelWatchers.get('memberUids').next([]);
      check('Joined-channel errors are observable, recovery clears them, and teardown stops every query and late callback',
        errorVisible && recovered && stoppedChannelQueries === 3 && channelEmissions === emissionsBeforeStop);
    } finally { if (stoppedChannelQueries === 0) stopScopedChannels(); }
    await runChatHistoryChecks(check, base, peer);
    await runMessageDeletionChecks(check, base, peer);
    await runAdminClearanceChecks(check, base);
    await runGoogleEnrollmentChecks(check, base);
    await runGoogleEntryChecks(check);
    await runLoginContinuationChecks(check);
    await runTimetableChecks(check);
    await runScheduleIdentityChecks(check);
    await runAcademicDataChecks(check);
    await runClassroomAttendanceChecks(check);
    await runDirectoryPrivacyChecks(check);
    await runChatClearanceChecks(check, base, peer);
    const roomFixture = document.createElement('div');
    roomFixture.hidden = true;
    document.body.append(roomFixture);
    const roomRoot = createRoot(roomFixture);
    const originalMessages = studentChatService.subscribeToMessages;
    const originalSend = studentChatService.sendMessage;
    const originalDirectory = studentSearchService.subscribeStudents;
    const originalWorkspaceSubscribe = chatWorkspacePreferences.subscribe;
    const originalWorkspaceChange = chatWorkspacePreferences.change;
    let workspaceCallback, roomPreferences = {};
    let roomCommits = 0, roomError = null;
    class RoomBoundary extends React.Component {
      state = { failed: false };
      static getDerivedStateFromError() { return { failed: true }; }
      componentDidCatch(error) { roomError = error; }
      render() { return this.state.failed ? null : this.props.children; }
    }
    try {
      studentChatService.subscribeToMessages = (_id, _key, callback) => { callback([{ id: 'fixture-message', type: 'text', text: 'Preserved fixture history', from: peer.uid, timestamp: 1 }]); return () => {}; };
      studentSearchService.subscribeStudents = callback => { callback([base, peer]); return () => {}; };
      chatWorkspacePreferences.subscribe = (_uid, _id, callback) => { workspaceCallback = callback; callback(roomPreferences); return () => {}; };
      chatWorkspacePreferences.change = async (_uid, _id, change) => { roomPreferences = change(roomPreferences); workspaceCallback(roomPreferences); };
      flushSync(() => roomRoot.render(<AuthContext.Provider value={{ user: base }}><ThemeProvider><RoomBoundary><Profiler id="dm-room" onRender={() => { if (++roomCommits > 20) throw new Error('DM render loop'); }}><ChatRoom chat={{ id: 'fixture-dm', ...legacyThread }} currentStudent={base} onBack={() => {}} /></Profiler></RoomBoundary></ThemeProvider></AuthContext.Provider>));
      await settle();
      check('The actual direct-message room settles without a participant render loop', !roomError && roomCommits < 10 && roomFixture.textContent.includes(peer.name));
      studentChatService.sendMessage = async () => { throw new Error('Fixture send denied'); };
      const composer = roomFixture.querySelector('input[placeholder^="Send message"]');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(composer, 'Keep this unsent draft');
      composer.dispatchEvent(new Event('input', { bubbles: true }));
      await settle();
      roomFixture.querySelector('button[type="submit"]').click();
      await settle();
      check('The actual composer retains its draft and shows a failed database send', composer.value === 'Keep this unsent draft' && roomFixture.textContent.includes('Fixture send denied'));
      roomFixture.querySelector('button[aria-label="Star message"]').click();
      await settle();
      check('The actual message star reflects the saved private preference', !!roomFixture.querySelector('button[aria-label="Unstar message"]'));
      chatWorkspacePreferences.change = async () => { throw new Error('Fixture preference denied'); };
      roomFixture.querySelector('button[aria-label="Unstar message"]').click();
      await settle();
      check('A rejected preference write keeps the saved star and displays the error', !!roomFixture.querySelector('button[aria-label="Unstar message"]') && roomFixture.textContent.includes('Fixture preference denied'));
      chatWorkspacePreferences.change = async (_uid, _id, change) => { roomPreferences = change(roomPreferences); workspaceCallback(roomPreferences); };
      roomPreferences = { hiddenBefore: 2 };
      workspaceCallback(roomPreferences);
      await settle();
      const hidden = !roomFixture.textContent.includes('Preserved fixture history');
      [...roomFixture.querySelectorAll('button')].find(button => button.textContent === 'Restore history').click();
      await settle();
      check('Hidden history can be restored through the actual room without deleting messages', hidden && roomFixture.textContent.includes('Preserved fixture history'));
    } finally {
      flushSync(() => roomRoot.unmount());
      roomFixture.remove();
      studentChatService.subscribeToMessages = originalMessages;
      studentChatService.sendMessage = originalSend;
      studentSearchService.subscribeStudents = originalDirectory;
      chatWorkspacePreferences.subscribe = originalWorkspaceSubscribe;
      chatWorkspacePreferences.change = originalWorkspaceChange;
    }
    const selectionFixture = document.createElement('div');
    selectionFixture.hidden = true;
    document.body.append(selectionFixture);
    const selectionRoot = createRoot(selectionFixture);
    const selectionOriginals = Object.fromEntries(['subscribeToConversations', 'subscribeToChannels', 'subscribeToMessages', 'openConversation', 'closeConversation'].map(key => [key, studentChatService[key]]));
    const selectionDirectoryOriginal = studentSearchService.subscribeStudents;
    const selectionWorkspaceOriginals = { all: chatWorkspacePreferences.subscribeAll, one: chatWorkspacePreferences.subscribe };
    const secondPeer = { ...peer, uid: 'fixture-second-peer', prn: 'PRN-FIXTURE-SECOND', email: 'second@example.test', name: 'Second Fixture Peer' };
    const threadA = { id: 'fixture-selection-a', ...legacyThread };
    const threadB = { id: 'fixture-selection-b', participants: [base.uid, secondPeer.uid], participantDetails: { [base.uid]: base, [secondPeer.uid]: secondPeer } };
    const openCompletions = new Map();
    let closeCompletion, selections = 0, selectionUnmounted = false;
    function SelectionFixture() {
      const selection = useChatSelection();
      const select = chat => { selections++; selection.selectChat(chat); };
      return <AuthContext.Provider value={{ user: base }}><ThemeProvider>
        <output aria-label="Selected fixture conversation">{selection.activeChat?.id || 'none'}</output>
        <button aria-label="Select fixture A directly" onClick={() => select(threadA)}>A</button>
        <button aria-label="Select fixture B directly" onClick={() => select(threadB)}>B</button>
        <button aria-label="Leave fixture view" onClick={selection.cancelChatAction}>Leave</button>
        <ConversationList currentStudent={base} activeChat={selection.activeChat} onSelectChat={select}
          onCloseChat={selection.closeChat} beginChatAction={selection.beginChatAction} />
        {selection.activeChat && <ChatRoom chat={selection.activeChat} currentStudent={base} onBack={selection.closeChat}
          onSelectChat={select} beginChatAction={selection.beginChatAction} />}
      </ThemeProvider></AuthContext.Provider>;
    }
    const selectedConversation = () => selectionFixture.querySelector('[aria-label="Selected fixture conversation"]')?.textContent;
    const directChoice = which => selectionFixture.querySelector(`[aria-label="Select fixture ${which} directly"]`).click();
    const openPeer = name => [...selectionFixture.querySelectorAll('button')].find(button => !button.title && button.textContent.includes(name)).click();
    try {
      studentChatService.subscribeToConversations = (_uid, callback) => { callback([threadA, threadB]); return () => {}; };
      studentChatService.subscribeToChannels = callback => { callback([]); return () => {}; };
      studentChatService.subscribeToMessages = (_id, _key, callback) => { callback([]); return () => {}; };
      studentChatService.openConversation = (_uid, id) => new Promise(resolve => openCompletions.set(id, resolve));
      studentChatService.closeConversation = () => new Promise(resolve => { closeCompletion = resolve; });
      studentSearchService.subscribeStudents = callback => { callback([base, peer, secondPeer]); return () => {}; };
      chatWorkspacePreferences.subscribeAll = (_uid, callback) => { callback({}); return () => {}; };
      chatWorkspacePreferences.subscribe = (_uid, _id, callback) => { callback({}); return () => {}; };
      flushSync(() => selectionRoot.render(<SelectionFixture />));
      await settle();
      openPeer(peer.name); openPeer(secondPeer.name);
      openCompletions.get(threadB.id)(); await settle();
      openCompletions.get(threadA.id)(); await settle();
      check('Two real conversation-list clicks keep the latest choice when earlier persistence finishes late', selectedConversation() === threadB.id);
      directChoice('A'); await settle();
      selectionFixture.querySelector(`[aria-label="Close conversation with ${peer.name}"]`).click();
      directChoice('B'); await settle();
      closeCompletion(); await settle();
      check('A delayed list close cannot clear another newly selected conversation', selectedConversation() === threadB.id);
      directChoice('A'); await settle();
      selectionFixture.querySelector('button[title="Close direct message"]').click();
      directChoice('B'); await settle();
      closeCompletion(); await settle();
      check('A delayed close from the actual room cannot close a newer conversation', selectedConversation() === threadB.id);
      openPeer(peer.name);
      selectionFixture.querySelector('[aria-label="Leave fixture view"]').click();
      openCompletions.get(threadA.id)(); await settle();
      check('Leaving the view cancels a pending conversation open without discarding the current selection', selectedConversation() === threadB.id);
      directChoice('A'); await settle();
      selectionFixture.querySelector('button[title="Close direct message"]').click();
      selectionFixture.querySelector('[aria-label="Leave fixture view"]').click();
      closeCompletion(); await settle();
      check('A saved close still clears its own room when the student visits another view during the save', selectedConversation() === 'none');
      directChoice('A'); await settle();
      selectionFixture.querySelector('button[title="Close direct message"]').click();
      openPeer(peer.name);
      openCompletions.get(threadA.id)(); await settle();
      closeCompletion(); await settle();
      check('Reopening the same conversation wins over an earlier close acknowledgment', selectedConversation() === threadA.id);
      openPeer(peer.name);
      const selectionsBeforeUnmount = selections;
      flushSync(() => selectionRoot.unmount()); selectionUnmounted = true;
      openCompletions.get(threadA.id)(); await settle();
      check('A conversation request completed after unmount cannot navigate back into chat', selections === selectionsBeforeUnmount);
    } finally {
      if (!selectionUnmounted) flushSync(() => selectionRoot.unmount());
      selectionFixture.remove();
      Object.assign(studentChatService, selectionOriginals);
      studentSearchService.subscribeStudents = selectionDirectoryOriginal;
      chatWorkspacePreferences.subscribeAll = selectionWorkspaceOriginals.all;
      chatWorkspacePreferences.subscribe = selectionWorkspaceOriginals.one;
    }
    const profileFixture = document.createElement('div');
    profileFixture.hidden = true;
    document.body.append(profileFixture);
    const profileRoot = createRoot(profileFixture);
    const socialOriginals = Object.fromEntries(['subscribeProfile', 'subscribeStudentPosts', 'addComment', 'createArtifact'].map(key => [key, studentSocialService[key]]));
    const relationshipOriginals = { subscribe: studentRelationshipService.subscribe, subscribeFollowCounts: studentRelationshipService.subscribeFollowCounts };
    const profileDirectoryOriginal = studentSearchService.subscribeStudents;
    const photoLibraryOriginal = cloudStorageService.listUserProfilePhotos;
    let profilePostsCallback;
    let fixturePosts = [{ id: 'profile-fixture-post', authorUid: base.uid, authorName: base.name, title: 'Fixture social artifact', category: 'Research', mediaUrl: '/images/campus_main.jpg', comments: [], likes: [] }];
    try {
      studentSocialService.subscribeProfile = (uid, callback) => { callback({ uid, bio: 'Fixture biography' }); return () => {}; };
      studentSocialService.subscribeStudentPosts = (_uid, callback) => { profilePostsCallback = callback; callback(fixturePosts); return () => {}; };
      studentRelationshipService.subscribe = (_uid, callback) => { callback({ friends: [], following: [], incoming: [], outgoing: [] }); return () => {}; };
      studentRelationshipService.subscribeFollowCounts = (_uid, callback) => { callback({ followers: 0, following: 0 }); return () => {}; };
      studentSearchService.subscribeStudents = callback => { callback([base, peer]); return () => {}; };
      cloudStorageService.listUserProfilePhotos = async () => [{ key: photoKey, url: '/images/campus_main.jpg', fileName: 'Fixture saved photo' }];
      flushSync(() => profileRoot.render(<MemoryRouter><AuthContext.Provider value={{ user: base,
        updateUserName: async () => { throw new Error('Fixture profile save denied'); },
        updateUserPhoto: async () => { throw new Error('Fixture avatar save denied'); }
      }}><ThemeProvider><DedicatedProfileView currentStudent={base} /><CustomAlertModal /></ThemeProvider></AuthContext.Provider></MemoryRouter>));
      await settle();
      profileFixture.querySelector('[aria-label="Open post Fixture social artifact"]').click();
      await settle();
      fixturePosts = [{ ...fixturePosts[0], comments: [{ id: 'peer-live-comment', authorUid: peer.uid, authorName: peer.name, text: 'Live peer fixture comment', createdAt: Date.now() }] }];
      profilePostsCallback(fixturePosts);
      await settle();
      check('An already open artifact receives peer comments from the live profile subscription', profileFixture.textContent.includes('Live peer fixture comment'));
      studentSocialService.addComment = async () => { throw new Error('Fixture comment save denied'); };
      const commentInput = profileFixture.querySelector('input[placeholder="Add a constructive critique or note..."]');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(commentInput, 'Preserve this comment draft');
      commentInput.dispatchEvent(new Event('input', { bubbles: true }));
      await settle();
      profileFixture.querySelector('button[title="Send comment"]').click();
      await settle();
      check('A rejected comment keeps the actual profile composer draft and shows its error', commentInput.value === 'Preserve this comment draft' && profileFixture.textContent.includes('Fixture comment save denied'));
      studentSocialService.addComment = async (_id, data) => {
        const comment = { ...data, id: 'saved-fixture-comment', createdAt: Date.now() };
        fixturePosts = [{ ...fixturePosts[0], comments: [...fixturePosts[0].comments, comment] }];
        profilePostsCallback(fixturePosts);
        return comment;
      };
      profileFixture.querySelector('button[title="Send comment"]').click();
      await settle();
      check('A comment snapshot arriving before write acknowledgment is displayed exactly once', commentInput.value === '' && profileFixture.textContent.split('Preserve this comment draft').length === 2);
      const closeArtifact = profileFixture.querySelector('input[placeholder="Add a constructive critique or note..."]').closest('form').parentElement.querySelector('button:not([title])');
      closeArtifact.click();
      await settle();
      [...profileFixture.querySelectorAll('button')].find(button => button.textContent === 'Publish Artifact').click();
      await settle();
      const titleInput = profileFixture.querySelector('input[placeholder="e.g. Distributed Mesh Pavilion / Structural Analysis"]');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(titleInput, 'Keep my unpublished draft');
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      studentSocialService.createArtifact = async () => { throw new Error('Fixture publish denied'); };
      await settle();
      titleInput.closest('form').querySelector('button[type="submit"]').click();
      await settle();
      check('A rejected publication keeps the actual form and exposes the database failure', titleInput.value === 'Keep my unpublished draft' && profileFixture.textContent.includes('Fixture publish denied') && !profileFixture.querySelector('[aria-label="Open post Keep my unpublished draft"]'));
      [...profileFixture.querySelectorAll('button')].find(button => button.textContent.trim() === 'Understood').click();
      await settle();
      [...titleInput.closest('form').querySelectorAll('button')].find(button => button.textContent.trim() === 'Cancel').click();
      await settle();
      [...profileFixture.querySelectorAll('button')].find(button => button.textContent.includes('Edit Profile & Bio')).click();
      await settle();
      const bioInput = profileFixture.querySelector('textarea[placeholder="Tell campus about your discipline, research, and focus..."]');
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(bioInput, 'Keep my profile biography draft');
      bioInput.dispatchEvent(new Event('input', { bubbles: true }));
      await settle();
      bioInput.closest('form').querySelector('button[type="submit"]').click();
      await settle();
      check('A rejected profile save retains the actual name and biography form with an error', bioInput.value === 'Keep my profile biography draft' && profileFixture.textContent.includes('Fixture profile save denied') && !!profileFixture.querySelector('input[placeholder="Enter your student name..."]'));
      [...profileFixture.querySelectorAll('button')].find(button => button.textContent.trim() === 'Understood').click();
      await settle();
      [...bioInput.closest('form').querySelectorAll('button')].find(button => button.textContent.trim() === 'Cancel').click();
      await settle();
      const avatarButton = profileFixture.querySelector('button[title="Change profile avatar"]');
      const originalAvatar = avatarButton.parentElement.querySelector('img')?.getAttribute('src') || '';
      avatarButton.click();
      await settle();
      profileFixture.querySelector('[aria-label="Select photo Fixture saved photo"]').click();
      await settle();
      [...profileFixture.querySelectorAll('button')].find(button => button.textContent.trim() === 'Save Avatar').click();
      await settle();
      check('A rejected avatar save retains the photo chooser and original displayed avatar', profileFixture.textContent.includes('Fixture avatar save denied') && !!profileFixture.querySelector('[aria-label="Select photo Fixture saved photo"]') && (avatarButton.parentElement.querySelector('img')?.getAttribute('src') || '') === originalAvatar);
    } finally {
      flushSync(() => profileRoot.unmount());
      profileFixture.remove();
      Object.assign(studentSocialService, socialOriginals);
      Object.assign(studentRelationshipService, relationshipOriginals);
      studentSearchService.subscribeStudents = profileDirectoryOriginal;
      cloudStorageService.listUserProfilePhotos = photoLibraryOriginal;
    }
    const threads = [{ id: 'first', lastTimestamp: 10 }, { id: 'second', lastTimestamp: 20 }];
    check('Opening an existing conversation promotes it using private recency', visibleConversationThreads(threads, { first: { lastViewedAt: 100 } })[0].id === 'first');
    check('Closing a DM removes it from the active list', visibleConversationThreads(threads, { first: { closed: true, closedAt: 100 } }).length === 1);
    check('Closed history is still available to Search Feed', visibleConversationThreads(threads, { first: { closed: true, closedAt: 100 } }, true).length === 2);
    check('A new incoming message revives a closed DM', visibleConversationThreads([{ id: 'first', lastTimestamp: 101 }], { first: { closed: true, closedAt: 100 } }).length === 1);
    check('Private recency does not mutate the shared conversation', !threads.some(thread => Object.hasOwn(thread, '_lastViewedAt')));
    const muted = channelNotificationPolicy('8h', 1000);
    check('Timed channel mute suppresses notifications before its deadline', !messageNoticeAllowed(muted, {}, self, 1001));
    check('Timed channel mute expires at its deadline', messageNoticeAllowed(muted, {}, self, 1000 + 8 * 3600000));
    check('Permanent mute suppresses message alerts', !messageNoticeAllowed(channelNotificationPolicy('always'), {}, self));
    check('Mentions-only alerts require the signed-in student’s PRN or handle', messageNoticeAllowed({ mode: 'mentions' }, { lastMentions: ['prn-self'] }, self) && !messageNoticeAllowed({ mode: 'mentions' }, { lastMentions: ['someone-else'] }, self));
    let savedPreferences;
    const stopPreferences = chatNotificationPreferences.subscribe('fixture-notification-a', value => { savedPreferences = value; });
    chatNotificationPreferences.update('fixture-notification-a', { audio: false, hideNames: true });
    check('Notification changes reach the active listener and survive a fresh read', savedPreferences.audio === false && chatNotificationPreferences.get('fixture-notification-a').hideNames);
    check('Notification preferences do not leak into another account', chatNotificationPreferences.get('fixture-notification-b').audio === true && !chatNotificationPreferences.get('fixture-notification-b').hideNames);
    stopPreferences();
    localStorage.removeItem('krc_chat_notifications_fixture-notification-a');
    localStorage.removeItem('krc_chat_notifications_fixture-notification-b');
    const keyA = await studentE2EE.generateConversationKey();
    const keyB = await studentE2EE.generateConversationKey();
    const encrypted = await studentE2EE.encrypt('Private browser fixture message', keyA, 'fixture-rotation');
    check('Browser encryption produces ciphertext and decrypts the message', encrypted.startsWith('E2EE::') && await studentE2EE.decrypt(encrypted, keyA) === 'Private browser fixture message');
    const rotated = await studentE2EE.encrypt('New key fixture', keyB, 'fixture-rotation');
    check('Rotating a conversation key replaces its cached key', await studentE2EE.decrypt(rotated, keyB, 'fixture-new-reader') === 'New key fixture');
    let rejectedEncryption = false;
    try { await studentE2EE.encrypt('Never persist plaintext', 'invalid-key'); } catch { rejectedEncryption = true; }
    check('Encryption failure rejects instead of returning plaintext', rejectedEncryption);
    const fingerprint = await studentE2EE.getKeyFingerprint(keyA);
    const expectedHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', Uint8Array.from(atob(keyA), char => char.charCodeAt(0)))), byte => byte.toString(16).padStart(2, '0')).join('');
    check('Fingerprint hashes the actual conversation key', fingerprint === expectedHash && /^[a-f0-9]{64}$/.test(fingerprint));
    check('Different conversation keys have different fingerprints', fingerprint !== await studentE2EE.getKeyFingerprint(keyB));
    let writes = 0;
    const deniedChatService = new StudentChatService({ write: async () => { writes++; throw new Error('Fixture database denied'); } });
    let rejectedMissingKey = false;
    try { await deniedChatService.sendMessage('fixture-chat', self.uid, { text: 'Keep my draft' }); } catch { rejectedMissingKey = true; }
    check('A missing direct-message key prevents database writes', rejectedMissingKey && writes === 0);
    let directFailure = false, channelFailure = false;
    try { await deniedChatService.sendMessage('fixture-chat', self.uid, { text: 'Keep my draft', conversationKey: keyA }); } catch (error) { directFailure = error.message === 'Fixture database denied'; }
    try { await deniedChatService.sendMessage('fixture-channel', self.uid, { text: 'Keep channel draft', isChannel: true }); } catch (error) { channelFailure = error.message === 'Fixture database denied'; }
    check('Rejected direct and channel sends reach the composer as errors', directFailure && channelFailure && writes === 2);
    let persisted;
    const savedChatService = new StudentChatService({ write: async data => { persisted = data; return { id: 'fixture-message', ...data.message }; } });
    const sent = await savedChatService.sendMessage('fixture-chat', self.uid, { text: 'Secret fixture', conversationKey: keyA, senderDetails: self });
    check('Successful send returns persisted ID and entered sender name', sent.id === 'fixture-message' && sent.fromName === self.name);
    check('Persisted message and thread preview exclude plaintext', persisted.message.text.startsWith('E2EE::') && !persisted.summary.lastMessage.includes('Secret fixture'));
    const merged = mergeStudentDirectory([{ ...base, _documentId: 'google_tanmay.personal@example.test', sem: 'Sem I', name: 'Student' }, base], [{ ...base, sem: 'Sem I', name: 'Placeholder' }, { uid: 'orphan', name: 'Orphan social account' }]);
    check('UID and linked email aliases deduplicate to one peer', merged.length === 1);
    check('Enrollment full name wins over placeholders', merged[0].name === 'Tanmay Deshpande');
    check('Enrollment semester wins over stale social metadata', merged[0].sem === 'Sem V');
    check('Distinct emails with a historical shared PRN remain separate', mergeStudentDirectory([base, { ...peer, prn: base.prn }]).length === 2);
    check('Social-only accounts never create registered peers', !mergeStudentDirectory([], [base]).length);
    check('Explicit demo enrollments are excluded from the chatting directory', !mergeStudentDirectory([{ ...base, isDemo: true }]).length);
    check('Legacy mock accounts are excluded from the chatting directory', !mergeStudentDirectory([{ ...base, uid: 'demo_student_01' }]).length);
    check('A real student is retained even when its name matches an old sample', mergeStudentDirectory([base])[0]?.name === 'Tanmay Deshpande');
    check('Explicit clearance revocation wins across aliases', !mergeStudentDirectory([base, { ...base, _documentId: 'PRN-2026-081', allowChatting: false }])[0].allowChatting);
    const repo = repository([base, peer]);
    const service = new StudentSearchService(repo);
    const cacheBefore = localStorage.getItem('krc_students');
    const stop = service.subscribeStudents(() => {});
    await settle();
    let lateDirectory = [];
    const stopLate = service.subscribeStudents(items => { lateDirectory = items; }, true);
    check('A newly opened profile receives names from the already loaded directory', lateDirectory.some(student => student.uid === base.uid && student.name === base.name));
    stopLate();
    check('Full-name search returns the entered name', (await service.search('tanmay deshpande'))[0]?.name === base.name);
    check('Handle prefix search works', (await service.search('@tanmay'))[0]?.uid === base.uid);
    check('Linked Google email is searchable', (await service.search(base.googleEmail))[0]?.uid === base.uid);
    check('PRN and roll number are searchable', (await service.search('081'))[0]?.uid === base.uid && (await service.search('42'))[0]?.uid === base.uid);
    check('Self aliases are excluded', (await service.search('', { uid: 'different-auth', prn: base.prn, email: base.googleEmail })).every(s => s.uid !== base.uid));
    check('Unrelated multi-token queries return no false positives', !(await service.search('unrelated tanmay')).length);
    const large = Array.from({ length: 125 }, (_, i) => ({ ...base, uid: `z-${i}`, _documentId: `z-${i}`, prn: `UNIQUE-${i}`, email: `z${i}@example.test`, googleEmail: '', name: `A Peer ${String(i).padStart(3, '0')}` }));
    repo.emit([...large, peer]);
    check('Department/semester filtering happens before the result limit', (await service.searchStudents('', null, { dept: 'AI & DS', sem: 'Sem II' }, 10))[0]?.uid === peer.uid);
    repo.emit([base]);
    check('Realtime removal clears stale peers', !(await service.search('riya')).length);
    repo.emit([base, peer]);
    check('Realtime additions appear immediately', (await service.search('riya'))[0]?.uid === peer.uid);
    repo.emit([{ ...base, allowChatting: false }, peer]);
    check('Realtime blocked peers disappear immediately', !(await service.search('tanmay')).length);
    check('Search never overwrites the enrollment browser cache', localStorage.getItem('krc_students') === cacheBefore);
    repo.emit([peer], { error: 'Fixture directory denied' });
    check('Directory errors remain observable', service.getStatus().error === 'Fixture directory denied');
    stop();
    check('Search listener stops after the final subscriber leaves', !service._isRealtimeInitialized);
    let completeOld;
    const raceRepo = repository([base]);
    const raceService = new StudentSearchService(raceRepo);
    const stopRace = raceService.subscribeStudents(() => {});
    await settle();
    raceRepo.getStudents = () => new Promise(resolve => { completeOld = resolve; });
    const oldFetch = raceService.getStudentPool(true);
    raceRepo.emit([peer]);
    completeOld([base]);
    await oldFetch;
    check('Slow old fetch cannot overwrite a newer live snapshot', (await raceService.search('riya'))[0]?.uid === peer.uid && !(await raceService.search('tanmay')).length);
    stopRace();
    for (const role of ['admin', 'faculty', 'student']) {
      for (const target of ['admin', 'faculty', 'student']) {
        flushSync(() => guardRoot.render(
          <AuthContext.Provider value={{ user: { uid: 'fixture' }, role }}>
            <MemoryRouter key={`${role}-${target}`} initialEntries={[`/${target}/protected`]}>
              <Routes>
                <Route path={`/${target}/protected`} element={<RoleGuard requiredRole={target}><span>PROTECTED {target}</span></RoleGuard>} />
                <Route path={`/${role}/dashboard`} element={<span>OWN DASHBOARD {role}</span>} />
                <Route path="/" element={<span>LANDING</span>} />
              </Routes>
            </MemoryRouter>
          </AuthContext.Provider>
        ));
        await settle();
        check(`${role} account ${role === target ? 'can enter its own' : 'cannot enter the ' + target} portal`, document.getElementById('guard-fixture').textContent === (role === target ? `PROTECTED ${target}` : `OWN DASHBOARD ${role}`));
      }
    }
  } catch (error) {
    check(`Unexpected browser exception: ${error.message}`, false);
    console.error(error);
  }
  document.getElementById('summary').textContent = `${passed} passed · ${failed} failed`;
  running = false;
  runButton.disabled = false;
}
function App() {
  const [notice, setNotice] = useState('In-memory fixtures only. No production account, message or database changes.');
  const update = (records, status) => { uiRepository.emit(records, status); setNotice('Fixture update delivered through the search subscription.'); };
  return <main className="min-h-screen bg-bg text-text p-5">
    <h1 className="text-2xl font-bold">ERP browser regression checks</h1>
    <p className="my-2">Actual search, directory merge, authentication policy and route guard modules.</p>
    <button id="run-checks" className="border p-2" onClick={run}>Run browser checks</button>
    <strong id="summary" className="ml-4">Ready</strong>
    <ol id="report-mount" />
    <div className="my-4 flex flex-wrap gap-2">
      <button className="border p-2" onClick={() => update([base, peer, { ...peer, uid: 'new-live', _documentId: 'new-live', prn: 'PRN-NEW', email: 'new@example.test', name: 'New Live Peer' }])}>Add live fixture peer</button>
      <button className="border p-2" onClick={() => update([base])}>Remove fixture peers</button>
      <button className="border p-2" onClick={() => update([{ ...base, allowChatting: false }, peer])}>Block Tanmay fixture</button>
      <button className="border p-2" onClick={() => update([base, peer], { error: 'Fixture directory access denied. Retry to reconnect.' })}>Simulate directory error</button>
      <button className="border p-2" onClick={() => update([base, peer])}>Reset fixtures</button>
    </div>
    <p className="text-sm mb-3">{notice}</p>
    <div className="h-[700px] border flex flex-col"><SearchFeedView currentStudent={self} archetype={CHAT_ARCHETYPES.corporate} searchService={uiService} chatService={{ subscribeToConversations: (_uid, callback) => { callback([]); return () => {}; } }} onStartChat={() => {}} onViewProfile={student => setNotice(`Profile selected: ${student.name}`)} /></div>
  </main>;
}
createRoot(document.getElementById('root')).render(<App />);
