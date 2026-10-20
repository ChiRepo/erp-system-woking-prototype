import {doc,setDoc,updateDoc,getDocFromServer,writeBatch,serverTimestamp,Timestamp} from 'firebase/firestore';
import {createClassroomAttendanceRepository} from './src/services/classroomAttendanceRepository.js';
import {encodeClassroomToken,classroomNonce} from './src/utils/classroomToken.js';

export async function runClassroomRuleChecks({check,seed,session,run,studentUid,facultyUid,profile,institutional,adminFullDb,studentFullDb}) {
 const adminUid=`${run}-google-admin-full`,facultyEmail=`${run}.faculty@campus.example.test`;
 const facultyDb=session(facultyUid,facultyEmail,'password',false,true);
 const otherUid=`${run}-other-faculty`,otherEmail=`${run}.other-faculty@campus.example.test`;
 await seed(`users/${otherUid}`,{uid:otherUid,id:'FAC-OTHER',role:'faculty',name:'Other Faculty',email:otherEmail,dept:'CSE'});
 const otherDb=session(otherUid,otherEmail,'password',false,true);
 const adminActor=()=>({uid:adminUid,email:'chinmayc3003@gmail.com',getIdTokenResult:async()=>({signInProvider:'google.com',claims:{email_verified:true}})});
 const admin=createClassroomAttendanceRepository({database:adminFullDb,currentUser:adminActor});
 const faculty=createClassroomAttendanceRepository({database:facultyDb,currentUser:()=>({uid:facultyUid})});
 const other=createClassroomAttendanceRepository({database:otherDb,currentUser:()=>({uid:otherUid})});
 const student=createClassroomAttendanceRepository({database:studentFullDb,currentUser:()=>({uid:studentUid})});
 const sessionId=`${run}-classroom`,now=Date.now();
 const values={facultyUid,facultyName:'Local Fixture Faculty',courseId:'LOCAL-CLASS',courseName:'Isolated verification lecture',room:'Fixture Room',dept:profile.dept,sem:profile.sem,startAt:new Date(now-5000),endAt:new Date(now+300000)};
 await check('The actual admin repository creates an assigned classroom session',()=>admin.createSession(values,sessionId),true);
 await check('Retrying the same acknowledged session request creates no duplicate',async()=>{const id=await admin.createSession(values,sessionId);if(id!==sessionId)throw new Error('Duplicate session ID');},true);
 await check('A faculty cannot create their own administrative session assignment',()=>setDoc(doc(facultyDb,'attendance_sessions',`${run}-forged-session`),{...values,createdBy:facultyUid,createdAt:serverTimestamp(),nonce:'',tokenIssuedAt:null,active:true}),false);
 await check('A student-shaped client cannot create a classroom session',()=>setDoc(doc(studentFullDb,'attendance_sessions',`${run}-student-session`),{...values,createdBy:studentUid,createdAt:serverTimestamp(),nonce:'',tokenIssuedAt:null,active:true}),false);
 await check('A student cannot read the private classroom nonce document',()=>getDocFromServer(doc(studentFullDb,'attendance_sessions',sessionId)),false);
 await check('An unrelated faculty cannot read another teacher classroom nonce',()=>getDocFromServer(doc(otherDb,'attendance_sessions',sessionId)),false);
 await check('An unrelated faculty cannot rotate another teacher classroom challenge',()=>other.publishChallenge(sessionId),false);
 let published;
 await check('Assigned faculty publishes a challenge acknowledged by the actual database',async()=>{published=await faculty.publishChallenge(sessionId);if(!published.token||published.session.nonce.length!==43)throw new Error('No acknowledged nonce');},true);
 let primed=false,lostConfirmedSession=false,watchError;
 const stopSessions=faculty.subscribeSessions(facultyUid,false,rows=>{if(rows.some(row=>row.id===sessionId))primed=true;else if(primed)lostConfirmedSession=true;},error=>{watchError=error;});
 try {
  const deadline=Date.now()+5000;while(!primed&&!watchError&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,20));
  await check('A confirmed faculty session remains selected while a new nonce is pending and acknowledged',async()=>{if(!primed||watchError)throw new Error('No faculty session stream');published=await faculty.publishChallenge(sessionId);if(lostConfirmedSession)throw new Error('Challenge publication removed its session');},true);
 } finally {stopSessions();}
 await check('Assigned faculty cannot extend their administrator-defined class window',()=>updateDoc(doc(facultyDb,'attendance_sessions',sessionId),{endAt:Timestamp.fromMillis(now+86400000)}),false);
 await check('Assigned faculty cannot transfer the session to a different teacher',()=>updateDoc(doc(facultyDb,'attendance_sessions',sessionId),{facultyUid:otherUid}),false);
 await check('Assigned faculty cannot forge a future server challenge timestamp',()=>updateDoc(doc(facultyDb,'attendance_sessions',sessionId),{nonce:classroomNonce(),tokenIssuedAt:Timestamp.fromMillis(Date.now()+60000)}),false);
 const id=`${sessionId}_${studentUid}`,historyPath=`users/${studentUid}/attendance_history/${id}`,auditPath=`attendance_audit_log/${id}`;
 const entry=(overrides={})=>({attendanceId:id,sessionId,nonce:published.session.nonce,studentUid,studentName:profile.name,prn:profile.prn,dept:profile.dept,sem:profile.sem,courseId:values.courseId,courseName:values.courseName,facultyUid,faculty:values.facultyName,lectureHall:values.room,status:'Present',verified:true,verificationMethod:'Live classroom QR',timestamp:serverTimestamp(),...overrides});
 const pair=async(record=entry(),audit=record,database=studentFullDb,recordId=id,userId=studentUid)=>{const batch=writeBatch(database);batch.set(doc(database,'users',userId,'attendance_history',recordId),record);batch.set(doc(database,'attendance_audit_log',recordId),audit);await batch.commit();};
 await check('An unsigned owner-authored attendance record cannot bypass classroom validation',()=>setDoc(doc(studentFullDb,historyPath),{courseId:'FORGED',status:'Present',timestamp:serverTimestamp(),verificationMethod:'Made in browser',studentUid}),false);
 await check('A correct classroom receipt cannot be saved without its audit counterpart',()=>setDoc(doc(studentFullDb,historyPath),entry()),false);
 await check('A correct audit entry cannot be saved without its personal counterpart',()=>setDoc(doc(studentFullDb,auditPath),entry()),false);
 await check('A valid nonce cannot authorize a different student identity',()=>pair(entry({studentUid:'different-student'})),false);
 await check('A valid nonce cannot authorize an invented course',()=>pair(entry({courseId:'FORGED-COURSE'})),false);
 await check('A valid nonce cannot authorize an invented student name or PRN',()=>pair(entry({studentName:'Another Full Name',prn:'OTHER-PRN'})),false);
 await check('A valid nonce cannot authorize a different enrolled department',()=>pair(entry({dept:'OTHER-DEPARTMENT'})),false);
 await check('A valid nonce cannot authorize a different enrolled semester',()=>pair(entry({sem:'Sem VIII'})),false);
 await check('A forged nonce is rejected even with correct student and session metadata',()=>pair(entry({nonce:'X'.repeat(43)})),false);
 await check('A client timestamp cannot replace the authoritative attendance timestamp',()=>pair(entry({timestamp:Timestamp.fromMillis(Date.now()+1000)})),false);
 await check('A mismatched audit entry rolls back both records atomically',()=>pair(entry(),entry({status:'Absent'})),false);
 await check('Denied classroom batches leave neither personal history nor audit residue',async()=>{const snapshots=await Promise.all([getDocFromServer(doc(adminFullDb,historyPath)),getDocFromServer(doc(adminFullDb,auditPath))]);if(snapshots.some(item=>item.exists()))throw new Error('Partial attendance data');},true);
 await check('A faculty account cannot impersonate a student check-in',()=>pair(entry(),entry(),facultyDb),false);
 published=await faculty.publishChallenge(sessionId);
 const oldToken=published.token;
 published=await faculty.publishChallenge(sessionId);
 await check('A rotated classroom code cannot be replayed through the actual repository',()=>student.submitAttendance({uid:studentUid,courseId:values.courseId,rawToken:oldToken}),false);
 const protectedSession=await getDocFromServer(doc(adminFullDb,'attendance_sessions',sessionId));
 for(const [label,overrides] of [
  ['expired challenge',{tokenIssuedAt:Timestamp.fromMillis(Date.now()-60000)}],
  ['future lecture',{startAt:Timestamp.fromMillis(Date.now()+60000),endAt:Timestamp.fromMillis(Date.now()+120000)}],
  ['ended lecture',{startAt:Timestamp.fromMillis(Date.now()-120000),endAt:Timestamp.fromMillis(Date.now()-1000)}],
  ['closed lecture',{active:false}]
 ]) {
  const variantId=`${sessionId}-${label.replaceAll(' ','-')}`;
  await seed(`attendance_sessions/${variantId}`,{...protectedSession.data(),...overrides});
  const recordId=`${variantId}_${studentUid}`,record=entry({attendanceId:recordId,sessionId:variantId});
  await check(`The server rejects a correct nonce for an ${label}`,()=>pair(record,record,studentFullDb,recordId),false);
 }
 published=await faculty.publishChallenge(sessionId);
 let saved;
 await check('The actual student repository saves one validated personal and audit entry',async()=>{saved=await student.submitAttendance({uid:studentUid,courseId:values.courseId,rawToken:published.token});if(saved.studentName!==profile.name||saved.studentUid!==studentUid||saved.verificationMethod!=='Live classroom QR')throw new Error('Saved identity changed');},true);
 await check('Both acknowledged attendance documents contain identical server timestamps and identities',async()=>{const [personal,audit]=await Promise.all([getDocFromServer(doc(adminFullDb,historyPath)),getDocFromServer(doc(adminFullDb,auditPath))]);if(JSON.stringify(personal.data())!==JSON.stringify(audit.data())||!personal.data().timestamp.toMillis())throw new Error('Attendance pair mismatch');},true);
 await check('A second submission to the same classroom session cannot rewrite history',()=>student.submitAttendance({uid:studentUid,courseId:values.courseId,rawToken:published.token}),false);
 const duplicateId=`${id}-duplicate`;
 await check('A different record ID cannot bypass one-check-in-per-session enforcement',()=>pair(entry({attendanceId:duplicateId}),entry({attendanceId:duplicateId}),studentFullDb,duplicateId),false);
 await check('A student cannot forge a Paid receipt in their own fee folder',()=>setDoc(doc(studentFullDb,'users',studentUid,'fee_receipts','forged-paid'),{studentUid,amount:195000,status:'Paid'}),false);
 await check('A faculty cannot forge a student payment receipt',()=>setDoc(doc(facultyDb,'users',studentUid,'fee_receipts','faculty-paid'),{studentUid,amount:195000,status:'Paid'}),false);
 await check('The exact accounting administrator retains receipt entry access',()=>setDoc(doc(adminFullDb,'users',studentUid,'fee_receipts','admin-recorded'),{studentUid,amount:0,status:'Pending',mode:'Isolated test record'}),true);
}
