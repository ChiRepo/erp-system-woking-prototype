import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { attendanceRecords } from '../utils/academicRecords';

const paths = { attendance:'attendance_history', grades:'grades', fees:'fee_receipts', academicSummary:'academic/summary', feeSummary:'fee_summary/current' };
const documentKinds = new Set(['profile','academicSummary','feeSummary']);
export function createStudentAcademicRepository(watch) {
  return {
    subscribe(uid, kind, onNext, onError = () => {}) {
      if (typeof uid !== 'string' || !uid.trim() || uid.includes('/') || !(kind === 'profile' || paths[kind])) {
        onError(new Error('An enrolled account is required to load academic records.'));
        return () => {};
      }
      let active = true;
      let stop = () => {};
      try {
        stop = watch({ uid, kind, path:paths[kind] }, value => {
          if (!active) return;
          if (documentKinds.has(kind)) { onNext(value ? {...value,uid} : null); return; }
          const records = Array.isArray(value) ? value.filter(item => item && (!item.studentUid || item.studentUid === uid) && item.isDemo !== true && item.isMock !== true) : [];
          onNext(kind === 'attendance' ? attendanceRecords(records, uid) : records);
        }, error => { if (active) onError(error); });
      } catch (error) { onError(error); }
      return () => { active = false; stop?.(); };
    }
  };
}

export const studentAcademicRepository = createStudentAcademicRepository(({uid,kind,path}, next, fail) => {
  if (documentKinds.has(kind)) {
    const target = kind === 'profile' ? doc(db,'users',uid) : doc(db,'users',uid,...path.split('/'));
    return onSnapshot(target, snapshot => next(snapshot.exists() ? {...snapshot.data(),uid} : null), fail);
  }
  return onSnapshot(collection(db,'users',uid,path), {includeMetadataChanges:true}, snapshot => {
    next(snapshot.docs.filter(item=>!item.metadata.hasPendingWrites).map(item => ({...item.data(),id:item.id,
      ...(kind === 'grades' ? {gradeId:item.id} : kind === 'attendance' ? {attendanceId:item.id} : {receiptId:item.id})
    })));
  }, fail);
});
