import {useEffect,useState} from 'react';
import {messageDeletionRepository} from '../../services/messageDeletionRepository.js';
import {studentE2EE} from '../../services/studentE2EE.js';

// Resolve saved IDs from their central source; never replay a cached body after retraction.
export default function StarredChatMessages({stars={},hiddenMessages={},chatId,isChannel,conversationKey,onUnstar,saving,resolveName}) {
 const [records,setRecords]=useState({});
 const ids=Object.keys(stars).sort().join(',');
 useEffect(()=>{
  let active=true;const revisions={};setRecords({});
  const stops=ids?ids.split(',').map(messageId=>messageDeletionRepository.subscribeMessage({chatId,messageId,isChannel},async value=>{
   const revision=revisions[messageId]=(revisions[messageId]||0)+1;
   let message=value;
   try{if(message&&!message.deletedForEveryone&&!isChannel&&message.type==='text'&&message.text?.startsWith('E2EE::'))message={...message,text:await studentE2EE.decrypt(message.text,conversationKey,chatId)};}
   catch{message=null;}
   if(active&&revision===revisions[messageId])setRecords(previous=>({...previous,[messageId]:message}));
  })):[];
  return()=>{active=false;stops.forEach(stop=>stop());};
 },[ids,chatId,isChannel,conversationKey]);
 return <div className="space-y-3 max-h-80 overflow-y-auto">{Object.keys(stars).filter(id=>hiddenMessages[id]!==true).map(id=>{
  const message=records[id],deleted=message?.deletedForEveryone===true;
  return <div key={id} className="rounded-lg bg-slate-900 p-3 text-xs text-slate-200 space-y-2">
   <p className="font-semibold">{message?resolveName(message):'Saved message'}</p>
   <p className="whitespace-pre-wrap break-words">{deleted?'This message was deleted':!message?'Message unavailable':message.text||(message.type==='gif'?'GIF':'Photo')}</p>
   {!deleted&&message&&(message.src||message.mediaUrl)&&<img src={message.src||message.mediaUrl} alt="Starred attachment" className="max-h-40 rounded object-contain"/>}
   <button type="button" disabled={saving} onClick={()=>onUnstar({id})} className="text-amber-400 underline">Unstar message</button>
  </div>;
 })}</div>;
}
