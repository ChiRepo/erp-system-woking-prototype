import {createRemoteJWKSet,jwtVerify} from 'jose';

const publicKeys=createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
export class MediaError extends Error {
  constructor(status,message){super(message);this.status=status;}
}
export function createTokenVerifier({projectId='erp-system-mit',key=publicKeys}={}) {
  return async token=>{
    try {
      const {payload}=await jwtVerify(token,key,{algorithms:['RS256'],issuer:`https://securetoken.google.com/${projectId}`,audience:projectId,clockTolerance:5,requiredClaims:['sub','iat','exp','auth_time']});
      const now=Math.floor(Date.now()/1000);
      if(typeof payload.sub!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(payload.sub)||!Number.isFinite(payload.auth_time)||payload.auth_time>now+5||payload.iat>now+5||payload.firebase?.tenant)throw new Error('Unsupported identity');
      return payload;
    }catch(error){
      if(error.code==='ERR_JWKS_TIMEOUT'||error instanceof TypeError||error.name==='TimeoutError')throw new MediaError(503,'Sign-in verification is temporarily unavailable. Please retry.');
      throw new MediaError(401,'Sign in again to manage your media.');
    }
  };
}
const normalize=value=>String(value||'').trim().toLowerCase();
export function isMediaAdmin(claims) {
  const email=normalize(claims.email),provider=claims.firebase?.sign_in_provider;
  return email==='chinmayc3003@gmail.com'&&provider==='google.com'&&claims.email_verified===true||email==='admin@krc.edu'&&provider==='password';
}
export function enrolledMediaActor(claims,profile) {
  if(isMediaAdmin(claims))return {uid:claims.sub,role:'admin',profile:profile||{}};
  const role=String(profile?.role||'').toLowerCase(),provider=claims.firebase?.sign_in_provider,email=normalize(claims.email);
  const matches=provider==='password'?email===normalize(profile?.email):provider==='google.com'&&claims.email_verified===true&&[normalize(profile?.email),normalize(profile?.googleEmail)].includes(email);
  if(!email||!profile||profile.uid!==claims.sub||!matches||!(role==='student'&&profile.prn||role==='faculty'&&(profile.id||profile.employeeId)))throw new MediaError(403,'An enrolled campus account is required.');
  return {uid:claims.sub,role,profile};
}
const decode=value=>value?.stringValue??value?.booleanValue??(value?.integerValue!==undefined?Number(value.integerValue):value?.doubleValue??(value?.arrayValue?value.arrayValue.values?.map(decode)||[]:value?.mapValue?Object.fromEntries(Object.entries(value.mapValue.fields||{}).map(([key,item])=>[key,decode(item)])):null));
export function createEnrollmentReader({projectId='erp-system-mit',fetcher=fetch}={}) {
  return async(path,token)=>{
    const url=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${path.split('/').map(encodeURIComponent).join('/')}`;
    let response;
    try{response=await fetcher(url,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(10000)});}catch{throw new MediaError(503,'Campus access could not be verified. Please retry.');}
    if(response.status===404)return null;
    if(!response.ok)throw new MediaError(response.status===403?403:503,'Campus access could not be verified. Please retry.');
    const document=await response.json();
    return Object.fromEntries(Object.entries(document.fields||{}).map(([key,value])=>[key,decode(value)]));
  };
}
