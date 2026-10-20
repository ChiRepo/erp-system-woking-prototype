import {collection,doc,getDocs,onSnapshot,query,where,writeBatch} from 'firebase/firestore';
import {db,auth} from '../firebase.js';
import {isAdminIdentity} from '../utils/authPolicy.js';
import {studentDirectoryProjection} from '../utils/studentDirectoryProjection.js';

export function createStudentDirectoryRepository({database=db,currentUser=()=>auth.currentUser}={}) {
  const target=administrative=>query(collection(database,administrative?'users':'student_directory'),where('role','in',['student','Student']));
  const rows=snapshot=>snapshot.docs.map(item=>({...item.data(),_documentId:item.id}));
  return {
    async synchronize(enrollments) {
      const user=currentUser(),token=await user?.getIdTokenResult();
      if(!user||!isAdminIdentity(user.email,token?.signInProvider,token?.claims?.email_verified===true))throw new Error('Only the college administrator can publish the campus directory.');
      const peers=enrollments.flatMap(profile=>{
        const peer=studentDirectoryProjection(profile,profile._documentId);
        if(!peer)return [];
        return [peer];
      });
      for(let offset=0;offset<peers.length;offset+=250) {
        const batch=writeBatch(database);
        for(const peer of peers.slice(offset,offset+250))batch.set(doc(database,'student_directory',peer.uid),peer);
        await batch.commit();
      }
      return peers.length;
    },
    async get(administrative=false) {
      const enrollments=rows(await getDocs(target(administrative)));
      if(administrative)await this.synchronize(enrollments);
      return enrollments;
    },
    subscribe(administrative,next,fail) {
      let active=true,revision=0;
      const stop=onSnapshot(target(administrative),{includeMetadataChanges:true},async snapshot=>{
        if(snapshot.metadata.hasPendingWrites)return;
        const current=++revision;
        const enrollments=rows(snapshot);
        try {
          if(administrative)await this.synchronize(enrollments);
          if(active&&current===revision)next(enrollments);
        } catch(error){if(active&&current===revision)fail(error);}
      },error=>{if(active)fail(error);});
      return()=>{active=false;++revision;stop();};
    }
  };
}
export const studentDirectoryRepository=createStudentDirectoryRepository();
