import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { MemoryRouter, useLocation } from 'react-router-dom';
import Login from './src/pages/auth/Login.jsx';
import { AuthContext } from './src/contexts/authSession.js';
import { GOOGLE_SIGN_IN_ORIGIN } from './src/utils/googleSignInEntry.js';
const settle = () => new Promise(resolve => setTimeout(resolve, 30));
export async function runLoginContinuationChecks(check) {
 const node=document.createElement('div'); node.hidden=true; document.body.append(node);
 let root=createRoot(node), path='', attempts=[];
 const entry={origin:GOOGLE_SIGN_IN_ORIGIN,pathname:'/login',search:'?google=continue'};
 const signInWithGoogle=async options => { attempts.push(options); return null; };
 function Probe(){ const location=useLocation(); path=location.pathname+location.search; return null; }
 const view=(value, location=entry) => <AuthContext.Provider value={{signInWithGoogle,...value}}><MemoryRouter initialEntries={['/login?google=continue']}><Probe/><Login entryLocation={location}/></MemoryRouter></AuthContext.Provider>;
 const student={uid:'fixture-existing-student',name:'Existing Student'};
 try {
  flushSync(()=>root.render(view({user:student,role:'student',loading:true}))); await settle();
  check('The actual login waits for authoritative authentication before continuing or leaving an existing session', attempts.length===0 && path==='/login?google=continue');
  flushSync(()=>root.render(view({user:student,role:'student',loading:false}))); await settle();
  check('An existing student session starts a new first-party Google redirect instead of taking over the sign-in route', attempts.length===1 && attempts[0]?.redirect===true && path==='/login');
  flushSync(()=>root.render(view({user:{...student,name:'Updated Student'},role:'student',loading:false}))); await settle();
  check('A live profile update cannot repeat the Google continuation or reopen its consumed marker', attempts.length===1 && path==='/login');
  flushSync(()=>root.unmount()); root=createRoot(node);
  flushSync(()=>root.render(view({user:student,role:'guest',loading:false},{...entry,search:''}))); await settle();
  check('An ordinary unknown-account login still redirects to the public landing page', path==='/');
  flushSync(()=>root.unmount()); root=createRoot(node);
  flushSync(()=>root.render(view({user:student,role:'faculty',loading:false},{...entry,search:''}))); await settle();
  check('An ordinary enrolled login still returns to its own portal', path==='/faculty/dashboard' && attempts.length===1);
 } finally { flushSync(()=>root.unmount()); node.remove(); }
}
