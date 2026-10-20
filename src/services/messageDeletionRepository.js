import {doc, onSnapshot, runTransaction, serverTimestamp} from 'firebase/firestore';
import {auth, db} from '../firebase.js';
import {isAdminIdentity} from '../utils/authPolicy.js';
import {canManageChannel, channelCreatorUid} from './channelPolicy.js';

const validId=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,300}$/.test(value);
const parentName=isChannel=>isChannel?'student_channels':'student_chats';
export function canDeleteMessageForEveryone({uid,isAdmin=false,message,thread,isChannel=false}) {
  if(!uid||!message||message.deletedForEveryone===true)return false;
  if(isAdmin)return true;
  const member=isChannel?!(thread?.bannedMembers||[]).includes(uid)&&
    (channelCreatorUid(thread)===uid||thread?.memberUids?.includes(uid)):thread?.participants?.includes(uid);
  return !!member&&(message.from===uid||isChannel&&canManageChannel(thread,uid));
}
export function deletedMessageRecord(message,uid,deletedAt) {
  return {from:message.from,fromName:message.fromName||'',timestamp:message.timestamp,
    type:'deleted',text:'',deletedForEveryone:true,deletedBy:uid,deletedAt};
}

/** Central deletion is an acknowledged, server-authorized transaction, never a local splice. */
export function createMessageDeletionRepository({database=db,currentUser=()=>auth.currentUser}={}) {
  return {
    async removeForEveryone({chatId,messageId,isChannel=false}) {
      const user=currentUser();
      if(!user?.uid||!validId(chatId)||!validId(messageId))throw new Error('Sign in and select a valid message.');
      const uid=user.uid,token=await user.getIdTokenResult();
      const isAdmin=isAdminIdentity(token.claims.email,token.signInProvider||token.claims.firebase?.sign_in_provider,token.claims.email_verified===true);
      if(currentUser()?.uid!==uid)throw new Error('Your account changed. Reopen the conversation.');
      const parent=doc(database,parentName(isChannel),chatId),ref=doc(parent,'messages',messageId);
      await runTransaction(database,async transaction=>{
        if(currentUser()?.uid!==uid)throw new Error('Your account changed. Reopen the conversation.');
        const [threadSnapshot,snapshot]=await Promise.all([transaction.get(parent),transaction.get(ref)]);
        if(!threadSnapshot.exists()||!snapshot.exists())throw new Error('This message is no longer available.');
        const thread=threadSnapshot.data(),message=snapshot.data();
        if(message.deletedForEveryone===true)return;
        if(!canDeleteMessageForEveryone({uid,isAdmin,message,thread,isChannel}))throw new Error('You can delete only your own messages for everyone.');
        transaction.set(ref,deletedMessageRecord(message,uid,serverTimestamp()));
        if(thread.lastMessageId?thread.lastMessageId===messageId:thread.lastTimestamp===message.timestamp&&thread.lastSender===message.from) {
          transaction.update(parent,{lastMessage:'Message deleted',lastMentions:[]});
        }
      });
      if(currentUser()?.uid!==uid)throw new Error('Your account changed. Reopen the conversation.');
      return true;
    },
    subscribeMessage({chatId,messageId,isChannel=false},callback) {
      if(!validId(chatId)||!validId(messageId)){callback(null);return()=>{};}
      return onSnapshot(doc(database,parentName(isChannel),chatId,'messages',messageId),snapshot=>callback(snapshot.exists()?{...snapshot.data(),id:snapshot.id}:null),()=>callback(null));
    }
  };
}
export const messageDeletionRepository=createMessageDeletionRepository();
