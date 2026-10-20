import {useState,useEffect} from 'react';
import {QRCodeSVG} from 'qrcode.react';
import {classroomAttendanceRepository} from '../../services/classroomAttendanceRepository';
import {CLASSROOM_TOKEN_TTL_MS} from '../../utils/classroomToken';

export default function QRGenerator({session}) {
  const [state,setState]=useState({sessionId:'',token:'',expiresAt:0,error:'',loading:true});
  const [now,setNow]=useState(Date.now());
  const [version,setVersion]=useState(0);
  useEffect(()=>{
    let active=true,pending=false;
    setState({sessionId:session?.id || '',token:'',expiresAt:0,error:'',loading:true});
    if(!session?.id)return()=>{active=false;};
    const publish=async()=>{
      if(pending)return;
      pending=true;
      setState(previous=>({...previous,token:'',loading:true,error:''}));
      try {
        const result=await classroomAttendanceRepository.publishChallenge(session.id);
        if(active)setState({sessionId:session.id,token:result.token,expiresAt:result.session.tokenIssuedAt.toMillis()+CLASSROOM_TOKEN_TTL_MS,error:'',loading:false});
      } catch {if(active)setState({sessionId:session.id,token:'',expiresAt:0,error:'The classroom code could not be published. Check your assigned session and retry.',loading:false});}
      finally {pending=false;}
    };
    publish();
    const rotation=setInterval(publish,30000),clock=setInterval(()=>setNow(Date.now()),1000);
    return()=>{active=false;clearInterval(rotation);clearInterval(clock);};
  },[session?.id,version]);
  const current=state.sessionId===session?.id?state:{token:'',expiresAt:0,loading:true,error:''};
  const valid=Boolean(current.token&&now<current.expiresAt);
  const url=current.token?`https://erp-system-mit.web.app/student/attendance?scan=true&token=${encodeURIComponent(current.token)}`:'';
  return <div className="bg-surface border border-border rounded-xl p-5 space-y-4 text-center" aria-label="Classroom QR publisher">
    <h3 className="font-bold text-text">Lecture Attendance — {session?.courseId}</h3>
    {current.error?<p role="alert" className="text-sm text-red-500">{current.error}</p>:valid?<div className="bg-white p-3 rounded-xl w-fit mx-auto"><QRCodeSVG value={url} size={280} className="max-w-full h-auto" level="M" includeMargin/></div>:<p role="status" className="text-sm text-muted">{current.loading?'Publishing classroom code…':'The classroom code expired. Refresh it before scanning.'}</p>}
    {valid&&<p className="text-xs text-muted">Code expires in {Math.max(0,Math.ceil((current.expiresAt-now)/1000))}s. Only students in this session’s enrolled cohort can check in.</p>}
    <button onClick={()=>setVersion(value=>value+1)} disabled={current.loading} className="px-3 py-2 rounded-lg border border-border text-xs text-text disabled:opacity-50">Refresh classroom code</button>
    <p className="text-xs text-muted">The code confirms a current assigned session. Device location is advisory and is not proof of attendance.</p>
  </div>;
}
