const SAMPLE_ATTENDANCE_IDS = new Set([
  'ATT-20250926-CS501-AARAV-081', 'ATT-20250926-CS502-AARAV-081',
  'ATT-20250927-CS503-AARAV-081', 'ATT-20250927-AI504-AARAV-081',
  'ATT-20250928-CS501-AARAV-081'
]);

export function attendanceRecords(records, uid) {
  if (!uid || !Array.isArray(records)) return [];
  const unique = new Map();
  for (const record of records) {
    if (!record || SAMPLE_ATTENDANCE_IDS.has(record.attendanceId) || record.isDemo === true || record.isMock === true) continue;
    if (record.studentUid && record.studentUid !== uid) continue;
    const id = record.attendanceId || record.id;
    if (!id) continue;
    unique.set(id, { ...record, studentUid: uid });
  }
  return [...unique.values()].sort((a,b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')));
}

export function recordedNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function recordDateLabel(record) {
  if (typeof record?.dateFormatted === 'string' && record.dateFormatted) return record.dateFormatted;
  const timestamp = record?.timestamp;
  const date = timestamp?.toDate ? timestamp.toDate() : timestamp == null ? null : new Date(timestamp);
  return date && Number.isFinite(date.getTime()) ? date.toLocaleString('en-IN') : 'Date not recorded';
}

export function academicHighlights(profile) {
  const academic = profile?.academicSummary || {};
  const fees = profile?.feeSummary || {};
  return {
    cgpa: recordedNumber(academic.cgpa),
    earnedCredits: recordedNumber(academic.earnedCredits),
    academicStatus: typeof academic.status === 'string' ? academic.status : '',
    sgpa: recordedNumber(academic.sgpa),
    enrolledCourses: Array.isArray(profile?.enrolledCourses) ? profile.enrolledCourses : null,
    annualTuition: recordedNumber(fees.annualTuition),
    totalPaid: recordedNumber(fees.totalPaid),
    due: recordedNumber(fees.due),
    feeStatus: typeof fees.status === 'string' ? fees.status : ''
  };
}
