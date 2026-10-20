import {collection,doc,getDocFromServer,getDocs,onSnapshot,query,where,runTransaction,updateDoc,writeBatch,serverTimestamp,Timestamp} from 'firebase/firestore';
import {db,auth} from '../firebase';
import {isAdminIdentity} from '../utils/authPolicy';
import {parseClassroomToken,classroomNonce,encodeClassroomToken} from '../utils/classroomToken';

export function createClassroomAttendanceRepository({database=db,currentUser=()=>auth.currentUser}={}) {
  const actor=()=>{const user=currentUser();if(!user?.uid)throw new Error('Sign in with your enrolled account.');return user;};
  return {
    async getFacultyChoices() {
      const snapshot=await getDocs(query(collection(database,'users'),where('role','==','faculty')));
      return snapshot.docs.filter(item=>item.data().uid===item.id).map(item=>({...item.data(),uid:item.id}));
    },
    async createSession(values,requestId=crypto.randomUUID()) {
      const user=actor(),token=await user.getIdTokenResult();
      if(!isAdminIdentity(user.email,token.signInProvider,token.claims.email_verified===true))throw new Error('Only the college administrator can assign an attendance session.');
      const required=['facultyUid','facultyName','courseId','courseName','room','dept','sem'];
      if(!required.every(key=>typeof values[key]==='string'&&values[key].trim()&&values[key].length<=256))throw new Error('Complete the faculty, course, classroom and cohort details.');
      const start=new Date(values.startAt),end=new Date(values.endAt);
      if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||end<=start||end-start>8*60*60*1000)throw new Error('Choose a session ending after its start and within eight hours.');
      if(!requestId||requestId.includes('/')||values.facultyUid.includes('/')||values.courseId.includes('/'))throw new Error('Use the enrolled faculty account and a valid course identifier.');
      const ref=doc(database,'attendance_sessions',requestId);
      const data=Object.fromEntries(required.map(key=>[key,values[key].trim()]));
      await runTransaction(database,async transaction=>{
        const existing=await transaction.get(ref);
        if(existing.exists()) {
          const prior=existing.data();
          if(prior.createdBy!==user.uid||required.some(key=>prior[key]!==data[key])||prior.startAt?.toMillis()!==start.getTime()||prior.endAt?.toMillis()!==end.getTime())throw new Error('This request already created a different session. Start a new session.');
          return;
        }
        transaction.set(ref,{...data,startAt:Timestamp.fromDate(start),endAt:Timestamp.fromDate(end),active:true,nonce:'',tokenIssuedAt:null,createdBy:user.uid,createdAt:serverTimestamp()});
      });
      return ref.id;
    },
    subscribeSessions(uid,isAdmin,next,fail=()=>{}) {
      if(!uid)return()=>{};
      let active=true;
      const confirmed=new Map();
      const target=isAdmin?collection(database,'attendance_sessions'):query(collection(database,'attendance_sessions'),where('facultyUid','==',uid));
      const stop=onSnapshot(target,{includeMetadataChanges:true},snapshot=>{
        if(!active)return;
        const ids=new Set(snapshot.docs.map(item=>item.id));
        for(const id of confirmed.keys())if(!ids.has(id))confirmed.delete(id);
        const rows=snapshot.docs.flatMap(item=>{
          if(item.metadata.hasPendingWrites)return confirmed.has(item.id)?[confirmed.get(item.id)]:[];
          const saved={...item.data(),id:item.id};confirmed.set(item.id,saved);return [saved];
        });
        next(rows);
      },error=>{if(active)fail(error);});
      return()=>{active=false;stop();};
    },
    async publishChallenge(sessionId) {
      actor();
      if(!sessionId||sessionId.includes('/'))throw new Error('Choose your assigned session.');
      const nonce=classroomNonce(),ref=doc(database,'attendance_sessions',sessionId);
      await updateDoc(ref,{nonce,tokenIssuedAt:serverTimestamp()});
      const saved=await getDocFromServer(ref),session={...saved.data(),id:saved.id};
      if(!saved.exists()||session.nonce!==nonce||!session.tokenIssuedAt)throw new Error('The classroom code changed. Please refresh it.');
      return {session,token:encodeClassroomToken(session)};
    },
    async submitAttendance({uid,courseId,rawToken}) {
      const user=actor();
      if(!uid||uid!==user.uid)throw new Error('Attendance must use your signed-in student account.');
      const token=parseClassroomToken(rawToken);
      if(courseId&&courseId!==token.courseId)throw new Error('This code belongs to a different course.');
      const profileSnapshot=await getDocFromServer(doc(database,'users',uid)),profile=profileSnapshot.data();
      if(!profileSnapshot.exists()||!['student','Student'].includes(profile.role)||!profile.prn||!profile.name||profile.dept!==token.dept||profile.sem!==token.sem)throw new Error('This session is not assigned to your enrollment.');
      const id=`${token.sessionId}_${uid}`;
      const ref=doc(database,'users',uid,'attendance_history',id);
      const record={attendanceId:id,sessionId:token.sessionId,nonce:token.nonce,studentUid:uid,studentName:profile.name,prn:profile.prn,dept:profile.dept,sem:profile.sem,
        courseId:token.courseId,courseName:token.courseName,facultyUid:token.facultyUid,faculty:token.facultyName,lectureHall:token.room,
        status:'Present',verified:true,verificationMethod:'Live classroom QR',timestamp:serverTimestamp()};
      const batch=writeBatch(database);
      batch.set(ref,record);
      batch.set(doc(database,'attendance_audit_log',id),record);
      await batch.commit();
      const saved=await getDocFromServer(ref);
      if(!saved.exists())throw new Error('The database did not confirm this check-in.');
      return {...saved.data(),attendanceId:id};
    }
  };
}

export const classroomAttendanceRepository=createClassroomAttendanceRepository();
