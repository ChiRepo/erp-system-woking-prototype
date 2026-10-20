import {S3Client} from '@aws-sdk/client-s3';
import {FetchHttpHandler} from '@smithy/fetch-http-handler';
import {createWorkerGateway} from './workerBridge.js';
import {createMediaHandler} from './handler.js';
import {createTokenVerifier,createEnrollmentReader} from './auth.js';
import {createObjectStorage} from './storage.js';

export default createWorkerGateway(bindings=>{
 const secret=JSON.parse(bindings.MEDIA_STORAGE_CREDENTIALS||'{}');
 if(typeof secret.accessKeyId!=='string'||!secret.accessKeyId||typeof secret.secretAccessKey!=='string'||!secret.secretAccessKey)throw new Error('Missing media signing configuration');
 const region=bindings.MEDIA_REGION||'ap-south-1',projectId=bindings.FIREBASE_PROJECT_ID||'erp-system-mit';
 return createMediaHandler({
  verifyToken:createTokenVerifier({projectId}),readDocument:createEnrollmentReader({projectId}),
  storage:createObjectStorage({bucket:bindings.MEDIA_BUCKET,region,client:new S3Client({
   region,credentials:{accessKeyId:secret.accessKeyId,secretAccessKey:secret.secretAccessKey,...(secret.sessionToken?{sessionToken:secret.sessionToken}:{})},
   requestHandler:new FetchHttpHandler({requestTimeout:10000}),maxAttempts:2,
  })}),
  allowedOrigins:['https://erp-system-mit.web.app','https://erp-system-mit.firebaseapp.com'],
 });
});
