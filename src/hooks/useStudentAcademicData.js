import { useState, useEffect, useCallback } from 'react';
import { studentAcademicRepository } from '../services/studentAcademicRepository';

const empty = () => ({profile:null,academicSummary:null,feeSummary:null,attendance:[],grades:[],fees:[]});
export function useStudentAcademicData(uid, kinds, repository = studentAcademicRepository) {
  const key = kinds.join('|');
  const [version,setVersion] = useState(0);
  const [state,setState] = useState(() => ({uid:'',data:empty(),loading:true,errors:{}}));
  useEffect(() => {
    let active = true;
    const pending = new Set(key.split('|'));
    setState({uid,data:empty(),loading:Boolean(uid),errors:{}});
    if (!uid) return () => {active=false;};
    const stops = [...pending].map(kind => repository.subscribe(uid,kind,value => {
      if (!active) return;
      pending.delete(kind);
      setState(previous => ({uid,data:{...previous.data,[kind]:value},loading:pending.size>0,
        errors:{...previous.errors,[kind]:''}}));
    }, () => {
      if (!active) return;
      pending.delete(kind);
      setState(previous => ({uid,data:{...previous.data,[kind]:['profile','academicSummary','feeSummary'].includes(kind)?null:[]},loading:pending.size>0,
        errors:{...previous.errors,[kind]:`Could not load ${({profile:'student details',academicSummary:'academic summary',feeSummary:'fee summary'})[kind] || kind}. Please retry.`}}));
    }));
    return () => {active=false;stops.forEach(stop=>stop());};
  }, [uid,key,version,repository]);
  const retry=useCallback(()=>setVersion(value=>value+1),[]);
  return {...(state.uid===uid ? state : {data:empty(),loading:Boolean(uid),errors:{}}),
    error:state.uid===uid ? Object.values(state.errors).filter(Boolean).join(' ') : '', retry};
}
