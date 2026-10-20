import {doc,getDocFromServer,setDoc,writeBatch} from 'firebase/firestore';
import {createStudentDirectoryRepository} from './src/services/studentDirectoryRepository.js';
import {studentDirectoryProjection} from './src/utils/studentDirectoryProjection.js';

export async function runDirectoryPrivacyRuleChecks({check,seed,session,run,studentUid,profile,adminFullDb,studentFullDb}) {
 const peerUid=`${run}-private-peer`,peerEmail=`${run}.private-peer@campus.example.test`;
 const privatePeer={...profile,uid:peerUid,email:peerEmail,googleEmail:'',prn:`${run}-PRIVATE`,name:'Private Fixture Full Name',displayName:'Private Fixture Full Name',fullName:'Private Fixture Full Name',contactPhone:'LOCAL-PRIVATE-PHONE',privateEnrollmentNote:'LOCAL-PRIVATE-NOTE',academicSummary:{cgpa:9},feeSummary:{due:123},recentlyViewed:['LOCAL-PRIVATE-DM']};
 await seed(`users/${peerUid}`,privatePeer);
 const actor=()=>({email:'chinmayc3003@gmail.com',getIdTokenResult:async()=>({signInProvider:'google.com',claims:{email_verified:true}})});
 const admin=createStudentDirectoryRepository({database:adminFullDb,currentUser:actor});
 const student=createStudentDirectoryRepository({database:studentFullDb,currentUser:()=>({uid:studentUid})});
 await check('Actual admin directory synchronization publishes only canonical campus peer fields',async()=>{const count=await admin.synchronize([{...privatePeer,_documentId:peerUid},{...privatePeer,_documentId:`google_${peerEmail}`}]);if(count!==1)throw new Error('An alias became an independent peer');},true);
 await check('The actual student repository discovers full names without private enrollment data',async()=>{const peers=await student.get();const peer=peers.find(item=>item.uid===peerUid);if(peer?.name!==privatePeer.name||/LOCAL-PRIVATE|academicSummary|feeSummary|contactPhone|recentlyViewed/.test(JSON.stringify(peer)))throw new Error('Private enrollment fields reached a peer');},true);
 await check('A student cannot read another student private enrollment document',()=>getDocFromServer(doc(studentFullDb,'users',peerUid)),false);
 await check('A student retains read access to their own private enrollment',()=>getDocFromServer(doc(studentFullDb,'users',studentUid)),true);
 const unknown=session(`${run}-unknown-directory`,`${run}.unknown-directory@example.test`,'google.com',true,true);
 await check('An unknown signed-in account cannot read the campus peer directory',()=>getDocFromServer(doc(unknown,'student_directory',peerUid)),false);
 const projected=studentDirectoryProjection(privatePeer,peerUid);
 await check('A student cannot replace another student public directory name',()=>setDoc(doc(studentFullDb,'student_directory',peerUid),{...projected,name:'Forged Peer Name',displayName:'Forged Peer Name',fullName:'Forged Peer Name'}),false);
 await check('Even an administrator-shaped client cannot publish without actual backend authority',()=>createStudentDirectoryRepository({database:studentFullDb,currentUser:actor}).synchronize([{...privatePeer,_documentId:peerUid}]),false);
 await check('Private enrollment fields cannot be injected into campus directory documents',()=>setDoc(doc(adminFullDb,'student_directory',peerUid),{...projected,contactPhone:'LOCAL-PRIVATE-PHONE'}),false);
 await check('Public peer fields must match the saved authoritative enrollment identity',()=>setDoc(doc(adminFullDb,'student_directory',peerUid),{...projected,prn:'INVENTED-PRN'}),false);
 await check('A stale directory snapshot cannot overwrite authoritative chat clearance',()=>setDoc(doc(adminFullDb,'student_directory',peerUid),{...projected,allowChatting:false}),false);
 await check('A directory snapshot cannot replace the saved root profile photo with a stale image',()=>setDoc(doc(adminFullDb,'student_directory',peerUid),{...projected,photoURL:'https://images.example.test/stale.png'}),false);
 const peerDb=session(peerUid,peerEmail,'password',false,true);
 await check('An enrolled owner cannot publish a name that differs from their saved enrollment',()=>setDoc(doc(peerDb,'student_directory',peerUid),{...projected,name:'Unsaved Name',displayName:'Unsaved Name',fullName:'Unsaved Name'}),false);
 let latest,streamError;
 const stop=student.subscribe(false,rows=>{latest=rows.find(item=>item.uid===peerUid);},error=>{streamError=error;});
 try {
  const wait=async predicate=>{const until=Date.now()+8000;while(!predicate()&&!streamError&&Date.now()<until)await new Promise(resolve=>setTimeout(resolve,20));if(streamError||!predicate())throw new Error('The real directory stream did not update');};
  await wait(()=>latest?.name===privatePeer.name);
  const renamed={...privatePeer,name:'Renamed Fixture Full Name',displayName:'Renamed Fixture Full Name',fullName:'Renamed Fixture Full Name'};
  await check('A saved owner name change updates enrollment and public directory atomically',async()=>{const batch=writeBatch(peerDb);batch.update(doc(peerDb,'users',peerUid),{name:renamed.name,displayName:renamed.name,fullName:renamed.name});batch.set(doc(peerDb,'student_directory',peerUid),studentDirectoryProjection(renamed,peerUid));await batch.commit();},true);
  await check('Peer directory subscribers receive the actual saved full-name change without reload',async()=>{await wait(()=>latest?.name===renamed.name);},true);
  await check('Publishing a peer projection leaves existing private and academic fields intact',async()=>{const snapshot=await getDocFromServer(doc(adminFullDb,'users',peerUid));if(snapshot.data().privateEnrollmentNote!=='LOCAL-PRIVATE-NOTE'||snapshot.data().academicSummary.cgpa!==9)throw new Error('Directory publication changed private records');},true);
 } finally {stop();}
}
