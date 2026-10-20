import {useEffect,useState} from 'react';
import {collection,query,orderBy,limit,onSnapshot} from 'firebase/firestore';
import {db} from '../../firebase.js';
import {chatHistoryRepository,messageTime} from '../../services/chatHistoryRepository.js';
import {messageDeletionRepository} from '../../services/messageDeletionRepository.js';
import MessageDeleteAction from '../../components/chat/MessageDeleteAction.jsx';

export default function ChatModeration(){
 const [isChannel,setChannel]=useState(false),[count,setCount]=useState(50),[threads,setThreads]=useState([]),[selected,setSelected]=useState(null),[messages,setMessages]=useState([]),[status,setStatus]=useState({}),[error,setError]=useState(''),[search,setSearch]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{setThreads([]);setSelected(null);setError('');setLoading(true);return onSnapshot(query(collection(db,isChannel?'student_channels':'student_chats'),orderBy('lastTimestamp','desc'),limit(count)),snapshot=>{setThreads(snapshot.docs.map(item=>({...item.data(),id:item.id})));setLoading(false);},()=>{setThreads([]);setLoading(false);setError('Conversations could not be loaded. Check your administrator sign-in.');});},[isChannel,count]);
 useEffect(()=>{
  setMessages([]);setStatus({});if(!selected)return;
  const stop=chatHistoryRepository.subscribe({chatId:selected.id,isChannel,conversationKey:selected.conversationKey,pageSize:50},(values,next)=>{setMessages(values);setStatus({...next,loadOlder:()=>stop.loadOlder()});});
  return stop;
 },[selected,isChannel]);
 const title=thread=>isChannel?thread.name||'Campus channel':Object.values(thread.participantNames||{}).join(' · ')||Object.values(thread.participantDetails||{}).map(person=>person.name).filter(Boolean).join(' · ')||'Direct conversation';
 const visible=threads.filter(thread=>title(thread).toLowerCase().includes(search.trim().toLowerCase()));
 return <main className="max-w-7xl mx-auto space-y-4">
  <h1 className="text-2xl font-bold">Message moderation</h1>
  <p className="text-sm text-muted">Administrators can delete messages for everyone. Conversation membership and remaining history are preserved.</p>
  <div className="flex gap-2"><button type="button" aria-pressed={!isChannel} onClick={()=>{setChannel(false);setCount(50);}} className="border rounded-lg p-2">Direct messages</button><button type="button" aria-pressed={isChannel} onClick={()=>{setChannel(true);setCount(50);}} className="border rounded-lg p-2">Channels</button></div>
  {error&&<p role="alert" className="text-rose-500">{error}</p>}
  <div className="grid md:grid-cols-[280px_1fr] gap-4">
   <section className="rounded-xl border border-border p-3 space-y-2">
    <input aria-label="Search loaded conversations" placeholder="Search conversations" value={search} onChange={event=>setSearch(event.target.value)} className="w-full rounded border border-border bg-surface p-2"/>
    {loading?<p>Loading conversations…</p>:visible.length===0?<p className="text-sm text-muted">No matching conversations.</p>:visible.map(thread=><button type="button" key={thread.id} onClick={()=>setSelected(thread)} className={`block w-full text-left rounded-lg border p-3 text-sm ${selected?.id===thread.id?'border-primary':'border-border'}`}>{title(thread)}</button>)}
    {threads.length===count&&<button type="button" onClick={()=>setCount(value=>value+50)} className="text-sm underline">Load more conversations</button>}
   </section>
   <section className="rounded-xl border border-border p-4 space-y-3">
    {!selected?<p className="text-muted">Choose a conversation to moderate.</p>:<>
     <h2 className="font-semibold">{title(selected)}</h2>
     {status.error&&<p role="alert" className="text-rose-500">{status.error}</p>}
     {status.hasMore&&<button type="button" disabled={status.loadingOlder} onClick={()=>status.loadOlder?.()} className="underline text-sm">{status.loadingOlder?'Loading older messages…':'Load older messages'}</button>}
     {messages.length===0&&!status.error&&<p className="text-sm text-muted">No messages loaded.</p>}
     {messages.map(message=><article key={message.id} className="rounded-lg border border-border p-3 space-y-2">
      <div className="flex justify-between gap-2"><span className="font-semibold text-sm">{message.fromName||'Campus member'}</span><span className="text-xs text-muted">{new Date(messageTime(message.timestamp)).toLocaleString()}</span></div>
      <p className="whitespace-pre-wrap break-words text-sm">{message.deletedForEveryone?'This message was deleted':message.text||(message.type==='gif'?'GIF':'Photo attachment')}</p>
      {!message.deletedForEveryone&&(message.src||message.mediaUrl)&&<img src={message.src||message.mediaUrl} alt="Message attachment" className="max-h-60 max-w-full object-contain rounded"/>}
      {!message.deletedForEveryone&&<MessageDeleteAction canDeleteForEveryone onDeleteForEveryone={()=>messageDeletionRepository.removeForEveryone({chatId:selected.id,messageId:message.id,isChannel})}/>}
     </article>)}
    </>}
   </section>
  </div>
 </main>;
}
