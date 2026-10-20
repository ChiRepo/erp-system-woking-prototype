import {runMessageDeletionRuleChecks} from './tests-browser-message-deletion-rules.js';
import { runClassroomRuleChecks } from './tests-browser-classroom-rules.js';
import { runDirectoryPrivacyRuleChecks } from './tests-browser-directory-rules.js';
import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore/lite';
import { initializeFirestore, connectFirestoreEmulator as connectFullEmulator, collection, query, where, getDocsFromServer, onSnapshot } from 'firebase/firestore';
import { createStudentAccessAdapter, createStudentAccessRepository } from './src/services/studentAccessRepository.js';
import { createGoogleEnrollmentAdapter, createStudentAuthProvisioningService } from './src/services/studentAuthProvisioningService.js';
import { StudentFolderService } from './src/services/studentFolderService.js';
import { mergeStudentDirectory } from './src/services/studentDirectory.js';
import { StudentSearchService } from './src/services/studentSearchService.js';

// Never initialize a live-project client or run these fixtures from a hosted build.
if (!import.meta.env.DEV || !['localhost', '127.0.0.1'].includes(location.hostname)) throw new Error('Local development checks only.');
const projectId = 'demo-erp-auth-rules';
const rootUrl = `http://127.0.0.1:8088/v1/projects/${projectId}/databases/(default)/documents`;
const encodeValue = value => value?.toDate ? {timestampValue:value.toDate().toISOString()} : Array.isArray(value) ? { arrayValue: { values: value.map(encodeValue) } } :
  typeof value === 'boolean' ? { booleanValue: value } : typeof value === 'number' ? { integerValue: String(value) } :
  value && typeof value === 'object' ? { mapValue: { fields: encodeFields(value) } } : { stringValue: String(value) };
