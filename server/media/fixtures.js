import {createServer} from 'node:http';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {generateKeyPair,SignJWT,exportJWK} from 'jose';
import {S3Client,ListObjectsV2Command,DeleteObjectCommand} from '@aws-sdk/client-s3';
import {createTokenVerifier} from './auth.js';
import {createMediaHandler} from './handler.js';
import {createObjectStorage} from './storage.js';
import {onRequest} from 'firebase-functions/v2/https';

// Loopback-only, separate JWT issuer, dummy credentials, and RAM-only objects.
// This fixture never reads production configuration or connects to cloud storage.
if(process.env.NODE_ENV==='production')throw new Error('Local fixture server cannot run in production.');
const origin='http://127.0.0.1:8787',allowed=['http://localhost:5173','http://127.0.0.1:5173'];
const projectId='demo-erp-media-api',{privateKey,publicKey}=await generateKeyPair('RS256',{extractable:true});
const issuer=`https://securetoken.google.com/${projectId}`,now=Math.floor(Date.now()/1000);
const token=async(uid,email,provider='password',extra={},options={})=>new SignJWT({email,email_verified:provider==='google.com',firebase:{sign_in_provider:provider},auth_time:now,...extra}).setProtectedHeader({alg:'RS256'}).setSubject(uid).setIssuedAt(now).setIssuer(options.issuer||issuer).setAudience(options.audience||projectId).setExpirationTime(options.exp||now+3600).sign(privateKey);
const tokens={
 student:await token('student-a','a@campus.example.test'),other:await token('student-b','b@campus.example.test'),blocked:await token('blocked','blocked@campus.example.test'),faculty:await token('faculty','faculty@campus.example.test'),unknown:await token('unknown','unknown@example.test','google.com'),
 googleAdmin:await token('admin-google','chinmayc3003@gmail.com','google.com'),passwordAdmin:await token('admin-password','admin@krc.edu'),wrongAdmin:await token('admin-wrong','chinmayc3003@gmail.com'),wrongInstitutionalProvider:await token('institutional-google','admin@krc.edu','google.com'),unverifiedAdmin:await token('unverified-admin','chinmayc3003@gmail.com','google.com',{email_verified:false}),googleStudent:await token('student-a','a.google@example.test','google.com'),wrongProvider:await token('student-a','a.google@example.test'),unverified:await token('student-a','a.google@example.test','google.com',{email_verified:false}),
 expired:await token('student-a','a@campus.example.test','password',{}, {exp:now-600}),wrongProject:await token('student-a','a@campus.example.test','password',{}, {audience:'other-project'}),wrongIssuer:await token('student-a','a@campus.example.test','password',{}, {issuer:'https://securetoken.google.com/other-project'}),rate:await token('rate','rate@campus.example.test'),quota:await token('quota','quota@campus.example.test'),badUid:await token('bad-uid','bad@campus.example.test')
};
const profiles=new Map([
 ['student-a',{uid:'student-a',role:'student',prn:'PRN-A',email:'a@campus.example.test',googleEmail:'a.google@example.test',allowChatting:true}],['student-b',{uid:'student-b',role:'student',prn:'PRN-B',email:'b@campus.example.test',allowChatting:true}],
 ['blocked',{uid:'blocked',role:'student',prn:'PRN-BLOCKED',email:'blocked@campus.example.test',allowChatting:false}],['faculty',{uid:'faculty',role:'faculty',id:'FAC-ONLY',email:'faculty@campus.example.test'}],['rate',{uid:'rate',role:'student',prn:'PRN-RATE',email:'rate@campus.example.test'}],['quota',{uid:'quota',role:'student',prn:'PRN-QUOTA',email:'quota@campus.example.test'}],['bad-uid',{uid:'student-b',role:'student',prn:'PRN-BAD',email:'bad@campus.example.test'}]
]);
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jGskAAAAASUVORK5CYII=','base64');
const objects=new Map([['users/student-a/seed-one.png',{bytes:png,type:'image/png'}],['users/student-a/seed-two.png',{bytes:png,type:'image/png'}],['users/student-b/private.png',{bytes:png,type:'image/png'}]]);
let failUpload=false,falseAck=false,failList=false,failRemove=false,signs=0,removes=0,pages=0;
const credentials={accessKeyId:'LOCALTESTACCESSID',secretAccessKey:'LOCAL-ONLY-DUMMY-SIGNING-SECRET'},region='ap-south-1',bucket='erp-local-media-fixture';
const client=new S3Client({region,credentials});
client.send=async command=>{
 if(command instanceof ListObjectsV2Command){pages++;if(failList){failList=false;throw new Error('Local fixture listing rejected');}const owned=[...objects].filter(([key])=>key.startsWith(command.input.Prefix));const index=Number(command.input.ContinuationToken||0);return {Contents:[...owned.slice(index,index+1).map(([Key,value])=>({Key,Size:value.bytes.length,LastModified:new Date(0)})),{Key:'users/student-b/private.png',Size:68}],IsTruncated:index+1<owned.length,NextContinuationToken:index+1<owned.length?String(index+1):undefined};}
 if(command instanceof DeleteObjectCommand){if(failRemove){failRemove=false;throw new Error('Local fixture delete rejected');}objects.delete(command.input.Key);removes++;return {};}
 throw new Error('Fixture cannot perform remote operations');
};
const realStorage=createObjectStorage({bucket,region,client});
const storage={...realStorage,publicUrl:key=>`${origin}/fixture-public/${key}`,async signUpload(values){signs++;const grant=await realStorage.signUpload(values);return {...grant,url:`${origin}/fixture-upload`};}};
const readDocument=async path=>{
 if(path.startsWith('users/'))return profiles.get(path.slice(6))||null;
 return ({'student_chats/joined-dm':{participants:['student-a','student-b']},'student_chats/foreign-dm':{participants:['student-b','third-student']},'student_channels/joined-channel':{memberUids:['student-a'],bannedMembers:[]},'student_channels/legacy-owned-channel':{creatorUid:'student-a',memberUids:[],bannedMembers:[]},'student_channels/foreign-channel':{memberUids:['student-b']},'student_channels/banned-channel':{memberUids:['student-a'],bannedMembers:['student-a']}})[path]||null;
};
const handler=createMediaHandler({verifyToken:createTokenVerifier({projectId,key:publicKey}),readDocument,storage,allowedOrigins:allowed});
const firebaseHandler=onRequest({cors:false},handler);
const hmac=(key,data)=>createHmac('sha256',key).update(data).digest();
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
const server=createServer(async(req,res)=>{
 if(allowed.includes(req.headers.origin)){res.setHeader('Access-Control-Allow-Origin',req.headers.origin);res.setHeader('Vary','Origin');}
 if(req.url?.startsWith('/fixture-s3/erp-local-media-fixture')){
  if(req.method==='POST'){req.url='/fixture-upload';req.headers.origin=allowed[1];}
  else {
   if(!req.headers.authorization?.startsWith('AWS4-HMAC-SHA256 Credential=LOCALTESTACCESSID/'))return json(res,403,{error:'Disposable local SDK fixture only'});
   const url=new URL(req.url,origin),escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
   try{
    if(req.method==='GET'&&url.searchParams.get('list-type')==='2'){
     const page=await client.send(new ListObjectsV2Command({Prefix:url.searchParams.get('prefix')||'',ContinuationToken:url.searchParams.get('continuation-token')||undefined}));
     const rows=page.Contents.map(item=>`<Contents><Key>${escape(item.Key)}</Key><Size>${item.Size}</Size><LastModified>1970-01-01T00:00:00.000Z</LastModified></Contents>`).join('');
     res.writeHead(200,{'Content-Type':'application/xml'});res.end(`<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><IsTruncated>${page.IsTruncated}</IsTruncated>${page.NextContinuationToken?`<NextContinuationToken>${page.NextContinuationToken}</NextContinuationToken>`:''}${rows}</ListBucketResult>`);return;
    }
    if(req.method==='DELETE'){
     const key=decodeURIComponent(url.pathname.slice('/fixture-s3/erp-local-media-fixture/'.length));
     await client.send(new DeleteObjectCommand({Key:key}));res.writeHead(204);res.end();return;
    }
   }catch{res.writeHead(503,{'Content-Type':'application/xml'});res.end('<Error><Code>ServiceUnavailable</Code><Message>Local fixture operation rejected</Message></Error>');return;}
   return json(res,404,{error:'Local object fixture not found'});
  }
 }
 if(req.url?.startsWith('/firebase/api/media/')){
  if(req.method==='OPTIONS')return handler(req,res);
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size<=8192)chunks.push(chunk);}
  if(size>8192)return json(res,413,{error:'Local platform request too large'});
  req.rawBody=Buffer.concat(chunks);req.url=req.url.slice('/firebase'.length);
  return firebaseHandler(req,res);
 }
 if(req.url?.startsWith('/api/media/'))return handler(req,res);
 if(req.url?.startsWith('/fixtures/origin-probe')&&req.method==='GET'){
  const target=req.url==='/fixtures/origin-probe?worker=1'?'http://127.0.0.1:8789':'';
  res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end(`<script>fetch('${target}/api/media/upload',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer ${tokens.student}'},body:JSON.stringify({destination:'profile',contentType:'image/png',size:68})}).then(response=>parent.postMessage({kind:'media-origin-probe',status:response.status},'*')).catch(()=>parent.postMessage({kind:'media-origin-probe',status:403},'*'));</script>`);return;
 }
 if(!allowed.includes(req.headers.origin))return json(res,403,{error:'Local browser fixtures only'});
 if(req.url==='/fixtures'&&req.method==='GET')return json(res,200,{tokens,projectId});
 if(req.url==='/fixtures/worker-config'&&req.method==='GET'){
  const paths=['student_chats/joined-dm','student_chats/foreign-dm','student_channels/joined-channel','student_channels/legacy-owned-channel','student_channels/foreign-channel','student_channels/banned-channel'];
  const documents=Object.fromEntries([...profiles].map(([uid,value])=>[`users/${uid}`,value]));
  for(const path of paths)documents[path]=await readDocument(path);
  return json(res,200,{projectId,jwk:await exportJWK(publicKey),documents});
 }
 if(req.url==='/fixtures/state'&&req.method==='GET')return json(res,200,{keys:[...objects.keys()],signs,removes,pages});
 if(req.url==='/fixtures/fail-upload'){failUpload=true;return json(res,200,{ready:true});}
 if(req.url==='/fixtures/false-ack'){falseAck=true;return json(res,200,{ready:true});}
 if(req.url==='/fixtures/fail-list'){failList=true;return json(res,200,{ready:true});}
 if(req.url==='/fixtures/fail-remove'){failRemove=true;return json(res,200,{ready:true});}
 if(req.url==='/fixture-upload'&&req.method==='POST'){
  try{
   const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>21*1024*1024)throw new Error('Oversized');chunks.push(chunk);}
   if(failUpload){failUpload=false;throw new Error('Fixture upload rejected');}
   if(falseAck){falseAck=false;return json(res,200,{error:'Fixture proxy returned an unconfirmed response'});}
   const form=await new Request(`${origin}/fixture-upload`,{method:'POST',headers:{'Content-Type':req.headers['content-type']},body:Buffer.concat(chunks),duplex:'half'}).formData();
   const encoded=form.get('Policy'),policy=JSON.parse(Buffer.from(encoded,'base64').toString()),file=form.get('file');
   const [access,date,scopeRegion,service,terminal]=String(form.get('X-Amz-Credential')).split('/');
   if(access!==credentials.accessKeyId||scopeRegion!==region||service!=='s3'||terminal!=='aws4_request'||Date.parse(policy.expiration)<=Date.now()||!file?.arrayBuffer)throw new Error('Invalid fixture policy');
   const signing=hmac(hmac(hmac(hmac(`AWS4${credentials.secretAccessKey}`,date),region),'s3'),'aws4_request');
   const expected=createHmac('sha256',signing).update(encoded).digest('hex'),actual=String(form.get('X-Amz-Signature'));
   if(expected.length!==actual.length||!timingSafeEqual(Buffer.from(expected),Buffer.from(actual)))throw new Error('Invalid signature');
   for(const condition of policy.conditions){if(Array.isArray(condition)){if(condition[0]==='content-length-range'&&(file.size<condition[1]||file.size>condition[2]))throw new Error('File size mismatch');if(condition[0]==='eq'&&form.get(condition[1].slice(1))!==condition[2])throw new Error('Field mismatch');}else for(const [key,value]of Object.entries(condition))if(form.get(key)!==value)throw new Error('Policy mismatch');}
   objects.set(form.get('key'),{bytes:Buffer.from(await file.arrayBuffer()),type:form.get('Content-Type')});res.writeHead(204);res.end();return;
  }catch{return json(res,403,{error:'Local object store rejected the upload'});}
 }
 return json(res,404,{error:'Local fixture endpoint not found'});
});
server.requestTimeout=10000;server.headersTimeout=5000;server.keepAliveTimeout=5000;
server.listen(8787,'127.0.0.1',()=>process.stdout.write('Loopback-only media fixtures ready; no production storage connection.\n'));
