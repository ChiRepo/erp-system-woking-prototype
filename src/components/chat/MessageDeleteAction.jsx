import {useState,useRef,useEffect} from 'react';
import {Trash2,X} from 'lucide-react';

export default function MessageDeleteAction({canDeleteForEveryone=false,onDeleteForEveryone,onDeleteForMe}) {
 const [open,setOpen]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const active=useRef(true);
 useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
 const perform=async action=>{
  if(saving)return;setSaving(true);setError('');
  try{const result=await action();if(result===false)throw new Error('Your change could not be saved. Please retry.');if(active.current)setOpen(false);}
  catch(error){if(active.current)setError(error.message||'The message could not be deleted. Please retry.');}
  finally{if(active.current)setSaving(false);}
 };
 return <>
  <button type="button" aria-label="Delete message" title="Delete message" onClick={()=>{setError('');setOpen(true);}} className="p-1 rounded hover:bg-black/10 focus-visible:outline"><Trash2 className="w-3.5 h-3.5"/></button>
  {open&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={event=>event.stopPropagation()}>
   <section role="alertdialog" aria-modal="true" aria-labelledby="message-delete-title" className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 text-sm text-slate-100 shadow-xl">
    <div className="flex justify-between items-center"><h3 id="message-delete-title" className="font-semibold">Delete message?</h3><button type="button" disabled={saving} aria-label="Cancel message deletion" onClick={()=>setOpen(false)}><X className="w-4 h-4"/></button></div>
    <p className="my-3 text-slate-300">{canDeleteForEveryone?'Delete for everyone removes the content from this conversation for all participants. A deleted-message notice remains.':'You can delete this message only for yourself. Other participants will still see it.'}</p>
    {onDeleteForMe&&<p className="mb-3 text-xs text-slate-400">Delete for me is private. You can restore messages hidden for you from this conversation.</p>}
    {error&&<p role="alert" className="mb-3 text-rose-300">{error}</p>}
    <div className="flex flex-wrap justify-end gap-2">
     <button type="button" disabled={saving} onClick={()=>setOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-800">Cancel</button>
     {onDeleteForMe&&<button type="button" disabled={saving} onClick={()=>perform(onDeleteForMe)} className="rounded-lg bg-slate-700 px-3 py-2">Delete for me</button>}
     {canDeleteForEveryone&&onDeleteForEveryone&&<button type="button" disabled={saving} onClick={()=>perform(onDeleteForEveryone)} className="rounded-lg bg-rose-700 px-3 py-2">{saving?'Deleting…':'Delete for everyone'}</button>}
    </div>
   </section>
  </div>}
 </>;
}
