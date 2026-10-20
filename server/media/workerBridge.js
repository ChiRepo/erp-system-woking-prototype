import {createServer} from 'node:http';
import {httpServerHandler} from 'cloudflare:node';
import {env} from 'cloudflare:workers';

// Keep one authorized handler (and its bounded request budgets) per Worker isolate.
export function createWorkerGateway(buildHandler) {
 let ready;
 const server=createServer(async(request,response)=>{
  try{
   ready??=Promise.resolve().then(()=>buildHandler(env));
   const handler=await ready;
   await handler(request,response);
  }catch{
   ready=undefined;
   response.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   response.end(JSON.stringify({error:'The media service is not configured. Please retry later.'}));
  }
 });
 return httpServerHandler(server);
}
