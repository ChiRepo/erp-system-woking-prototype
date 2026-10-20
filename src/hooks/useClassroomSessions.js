import {useEffect,useState} from 'react';
import {classroomAttendanceRepository} from '../services/classroomAttendanceRepository';
export function useClassroomSessions(uid,isAdmin=false) {
  const [state,setState]=useState({uid:'',sessions:[],loading:true,error:''});
  const [version,setVersion]=useState(0);
  useEffect(()=>{
    let active=true;
    setState({uid,sessions:[],loading:Boolean(uid),error:''});
    if(!uid)return()=>{active=false;};
    const stop=classroomAttendanceRepository.subscribeSessions(uid,isAdmin,sessions=>{if(active)setState({uid,sessions,loading:false,error:''});},()=>{if(active)setState({uid,sessions:[],loading:false,error:'Attendance sessions could not be loaded. Please retry.'});});
    return()=>{active=false;stop();};
  },[uid,isAdmin,version]);
  return {...(state.uid===uid?state:{sessions:[],loading:Boolean(uid),error:''}),retry:()=>setVersion(v=>v+1)};
}
