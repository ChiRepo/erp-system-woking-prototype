export const GOOGLE_SIGN_IN_ORIGIN = 'https://erp-system-mit.firebaseapp.com';
const bridgeHosts = new Set(['erp-system-mit.web.app', 'localhost', '127.0.0.1']);

export function googleSignInBridgeTarget(location) {
  if (!location?.origin || location.origin === GOOGLE_SIGN_IN_ORIGIN) return null;
  let url;
  try { url = new URL(location.origin); } catch { return null; }
  if (!bridgeHosts.has(url.hostname)) return null;
  if (url.hostname === 'erp-system-mit.web.app' && url.protocol !== 'https:') return null;
  return `${GOOGLE_SIGN_IN_ORIGIN}/login?google=continue`;
}

export function isGoogleSignInContinuation(location) {
  return location?.origin === GOOGLE_SIGN_IN_ORIGIN && location.pathname === '/login' &&
    new URLSearchParams(location.search).get('google') === 'continue';
}

export async function enterGoogleSignIn(location, adapter, redirect = false) {
  const target = googleSignInBridgeTarget(location);
  if (target) { adapter.navigate(target); return null; }
  if (location?.origin !== GOOGLE_SIGN_IN_ORIGIN) throw new Error('Open the official campus sign-in page to continue with Google.');
  if (redirect) { await adapter.redirect(); return null; }
  return adapter.popup();
}
