import {createServer} from 'node:http';
import {createTokenVerifier,createEnrollmentReader} from './auth.js';
import {createMediaHandler} from './handler.js';
import {createObjectStorage} from './storage.js';

const projectId=process.env.FIREBASE_PROJECT_ID||'erp-system-mit';
const handler=createMediaHandler({verifyToken:createTokenVerifier({projectId}),readDocument:createEnrollmentReader({projectId}),storage:createObjectStorage({bucket:process.env.MEDIA_BUCKET,region:process.env.MEDIA_REGION||'ap-south-1'}),allowedOrigins:(process.env.MEDIA_ALLOWED_ORIGINS||'https://erp-system-mit.web.app,https://erp-system-mit.firebaseapp.com').split(',').map(value=>value.trim()).filter(Boolean)});
const server=createServer(handler);
server.requestTimeout=10000;server.headersTimeout=5000;server.keepAliveTimeout=5000;
server.listen(Number(process.env.PORT||8787),process.env.MEDIA_BIND_HOST||'127.0.0.1',()=>process.stdout.write('Authenticated media gateway listening.\n'));
