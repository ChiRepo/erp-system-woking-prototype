import {onRequest} from 'firebase-functions/v2/https';
import {defineSecret,defineString} from 'firebase-functions/params';
import {S3Client} from '@aws-sdk/client-s3';
import {createTokenVerifier,createEnrollmentReader} from './auth.js';
import {createMediaHandler} from './handler.js';
import {createObjectStorage} from './storage.js';

const storageCredentials=defineSecret('MEDIA_STORAGE_CREDENTIALS');
const bucket=defineString('MEDIA_BUCKET',{default:'krc-edu-bucket'});
const region=defineString('MEDIA_REGION',{default:'ap-south-1'});
let handler;

// Credentials are bound only to this function and resolved only at runtime.
export const mediaGateway=onRequest({
 region:'asia-south1',memory:'256MiB',timeoutSeconds:30,
 minInstances:0,maxInstances:1,concurrency:8,cors:false,
 secrets:[storageCredentials],
},async(request,response)=>{
 try {
  if(!handler){
   const secret=JSON.parse(storageCredentials.value());
   if(typeof secret.accessKeyId!=='string'||!secret.accessKeyId||typeof secret.secretAccessKey!=='string'||!secret.secretAccessKey)throw new Error('Invalid media secret configuration');
   const credentials={accessKeyId:secret.accessKeyId,secretAccessKey:secret.secretAccessKey,...(secret.sessionToken?{sessionToken:secret.sessionToken}:{})};
   const projectId=process.env.GCLOUD_PROJECT||'erp-system-mit';
   handler=createMediaHandler({
    verifyToken:createTokenVerifier({projectId}),readDocument:createEnrollmentReader({projectId}),
    storage:createObjectStorage({bucket:bucket.value(),region:region.value(),client:new S3Client({region:region.value(),credentials})}),
    allowedOrigins:['https://erp-system-mit.web.app','https://erp-system-mit.firebaseapp.com'],
   });
  }
  return await handler(request,response);
 }catch{
  response.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  response.end(JSON.stringify({error:'The media service is not configured. Please retry later.'}));
 }
});