const encodeFields = value => Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encodeValue(item)]));
async function seed(path, value) {
  const response = await fetch(`${rootUrl}/${path}`, { method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: encodeFields(value) }) });
  if (!response.ok) throw new Error(`Local fixture setup failed (${response.status}).`);
}
const clients = [];
let serial = 0;
const waitFor = async predicate => {
  const deadline = Date.now() + 8000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error('The local live update did not arrive.');
    await new Promise(resolve => setTimeout(resolve, 25));
  }
};
function session(uid, email, provider, verified = false, full = false) {
  const app = initializeApp({ projectId, apiKey: 'local-fixtures-only', appId: 'local-rules-checks' }, `local-rule-${Date.now()}-${++serial}`);
  clients.push(app);
  // The HTTP/1 local emulator must finish each response before Brave can reuse it.
  // Production clients retain their normal transport settings.
  const db = full ? initializeFirestore(app, {experimentalForceLongPolling:true}) : getFirestore(app);
  const options = email ? { mockUserToken: { sub: uid, email, email_verified: verified, firebase: { sign_in_provider: provider, identities: { email: [email] } } } } : {};
  (full ? connectFullEmulator : connectFirestoreEmulator)(db, '127.0.0.1', 8088, options);
  return db;
}
document.getElementById('run').onclick = async event => {
  const button = event.currentTarget;
  button.disabled = true;
  const results = document.getElementById('results'); results.replaceChildren();
  const summary = document.getElementById('summary'); summary.textContent = 'Running…';
  let passed = 0, failed = 0;
  const check = async (label, operation, allowed) => {
    let accepted = false, code, detail;
    const started = performance.now();
    try { await operation(); accepted = true; } catch (error) { code = error.code; detail = error.message; }
    const valid = allowed ? accepted : !accepted && code === 'permission-denied';
    valid ? ++passed : ++failed;
    const row = document.createElement('li'); row.style.color = valid ? '#047857' : '#b91c1c';
    row.textContent = `${valid ? 'PASS' : 'FAIL'} — ${label}${valid ? '' : ` (${accepted ? 'unexpectedly allowed' : code || detail || 'unavailable'})`} [${Math.round(performance.now()-started)}ms]`;
    results.append(row); summary.textContent = `${passed} passed · ${failed} failed`;
  };
  try {
    const run = `fixture-${Date.now()}`;
    const studentUid = `${run}-student`, googleUid = `${run}-google`, badUid = `${run}-bad`, facultyUid = `${run}-faculty`;
    const institutional = `${run}@campus.example.test`, googleEmail = `${run}.google@example.test`;
    const profile = { uid: studentUid, id: 'PRN-FIXTURE', prn: 'PRN-FIXTURE', role: 'student', name: 'Local Fixture Student', displayName: 'Local Fixture Student', email: institutional, googleEmail, dept: 'CSE', sem: 'Sem V', allowChatting: true };
    const channelId = `${run}-channel`, messagePath = `student_channels/${channelId}/messages/fixture-message`;
    await seed(`users/${studentUid}`, profile);
    await seed(`users/google_${googleEmail}`, profile);
    await seed(`users/${badUid}`, { ...profile, uid: badUid });
    await seed(`users/${facultyUid}`, { uid: facultyUid, role: 'faculty', id: 'FAC-FIXTURE', email: `${run}.faculty@campus.example.test`, googleEmail: `${run}.faculty@example.test`, name: 'Local Fixture Faculty' });
    await seed(`student_channels/${channelId}`, { name: 'Local access fixture', creatorUid: studentUid, createdBy: studentUid, memberUids: [studentUid, googleUid, badUid, facultyUid], bannedMembers: [] });
    await seed(messagePath, { text: 'Local database fixture only', type: 'text', from: studentUid, timestamp: 1 });
    const attendancePath = `users/${studentUid}/attendance_history/fixture-attendance`;
    await seed(attendancePath, { courseId: 'FIXTURE', status: 'present', timestamp: 1 });
    const passwordDb = session(studentUid, institutional, 'password');
    await check('An enrolled institutional password session can read its joined channel messages', () => getDoc(doc(passwordDb, messagePath)), true);
    const googleDb = session(googleUid, googleEmail, 'google.com', true);
    await check('A verified Google session can initialize only its administrator-enrolled identity', () => setDoc(doc(googleDb, 'users', googleUid), { ...profile, uid: googleUid }), true);
    await check('That verified Google session can then read its joined channel history', () => getDoc(doc(googleDb, messagePath)), true);
    const badPasswordDb = session(badUid, googleEmail, 'password');
    await check('A password session using the alternate Google address cannot reuse a stale student role', () => getDoc(doc(badPasswordDb, messagePath)), false);
    const wrongPasswordUid = `${run}-wrong-password`, wrongPasswordDb = session(wrongPasswordUid, googleEmail, 'password');
    await check('A password session cannot initialize enrollment from a Google alias', () => setDoc(doc(wrongPasswordDb, 'users', wrongPasswordUid), { ...profile, uid: wrongPasswordUid }), false);
    const unverifiedUid = `${run}-unverified`, unverifiedDb = session(unverifiedUid, googleEmail, 'google.com', false);
    await check('Unverified Google tokens cannot initialize enrollment', () => setDoc(doc(unverifiedDb, 'users', unverifiedUid), { ...profile, uid: unverifiedUid }), false);
    await seed(`users/${unverifiedUid}`, { ...profile, uid: unverifiedUid });
    await check('Unverified Google tokens cannot reuse a previously copied student profile', () => getDoc(doc(unverifiedDb, `student_channels/${channelId}`)), false);
    const unknownUid = `${run}-unknown`, unknownDb = session(unknownUid, `${run}.unknown@example.test`, 'google.com', true);
    await check('An unknown verified Google account cannot grant itself a student enrollment', () => setDoc(doc(unknownDb, 'users', unknownUid), { ...profile, uid: unknownUid }), false);
    await check('An unknown verified Google account cannot read campus channels', () => getDoc(doc(unknownDb, `student_channels/${channelId}`)), false);
    const tamperUid = `${run}-tamper`, tamperDb = session(tamperUid, googleEmail, 'google.com', true);
    await check('Enrollment initialization rejects another account UID in the submitted profile', () => setDoc(doc(tamperDb, 'users', tamperUid), { ...profile, uid: studentUid }), false);
    await check('Enrollment initialization rejects an invented department', () => setDoc(doc(tamperDb, 'users', tamperUid), { ...profile, uid: tamperUid, dept: 'Invented' }), false);
    await check('Enrollment initialization rejects an invented semester', () => setDoc(doc(tamperDb, 'users', tamperUid), { ...profile, uid: tamperUid, sem: 'Invented' }), false);
    await check('A student cannot rewrite the canonical authentication UID', () => updateDoc(doc(passwordDb, 'users', studentUid), { authUid: facultyUid }), false);
    await check('A student cannot promote their own role by editing the profile', () => updateDoc(doc(passwordDb, 'users', studentUid), { role: 'faculty' }), false);
    await check('A student cannot publish their own academic summary', () => updateDoc(doc(passwordDb, 'users', studentUid), { academicSummary: { cgpa: 10, status: 'First Class' } }), false);
    await check('A student cannot publish their own fee clearance', () => updateDoc(doc(passwordDb, 'users', studentUid), { feeSummary: { due: 0, totalPaid: 195000 } }), false);
    await check('A student cannot assign their own enrolled courses', () => updateDoc(doc(passwordDb, 'users', studentUid), { enrolledCourses: ['CS-501'] }), false);
    await check('First-login enrollment cannot invent an academic summary', () => setDoc(doc(tamperDb, 'users', tamperUid), { ...profile, uid: tamperUid, academicSummary: { cgpa: 10 } }), false);
    await check('First-login enrollment cannot invent a fee summary', () => setDoc(doc(tamperDb, 'users', tamperUid), { ...profile, uid: tamperUid, feeSummary: { due: 0 } }), false);
    await check('First-login enrollment cannot invent a course assignment', () => setDoc(doc(tamperDb, 'users', tamperUid), { ...profile, uid: tamperUid, enrolledCourses: ['CS-501'] }), false);
    const facultyDb = session(facultyUid, `${run}.faculty@campus.example.test`, 'password');
    await check('The enrolled faculty password session retains its authorized academic access', () => getDoc(doc(facultyDb, attendancePath)), true);
    await check('Faculty membership metadata cannot grant student channel access', () => getDoc(doc(facultyDb, messagePath)), false);
    const badFacultyDb = session(facultyUid, `${run}.faculty@example.test`, 'password');
    await check('A faculty Google alias through password sign-in cannot reuse academic authority', () => getDoc(doc(badFacultyDb, attendancePath)), false);
    const googleAdminDb = session(`${run}-google-admin`, 'chinmayc3003@gmail.com', 'google.com', true);
    await check('The exact verified Google administrator retains administrative enrollment access', () => setDoc(doc(googleAdminDb, 'users', `${run}-admin-created-google`), { role: 'guest' }), true);
    const passwordAdminDb = session(`${run}-password-admin`, 'admin@krc.edu', 'password');
    await check('The exact password administrator retains administrative enrollment access', () => setDoc(doc(passwordAdminDb, 'users', `${run}-admin-created-password`), { role: 'guest' }), true);
    await check('The exact administrator can publish actual academic and fee summaries', () => updateDoc(doc(passwordAdminDb, 'users', studentUid), { academicSummary: { cgpa: 0, earnedCredits: 0 }, feeSummary: { due: 0, totalPaid: 0 }, enrolledCourses: [] }), true);
    const academicSummaryPath = `users/${studentUid}/academic/summary`, feeSummaryPath = `users/${studentUid}/fee_summary/current`;
    await check('The exact administrator can publish private academic and financial summary documents', async () => {
      await setDoc(doc(passwordAdminDb, academicSummaryPath), { cgpa: 0, earnedCredits: 0 });
      await setDoc(doc(passwordAdminDb, feeSummaryPath), { due: 0, totalPaid: 0 });
    }, true);
    await check('A student cannot author the private published academic summary', () => updateDoc(doc(passwordDb, academicSummaryPath), { cgpa: 10 }), false);
    await check('A student cannot author their private fee summary', () => updateDoc(doc(passwordDb, feeSummaryPath), { due: 0, totalPaid: 999999 }), false);
    await check('The owner can read their actual private published academic and fee summary', async () => {
      await getDoc(doc(passwordDb, academicSummaryPath)); await getDoc(doc(passwordDb, feeSummaryPath));
    }, true);
    await check('A different student cannot read another student financial summary', () => getDoc(doc(googleDb, feeSummaryPath)), false);
    await check('A faculty account cannot read a student financial summary', () => getDoc(doc(facultyDb, feeSummaryPath)), false);
    await check('Faculty retains read access to the published academic summary', () => getDoc(doc(facultyDb, academicSummaryPath)), true);
    const wrongGoogleAdminDb = session(`${run}-bad-google-admin`, 'chinmayc3003@gmail.com', 'password', true);
    await check('The administrator Gmail through password sign-in is denied administrative writes', () => setDoc(doc(wrongGoogleAdminDb, 'users', `${run}-denied-google-admin`), { role: 'guest' }), false);
    const wrongPasswordAdminDb = session(`${run}-bad-password-admin`, 'admin@krc.edu', 'google.com', true);
    await check('The administrator institutional email through Google is denied administrative writes', () => setDoc(doc(wrongPasswordAdminDb, 'users', `${run}-denied-password-admin`), { role: 'guest' }), false);
    const anonymousDb = session(`${run}-anonymous`);
    await check('An anonymous browser cannot read campus channels', () => getDoc(doc(anonymousDb, `student_channels/${channelId}`)), false);

    for (const collectionName of ['system_secure_vault', 'security_audit']) {
      const vaultPath = `${collectionName}/${run}-fixture`;
      await seed(vaultPath, {value:'fixture-only',classification:'No real credentials'});
      for (const [label,database] of [['verified Google administrator',googleAdminDb],['password administrator',passwordAdminDb],['student',passwordDb],['faculty',facultyDb],['unknown Google account',unknownDb],['administrator Gmail through password',wrongGoogleAdminDb],['administrator email through Google',wrongPasswordAdminDb],['anonymous browser',anonymousDb]]) {
        await check(`The ${label} cannot read legacy ${collectionName} credentials`,()=>getDoc(doc(database,vaultPath)),false);
        await check(`The ${label} cannot alter legacy ${collectionName} credentials`,()=>updateDoc(doc(database,vaultPath),{value:'unauthorized-fixture'}),false);
      }
    }

    const prnAliasId = `${run}-prn-alias`, collisionUid = `${run}-prn-collision`, facultyAliasId = `${run}-faculty-collision`;
    await seed(`users/${prnAliasId}`, profile);
    await seed(`users/${collisionUid}`, { ...profile, uid: collisionUid, email: `${run}.other@example.test` });
    await seed(`users/${facultyAliasId}`, { ...profile, uid: facultyAliasId, id: 'FAC-FIXTURE', role: 'faculty' });
    const adminActor = () => ({ email: 'chinmayc3003@gmail.com', getIdTokenResult: async () => ({ signInProvider: 'google.com', claims: { email_verified: true } }) });
    const adminFullDb = session(`${run}-google-admin-full`, 'chinmayc3003@gmail.com', 'google.com', true, true);
    const studentFullDb = session(studentUid, institutional, 'password', false, true);
    const adapter = createStudentAccessAdapter({ database: adminFullDb, currentUser: adminActor });
    const access = createStudentAccessRepository(adapter);
    const linkedIds = [studentUid, googleUid, badUid, unverifiedUid, `google_${googleEmail}`, prnAliasId];
    await check('The actual admin repository atomically blocks canonical and every linked login/alias record', async () => {
      const result = await access.setChatAccess({ uid: studentUid }, false);
      const snapshots = await Promise.all(linkedIds.map(uid => getDoc(doc(googleAdminDb, 'users', uid))));
      if (result.updatedRecords !== linkedIds.length || snapshots.some(snapshot => snapshot.data().allowChatting !== false)) throw new Error('A linked clearance was not saved.');
    }, true);
    await check('A colliding PRN and a faculty record remain untouched by the saved student change', async () => {
      const snapshots = await Promise.all([collisionUid, facultyAliasId].map(uid => getDoc(doc(googleAdminDb, 'users', uid))));
      if (snapshots.some(snapshot => snapshot.data().allowChatting !== true)) throw new Error('An unrelated profile was modified.');
    }, true);
    await check('Saved student revocation is enforced on the institutional account’s message reads', () => getDoc(doc(passwordDb, messagePath)), false);
    await check('Saved student revocation is enforced on the separate Google login’s message reads', () => getDoc(doc(googleDb, messagePath)), false);
    const directoryQuery = () => query(collection(studentFullDb, 'student_directory'), where('role', 'in', ['student', 'Student']));
    const directoryFrom = snapshot => mergeStudentDirectory(snapshot.docs.map(item => ({ ...item.data(), _documentId: item.id })));
    let livePool = [], readyDirectory = false, directoryError;
    const search = new StudentSearchService({
      getStudents: async () => directoryFrom(await getDocsFromServer(directoryQuery())),
      subscribeStudents(callback) {
        return onSnapshot(directoryQuery(), snapshot => {
          if (snapshot.metadata.fromCache) return;
          readyDirectory = true;
          callback(directoryFrom(snapshot), { loading: false, error: null });
        }, error => { directoryError = error; readyDirectory = true; callback([], { loading: false, error: error.code }); });
      }
    });
    const stopSearch = search.subscribeStudents(pool => { livePool = pool; }, true);
    try {
      await check('A real student directory stream removes the blocked enrollment from peer discovery', async () => {
        await waitFor(() => readyDirectory);
        if (directoryError || livePool.some(student => student.email === institutional)) throw new Error('Blocked student remained discoverable.');
      }, true);
      await check('The actual admin repository restores all aliases while preserving full names', async () => {
        await access.setChatAccess({ uid: studentUid }, true);
        const snapshots = await Promise.all(linkedIds.map(uid => getDoc(doc(googleAdminDb, 'users', uid))));
        if (snapshots.some(snapshot => snapshot.data().allowChatting !== true || snapshot.data().name !== profile.name)) throw new Error('Restoration lost a name or retained an alias block.');
      }, true);
      await check('Peer discovery receives the restored enrollment live without refreshing the browser', async () => {
        await waitFor(() => livePool.some(student => student.email === institutional));
        if (livePool.filter(student => student.email === institutional).length !== 1) throw new Error('Restored aliases produced duplicate peers.');
      }, true);
      await check('Both restored accounts can read the same preserved message history again', async () => {
        const snapshots = await Promise.all([passwordDb, googleDb].map(database => getDoc(doc(database, messagePath))));
        if (snapshots.some(snapshot => snapshot.data().text !== 'Local database fixture only')) throw new Error('Existing history was changed.');
      }, true);
      await check('A missing alias makes a real batch fail without partially changing the canonical record', async () => {
        let rejected = false;
        try { await adapter.commit([{ id: studentUid }, { id: `${run}-missing-alias` }], { allowChatting: false }); } catch { rejected = true; }
        const snapshot = await getDoc(doc(googleAdminDb, 'users', studentUid));
        if (!rejected || snapshot.data().allowChatting !== true) throw new Error('A failed batch produced partial success.');
      }, true);
      const studentAdapter = createStudentAccessAdapter({ database: studentFullDb, currentUser: adminActor });
      await check('A forged administrator-shaped client cannot bypass database rules for clearance writes', () => studentAdapter.commit(linkedIds.map(id => ({ id })), { allowChatting: false }), false);
      await check('The denied client batch leaves all actual linked clearances unchanged', async () => {
        const snapshots = await Promise.all(linkedIds.map(uid => getDoc(doc(googleAdminDb, 'users', uid))));
        if (snapshots.some(snapshot => snapshot.data().allowChatting !== true)) throw new Error('A denied write changed enrollment state.');
      }, true);

      const linkUid = `${run}-link-student`, linkPrn = `${run}-link-prn`, linkEmail = `${run}.link@campus.test`, linkGoogle = `${run}.linked@example.test`;
      const linkProfile = { ...profile, uid: linkUid, prn: linkPrn, email: linkEmail, googleEmail: '', name: 'Enrollment Preservation Fixture', fullName: 'Enrollment Preservation Fixture', displayName: 'Enrollment Preservation Fixture', authProviders: ['password'], photoURL: 'fixture-photo', mustChangePassword: false };
      await seed(`users/${linkUid}`, linkProfile); await seed(`users/${linkPrn}`, linkProfile);
      const preserved = [
        [`users/${linkUid}/folder/academic`, { cgpa: '7.42', credits: 12 }],
        [`users/${linkUid}/folder/fees`, { paidAmount: 1234, dueAmount: 5678 }],
        [`users/${linkUid}/attendance_history/preserved`, { status: 'Absent', courseId: 'REAL-COURSE' }],
        [`student_social_profiles/${linkUid}`, { name: linkProfile.name, bio: 'Existing custom biography', avatar: 'existing-avatar' }]
      ];
      for (const [path, data] of preserved) await seed(path, data);
      const googleEnrollment = createStudentAuthProvisioningService(createGoogleEnrollmentAdapter({ database: adminFullDb, requireAdmin: adapter.requireAdmin }));
      await check('Actual Google enrollment commits canonical, PRN and both lookup aliases together with the full name', async () => {
        await googleEnrollment.enrollGoogleAccount({ student: linkProfile, googleEmail: linkGoogle });
        const snapshots = await Promise.all([linkUid, linkPrn, `google_${linkGoogle}`, linkGoogle].map(uid => getDoc(doc(googleAdminDb, 'users', uid))));
        if (snapshots.some(snapshot => snapshot.data().googleEmail !== linkGoogle || snapshot.data().fullName !== linkProfile.name || snapshot.data().googleEmailVerified !== false)) throw new Error('A Google alias was missing, renamed, or falsely verified.');
      }, true);
      await check('Linking Google preserves actual academic, fees, attendance, social and password lifecycle records', async () => {
        for (const [path, data] of preserved) {
          const snapshot = await getDoc(doc(googleAdminDb, path));
          if (Object.keys(snapshot.data()).length !== Object.keys(data).length || Object.entries(data).some(([key, value]) => snapshot.data()[key] !== value)) throw new Error('Existing student data was rewritten.');
        }
        const canonical = (await getDoc(doc(googleAdminDb, 'users', linkUid))).data();
        if (canonical.photoURL !== 'fixture-photo' || canonical.mustChangePassword !== false) throw new Error('Profile or password lifecycle was reset.');
      }, true);
      await check('Repeating the same Google enrollment is idempotent and does not provision a new student account', () => googleEnrollment.enrollGoogleAccount({ student: linkProfile, googleEmail: linkGoogle }), true);
      await check('A different Google address cannot silently replace an existing enrollment link', async () => {
        let reason = '';
        try { await googleEnrollment.enrollGoogleAccount({ student: linkProfile, googleEmail: `${run}.replacement@example.test` }); } catch (error) { reason = error.message; }
        if (reason !== 'A different Google address is already enrolled.') throw new Error('Expected explicit replacement refusal.');
      }, true);
      const otherLink = { ...linkProfile, uid: `${run}-link-other`, prn: `${run}-link-other-prn`, email: `${run}.otherlink@campus.test` };
      await seed(`users/${otherLink.uid}`, otherLink);
      await check('A Google address already assigned to another enrollment cannot be claimed', async () => {
        let reason = '';
        try { await googleEnrollment.enrollGoogleAccount({ student: otherLink, googleEmail: linkGoogle }); } catch (error) { reason = error.message; }
        if (reason !== 'That Google address belongs to another enrollment.') throw new Error('Expected explicit alias ownership refusal.');
      }, true);
      const occupied = `${run}.occupied@example.test`;
      await seed(`users/google_${occupied}`, { ...profile, uid: 'unrelated-canonical-owner', email: 'unrelated-owner@campus.test', googleEmail: '' });
      await check('A conflicting lookup alias rejects the whole transaction without modifying the canonical enrollment', async () => {
        let rejected = false;
        try { await googleEnrollment.enrollGoogleAccount({ student: otherLink, googleEmail: occupied }); } catch { rejected = true; }
        const snapshot = await getDoc(doc(googleAdminDb, 'users', otherLink.uid));
        if (!rejected || snapshot.data().googleEmail !== '') throw new Error('A conflicting alias produced a partial link.');
      }, true);
      const forgedGoogle = createStudentAuthProvisioningService(createGoogleEnrollmentAdapter({ database: studentFullDb, requireAdmin: adapter.requireAdmin }));
      await check('Database rules reject a forged administrator client attempting Google enrollment', () => forgedGoogle.enrollGoogleAccount({ student: otherLink, googleEmail: `${run}.forged@example.test` }), false);

      const folderService = new StudentFolderService({ database: adminFullDb });
      const freshUid = `${run}-fresh-student`, freshPrn = `${run}-fresh-prn`;
      const fresh = { uid: freshUid, prn: freshPrn, email: `${run}.fresh@campus.test`, name: '  Full   Student Name  ', dept: 'ECE', sem: 'Sem II', role: 'student', allowChatting: true, startingPassword: 'Fixture-not-a-real-login' };
      const savedLocal = new Map(Object.keys(localStorage).map(key => [key, localStorage.getItem(key)]));
      try {
        await check('New enrollment atomically persists the entered full name across canonical, PRN, folder and social profiles', async () => {
          await folderService.provisionStudentFolder(fresh);
          for (const path of [`users/${freshUid}`, `users/${freshPrn}`, `users/${freshUid}/folder/profile`, `student_social_profiles/${freshUid}`]) {
            const snapshot = await getDoc(doc(googleAdminDb, path));
            if (snapshot.data().name !== 'Full Student Name' || snapshot.data().fullName !== 'Full Student Name' || snapshot.data().displayName !== 'Full Student Name') throw new Error('A full name was missing or replaced.');
            if (JSON.stringify(snapshot.data()).includes(fresh.startingPassword)) throw new Error('A credential leaked into enrollment data.');
          }
        }, true);
        await check('A new enrollment has no invented grade, attendance percentage, tuition or payment status', async () => {
          const profile = (await getDoc(doc(googleAdminDb, 'users', freshUid))).data();
          const academic = (await getDoc(doc(googleAdminDb, `users/${freshUid}/folder/academic`))).data();
          const fees = (await getDoc(doc(googleAdminDb, `users/${freshUid}/folder/fees`))).data();
          if (profile.attendance !== null || profile.cgpa !== null || profile.fee !== 'Not assessed' || academic.enrolledCourses.length || academic.credits !== 0 || fees.annualTuition !== null || fees.paidAmount !== null || fees.dueAmount !== null) throw new Error('Invented academic/payment values were saved.');
        }, true);
        await check('New enrollment creates no payment receipt or attendance event', async () => {
          const results = await Promise.all(['fee_receipts', 'attendance_history'].map(name => getDocsFromServer(collection(adminFullDb, 'users', freshUid, name))));
          if (results.some(result => !result.empty)) throw new Error('Enrollment invented a historical event.');
        }, true);
        await check('New enrollment does not claim an allocated cloud vault or encrypted folder', async () => {
          const security = (await getDoc(doc(googleAdminDb, `users/${freshUid}/folder/security`))).data();
          const storage = (await getDoc(doc(googleAdminDb, `users/${freshUid}/folder/storage`))).data();
          if (security.folderEncrypted || security.e2eeVaultStatus || storage.cloudVault || storage.status !== 'not_initialized') throw new Error('Unverified provisioning was reported.');
        }, true);
        await check('Creating an existing student again is rejected without resetting their saved records', async () => {
          await seed(`users/${freshUid}/folder/academic`, { cgpa: '6.75', credits: 14 });
          let reason = '';
          try { await folderService.provisionStudentFolder(fresh); } catch (error) { reason = error.message; }
          const academic = (await getDoc(doc(googleAdminDb, `users/${freshUid}/folder/academic`))).data();
          if (!reason.includes('already enrolled') || academic.cgpa !== '6.75' || academic.credits !== 14) throw new Error('Existing academic records were overwritten.');
        }, true);
        await check('An occupied historical PRN prevents partial creation of a new canonical student', async () => {
          const conflicting = { ...fresh, uid: `${run}-fresh-conflict`, email: `${run}.conflict@campus.test` };
          let reason = '';
          try { await folderService.provisionStudentFolder(conflicting); } catch (error) { reason = error.message; }
          if (!reason.includes('already exist') || (await getDoc(doc(googleAdminDb, 'users', conflicting.uid))).exists()) throw new Error('A PRN conflict produced partial enrollment.');
        }, true);
        const deniedFolder = new StudentFolderService({ database: studentFullDb });
        await check('A student cannot forge the administrator enrollment transaction', () => deniedFolder.provisionStudentFolder({ ...fresh, uid: `${run}-forged-new-student`, prn: `${run}-forged-new-prn` }), false);
      } finally {
        for (const key of Object.keys(localStorage)) if (!savedLocal.has(key)) localStorage.removeItem(key);
        for (const [key, value] of savedLocal) localStorage.setItem(key, value);
      }
    } finally { stopSearch(); }
    const releaseCompletedClients = async () => {
      // Keep only the two shared actors between independent fixture suites.
      for (let index=clients.length-1;index>=0;index--) {
        const app=clients[index];
        if (app!==adminFullDb.app && app!==studentFullDb.app) {
          clients.splice(index,1); await deleteApp(app);
        }
      }
    };
    await releaseCompletedClients();
    await runClassroomRuleChecks({check,seed,session,run,studentUid,facultyUid,profile,institutional,adminFullDb,studentFullDb});
    await releaseCompletedClients();
    await runDirectoryPrivacyRuleChecks({check,seed,session,run,studentUid,profile,institutional,adminFullDb,studentFullDb});
    await releaseCompletedClients();
    await runMessageDeletionRuleChecks({check,seed,session,run,studentUid,profile,institutional,adminFullDb,studentFullDb});

  } catch (error) {
    ++failed; const row = document.createElement('li'); row.style.color = '#b91c1c'; row.textContent = `FAIL — Local fixture setup: ${error.message}`; results.append(row);
  } finally {
    await Promise.all(clients.splice(0).map(app => deleteApp(app)));
    summary.textContent = `${passed} passed · ${failed} failed`;
    button.disabled = false;
  }
};
