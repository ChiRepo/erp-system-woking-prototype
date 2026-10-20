import { GOOGLE_SIGN_IN_ORIGIN, googleSignInBridgeTarget, isGoogleSignInContinuation, enterGoogleSignIn } from './src/utils/googleSignInEntry.js';
export async function runGoogleEntryChecks(check) {
  check('The public site and local previews use the fixed first-party Google sign-in destination', ['https://erp-system-mit.web.app', 'http://localhost:5173', 'http://127.0.0.1:4173'].every(origin => googleSignInBridgeTarget({ origin }) === `${GOOGLE_SIGN_IN_ORIGIN}/login?google=continue`));
  check('An external or lookalike host cannot select a Google sign-in bridge', ['https://erp-system-mit.web.app.attacker.test', 'https://attacker.test', 'http://erp-system-mit.web.app'].every(origin => googleSignInBridgeTarget({ origin }) === null));
  check('Only the exact first-party login page consumes the continuation marker', isGoogleSignInContinuation({ origin: GOOGLE_SIGN_IN_ORIGIN, pathname: '/login', search: '?google=continue' }) && !isGoogleSignInContinuation({ origin: 'https://attacker.test', pathname: '/login', search: '?google=continue' }) && !isGoogleSignInContinuation({ origin: GOOGLE_SIGN_IN_ORIGIN, pathname: '/student/chat', search: '?google=continue' }));
  let navigation, popups = 0, redirects = 0;
  const credential = { user: { uid: 'fixture-google-session' } };
  const adapter = { navigate: target => { navigation = target; }, popup: async () => { ++popups; return credential; }, redirect: async () => { ++redirects; } };
  const bridged = await enterGoogleSignIn({ origin: 'http://localhost:5173' }, adapter);
  check('A cross-origin Google entry navigates before starting any popup or redirect storage operation', bridged === null && navigation === `${GOOGLE_SIGN_IN_ORIGIN}/login?google=continue` && popups === 0 && redirects === 0);
  await enterGoogleSignIn({ origin: GOOGLE_SIGN_IN_ORIGIN }, adapter, true);
  check('The first-party continuation uses a full-page redirect without opening another popup', redirects === 1 && popups === 0);
  const result = await enterGoogleSignIn({ origin: GOOGLE_SIGN_IN_ORIGIN }, adapter);
  check('An ordinary first-party Google button retains the real credential result', result === credential && popups === 1);
  let refused = false;
  try { await enterGoogleSignIn({ origin: 'https://attacker.test' }, adapter, true); } catch { refused = true; }
  check('An unsupported host cannot start an authentication operation', refused && redirects === 1 && popups === 1);
}
