export const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

// Use the active ID-token provider, not providerData (which includes linked methods).
export function isAdminIdentity(email, signInProvider, emailVerified = false) {
  const address = normalizeEmail(email);
  return (address === 'chinmayc3003@gmail.com' && signInProvider === 'google.com' && emailVerified) ||
    (address === 'admin@krc.edu' && signInProvider === 'password');
}

export function registeredRole(profile) {
  const role = String(profile?.role || '').trim().toLowerCase();
  if (role === 'student' && String(profile?.prn || '').trim()) return 'student';
  if (role === 'faculty' && (profile?.id || profile?.employeeId)) return 'faculty';
  return 'guest';
}

// A Google alias authorizes a verified Google session; passwords use the institutional account.
export function enrollmentAllowsSession(profile, email, signInProvider, emailVerified = false) {
  if (registeredRole(profile) === 'guest') return false;
  const address = normalizeEmail(email);
  if (!address) return false;
  const institutional = normalizeEmail(profile?.email);
  if (signInProvider === 'password') return address === institutional;
  if (signInProvider === 'google.com' && emailVerified) {
    return address === institutional || address === normalizeEmail(profile?.googleEmail);
  }
  return false;
}

export function dashboardPath(role) {
  return ['admin', 'faculty', 'student'].includes(role) ? `/${role}/dashboard` : '/';
}
