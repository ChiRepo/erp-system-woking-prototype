import {useEffect,useRef,useState} from 'react';
import {useAuth} from '../../contexts/AuthContext';
import {useClassroomSessions} from '../../hooks/useClassroomSessions';
import {classroomAttendanceRepository} from '../../services/classroomAttendanceRepository';

export default function AttendanceSessionManager() {
  const {user}=useAuth();
  const sessions=useClassroomSessions(user?.uid,true);
  const [faculty,setFaculty]=useState([]),[error,setError]=useState(''),[notice,setNotice]=useState(''),[saving,setSaving]=useState(false);
  const [draft,setDraft]=useState({facultyUid:'',courseId:'',courseName:'',dept:'',sem:'',room:'',startAt:'',endAt:''});
  const requestId=useRef(crypto.randomUUID()),pending=useRef(false);
  useEffect(()=>{let active=true;classroomAttendanceRepository.getFacultyChoices().then(rows=>{if(active)setFaculty(rows);}).catch(()=>{if(active)setError('Enrolled faculty could not be loaded. Please retry this page.');});return()=>{active=false;};},[user?.uid]);
  const change=(field,value)=>{setDraft(previous=>({...previous,[field]:value}));requestId.current=crypto.randomUUID();setNotice('');};
  const submit=async event=>{
    event.preventDefault();if(pending.current)return;
    pending.current=true;setSaving(true);setError('');setNotice('');
    try {
      const teacher=faculty.find(item=>item.uid===draft.facultyUid);
      if(!teacher)throw new Error('Choose an enrolled faculty account.');
      const id=await classroomAttendanceRepository.createSession({...draft,facultyName:teacher.name || teacher.displayName},requestId.current);
      if(!id)throw new Error('The database did not confirm the session.');
      setNotice(`Attendance session saved for ${teacher.name || teacher.displayName} (${draft.courseId}).`);
    } catch(failure){setError(failure.message || 'The attendance session could not be saved.');}
    finally {pending.current=false;setSaving(false);}
  };
  return <section className="bg-surface border border-border rounded-xl p-5 space-y-4" aria-label="Attendance session assignments">
    <div><h2 className="font-bold text-text">Assign a Classroom Attendance Session</h2><p className="text-xs text-muted mt-1">Assign the faculty, enrolled cohort and actual class window before a classroom code can be published.</p></div>
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <label className="text-xs text-muted">Faculty<select aria-label="Session faculty" required value={draft.facultyUid} disabled={saving} onChange={event=>change('facultyUid',event.target.value)} className="block mt-1 w-full p-2 rounded border border-border bg-bg text-text"><option value="">Select an enrolled faculty account</option>{faculty.map(item=><option key={item.uid} value={item.uid}>{item.name || item.displayName} — {item.email}</option>)}</select></label>
      {[['courseId','Course code','text'],['courseName','Course name','text'],['dept','Department','text'],['sem','Semester (for example Sem V)','text'],['room','Classroom','text'],['startAt','Starts at','datetime-local'],['endAt','Ends at','datetime-local']].map(([field,label,type])=><label key={field} className="text-xs text-muted">{label}<input aria-label={label} required type={type} value={draft[field]} disabled={saving} onChange={event=>change(field,event.target.value)} className="block mt-1 w-full p-2 rounded border border-border bg-bg text-text"/></label>)}
      <button disabled={saving || Boolean(notice)} className="px-4 py-2 rounded border border-border text-sm text-text disabled:opacity-50">{saving?'Saving session…':'Save attendance session'}</button>
    </form>
    {error&&<p role="alert" className="text-sm text-red-500">{error}</p>}{notice&&<p role="status" className="text-sm text-emerald-600">{notice}</p>}
    {sessions.error&&<p role="alert" className="text-sm text-red-500">{sessions.error} <button onClick={sessions.retry}>Retry</button></p>}
    <p className="text-xs text-muted">{sessions.loading?'Loading assigned sessions…':`${sessions.sessions.length} saved attendance session(s).`}</p>
    <ul className="space-y-2 text-xs text-muted">{sessions.sessions.map(item=><li key={item.id} className="p-2 border border-border rounded">{item.courseId} · {item.facultyName} · {item.dept} / {item.sem} · {item.startAt?.toDate?.().toLocaleString()} · {item.active?'Assigned':'Closed'}</li>)}</ul>
  </section>;
}
