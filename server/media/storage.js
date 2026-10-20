import {S3Client,ListObjectsV2Command,DeleteObjectCommand} from '@aws-sdk/client-s3';
import {createPresignedPost} from '@aws-sdk/s3-presigned-post';

export function createObjectStorage({bucket,region='ap-south-1',client=new S3Client({region})}) {
 if(!bucket||!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket))throw new Error('Configure the server media bucket.');
 return {
  publicUrl:key=>`https://${bucket}.s3.${region}.amazonaws.com/${key.split('/').map(encodeURIComponent).join('/')}`,
  signUpload:({key,contentType,size,expiresIn})=>createPresignedPost(client,{Bucket:bucket,Key:key,Expires:expiresIn,Fields:{'Content-Type':contentType,success_action_status:'204'},Conditions:[['content-length-range',size,size],['eq','$Content-Type',contentType],['eq','$success_action_status','204']]}),
  async list(prefix){
   const objects=[];let token;
   do{const page=await client.send(new ListObjectsV2Command({Bucket:bucket,Prefix:prefix,ContinuationToken:token}));objects.push(...page.Contents||[]);token=page.IsTruncated?page.NextContinuationToken:undefined;if(page.IsTruncated&&!token)throw new Error('Incomplete media listing');}while(token);
   return objects;
  },
  async remove(key){await client.send(new DeleteObjectCommand({Bucket:bucket,Key:key}));}
 };
}
