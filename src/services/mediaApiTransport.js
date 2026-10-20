import {auth} from '../firebase.js';

/** Prepared server transport; the live uploader switches only after backend rollout. */
export function createMediaApiTransport({baseUrl='/api/media',currentUser=()=>auth.currentUser,fetcher=fetch,uploadOrigins=[]}={}) {
 const requireUser=expectedUid=>{
  const user=currentUser();
  if(!user?.uid)throw new Error('Sign in to manage your media.');
  if(expectedUid&&user.uid!==expectedUid)throw new Error('Your account changed. Retry from your current account.');
  return user;
 };
 const rpc=async(path,body,expectedUid=requireUser().uid,retry=true)=>{
  const user=requireUser(expectedUid);
  const token=await user.getIdToken(!retry);
  requireUser(expectedUid);
  const response=await fetcher(`${baseUrl}${path}`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body),credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(15000)});
  requireUser(expectedUid);
  if(response.status===401&&retry)return rpc(path,body,expectedUid,false);
  let result;try{result=await response.json();}catch{throw new Error('The media service returned an incomplete response.');}
  requireUser(expectedUid);
  if(!response.ok)throw new Error(result.error||'Your media request could not be completed.');
  return result;
 };
 return {
  identity:()=>rpc('/identity',{}),
  async upload({file,destination='profile',chatId,contentType=file?.type}) {
   const expectedUid=requireUser().uid;
   const blob=file instanceof Blob?file:file instanceof ArrayBuffer||ArrayBuffer.isView(file)?new Blob([file],{type:contentType}):null;
   if(!blob||blob.size<1||!contentType)throw new Error('Choose a valid image to upload.');
   const grant=await rpc('/upload',{destination,chatId,contentType,size:blob.size},expectedUid);
   let url;try{url=new URL(grant.url);}catch{throw new Error('The media upload destination is incomplete.');}
   if(!uploadOrigins.includes(url.origin)||url.username||url.password||grant.fields?.key!==grant.key||grant.fields?.['Content-Type']!==contentType||typeof grant.publicUrl!=='string'||!Number.isInteger(grant.expiresIn)||grant.expiresIn<1||grant.expiresIn>120)throw new Error('The media upload grant is invalid.');
   const form=new FormData();
   for(const [key,value]of Object.entries(grant.fields)){if(typeof value!=='string')throw new Error('The media upload grant is incomplete.');form.append(key,value);}
   form.append('file',blob,file.name||'campus-image');
   const response=await fetcher(url.href,{method:'POST',body:form,credentials:'omit',signal:AbortSignal.timeout(120000)});
   requireUser(expectedUid);
   if(response.status!==204)throw new Error('Your image was not saved. Please retry.');
   return {key:grant.key,url:grant.publicUrl,publicUrl:grant.publicUrl,fileSize:blob.size,contentType};
  },
  async list(){const result=await rpc('/profile/list',{});if(!Array.isArray(result.objects))throw new Error('Your media library response is incomplete.');return result.objects;},
  async remove(key){const result=await rpc('/profile/remove',{key});if(result.removed!==true)throw new Error('The media service did not confirm deletion.');return true;}
 };
}

/** A configured gateway never falls back to browser signing on an error. */
export function createConfiguredMediaTransport({gatewayUrl,legacyTransport,publicUrl,uploadOrigins,currentUser,fetcher,allowLocal=false}={}) {
 if(!String(gatewayUrl||'').trim())return legacyTransport;
 let baseUrl;
 try{
  const url=new URL(String(gatewayUrl).trim());
  const local=allowLocal&&url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if((url.protocol!=='https:'&&!local)||url.username||url.password||url.search||url.hash||!url.pathname.replace(/\/$/,'').endsWith('/api/media'))throw new Error();
  baseUrl=url.href.replace(/\/$/,'');
 }catch{
  const unavailable=async()=>{throw new Error('The media service address is invalid. Contact your administrator.');};
  return {publicUrl,upload:unavailable,list:unavailable,remove:unavailable,identity:unavailable};
 }
 return {...createMediaApiTransport({baseUrl,currentUser,fetcher,uploadOrigins}),publicUrl};
}
