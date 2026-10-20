/**
 * @fileoverview FACULTY attendance sessions - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import {useEffect,useState} from 'react';
import {useAuth} from '../../contexts/AuthContext';
import {useClassroomSessions} from '../../hooks/useClassroomSessions';
import {firestoreService} from '../../services/firestoreService';
import {recordDateLabel} from '../../utils/academicRecords';
import QRGenerator from '../../components/attendance/QRGenerator';

export default function FacultyAttendance() {
  const {user}=useAuth();
  const sessions=useClassroomSessions(user?.uid);
  const [now,setNow]=useState(Date.now()),[choice,setChoice]=useState(''),[roster,setRoster]=useState([]),[error,setError]=useState(''),[version,setVersion]=useState(0);
  const assigned=sessions.sessions.filter(item=>item.active);
  const selected=assigned.find(item=>item.id===choice)||assigned.find(item=>item.startAt?.toMillis()<=now&&item.endAt?.toMillis()>now)||assigned[0]||null;
  const live=Boolean(selected&&selected.startAt?.toMillis()<=now&&selected.endAt?.toMillis()>now);
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{
    let active=true;setRoster([]);setError('');
    if(!selected?.id)return()=>{active=false;};
    const stop=firestoreService.subscribeAuditLog(rows=>{if(active)setRoster(rows);},null,selected.id,()=>{if(active){setRoster([]);setError('Session attendance could not be loaded. Please retry.');}});
    return()=>{active=false;stop();};
  },[selected?.id,user?.uid,version]);
  return <div className="max-w-7xl mx-auto space-y-6">
    <div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-2xl font-bold text-text">Lecture Attendance QR Station</h1><p className="text-sm text-muted mt-1">Only your administrator-assigned sessions can publish classroom codes.</p></div><label className="text-xs text-muted">Assigned session<select aria-label="Assigned attendance session" value={selected?.id||''} disabled={!assigned.length} onChange={event=>setChoice(event.target.value)} className="block p-2 mt-1 bg-surface border border-border rounded text-text">{!assigned.length&&<option value="">No assigned subjects</option>}{assigned.map(item=><option key={item.id} value={item.id}>{item.courseId} · {item.startAt?.toDate?.().toLocaleString()}</option>)}</select></label></div>
    {sessions.error&&<p role="alert" className="text-sm text-red-500">{sessions.error} <button onClick={sessions.retry}>Retry</button></p>}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section className="bg-surface border border-border rounded-xl p-5 space-y-3">
        <h2 className="font-bold text-text">{live?'Active QR Station':'QR Station Inactive'}</h2>
        {live?<QRGenerator key={selected.id} session={selected}/>:<p role="status" className="text-sm text-muted">{sessions.loading?'Loading your attendance sessions…':selected?'QR attendance opens during your assigned lecture.':'No lectures assigned to you today. QR attendance is unavailable.'}</p>}
        <p className="text-xs text-muted">Faculty: {user?.displayName || user?.name}</p>{selected&&<p className="text-xs text-muted">{selected.courseName} · {selected.room} · {selected.dept} / {selected.sem}</p>}
      </section>
      <section className="bg-surface border border-border rounded-xl p-5 space-y-3"><div className="flex justify-between gap-2"><h2 className="font-bold text-text">Session Attendance</h2><button disabled={!selected} onClick={()=>setVersion(v=>v+1)} className="text-xs border border-border rounded px-3 py-1 text-text disabled:opacity-50">Refresh roster</button></div>
        {error&&<p role="alert" className="text-sm text-red-500">{error}</p>}<p className="text-sm text-muted">{roster.length} saved check-in(s)</p>
        {roster.length?<ul className="space-y-2">{roster.map(item=><li key={item.attendanceId || item.auditId} className="p-3 border border-border rounded text-xs text-text">{item.studentName} · {item.prn}<p className="text-muted mt-1">{recordDateLabel(item)} · {item.attendanceId}</p></li>)}</ul>:<p className="text-sm text-muted">No student check-ins recorded for this session.</p>}
      </section>
    </div>
  </div>;
}
