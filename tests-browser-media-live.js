import {auth} from './src/firebase.js';
import {onAuthStateChanged} from 'firebase/auth';
import {createMediaApiTransport} from './src/services/mediaApiTransport.js';
if(!import.meta.env.DEV||!['localhost','127.0.0.1'].includes(location.hostname))throw new Error('Local verification only');
const button=document.getElementById('run'),results=document.getElementById('results');
onAuthStateChanged(auth,user=>{button.disabled=!user;document.getElementById('account').textContent=user?`Signed in: ${user.displayName||user.email}`:'Sign in first';});
button.onclick=async()=>{
 button.disabled=true;results.replaceChildren();
 const check=(label,ok)=>{const row=document.createElement('li');row.textContent=`${ok?'PASS':'FAIL'} — ${label}`;results.append(row);if(!ok)throw new Error('Verification stopped');};
 try{
  const transport=createMediaApiTransport({baseUrl:'https://krc-erp-media-gateway.jyotsnachaudhari999.workers.dev/api/media',uploadOrigins:['https://krc-edu-bucket.s3.ap-south-1.amazonaws.com']});
  const actor=await transport.identity();check('Deployed Worker verifies real Firebase identity and student enrollment',actor.uid===auth.currentUser?.uid&&actor.role==='student');
  const image=new Blob([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jGskAAAAASUVORK5CYII='),c=>c.charCodeAt(0))],{type:'image/png'});
  const saved=await transport.upload({file:image});check('Real object store acknowledges exact-size own-account image upload',saved.key.startsWith(`users/${actor.uid}/`)&&saved.fileSize===image.size);
  const rows=await transport.list();check('Real listing contains the acknowledged image and only own-account objects',rows.some(row=>row.Key===saved.key)&&rows.every(row=>row.Key.startsWith(`users/${actor.uid}/`)));
 }catch(error){const row=document.createElement('li');row.textContent=`FAIL — ${error.message}`;results.append(row);}finally{button.disabled=!auth.currentUser;}
};

document.getElementById('list').onclick=async()=>{
 const row=document.createElement('li');row.textContent='Checking real own-account listing without uploading';results.append(row);
 try{const transport=createMediaApiTransport({baseUrl:'https://krc-erp-media-gateway.jyotsnachaudhari999.workers.dev/api/media'});const rows=await transport.list();row.textContent=rows.every(item=>item.Key.startsWith(`users/${auth.currentUser.uid}/`))&&rows.some(item=>item.Size===68)?'PASS — Real listing contains the 68-byte verification image and only own-account objects':'FAIL — Listing did not contain the verification image';}catch(error){row.textContent=`FAIL — Listing: ${error.message}`;}
};
