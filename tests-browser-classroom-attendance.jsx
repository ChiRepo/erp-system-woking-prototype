import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {Timestamp} from 'firebase/firestore';
import {AuthContext} from './src/contexts/authSession.js';
import AttendanceSessionManager from './src/components/attendance/AttendanceSessionManager.jsx';
import {AttendanceService} from './src/services/attendanceService.js';
import {classroomAttendanceRepository} from './src/services/classroomAttendanceRepository.js';
import {parseClassroomToken,encodeClassroomToken,classroomNonce} from './src/utils/classroomToken.js';
import QRScanner from './src/components/attendance/QRScanner.jsx';
import QRGenerator from './src/components/attendance/QRGenerator.jsx';
const settle=()=>new Promise(resolve=>setTimeout(resolve,40));
export async function runClassroomAttendanceChecks(check) {
 const session={id:'fixture-session',courseId:'FIXTURE',courseName:'Live fixture lecture',facultyUid:'fixture-faculty',facultyName:'Faculty Ω Name',room:'Fixture Room',dept:'ECE',sem:'Sem V',nonce:classroomNonce(),tokenIssuedAt:Timestamp.now()};
 const token=encodeClassroomToken(session);
 check('A classroom token preserves actual session metadata and Unicode full names',parseClassroomToken(token).facultyName===session.facultyName&&parseClassroomToken(token).sessionId===session.id);
 let legacyDenied=false,expiredDenied=false,futureDenied=false,foreignDenied=false;
 try{parseClassroomToken(`KRCIT|CS-501|DEMO|${Date.now()}`);}catch{legacyDenied=true;}
 try{parseClassroomToken(encodeClassroomToken({...session,tokenIssuedAt:Timestamp.fromMillis(Date.now()-45000)}));}catch{expiredDenied=true;}
 try{parseClassroomToken(encodeClassroomToken({...session,tokenIssuedAt:Timestamp.fromMillis(Date.now()+60000)}));}catch{futureDenied=true;}
 try{parseClassroomToken(`https://lookalike.example.test/student/attendance?token=${encodeURIComponent(token)}`);}catch{foreignDenied=true;}
 check('Legacy/demo, expired, future and foreign-site tokens are rejected before saving',legacyDenied&&expiredDenied&&futureDenied&&foreignDenied);
 check('Classroom challenges use independent256-bit nonce values',session.nonce.length===43&&session.nonce!==classroomNonce());
 let events=0,writes=0;const event=()=>events++;window.addEventListener('krc_attendance_updated',event);
 const service=new AttendanceService({repository:{submitAttendance:async()=>{writes++;throw new Error('Fixture attendance denied');}}});
 let rejected=false,missing=false;
 try{await service.markAttendance({user:{uid:'fixture-student'},courseId:'FIXTURE',rawToken:token});}catch{rejected=true;}
 try{await service.markAttendance({user:null,courseId:'FIXTURE',rawToken:token});}catch{missing=true;}
 check('A denied attendance save and missing identity never publish local success or seed default users',rejected&&missing&&writes===1&&events===0);
 const saved={attendanceId:'confirmed-attendance',studentName:'Saved Full Name'};
 const confirmed=new AttendanceService({repository:{submitAttendance:async()=>saved}});
 const result=await confirmed.markAttendance({user:{uid:'fixture-student'},courseId:'FIXTURE',rawToken:token});
 check('Attendance success uses the acknowledged saved record and emits exactly once',result===saved&&events===1);
 window.removeEventListener('krc_attendance_updated',event);
 const node=document.createElement('div');node.hidden=true;document.body.append(node);let root=createRoot(node);
 let release,rejectSave,attempts=0;
 const pendingSave=()=>{attempts++;return new Promise((resolve,reject)=>{release=resolve;rejectSave=reject;});};
 try {
  flushSync(()=>root.render(<QRScanner initialMode="manual" isFullscreen={false} initialToken={token} onScanSuccess={pendingSave}/>));await settle();
  check('The actual scanner has no Instant Demo Attendance action',!node.querySelector('[title="Instant Demo Attendance QR"]'));
  const form=node.querySelector('form');
  flushSync(()=>{form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});await settle();
  check('The actual scanner waits for persistence and prevents duplicate submissions',attempts===1&&node.textContent.includes('Saving attendance')&&!node.textContent.includes('Attendance saved'));
  rejectSave(new Error('Fixture attendance write rejected'));await settle();
  check('The actual scanner explains rejected persistence without showing success and preserves its code',node.textContent.includes('Fixture attendance write rejected')&&!node.textContent.includes('Attendance saved')&&node.querySelector('input[type=text]').value===token);
  flushSync(()=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));await settle();release(saved);await settle();
  check('The actual scanner shows success only after receiving the saved attendance ID',attempts===2&&node.textContent.includes('Attendance saved'));
  flushSync(()=>root.unmount());root=createRoot(node);
  const originalPublish=classroomAttendanceRepository.publishChallenge;
  let oldResolve,newResolve;
  try {
    classroomAttendanceRepository.publishChallenge=id=>new Promise(resolve=>{if(id==='old-session')oldResolve=resolve;else newResolve=resolve;});
    flushSync(()=>root.render(<QRGenerator session={{...session,id:'old-session'}}/>));await settle();
    check('The actual QR publisher shows no code before the database acknowledges its nonce',node.textContent.includes('Publishing classroom code')&&!node.querySelector('svg'));
    flushSync(()=>root.render(<QRGenerator session={{...session,id:'new-session'}}/>));await settle();
    oldResolve({session,token});await settle();
    check('A late challenge from a previously selected lecture cannot display its QR code',!node.querySelector('svg'));
    newResolve({session,token});await settle();
    check('An acknowledged challenge displays the actual QR for the current selected session',Boolean(node.querySelector('svg')));
    flushSync(()=>root.unmount());root=createRoot(node);
    classroomAttendanceRepository.publishChallenge=async()=>{throw new Error('fixture denied');};
    flushSync(()=>root.render(<QRGenerator session={session}/>));await settle();
    check('A rejected challenge displays a retryable error and never exposes an unsigned QR',node.querySelector('[role=alert]')?.textContent.includes('could not be published')&&!node.querySelector('svg'));
  } finally {classroomAttendanceRepository.publishChallenge=originalPublish;}
  flushSync(()=>root.unmount());root=createRoot(node);
  const originals={getFacultyChoices:classroomAttendanceRepository.getFacultyChoices,subscribeSessions:classroomAttendanceRepository.subscribeSessions,createSession:classroomAttendanceRepository.createSession};
  let creations=0,finishSession;
  try {
    classroomAttendanceRepository.getFacultyChoices=async()=>[{uid:'fixture-faculty',name:'Faculty Full Name',email:'faculty@example.test'}];
    classroomAttendanceRepository.subscribeSessions=(_uid,_admin,next)=>{next([]);return()=>{};};
    classroomAttendanceRepository.createSession=async()=>{creations++;throw new Error('Fixture session save denied');};
    flushSync(()=>root.render(<AuthContext.Provider value={{user:{uid:'fixture-admin'}}}><AttendanceSessionManager/></AuthContext.Provider>));await settle();
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
    const fields={'Course code':'FIXTURE','Course name':'Fixture Lecture','Department':'ECE','Semester (for example Sem V)':'Sem V','Classroom':'Fixture Room','Starts at':'2026-10-16T01:00','Ends at':'2026-10-16T02:00'};
    flushSync(()=>{for(const [label,value] of Object.entries(fields)){const input=node.querySelector(`[aria-label="${label}"]`);setter.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));}const select=node.querySelector('select');select.value='fixture-faculty';select.dispatchEvent(new Event('change',{bubbles:true}));});await settle();
    flushSync(()=>node.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));await settle();
    check('The actual admin assignment form preserves entered class details after a rejected save',creations===1&&node.querySelector('[role=alert]')?.textContent.includes('Fixture session save denied')&&node.querySelector('[aria-label="Course name"]').value==='Fixture Lecture');
    classroomAttendanceRepository.createSession=()=>{creations++;return new Promise(resolve=>{finishSession=resolve;});};
    flushSync(()=>{node.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));node.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});await settle();
    check('A pending actual session assignment prevents duplicate submissions without reporting success',creations===2&&node.textContent.includes('Saving session')&&!node.textContent.includes('Attendance session saved'));
    finishSession('saved-session');await settle();
    check('Only an acknowledged actual session assignment displays its faculty full name and success state',node.querySelector('[role=status]')?.textContent.includes('Faculty Full Name')&&node.textContent.includes('Attendance session saved'));
  } finally {Object.assign(classroomAttendanceRepository,originals);}
 } finally {flushSync(()=>root.unmount());node.remove();}
}
