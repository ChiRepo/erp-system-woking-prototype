import { useCallback, useEffect, useRef, useState } from 'react';
import { firestoreService } from '../services/firestoreService.js';
import { studentChatService } from '../services/studentChatService.js';
import { sameStudentIdentity, studentIdentityKeys } from '../services/studentDirectory.js';

// One enrollment stream controls the gate. Profile appearance updates must not
// restart it or destroy a room's unsent text, and stale callbacks grant nothing.
export function useStudentChatClearance(student, { enabled = true } = {}) {
  const uid = student?.uid || student?.prn;
  const identity = JSON.stringify([enabled, uid, ...studentIdentityKeys(student).sort()]);
  const current = useRef(student);
  current.current = student;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ identity: null, hasClearance: false, checkingClearance: true, clearanceError: '' });
  const recheckClearance = useCallback(() => {
    studentChatService.clearClearanceCache();
    setAttempt(value => value + 1);
  }, []);

  useEffect(() => {
    let active = true;
    if (!enabled || !uid) {
      setState({ identity, hasClearance: false, checkingClearance: false, clearanceError: '' });
      return;
    }
    setState(previous => previous.identity === identity
      ? { ...previous, checkingClearance: !previous.hasClearance }
      : { identity, hasClearance: false, checkingClearance: true, clearanceError: '' });
    const stop = firestoreService.subscribeStudents((students, status = {}) => {
      if (!active || status.loading) return;
      const enrolled = (students || []).find(item => sameStudentIdentity(item, current.current));
      const next = {
        identity,
        hasClearance: !status.error && !!enrolled && enrolled.allowChatting !== false,
        checkingClearance: false,
        clearanceError: status.error ? status.error.message || String(status.error) : ''
      };
      setState(previous => Object.keys(next).every(key => previous[key] === next[key]) ? previous : next);
    });
    return () => { active = false; stop?.(); };
  }, [identity, uid, enabled, attempt]);

  useEffect(() => {
    if (!enabled || !uid) return;
    const changed = event => {
      if (event.type === 'storage' && event.key !== 'krc_students') return;
      recheckClearance();
    };
    window.addEventListener('krc_clearance_updated', changed);
    window.addEventListener('storage', changed);
    return () => {
      window.removeEventListener('krc_clearance_updated', changed);
      window.removeEventListener('storage', changed);
    };
  }, [enabled, uid, recheckClearance]);

  // Account switches are closed immediately, before the previous effect cleans up.
  return { ...(state.identity === identity ? state : { hasClearance: false, checkingClearance: !!enabled && !!uid, clearanceError: '' }), recheckClearance };
}
