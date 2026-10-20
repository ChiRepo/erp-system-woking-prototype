// Enrollment caches may keep account lifecycle flags, but never credential values.
const PASSWORD_METADATA_FIELDS = new Set([
  'mustchangepassword', 'isstartingpassword', 'passwordchangerequired',
  'passwordresetrequired', 'passwordchangedat', 'passwordlastchangedat',
  'lastpasswordchangeat', 'passwordupdatedat', 'passwordexpiresat'
]);

function isCredentialField(key) {
  const normalized = key.replace(/[^a-z0-9]/gi, '').toLowerCase();
  if (PASSWORD_METADATA_FIELDS.has(normalized)) return false;
  return /password|passwd|passphrase/.test(normalized) || /^(?:starting|initial|temporary|temp|current|old|new|confirm)?pwd(?:hash|salt)?$/.test(normalized);
}

/** Copy enrollment data while removing credential fields, including legacy nested data. */
export function sanitizeEnrollmentData(value, seen = new WeakMap()) {
  if (!value || typeof value !== 'object') return value;
  // Keep Date/Timestamp instances and other non-record values intact.
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return value;
  if (seen.has(value)) return seen.get(value);
  const sanitized = Array.isArray(value) ? [] : {};
  seen.set(value, sanitized);
  for (const [key, item] of Object.entries(value)) {
    if (isCredentialField(key)) continue;
    Object.defineProperty(sanitized, key, {
      value: sanitizeEnrollmentData(item, seen), enumerable: true, writable: true, configurable: true
    });
  }
  return sanitized;
}

export function sanitizeEnrollmentRoster(records) {
  return Array.isArray(records) ? sanitizeEnrollmentData(records) : [];
}
