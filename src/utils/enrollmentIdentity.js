export function normalizeFullName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

// Never allocate IDs from a filtered/cached roster length (or reuse a deleted ID).
export function createEnrollmentId(role = 'student') {
  const suffix = crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
  return role === 'faculty' ? `FAC-${suffix}` : `PRN-${new Date().getFullYear()}-${suffix}`;
}
