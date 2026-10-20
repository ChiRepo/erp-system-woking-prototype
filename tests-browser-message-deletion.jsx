import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {canDeleteMessageForEveryone,deletedMessageRecord,messageDeletionRepository} from './src/services/messageDeletionRepository.js';
import {messagesAfterHiddenHistory} from './src/services/chatWorkspacePreferences.js';
import {createChatHistoryRepository} from './src/services/chatHistoryRepository.js';
import MessageDeleteAction from './src/components/chat/MessageDeleteAction.jsx';
import StarredChatMessages from './src/components/chat/StarredChatMessages.jsx';
const settle=()=>new Promise(resolve=>setTimeout(resolve,30));
export async function runMessageDeletionChecks(check,base,peer){
 const message={id:'delete-fixture',from:base.uid,fromName:base.name,timestamp:123,type:'image',text:'Private fixture body',src:'/fixture.png',mediaUrl:'/fixture.png',fileName:'fixture.png'},thread={participants:[base.uid,peer.uid]};
 const allowed=(uid,extra={})=>canDeleteMessageForEveryone({uid,message,thread,...extra});
 check('A participant can retract their own message for everyone',allowed(base.uid));
 check('A normal participant cannot retract another sender’s message',!allowed(peer.uid));
 check('A nonparticipant cannot retract even a historical own message',!allowed(base.uid,{thread:{participants:[peer.uid]}}));
 check('An exact administrator policy can moderate another sender’s message',allowed(peer.uid,{isAdmin:true}));
 const channel={creatorUid:peer.uid,memberUids:[base.uid,peer.uid],adminUids:[peer.uid]};
 check('A canonical channel manager can retract a member message',allowed(peer.uid,{thread:channel,isChannel:true}));
 check('A banned channel manager cannot reclaim message deletion authority',!allowed(peer.uid,{thread:{...channel,bannedMembers:[peer.uid]},isChannel:true}));
 check('A deleted message cannot be retracted or modified a second time',!allowed(base.uid,{message:{...message,deletedForEveryone:true}}));
 const tombstone=deletedMessageRecord(message,base.uid,456);
 check('Retraction removes body, media references and filenames while retaining author/time',tombstone.text===''&&tombstone.type==='deleted'&&!tombstone.src&&!tombstone.mediaUrl&&!tombstone.fileName&&tombstone.from===message.from&&tombstone.timestamp===123);
 const own=messagesAfterHiddenHistory([message],0,{[message.id]:true}),other=messagesAfterHiddenHistory([message]);
 check('Delete for me filters only the owner’s preferences without changing shared history',own.length===0&&other.length===1&&message.text==='Private fixture body');
 const history=createChatHistoryRepository({read:async()=>[{id:message.id,data:()=>({...message,deletedForEveryone:true})}]});
 const decoded=await history.readAll({chatId:'delete-fixture',isChannel:true});
 check('History and export decoding cannot resurrect a legacy deleted body or image',decoded[0].text===''&&!decoded[0].src&&!decoded[0].mediaUrl);
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 const render=element=>flushSync(()=>root.render(element));
 const button=text=>[...host.querySelectorAll('button')].find(node=>node.textContent===text);
 try{
  let hides=0;
  render(<MessageDeleteAction onDeleteForMe={async()=>{hides++;return true;}}/>);
  host.querySelector('[aria-label="Delete message"]').click();await settle();
  check('Another sender’s message exposes Delete for me without a global delete action',!!button('Delete for me')&&!button('Delete for everyone')&&host.textContent.includes('Other participants will still see it'));
  button('Delete for me').click();await settle();
  check('A saved private deletion closes its dialog only after acknowledgment',hides===1&&!host.querySelector('[role="alertdialog"]'));
  let attempts=0,release;
  render(<MessageDeleteAction canDeleteForEveryone onDeleteForEveryone={()=>{attempts++;return new Promise(resolve=>{release=resolve;});}}/>);
  host.querySelector('[aria-label="Delete message"]').click();await settle();button('Delete for everyone').click();await settle();
  check('An in-flight global deletion prevents duplicate clicks and retains its dialog',attempts===1&&!!host.querySelector('[role="alertdialog"]')&&button('Deleting…')?.disabled);
  release(false);await settle();
  check('A rejected global deletion stays visible with an actionable error',!!host.querySelector('[role="alert"]')&&!!button('Delete for everyone'));
  button('Cancel').click();await settle();
  const original=messageDeletionRepository.subscribeMessage;let emit;
  messageDeletionRepository.subscribeMessage=(_spec,callback)=>{emit=callback;callback(message);return()=>{};};
  try{
   render(<StarredChatMessages stars={{[message.id]:message}} chatId="fixture" isChannel onUnstar={()=>{}} resolveName={()=>base.name}/>);await settle();
   check('Saved messages resolve their actual central body and attachment',host.textContent.includes('Private fixture body')&&!!host.querySelector('img'));
   emit({...tombstone,id:message.id});await settle();
   check('A live retraction removes a starred attachment and its cached body immediately',host.textContent.includes('This message was deleted')&&!host.textContent.includes('Private fixture body')&&!host.querySelector('img'));
   render(<StarredChatMessages stars={{[message.id]:message}} hiddenMessages={{[message.id]:true}} chatId="fixture" isChannel onUnstar={()=>{}} resolveName={()=>base.name}/>);await settle();
   check('Messages deleted for me cannot reappear in the starred view',!host.textContent.includes('This message was deleted')&&!host.querySelector('img'));
  }finally{messageDeletionRepository.subscribeMessage=original;}
 }finally{root.unmount();host.remove();}
}
