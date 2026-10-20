import { sanitizeEnrollmentData } from '../utils/enrollmentCache.js';

const clean = (value) => String(value || '').trim().toLowerCase();

export function isDemoStudent(student) {
  const email = clean(student?.email);
  const uid = clean(student?.uid || student?.id);
  return student?.isDemo === true || student?.isMock === true || student?.isSample === true ||
    ['demo', 'mock', 'sample'].includes(clean(student?.source)) ||
    ['demo.student@krc.edu', 'mock.user@krc.edu'].includes(email) ||
    /^(demo|mock)[_-]/.test(uid);
}

export function studentIdentityKeys(student) {
  if (!student) return [];
  return [...new Set([
    student.uid, student.authUid, student.id, student._documentId, student.prn,
    student.email, student.googleEmail, student.institutionalEmail, ...(student.identityIds || [])
  ].map(clean).filter(Boolean))];
}

export function sameStudentIdentity(left, right) {
  const leftKeys = studentIdentityKeys(left);
  const rightKeys = new Set(studentIdentityKeys(right));
  const shared = leftKeys.filter(key => rightKeys.has(key));
  if (shared.some(key => !key.startsWith('prn-') && key !== clean(left?.prn) && key !== clean(right?.prn))) return true;
  const emails = student => studentIdentityKeys(student).filter(key => key.includes('@') && !key.startsWith('google_'));
  // Historical roster-count collisions must not merge distinct institutional accounts.
  if (emails(left).length && emails(right).length) return false;
  return shared.length > 0;
}

function recordPriority(record) {
  const id = record._documentId || record.id;
  if (id?.startsWith('google_') || id?.includes('@')) return 0;
  if (id?.startsWith('PRN-')) return 1;
  return 2;
}

function recordTime(record) {
  const value = record.updatedAt;
  return value?.toMillis?.() || (value?.seconds ? value.seconds * 1000 : Date.parse(value || '') || 0);
}

// Only enrollment records create peers. Social records can enrich an existing peer.
export function mergeStudentDirectory(enrollments = [], socialProfiles = []) {
  const groups = [];
  const records = enrollments.filter(s => !isDemoStudent(s) && clean(s?.role) === 'student' && String(s?.prn || '').trim())
    .slice().sort((a, b) => recordPriority(a) - recordPriority(b) || recordTime(a) - recordTime(b));

  for (const record of records) {
    const keys = new Set(studentIdentityKeys(record));
    if (!keys.size) continue;
    const matches = groups.filter(group => group.records.some(existing => sameStudentIdentity(existing, record)));
    const group = matches[0] || { keys: new Set(), records: [] };
    if (!matches.length) groups.push(group);
    for (const other of matches.slice(1)) {
      other.keys.forEach(key => group.keys.add(key));
      group.records.push(...other.records);
      groups.splice(groups.indexOf(other), 1);
    }
    keys.forEach(key => group.keys.add(key));
    group.records.push(record);
  }

  return groups.map(group => {
    const ordered = group.records.slice().sort((a, b) => recordPriority(a) - recordPriority(b) || recordTime(a) - recordTime(b));
    const enrollment = Object.assign({}, ...ordered);
    const social = socialProfiles.filter(s => group.records.some(record => s._documentId
      ? studentIdentityKeys(record).includes(clean(s._documentId))
      : sameStudentIdentity(record, s)))
      .sort((a, b) => recordTime(a) - recordTime(b)).reduce((all, s) => ({ ...all, ...s }), {});
    const name = enrollment.name || enrollment.displayName || social.displayName || social.name || 'Student';
    const uid = enrollment.authUid || enrollment.uid || enrollment._documentId || enrollment.id || enrollment.prn;
    const safeEnrollment = sanitizeEnrollmentData(enrollment);
    return {
      ...safeEnrollment,
      uid, id: uid, name, displayName: name, role: 'student',
      email: clean(enrollment.email), googleEmail: clean(enrollment.googleEmail),
      prn: String(enrollment.prn || '').trim(),
      dept: enrollment.dept || '', sem: enrollment.sem || '',
      username: social.handle || social.username || enrollment.username || clean(enrollment.email).split('@')[0],
      avatar: social.customAvatar || social.photoURL || social.avatarUrl || social.avatar || enrollment.photoURL || enrollment.avatar || null,
      photoURL: social.customAvatar || social.photoURL || enrollment.photoURL || null,
      bio: social.bio || enrollment.bio || '',
      // Social appearance fields never add enrollment identities or DM aliases.
      identityIds: [...group.keys],
      // A stale alias must never undo an explicit administrative block.
      allowChatting: !ordered.some(s => s.allowChatting === false)
    };
  }).filter(s => s.name !== 'Student' || s.email || s.prn)
    .sort((a, b) => a.name.localeCompare(b.name) || a.prn.localeCompare(b.prn));
}
