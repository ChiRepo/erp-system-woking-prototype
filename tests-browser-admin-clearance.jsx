import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import Students from './src/pages/admin/Students.jsx';
import { ThemeProvider } from './src/contexts/ThemeContext.jsx';
import { firestoreService } from './src/services/firestoreService.js';
import { AuthContext } from './src/contexts/authSession.js';
import { createStudentAccessRepository, studentAccessRepository } from './src/services/studentAccessRepository.js';
import { persistEnrollmentProfile } from './src/utils/enrollmentPersistence.js';

const settle = () => new Promise(resolve => setTimeout(resolve, 30));
export async function runAdminClearanceChecks(check, base) {
  const documents = [
    { id: base.uid, data: { ...base } },
    { id: base.prn, data: { ...base } },
    { id: `google_${base.googleEmail}`, data: { ...base } },
    { id: 'fixture-google-login-uid', data: { ...base, uid: 'fixture-google-login-uid' } },
    { id: 'fixture-other-student', data: { ...base, uid: 'fixture-other-student', email: 'different@example.test' } },
    { id: 'fixture-faculty', data: { ...base, uid: 'fixture-faculty', role: 'faculty' } }
  ];
  let rejectWrite = true, rejectActor = false, reads = 0, commits = 0, committedIds = [];
  const repository = createStudentAccessRepository({
    requireAdmin: async () => { if (rejectActor) throw new Error('Fixture administrator denied'); },
    read: async uid => { ++reads; return documents.find(item => item.id === uid) || null; },
    linked: async () => [...documents, documents[1]],
    commit: async (records, change) => {
      ++commits;
      if (rejectWrite) throw new Error('Fixture clearance write denied');
      committedIds = records.map(item => item.id);
      for (const item of records) item.data = { ...item.data, ...change };
    }
  });
  let failed = false;
  try { await repository.setChatAccess(base, false); } catch { failed = true; }
  check('A rejected clearance batch cannot acknowledge success or alter linked enrollment records', failed && documents.every(item => item.data.allowChatting));
  rejectWrite = false;
  const blocked = await repository.setChatAccess(base, false);
  check('A saved clearance change updates canonical, PRN, Google alias and restored-login records once',
    blocked.updatedRecords === 4 && committedIds.length === new Set(committedIds).size && documents.slice(0, 4).every(item => item.data.allowChatting === false));
  check('A colliding historical PRN and a faculty profile cannot be changed as student aliases', documents[4].data.allowChatting === true && documents[5].data.allowChatting === true && !committedIds.includes('fixture-other-student') && !committedIds.includes('fixture-faculty'));
  await repository.setChatAccess(base, true);
  check('Restoring chat access clears every linked block without changing full names or enrollment identity', documents.every(item => item.data.allowChatting) && documents.slice(0, 4).every(item => item.data.name === base.name && item.data.prn === base.prn));
  rejectActor = true;
  const readsBefore = reads, commitsBefore = commits;
  try { await repository.setChatAccess(base, false); } catch { /* expected */ }
  check('An unauthorized actor is rejected before enrollment reads or writes', reads === readsBefore && commits === commitsBefore);
  rejectActor = false;
  try { await repository.setChatAccess({ ...base, uid: 'fixture-missing-enrollment' }, false); } catch { /* expected */ }
  check('A removed enrollment is not recreated by a stale access toggle', commits === commitsBefore);

  let granted = false, rejectedPersistence = false;
  try { await persistEnrollmentProfile('fixture-new-uid', base, async () => false); granted = true; } catch { rejectedPersistence = true; }
  check('Failed first-login enrollment persistence cannot advance to a granted portal role', rejectedPersistence && !granted);
  let savedProfile;
  await persistEnrollmentProfile('fixture-new-uid', { ...base, fullName: base.name, startingPassword: 'fixture-only-secret', nestedCredentials: { password: 'fixture-only-secret' } }, async (_uid, value) => { savedProfile = value; return true; });
  check('First-login persistence retains canonical full names and the session UID without copying legacy credentials', savedProfile.uid === 'fixture-new-uid' && savedProfile.name === base.name && savedProfile.fullName === base.name && !JSON.stringify(savedProfile).includes('fixture-only-secret'));
  let persistenceError = false;
  try { await persistEnrollmentProfile('fixture-new-uid', base, async () => { throw new Error('Fixture profile denied'); }); } catch (error) { persistenceError = error.message === 'Fixture profile denied'; }
  check('A rejected canonical profile write remains an observable authentication failure', persistenceError);

  const fixture = document.createElement('div'); fixture.hidden = true; document.body.append(fixture);
  const root = createRoot(fixture);
  const savedCache = localStorage.getItem('krc_students');
  const originalSubscribe = firestoreService.subscribeStudents, originalSave = studentAccessRepository.setChatAccess;
  let writeAttempts = 0, emitRoster, roster = [{ ...base }];
  try {
    firestoreService.subscribeStudents = callback => { emitRoster = callback; callback(roster, { loading: false }); return () => {}; };
    studentAccessRepository.setChatAccess = async () => { ++writeAttempts; throw new Error('Fixture clearance write denied'); };
    flushSync(() => root.render(<AuthContext.Provider value={{ user: base }}><ThemeProvider><Students /></ThemeProvider></AuthContext.Provider>));
    await settle();
    fixture.querySelector(`button[aria-label="Block chat for ${base.name}"]`).click();
    await settle();
    check('A failed admin clearance save preserves granted access and displays the failure',
      writeAttempts === 1 && !!fixture.querySelector(`button[aria-label="Block chat for ${base.name}"]`) && fixture.querySelector('[role="alert"]')?.textContent.includes('Fixture clearance write denied') && JSON.parse(localStorage.getItem('krc_students'))[0].allowChatting === true);
    let finishSave;
    studentAccessRepository.setChatAccess = (_student, allowed) => {
      ++writeAttempts;
      return new Promise(resolve => { finishSave = () => {
        roster = [{ ...base, allowChatting: allowed }];
        emitRoster(roster, { loading: false });
        resolve({ uid: base.uid, allowChatting: allowed, updatedRecords: 4 });
      }; });
    };
    const blockButton = fixture.querySelector(`button[aria-label="Block chat for ${base.name}"]`);
    blockButton.click(); blockButton.click();
    await settle();
    check('A pending admin save keeps the old access, prevents duplicate writes and shows saving state', writeAttempts === 2 && blockButton.disabled && blockButton.textContent.includes('Saving') && JSON.parse(localStorage.getItem('krc_students'))[0].allowChatting === true);
    finishSave(); await settle();
    check('The actual admin control reflects the committed live directory and clears its earlier error',
      !!fixture.querySelector(`button[aria-label="Allow chat for ${base.name}"]`) && !fixture.querySelector('[role="alert"]') && JSON.parse(localStorage.getItem('krc_students'))[0].allowChatting === false && fixture.querySelector('[aria-label="Chat access status"]')?.textContent.includes(`blocked for ${base.name}`));
    roster = [{ ...base, allowChatting: true }]; emitRoster(roster, { loading: false }); await settle();
    check('A remote clearance update immediately refreshes the actual admin control without reloading', !!fixture.querySelector(`button[aria-label="Block chat for ${base.name}"]`) && JSON.parse(localStorage.getItem('krc_students'))[0].allowChatting === true);
  } finally {
    flushSync(() => root.unmount()); fixture.remove();
    firestoreService.subscribeStudents = originalSubscribe; studentAccessRepository.setChatAccess = originalSave;
    if (savedCache === null) localStorage.removeItem('krc_students'); else localStorage.setItem('krc_students', savedCache);
  }
}
