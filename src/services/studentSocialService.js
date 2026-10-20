/**
 * @fileoverview Student Social Service
 * Manages student social profiles, friends & following relationships, 24-hour expiring stories,
 * and photo/video media posts. Fully decoupled from ERP academic dashboard records.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

import { db } from '../firebase.js';
import { studentRelationshipService } from './studentRelationshipService.js';
import { socialPostRepository } from './socialPostRepository.js';
import { 
  collection, doc, getDoc, setDoc, updateDoc, 
  query, where, orderBy, limit, getDocs, addDoc, 
  onSnapshot 
} from 'firebase/firestore';

export class StudentSocialService {
  constructor(posts = socialPostRepository) {
    this._profileCache = new Map();
    this.posts = posts;
  }

  /**
   * Retrieves dedicated social profile for a student
   */
  async getSocialProfile(uid) {
    if (!uid) return null;
    const snapshot = await getDoc(doc(db, 'student_social_profiles', uid));
    return { uid, ...(snapshot.exists() ? snapshot.data() : {}) };
  }

  subscribeProfile(uid, callback) {
    return onSnapshot(doc(db, 'student_social_profiles', uid), snapshot => callback({ uid, ...(snapshot.exists() ? snapshot.data() : {}) }),
      () => callback({ uid, error: 'Profile updates could not be loaded.' }));
  }

  subscribeStudentPosts(uid, callback) {
    return onSnapshot(query(collection(db, 'student_posts'), where('authorUid', '==', uid)), snapshot => {
      callback(snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    }, () => callback([], { error: 'Profile posts could not be loaded.' }));
  }

  /**
   * Retrieves profile details for a student (alias for getSocialProfile)
   */
  async getStudentProfile(uid) {
    return this.getSocialProfile(uid);
  }

  /**
   * Retrieves posts authored by this student (empty array default if none authored)
   */
  async getStudentPosts(uid) {
    if (!uid) return [];
    const snapshot = await getDocs(query(collection(db, 'student_posts'), where('authorUid', '==', uid)));
    return snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  /**
   * Updates social profile (bio, avatar, cover, handle)
   * Strictly decoupled from ERP dashboard academic credentials
   */
  async updateSocialProfile(uid, data) {
    this.posts.requireAuthor(uid);
    const cleanData = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    const docRef = doc(db, 'student_social_profiles', uid);
    await setDoc(docRef, cleanData, { merge: true });

    const localKey = `krc_student_social_${uid}`;
    const existing = this._profileCache.get(uid) || {};
    const merged = { ...existing, ...cleanData };
    
    this._profileCache.set(uid, merged);
    localStorage.setItem(localKey, JSON.stringify(merged));

    // If avatar was updated, broadcast to the entire app
    if (data.customAvatar !== undefined) {
      if (data.customAvatar) {
        localStorage.setItem(`krc_student_avatar_${uid}`, data.customAvatar);
      } else {
        localStorage.removeItem(`krc_student_avatar_${uid}`);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('krc_avatar_updated', {
          detail: { uid, avatarUrl: data.customAvatar || '', timestamp: Date.now() }
        }));
      }
    }

    return merged;
  }

  /**
   * Send friend request
   */
  async sendFriendRequest(fromUid, toUid) {
    return studentRelationshipService.requestFriend(fromUid, toUid);
  }

  async acceptFriendRequest(currentUid, senderUid) {
    return studentRelationshipService.acceptFriend(currentUid, senderUid);
  }

  async toggleFollow(currentUid, targetUid) {
    const snapshot = await getDoc(doc(db, 'student_follows', `${currentUid}__${targetUid}`));
    return studentRelationshipService.setFollowing(currentUid, targetUid, !snapshot.exists());
  }

  // ==================== 24-HOUR STORIES ====================

  /**
   * Creates a new 24-hour expiring story
   */
  async createStory({ authorUid, authorName, authorAvatar, mediaUrl, caption = '', type = 'photo' }) {
    this.posts.requireAuthor(authorUid);
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours TTL

    const storyData = {
      authorUid,
      authorName,
      authorAvatar: authorAvatar || null,
      mediaUrl,
      caption,
      type, // 'photo' or 'video'
      createdAt: now,
      expiresAt
    };

    const docRef = await addDoc(collection(db, 'student_stories'), storyData);
    return { id: docRef.id, ...storyData };
  }

  /**
   * Fetches active stories (strictly within 24 hours)
   */
  async getActiveStories() {
    const snapshot = await getDocs(query(collection(db, 'student_stories'), where('expiresAt', '>', Date.now()), orderBy('expiresAt', 'desc'), limit(40)));
    return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  }

  subscribeActiveStories(callback) {
    let records = [];
    let failed = false;
    const emit = () => { if (!failed) callback(records.filter(story => story.expiresAt > Date.now())); };
    const stop = onSnapshot(query(collection(db, 'student_stories'), where('expiresAt', '>', Date.now()), orderBy('expiresAt', 'desc'), limit(40)), snapshot => {
      records = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
      emit();
    }, () => { failed = true; records = []; callback([], { error: 'Stories could not be loaded.' }); });
    const expiryTimer = setInterval(emit, 30000);
    return () => { stop(); clearInterval(expiryTimer); };
  }

  // ==================== POSTS & MEDIA FEED ====================

  /**
   * Creates a photo/video post on student's social feed
   */
  async createPost({ authorUid, authorName, authorAvatar, mediaUrl, caption = '', mediaType = 'photo' }) {
    const postData = {
      authorUid,
      authorName,
      authorAvatar: authorAvatar || null,
      mediaUrl,
      caption,
      mediaType, // 'photo' or 'video'
      likes: [],
      createdAt: Date.now()
    };

    return this.posts.publish(postData);
  }

  /**
   * Retrieves social feed posts
   */
  async getFeedPosts(max = 30) {
    const snapshot = await getDocs(query(collection(db, 'student_posts'), orderBy('createdAt', 'desc'), limit(max)));
    return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  }

  /**
   * Creates an architectural/project artifact in student_posts
   */
  async createArtifact({ 
    authorUid, 
    authorName, 
    authorAvatar = null, 
    authorPrn = '', 
    title = 'Untitled Artifact', 
    category = 'Architecture', 
    mediaUrl = '', 
    caption = '', 
    tags = [] 
  }) {
    if (!authorUid || !mediaUrl) {
      throw new Error('Author UID and Media URL are required to publish an artifact.');
    }

    const artifactData = {
      authorUid,
      authorName: authorName || 'Student',
      authorAvatar: authorAvatar || null,
      authorPrn: authorPrn || '',
      title: title.trim(),
      category: category.trim() || 'Architecture',
      mediaUrl: mediaUrl.trim(),
      caption: caption.trim(),
      tags: Array.isArray(tags) ? tags : [],
      likes: [],
      comments: [],
      createdAt: Date.now()
    };

    return this.posts.publish(artifactData);
  }

  /**
   * Deletes an artifact by ID
   */
  async deleteArtifact(postId, authorUid) {
    return this.posts.delete(postId, authorUid);
  }

  /**
   * Adds a comment to an artifact
   */
  async addComment(postId, { authorUid, authorName, authorAvatar = null, authorPrn = '', text = '' }) {
    if (!postId || !text || !text.trim()) {
      throw new Error('Valid comment text is required.');
    }

    return this.posts.comment(postId, {
      authorUid,
      authorName: authorName || '',
      authorAvatar: authorAvatar || null,
      authorPrn: authorPrn || '',
      text: text.trim()
    });
  }

  /**
   * Retrieves single artifact with latest comments
   */
  async getArtifact(postId) {
    if (!postId) return null;
    const snapshot = await getDoc(doc(db, 'student_posts', postId));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  }

  /**
   * Update student avatar in social profile
   */
  async updateProfileAvatar(uid, photoUrl) {
    if (!uid) throw new Error('Sign in to update your profile photo.');
    return this.updateSocialProfile(uid, {
      customAvatar: photoUrl || null
    });
  }

  /**
   * Toggle like on post
   */
  async toggleLike(postId, uid) {
    return this.posts.like(postId, uid);
  }

}

export const studentSocialService = new StudentSocialService();
