import {studentDirectoryProjection} from './src/utils/studentDirectoryProjection.js';
import {mergeStudentDirectory,sameStudentIdentity} from './src/services/studentDirectory.js';
import {StudentSearchService} from './src/services/studentSearchService.js';

export async function runDirectoryPrivacyChecks(check) {
 const enrollment={uid:'private-directory-fixture',_documentId:'private-directory-fixture',role:'student',name:'Saved Full Name',prn:'PRN-PRIVATE',email:'fixture@campus.example.test',dept:'CSE',sem:'Sem V',allowChatting:true,
  contactPhone:'PRIVATE-PHONE',address:'PRIVATE-ADDRESS',academicSummary:{cgpa:10},feeSummary:{due:123},joinedGroups:['PRIVATE-CHANNEL'],recentlyViewed:['PRIVATE-DM'],uploadedPhotos:['PRIVATE-HISTORY'],startingPassword:'LOCAL-FAKE-SECRET'};
 const peer=studentDirectoryProjection(enrollment);
 check('Campus directory projection contains entered full names and none of the unrelated private enrollment fields',peer.name==='Saved Full Name'&&peer.fullName===peer.displayName&&!/PRIVATE-PHONE|PRIVATE-ADDRESS|PRIVATE-CHANNEL|PRIVATE-DM|PRIVATE-HISTORY|LOCAL-FAKE-SECRET|academicSummary|feeSummary/.test(JSON.stringify(peer)));
 check('Email/PRN aliases and demo enrollments cannot create independent directory identities',studentDirectoryProjection(enrollment,'PRN-PRIVATE')===null&&studentDirectoryProjection({...enrollment,isDemo:true})===null);
 const rows=mergeStudentDirectory([peer],[{_documentId:peer.uid,uid:peer.uid,handle:'saved.handle',customAvatar:'https://images.example.test/actual-avatar.png'}]);
 check('Directory enrichment uses the saved social handle and custom avatar',rows[0].username==='saved.handle'&&rows[0].avatar==='https://images.example.test/actual-avatar.png'&&rows[0].photoURL===rows[0].avatar);
 const attacked=mergeStudentDirectory([peer],[{_documentId:'other-actor',uid:peer.uid,email:peer.email,prn:peer.prn,handle:'spoofed.handle',customAvatar:'https://images.example.test/spoofed.png',bio:'Injected peer bio'}]);
 check('An unrelated social document cannot impersonate a peer using embedded UID, email or PRN',attacked[0].username!=='spoofed.handle'&&attacked[0].bio!=='Injected peer bio'&&!attacked[0].avatar);
 const poisoned=mergeStudentDirectory([peer],[{_documentId:peer.uid,uid:'victim-uid',identityIds:['victim-uid'],email:'victim@campus.example.test'}]);
 check('A saved social profile cannot add another account to its own DM identity aliases',!sameStudentIdentity(poisoned[0],{uid:'victim-uid',email:'victim@campus.example.test'}));
 let publish;
 const service=new StudentSearchService({subscribeStudents:callback=>{publish=callback;callback(rows,{loading:false,error:null});return()=>{};},getStudents:async()=>rows});
 const stop=service.subscribeStudents(()=>{},true);
 try {
  const matches=await service.search('saved.handle');
  check('The actual search service discovers the student by their saved social handle',matches.some(item=>item.uid===peer.uid));
  publish(mergeStudentDirectory([peer],[{_documentId:peer.uid,handle:'renamed.handle',customAvatar:'https://images.example.test/new-avatar.png'}]),{loading:false,error:null});
  const changed=await service.search('renamed.handle');
  check('Live handle and avatar changes replace cached peer values without refreshing',changed[0]?.username==='renamed.handle'&&changed[0]?.avatar==='https://images.example.test/new-avatar.png');
 } finally {stop();}
}
