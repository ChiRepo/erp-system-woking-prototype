import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import Students from './src/pages/admin/Students.jsx';
import { ThemeProvider } from './src/contexts/ThemeContext.jsx';
import { AuthContext } from './src/contexts/authSession.js';
import { firestoreService } from './src/services/firestoreService.js';
import { createStudentAuthProvisioningService, studentAuthProvisioningService, validateGoogleEnrollmentEmail } from './src/services/studentAuthProvisioningService.js';

const settle = () => new Promise(resolve => setTimeout(resolve, 30));
export async function runGoogleEnrollmentChecks(check, base) {
  check('Google enrollment normalizes addresses without inventing email verification', validateGoogleEnrollmentEmail('  Student.Google@Example.Test ') === 'student.google@example.test');
  for (const address of ['not-an-email', 'admin@krc.edu', 'chinmayc3003@gmail.com', 'student/path@example.test']) {
    let rejected = false;
    try { validateGoogleEnrollmentEmail(address); } catch { rejected = true; }
    check(`Invalid or administrator Google enrollment is rejected: ${address}`, rejected);
  }
  let calls = 0, denied = true, failure = false;
  const service = createStudentAuthProvisioningService({
    requireAdmin: async () => { if (denied) throw new Error('Fixture admin denied'); },
    link: async (uid, googleEmail) => { ++calls; if (failure) throw new Error('Fixture database denied'); return { uid, googleEmail }; }
  });
  try { await service.enrollGoogleAccount({ student: base, googleEmail: base.googleEmail }); } catch { /* expected */ }
  check('Unauthorized Google enrollment never reaches database mutation', calls === 0);
  denied = false;
  try { await service.enrollGoogleAccount({ student: { ...base, role: 'faculty' }, googleEmail: base.googleEmail }); } catch { /* expected */ }
  check('A faculty or missing student enrollment cannot be linked as a student', calls === 0);
  failure = true; let rejected = false;
  try { await service.enrollGoogleAccount({ student: base, googleEmail: base.googleEmail }); } catch { rejected = true; }
  check('A failed Google enrollment write cannot acknowledge success', rejected && calls === 1);

  const fixture = document.createElement('div'); fixture.hidden = true; document.body.append(fixture);
  const root = createRoot(fixture), originalSubscribe = firestoreService.subscribeStudents, originalLink = studentAuthProvisioningService.enrollGoogleAccount;
  const cache = localStorage.getItem('krc_students');
  let emitRoster, attempts = 0, complete;
  const enrolled = { ...base, googleEmail: '', isGoogleLinked: false };
  try {
    firestoreService.subscribeStudents = callback => { emitRoster = callback; callback([enrolled], { loading: false }); return () => {}; };
    studentAuthProvisioningService.enrollGoogleAccount = async () => { ++attempts; throw new Error('Fixture Google save denied'); };
    flushSync(() => root.render(<AuthContext.Provider value={{ user: base }}><ThemeProvider><Students /></ThemeProvider></AuthContext.Provider>));
    await settle();
    [...fixture.querySelectorAll('button')].find(button => button.textContent.includes('Add Google')).click(); await settle();
    const dialog = fixture.querySelector('[role="dialog"]');
    check('Actual admin Google form describes OAuth ownership and has no fake OTP or mail preview', dialog.textContent.includes('proves ownership by signing in through Google') && !/OTP|Auto-fill|dispatched/i.test(dialog.textContent));
    dialog.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await settle();
    check('Failed Google enrollment leaves the form open and preserves the current roster', attempts === 1 && dialog.querySelector('[role="alert"]')?.textContent.includes('Fixture Google save denied') && !JSON.parse(localStorage.getItem('krc_students'))[0].googleEmail);
    studentAuthProvisioningService.enrollGoogleAccount = () => { ++attempts; return new Promise(resolve => { complete = resolve; }); };
    dialog.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await settle();
    dialog.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await settle();
    check('Pending Google enrollment prevents duplicate writes and keeps uncommitted aliases out of the roster', attempts === 2 && dialog.querySelector('button[type="submit"]').disabled && !JSON.parse(localStorage.getItem('krc_students'))[0].googleEmail);
    const linked = { ...enrolled, googleEmail: base.email, isGoogleLinked: true };
    emitRoster([linked], { loading: false }); complete(linked); await settle();
    check('Acknowledged Google enrollment closes the form and displays the subscribed name and alias', !fixture.querySelector('[role="dialog"]') && fixture.textContent.includes('Google Sign-In Enrollment Saved') && fixture.textContent.includes(base.name) && JSON.parse(localStorage.getItem('krc_students'))[0].googleEmail === base.email);
  } finally {
    flushSync(() => root.unmount()); fixture.remove(); firestoreService.subscribeStudents = originalSubscribe; studentAuthProvisioningService.enrollGoogleAccount = originalLink;
    if (cache === null) localStorage.removeItem('krc_students'); else localStorage.setItem('krc_students', cache);
  }
}
