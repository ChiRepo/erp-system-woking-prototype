import { auth } from '../firebase.js';
import { cloudMediaTransport } from './cloudMediaTransport.js';

export function sanitizeUserId(userId) {
  return String(userId || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
}
export const getCloudPublicUrl = key => cloudMediaTransport.publicUrl(key);
export const getS3PublicUrl = getCloudPublicUrl;

export class CloudStorageService {
  constructor(transport = cloudMediaTransport, currentUid = () => auth.currentUser?.uid) {
    this.transport = transport;
    this.currentUid = currentUid;
  }

  ownUid(userId) {
    if (!userId || userId !== this.currentUid()) throw new Error('Sign in with your own account to manage photos.');
    return sanitizeUserId(userId);
  }

  async upload(namespace, userId, file, extra = {}) {
    const uid = this.ownUid(userId);
    if (![ `users/${uid}`, `artifacts/${uid}` ].includes(namespace) && !/^chats\/[a-zA-Z0-9_-]+$/.test(namespace)) throw new Error('Choose a valid photo destination.');
    if (!file || !(file.arrayBuffer || file instanceof ArrayBuffer || file instanceof Uint8Array)) throw new Error('Choose a valid file to upload.');
    const fileName = String(file.name || 'photo.jpg').replace(/[^a-zA-Z0-9_.-]/g, '_');
    let key = `${namespace}/${Date.now()}_${crypto.randomUUID()}_${fileName}`;
    const contentType = file.type || 'image/jpeg';
    const destination = namespace === `users/${uid}` ? 'profile' : namespace === `artifacts/${uid}` ? 'artifact' : 'chat';
    let saved;
    try { saved = await this.transport.upload({ key, file, contentType, destination, ...(destination === 'chat' ? { chatId: extra.chatId } : {}) }); }
    catch { throw new Error('Your file could not be saved. Please retry.'); }
    this.ownUid(userId);
    if (saved !== undefined) {
      const prefix = `${namespace}/${destination === 'chat' ? `${uid}/` : ''}`;
      if (typeof saved?.key !== 'string' || !saved.key.startsWith(prefix) || saved.key.slice(prefix.length).split('/').some(part => !part || part === '.' || part === '..') || typeof saved.publicUrl !== 'string' || !saved.publicUrl) throw new Error('Your file upload returned an invalid destination.');
      key = saved.key;
    }
    const url = saved?.publicUrl || this.transport.publicUrl(key);
    const metadata = { key, url, publicUrl: url, fileName, fileSize: file.size ?? file.byteLength ?? 0,
      contentType, uploadedAt: new Date().toISOString(), ...extra };
    if (namespace === `users/${uid}`) this.cacheUserPhoto(uid, metadata);
    return metadata;
  }

  async uploadUserProfilePhoto(userId, file) {
    return this.upload(`users/${this.ownUid(userId)}`, userId, file);
  }

  async uploadStudentArtifact(userId, file) {
    return this.upload(`artifacts/${this.ownUid(userId)}`, userId, file, { authorUid: userId });
  }

  async uploadChatPhoto(chatId, senderId, file) {
    this.ownUid(senderId);
    if (!chatId || !/^[a-zA-Z0-9_-]+$/.test(chatId)) throw new Error('Open a valid conversation before uploading a photo.');
    return this.upload(`chats/${chatId}`, senderId, file, { chatId, senderId });
  }

  async uploadStudentPhoto(arg1, arg2, arg3) {
    const isFile = value => value instanceof Blob || value instanceof ArrayBuffer || value instanceof Uint8Array;
    let file, userId, chatId;
    if (isFile(arg1)) [file, userId, chatId] = [arg1, arg2, arg3];
    else if (isFile(arg2)) [userId, file, chatId] = [arg1, arg2, arg3];
    else if (isFile(arg3)) [chatId, userId, file] = [arg1, arg2, arg3];
    if (!file) throw new Error('Choose a valid photo to upload.');
    return chatId ? this.uploadChatPhoto(chatId, userId, file) : this.uploadUserProfilePhoto(userId, file);
  }

  async listUserProfilePhotos(userId) {
    const uid = this.ownUid(userId);
    const prefix = `users/${uid}/`;
    let objects;
    try { objects = await this.transport.list(prefix); }
    catch { throw new Error('Your photo library could not be loaded. Please retry.'); }
    this.ownUid(userId);
    const cached = new Map(this.getCachedUserPhotos(uid).map(item => [item.key, item]));
    return objects.filter(item => item.Key?.startsWith(prefix) && !item.Key.endsWith('/')).map(item => {
      const key = item.Key;
      const url = this.transport.publicUrl(key);
      return { ...(cached.get(key) || {}), key, url,
        fileName: cached.get(key)?.fileName || key.split('/').pop().replace(/^\d+_(?:[a-f0-9-]{36}_)?/i, ''),
        fileSize: item.Size || 0, uploadedAt: item.LastModified ? new Date(item.LastModified).toISOString() : null };
    }).sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));
  }

  async deleteUserProfilePhoto(userId, objectKey, photoUrl = null) {
    const uid = this.ownUid(userId);
    const prefix = `users/${uid}/`;
    const prefixUrl = this.transport.publicUrl(prefix);
    const key = objectKey || (photoUrl?.startsWith(prefixUrl) ? prefix + photoUrl.slice(prefixUrl.length).split('?')[0] : '');
    if (!key.startsWith(prefix) || key.slice(prefix.length).split('/').some(part => !part || part === '.' || part === '..')) throw new Error('This photo is not in your account photo library.');
    try { await this.transport.remove(key); }
    catch { throw new Error('Your photo could not be deleted. Please retry.'); }
    this.ownUid(userId);
    const photos = this.getCachedUserPhotos(uid).filter(item => item.key !== key && item.url !== photoUrl);
    try { localStorage.setItem(`krc_cloud_photos_${uid}`, JSON.stringify(photos)); } catch { /* Optional browser cache. */ }
    return true;
  }

  getCachedUserPhotos(uid) {
    try {
      const value = JSON.parse(localStorage.getItem(`krc_cloud_photos_${uid}`) || localStorage.getItem(`krc_s3_photos_${uid}`) || '[]');
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  }

  cacheUserPhoto(uid, metadata) {
    try {
      const items = this.getCachedUserPhotos(uid).filter(item => item.key !== metadata.key);
      localStorage.setItem(`krc_cloud_photos_${uid}`, JSON.stringify([metadata, ...items].slice(0, 100)));
    } catch { /* A cache failure never changes the result of a committed remote upload. */ }
  }
}

export const cloudStorageService = new CloudStorageService();
export const s3StorageService = cloudStorageService;
export const S3StorageService = CloudStorageService;
