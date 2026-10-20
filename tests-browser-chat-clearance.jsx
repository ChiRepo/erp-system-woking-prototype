import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from './src/contexts/authSession.js';
import { ThemeProvider } from './src/contexts/ThemeContext.jsx';
import StudentChatContainer from './src/components/chat/StudentChatContainer.jsx';
import { firestoreService } from './src/services/firestoreService.js';
import { studentChatService } from './src/services/studentChatService.js';
import { studentSearchService } from './src/services/studentSearchService.js';
import { chatWorkspacePreferences } from './src/services/chatWorkspacePreferences.js';

const settle = () => new Promise(resolve => setTimeout(resolve, 30));
export async function runChatClearanceChecks(check, base, peer) {
  const thread = { id: 'clearance-race-fixture', participants: [base.uid, peer.uid], participantDetails: { [base.uid]: base, [peer.uid]: peer }, participantNames: { [base.uid]: base.name, [peer.uid]: peer.name } };
  const swaps = [];
  const replace = (object, name, method) => { swaps.push(() => { object[name] = object[`__fixture_original_${name}`]; delete object[`__fixture_original_${name}`]; }); object[`__fixture_original_${name}`] = object[name]; object[name] = method; };
  let emit, roster = [{ ...base }], pendingLookups = [], verifyCalls = 0, subscriptions = 0;
  try {
    replace(firestoreService, 'subscribeStudents', callback => { ++subscriptions; emit = callback; const initial = roster; const timer = setTimeout(() => callback(initial, { loading: false }), 10); return () => clearTimeout(timer); });
    replace(studentChatService, 'verifyStudentClearance', () => { ++verifyCalls; return new Promise(resolve => pendingLookups.push(resolve)); });
    replace(studentChatService, 'getOrCreateConversation', async () => thread);
    replace(studentChatService, 'subscribeToMessages', (_id, _key, callback) => { callback([], {}); return () => {}; });
    replace(studentChatService, 'subscribeToConversations', (_uid, callback) => { callback([thread]); return () => {}; });
    replace(studentChatService, 'subscribeToChannels', callback => { callback([]); return () => {}; });
    replace(studentSearchService, 'subscribeStudents', callback => { callback([base, peer]); return () => {}; });
    replace(chatWorkspacePreferences, 'subscribe', (_uid, _id, callback) => { callback({}); return () => {}; });
    replace(chatWorkspacePreferences, 'subscribeAll', (_uid, callback) => { callback({}); return () => {}; });
    const runFixture = async operation => {
      const fixture = document.createElement('div'); fixture.hidden = true; document.body.append(fixture);
      const root = createRoot(fixture);
      const render = user => flushSync(() => root.render(<MemoryRouter><AuthContext.Provider value={{ user, role: 'student' }}><ThemeProvider><StudentChatContainer isOpen onClose={() => {}} initialTargetStudent={peer} /></ThemeProvider></AuthContext.Provider></MemoryRouter>));
      try { roster = [{ ...base }]; pendingLookups = []; render(base); await settle(); await operation(fixture, render); }
      finally { flushSync(() => root.unmount()); fixture.remove(); }
    };
    await runFixture(async fixture => {
      emit([{ ...base, allowChatting: false }], { loading: false }); await settle();
      pendingLookups.splice(0).forEach(resolve => resolve(true)); await settle();
      check('The actual chat stays restricted when an older clearance lookup finishes after live revocation', fixture.textContent.includes('Campus Chat Access Restricted') && !fixture.querySelector('input[placeholder^="Send message"]'));
    });
    await runFixture(async (fixture, render) => {
      pendingLookups.splice(0).forEach(resolve => resolve(true)); await settle();
      const composer = fixture.querySelector('input[placeholder^="Send message"]');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(composer, 'Keep this live unsent draft');
      composer.dispatchEvent(new Event('input', { bubbles: true })); await settle();
      render({ ...base, name: 'Updated Fixture Full Name', displayName: 'Updated Fixture Full Name' }); await settle();
      pendingLookups.splice(0).forEach(resolve => resolve(true)); await settle();
      check('A routine profile update does not unmount the actual room or lose its typed draft', fixture.querySelector('input[placeholder^="Send message"]') === composer && composer.value === 'Keep this live unsent draft');
      const before = verifyCalls, subscribedBefore = subscriptions;
      window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated-preference-fixture', newValue: 'changed' })); await settle();
      check('An unrelated browser preference does not restart student clearance checks', verifyCalls === before && subscriptions === subscribedBefore);
      pendingLookups.splice(0).forEach(resolve => resolve(true)); await settle();
      emit([], { loading: false, error: 'Fixture live directory unavailable' }); await settle();
      check('A live directory error restricts the actual chat and explains the failure', fixture.textContent.includes('Fixture live directory unavailable') && !fixture.querySelector('input[placeholder^="Send message"]'));
      const staleCallback = emit;
      roster = [{ ...base, allowChatting: false }];
      [...fixture.querySelectorAll('button')].find(button => button.textContent.includes('Re-check Clearance')).click(); await settle();
      staleCallback([{ ...base }], { loading: false }); await settle();
      check('A callback from a replaced clearance subscription cannot reopen the restricted room', fixture.textContent.includes('Campus Chat Access Restricted') && !fixture.querySelector('input[placeholder^="Send message"]'));
      emit([{ ...base }], { loading: false }); await settle();
      check('A live restoration reopens the saved conversation and clears the previous directory error', !!fixture.querySelector('input[placeholder^="Send message"]') && !fixture.textContent.includes('Fixture live directory unavailable') && fixture.textContent.includes(peer.name));
    });
  } finally { swaps.reverse().forEach(restore => restore()); }
}
