import {randomUUID} from 'node:crypto';
import {MediaError,enrolledMediaActor} from './auth.js';

const imageTypes=new Map([['image/jpeg','jpg'],['image/png','png'],['image/webp','webp'],['image/gif','gif'],['image/avif','avif']]);
const safeId=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(value);
const safePhotoKey=(key,uid)=>typeof key==='string'&&key.startsWith(`users/${uid}/`)&&key.length<=512&&/^[A-Za-z0-9_.-]+$/.test(key.slice(`users/${uid}/`.length))&&!key.endsWith('/')&&!['.','..'].includes(key.slice(`users/${uid}/`.length));
const send=(response,status,data)=>{response.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});response.end(JSON.stringify(data));};
async function jsonBody(request) {
  if(!String(request.headers['content-type']||'').startsWith('application/json'))throw new MediaError(415,'Use a supported media request.');
  let size=0,body='';
  // Firebase's HTTP framework has already consumed the stream into rawBody.
  if(Buffer.isBuffer(request.rawBody)) {
    size=request.rawBody.length;
    if(size<=4096)body=request.rawBody.toString('utf8');
  } else {
    for await(const chunk of request){size+=chunk.length;if(size<=4096)body+=chunk;}
  }
  if(size>4096)throw new MediaError(413,'The media request is too large.');
  try{const value=JSON.parse(body);if(!value||Array.isArray(value)||typeof value!=='object')throw new Error();return value;}catch{throw new MediaError(400,'The media request is incomplete.');}
}
export function createMediaHandler({verifyToken,readDocument,storage,allowedOrigins,clock=()=>Date.now(),newId=randomUUID,rateLimit={count:30,windowMs:60000},uploadBudget={bytes:100*1024*1024,windowMs:3600000}}) {
  if(!verifyToken||!readDocument||!storage||!allowedOrigins?.length)throw new Error('Media gateway configuration is incomplete.');
  const requests=new Map();
  const grants=new Map();
  return async(request,response)=>{
    try {
      const origin=request.headers.origin;
      if(!allowedOrigins.includes(origin))throw new MediaError(403,'This site cannot use the media service.');
      response.setHeader('Access-Control-Allow-Origin',origin);response.setHeader('Vary','Origin');
      if(request.method==='OPTIONS'){
        response.setHeader('Access-Control-Allow-Headers','Authorization,Content-Type');response.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');response.writeHead(204);response.end();return;
      }
      if(request.method!=='POST')throw new MediaError(405,'Use a supported media request.');
      const bearer=request.headers.authorization?.match(/^Bearer ([^\s]+)$/)?.[1];
      if(!bearer)throw new MediaError(401,'Sign in to manage your media.');
      const claims=await verifyToken(bearer);
      const now=clock(),recent=(requests.get(claims.sub)||[]).filter(time=>time>now-rateLimit.windowMs);
      if(recent.length>=rateLimit.count)throw new MediaError(429,'Please wait briefly before trying more media requests.');
      if(!requests.has(claims.sub)&&requests.size>=10000){for(const [uid,times]of requests)if(times.at(-1)<=now-rateLimit.windowMs)requests.delete(uid);if(requests.size>=10000)throw new MediaError(503,'The media service is busy. Please retry shortly.');}
      recent.push(now);requests.set(claims.sub,recent);
      const profile=await readDocument(`users/${claims.sub}`,bearer);
      const actor=enrolledMediaActor(claims,profile),body=await jsonBody(request);
      const route=new URL(request.url,'http://localhost').pathname;
      if(route==='/api/media/identity') {
        if(Object.keys(body).length)throw new MediaError(400,'The identity request is invalid.');
        return send(response,200,{uid:actor.uid,role:actor.role});
      }
      if(route==='/api/media/upload') {
        if(Object.keys(body).some(key=>!['destination','uid','contentType','size','chatId'].includes(key)))throw new MediaError(400,'The upload request contains unsupported fields.');
        if(!['profile','artifact','chat'].includes(body.destination))throw new MediaError(400,'Choose a valid media destination.');
        if(body.destination!=='chat'&&body.chatId!==undefined)throw new MediaError(400,'Use a conversation only for chat media.');
        if(body.uid!==undefined&&body.uid!==actor.uid)throw new MediaError(403,'Media must belong to your own account.');
        const extension=imageTypes.get(body.contentType),limit=body.destination==='profile'?10*1024*1024:20*1024*1024;
        if(!extension||!Number.isSafeInteger(body.size)||body.size<1||body.size>limit)throw new MediaError(400,'Choose a supported image within the file size limit.');
        if(body.destination!=='profile'&&(actor.role!=='student'||actor.profile.allowChatting===false))throw new MediaError(403,'Student chat access is required.');
        let prefix=body.destination==='profile'?`users/${actor.uid}`:`artifacts/${actor.uid}`;
        if(body.destination==='chat') {
          if(!safeId(body.chatId))throw new MediaError(400,'Open a valid conversation.');
          let chat=await readDocument(`student_chats/${body.chatId}`,bearer);
          if(chat){if(!Array.isArray(chat.participants)||!chat.participants.includes(actor.uid))throw new MediaError(403,'You cannot upload to this conversation.');}
          else {
            chat=await readDocument(`student_channels/${body.chatId}`,bearer);
            const creator=chat?.creatorUid||chat?.createdBy;
            if(!chat||!(creator===actor.uid||Array.isArray(chat.memberUids)&&chat.memberUids.includes(actor.uid))||chat.bannedMembers?.includes(actor.uid)||chat.bannedMembers?.includes(actor.profile.prn))throw new MediaError(403,'You cannot upload to this channel.');
          }
          prefix=`chats/${body.chatId}/${actor.uid}`;
        }
        const key=`${prefix}/${clock()}_${newId()}.${extension}`;
        const reserved=(grants.get(actor.uid)||[]).filter(item=>item.time>now-uploadBudget.windowMs);
        if(reserved.reduce((sum,item)=>sum+item.size,0)+body.size>uploadBudget.bytes)throw new MediaError(429,'Your media upload allowance is temporarily reached. Try again later.');
        if(!grants.has(actor.uid)&&grants.size>=10000){for(const [uid,items]of grants)if(items.at(-1).time<=now-uploadBudget.windowMs)grants.delete(uid);if(grants.size>=10000)throw new MediaError(503,'The media service is busy. Please retry shortly.');}
        const reservation={time:now,size:body.size};reserved.push(reservation);grants.set(actor.uid,reserved);
        let grant;
        try{grant=await storage.signUpload({key,contentType:body.contentType,size:body.size,expiresIn:60});}catch(error){grants.set(actor.uid,(grants.get(actor.uid)||[]).filter(item=>item!==reservation));throw error;}
        return send(response,200,{...grant,key,publicUrl:storage.publicUrl(key),expiresIn:60});
      }
      if(route==='/api/media/profile/list') {
        if(Object.keys(body).some(key=>key!=='uid'))throw new MediaError(400,'The photo library request is invalid.');
        if(body.uid!==undefined&&body.uid!==actor.uid)throw new MediaError(403,'Open your own photo library.');
        const prefix=`users/${actor.uid}/`,objects=await storage.list(prefix);
        return send(response,200,{objects:objects.filter(item=>safePhotoKey(item.Key,actor.uid)).map(item=>({Key:item.Key,Size:item.Size,LastModified:item.LastModified}))});
      }
      if(route==='/api/media/profile/remove') {
        if(Object.keys(body).some(key=>key!=='key'))throw new MediaError(400,'The photo removal request is invalid.');
        if(!safePhotoKey(body.key,actor.uid))throw new MediaError(403,'This photo is not in your account library.');
        await storage.remove(body.key);return send(response,200,{removed:true});
      }
      throw new MediaError(404,'The media operation is unavailable.');
    }catch(error){send(response,error instanceof MediaError?error.status:503,{error:error instanceof MediaError?error.message:'The media service could not complete this request. Please retry.'});}
  };
}
