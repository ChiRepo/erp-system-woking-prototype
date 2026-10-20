import {S3Client} from '@aws-sdk/client-s3';
import {FetchHttpHandler} from '@smithy/fetch-http-handler';
import {importJWK} from 'jose';
import {createWorkerGateway} from './workerBridge.js';
import {createMediaHandler} from './handler.js';
import {createTokenVerifier} from './auth.js';
import {createObjectStorage} from './storage.js';

// Separate entry, demo issuer and dummy credentials; never included by worker.js.
export default createWorkerGateway(async bindings=>{
 if(bindings.ENVIRONMENT!=='local-fixtures')throw new Error('Local fixtures only');
 const origin='http://127.0.0.1:8787';
 const response=await fetch(`${origin}/fixtures/worker-config`,{headers:{Origin:'http://127.0.0.1:5173'}});
 if(!response.ok)throw new Error('Local fixture source unavailable');
 const {projectId,jwk,documents}=await response.json();
 if(projectId!=='demo-erp-media-api')throw new Error('Wrong fixture project');
 const key=await importJWK(jwk,'RS256');
 const storage=createObjectStorage({bucket:'erp-local-media-fixture',region:'ap-south-1',client:new S3Client({
  region:'ap-south-1',credentials:{accessKeyId:'LOCALTESTACCESSID',secretAccessKey:'LOCAL-ONLY-DUMMY-SIGNING-SECRET'},
  endpoint:`${origin}/fixture-s3`,forcePathStyle:true,requestHandler:new FetchHttpHandler({requestTimeout:5000}),maxAttempts:1,
 })});
 return createMediaHandler({
  verifyToken:createTokenVerifier({projectId,key}),readDocument:async path=>documents[path]||null,
  storage:{...storage,publicUrl:key=>`${origin}/fixture-public/${key}`,async list(prefix){try{return await storage.list(prefix);}catch(error){console.warn('Local fixture listing error:',error.name,error.message);throw error;}}},
  allowedOrigins:['http://localhost:5173','http://127.0.0.1:5173'],
 });
});
