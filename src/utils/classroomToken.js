const validId = value => typeof value === 'string' && value.length > 0 && value.length <= 128 && !value.includes('/');
export const CLASSROOM_TOKEN_TTL_MS = 45000;

export function encodeClassroomToken(session) {
  const payload = JSON.stringify({v:2,sessionId:session.id,nonce:session.nonce,
    courseId:session.courseId,courseName:session.courseName,facultyUid:session.facultyUid,
    facultyName:session.facultyName,room:session.room,dept:session.dept,sem:session.sem,
    issuedAt:session.tokenIssuedAt.toMillis()});
  return 'KRCIT2|' + btoa(String.fromCharCode(...new TextEncoder().encode(payload))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}

export function parseClassroomToken(input, now = Date.now()) {
  let raw = String(input || '').trim();
  if (raw.startsWith('https://') || raw.startsWith('http://')) {
    const url = new URL(raw);
    if (!['erp-system-mit.web.app','erp-system-mit.firebaseapp.com','localhost','127.0.0.1'].includes(url.hostname)) throw new Error('Use the classroom attendance code from this campus.');
    raw = url.searchParams.get('token') || '';
  }
  if (!raw.startsWith('KRCIT2|') || raw.length > 5000) throw new Error('This code is not a saved classroom session. Ask your faculty for the current QR code.');
  let payload;
  try {
    const encoded=raw.slice(7).replaceAll('-','+').replaceAll('_','/');
    payload=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded),c=>c.charCodeAt(0))));
  } catch { throw new Error('The classroom code is incomplete. Scan it again.'); }
  if (payload.v !== 2 || !validId(payload.sessionId) || !validId(payload.courseId) || !validId(payload.facultyUid) || !/^[A-Za-z0-9_-]{43}$/.test(payload.nonce || '') ||
    !['courseName','facultyName','room','dept','sem'].every(key=>typeof payload[key]==='string'&&payload[key].trim()&&payload[key].length<=256) || !Number.isFinite(payload.issuedAt)) {
    throw new Error('The classroom code is invalid. Ask your faculty to refresh it.');
  }
  if (payload.issuedAt > now + 5000 || now >= payload.issuedAt + CLASSROOM_TOKEN_TTL_MS) throw new Error('This classroom code has expired. Scan the refreshed QR code.');
  return payload;
}

export function classroomNonce() {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
