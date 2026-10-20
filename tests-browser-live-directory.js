import {onAuthStateChanged} from 'firebase/auth';
import {collection,query,where,getDocsFromServer,getDocFromServer,doc} from 'firebase/firestore';
import {auth,db} from './src/firebase.js';

if(!import.meta.env.DEV||!['localhost','127.0.0.1'].includes(location.hostname)||db.app.options.projectId!=='erp-system-mit')throw new Error('Local-only live read verification.');
const button=document.getElementById('run'),identity=document.getElementById('identity');
onAuthStateChanged(auth,user=>{identity.textContent=user?'Existing account session restored.':'Sign in to the local ERP with an enrolled student account first.';button.disabled=!user;});
button.onclick=async()=>{
 button.disabled=true;const results=document.getElementById('results');results.replaceChildren();let passed=0,failed=0;
 const check=(label,valid)=>{valid?passed++:failed++;const row=document.createElement('li');row.textContent=`${valid?'PASS':'FAIL'} — ${label}`;results.append(row);document.getElementById('summary').textContent=`${passed} passed · ${failed} failed`;};
 try {
  const uid=auth.currentUser?.uid;if(!uid)throw new Error('No active account');
  const own=await getDocFromServer(doc(db,'users',uid));
  if(!own.exists()||!['student','Student'].includes(own.data().role))throw new Error('An enrolled student account is required');
  check('The signed-in student can read their own private enrollment',true);
  const peers=(await getDocsFromServer(query(collection(db,'student_directory'),where('role','==','student')))).docs;
  check('The live directory includes the signed-in student with their enrolled full name',peers.some(item=>item.id===uid&&item.data().name===own.data().name));
  const other=peers.find(item=>item.id!==uid&&item.data().email!==own.data().email);
  if(!other)throw new Error('A separate enrolled peer is needed for the privacy check');
  check('The live student session can discover another enrolled student',Boolean(other.data().name&&other.data().prn));
  check('Published peer data excludes private enrollment, account and DM recency fields',!['startingPassword','password','contactPhone','address','academicSummary','feeSummary','chatAccessKey','recentlyViewed','uploadedPhotos','mustChangePassword'].some(key=>key in other.data()));
  let denied=false;try{await getDocFromServer(doc(db,'users',other.id));}catch(error){denied=error.code==='permission-denied';}
  check('The production server rejects reading that peer private enrollment',denied);
 }catch(error){check(error.code?`Live verification unavailable (${error.code})`:error.message,false);}
 finally{button.disabled=!auth.currentUser;}
};
