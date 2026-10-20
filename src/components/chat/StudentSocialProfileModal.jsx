/**
 * @fileoverview Student Social Profile Modal Component
 * Dedicated social media experience for in-campus student messaging.
 * Displays profile avatar, cover, friends list, followers/following,
 * 24-hour expiring stories reel, and photos/videos grid.
 * Strictly decoupled from ERP academic dashboard records.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, UserPlus, Users, Heart, MessageSquare, Plus, 
  Camera, Image as ImageIcon, Video, Sparkles, Check, 
  Edit3, Share2, Shield, Calendar, Clock, Lock
} from 'lucide-react';
import { studentSocialService } from '../../services/studentSocialService.js';
import { studentRelationshipService } from '../../services/studentRelationshipService.js';
import { studentSearchService } from '../../services/studentSearchService.js';
import DefaultAvatar from '../common/DefaultAvatar.jsx';
import { showCampusAlert } from '../common/CustomAlertModal.jsx';

export default function StudentSocialProfileModal({ 
  isOpen, 
  onClose, 
  studentUser,
  isOwnProfile = true,
  onStartChat = () => {}
}) {
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'stories' | 'friends' | 'following'
  const [profile, setProfile] = useState(null);
  const [connections, setConnections] = useState({ friends: [], followers: [], following: [] });
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [classmates, setClassmates] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showNewStoryModal, setShowNewStoryModal] = useState(false);
  const [activeStoryView, setActiveStoryView] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Edit fields
  const [editBio, setEditBio] = useState('');
  const [editHandle, setEditHandle] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // New post fields
  const [newPostUrl, setNewPostUrl] = useState('');
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostType, setNewPostType] = useState('photo');

  // New story fields
  const [newStoryUrl, setNewStoryUrl] = useState('');
  const [newStoryCaption, setNewStoryCaption] = useState('');

  const uid = studentUser?.uid || studentUser?.prn;

  useEffect(() => {
    if (!isOpen || !uid) return;
    const stopProfile = studentSocialService.subscribeProfile(uid, setProfile);
    const stopPosts = studentSocialService.subscribeStudentPosts(uid, (items, status = {}) => { setPosts(items); setLoadError(status.error || ''); });
    const stopStories = studentSocialService.subscribeActiveStories((items, status = {}) => {
      setStories(items.filter(story => story.authorUid === uid));
      if (status.error) setLoadError(status.error);
    });
    const stopFollow = studentRelationshipService.subscribeFollowCounts(uid, setFollowCounts);
    const stopConnections = isOwnProfile ? studentRelationshipService.subscribe(uid, setConnections) : () => {};
    const stopDirectory = studentSearchService.subscribeStudents(pool => setClassmates(pool.filter(student => student.uid !== uid)), true);
    return () => { stopProfile(); stopPosts(); stopStories(); stopFollow(); stopConnections(); stopDirectory(); };
  }, [isOpen, uid, isOwnProfile]);

  const save = async action => {
    if (saving) return;
    setSaving(true);
    try { await action(); }
    catch (error) { showCampusAlert({ title: 'Changes not saved', message: error.message || 'Please try again. Your draft is still here.', type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await save(async () => {
    const updated = await studentSocialService.updateSocialProfile(uid, {
      bio: editBio,
      handle: editHandle,
      customAvatar: editAvatar || null
    });
    setProfile(updated);
    setIsEditing(false);
    });
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostUrl) return;
    await save(async () => {
    await studentSocialService.createPost({
      authorUid: uid,
      authorName: studentUser?.displayName || studentUser?.name || 'Student',
      authorAvatar: profile?.customAvatar || studentUser?.photoURL,
      mediaUrl: newPostUrl,
      caption: newPostCaption,
      mediaType: newPostType
    });

    setNewPostUrl('');
    setNewPostCaption('');
    setShowNewPostModal(false);
    });
  };

  const handleCreateStory = async (e) => {
    e.preventDefault();
    if (!newStoryUrl) return;
    await save(async () => {
    await studentSocialService.createStory({
      authorUid: uid,
      authorName: studentUser?.displayName || studentUser?.name || 'Student',
      authorAvatar: profile?.customAvatar || studentUser?.photoURL,
      mediaUrl: newStoryUrl,
      caption: newStoryCaption,
      type: 'photo'
    });

    setNewStoryUrl('');
    setNewStoryCaption('');
    setShowNewStoryModal(false);
    });
  };

  if (!isOpen) return null;

  const friendsCount = connections.friends.length;
  const followingCount = followCounts.following;
  const followersCount = followCounts.followers;
  const postsCount = posts.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full sm:max-w-2xl bg-surface border border-border rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {(loadError || profile?.error) && <p role="alert" className="p-3 text-xs text-rose-500">{loadError || profile.error}</p>}
        {/* Cover Banner */}
        <div className="relative h-36 sm:h-44 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 shrink-0">
          <div className="absolute inset-0 bg-black/20" />
          
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors z-10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {isOwnProfile && (
              <>
                <button
                  type="button"
                  onClick={() => setShowNewStoryModal(true)}
                  className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30 text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> Story (24h)
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(true)}
                  className="px-3 py-1.5 rounded-full bg-white text-black hover:bg-gray-100 text-xs font-bold flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5" /> New Post
                </button>
              </>
            )}
          </div>
        </div>

        {/* Profile Header Info */}
        <div className="px-5 pt-0 pb-3 border-b border-border bg-surface shrink-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 -mt-12 sm:-mt-14 mb-3">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-surface shadow-xl overflow-hidden bg-bg">
                <DefaultAvatar
                  src={profile?.customAvatar || studentUser?.photoURL}
                  user={studentUser}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-surface animate-pulse" title="Online" />
            </div>

            <div className="flex items-center gap-2">
              {isOwnProfile ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!isEditing) { setEditBio(profile?.bio || ''); setEditHandle(profile?.handle || ''); setEditAvatar(profile?.customAvatar || ''); }
                    setIsEditing(!isEditing);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-border bg-bg text-text hover:bg-surface text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onStartChat(studentUser);
                    onClose();
                  }}
                  className="px-4 py-1.5 rounded-xl bg-text text-bg hover:opacity-90 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Send Message
                </button>
              )}
            </div>
          </div>

          {/* Edit Form or Display */}
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-3 p-3 bg-bg/50 rounded-xl border border-border my-2">
              <div>
                <label className="text-xs font-semibold text-text">Social Handle</label>
                <input
                  type="text"
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text mt-1 focus:outline-none"
                  placeholder="@handle"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text">Bio / Status</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={2}
                  className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text mt-1 focus:outline-none"
                  placeholder="Tell campus friends about yourself..."
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text">Custom Avatar URL (Optional)</label>
                <input
                  type="url"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text mt-1 focus:outline-none"
                  placeholder="https://..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 rounded-lg text-xs text-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={saving}
                  className="px-3.5 py-1 rounded-lg bg-text text-bg text-xs font-bold hover:opacity-90 flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Save Social Profile
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text">
                  {studentUser?.displayName || studentUser?.name || 'KRC Student'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {studentUser?.dept || 'CSE'}
                </span>
              </div>
              <p className="text-xs text-muted font-mono">{profile?.handle || `@student_${uid.slice(-4)}`}</p>
              <p className="text-xs text-text mt-1 leading-relaxed">
                {profile?.bio || 'KRC Student | In-Campus Messaging Hub'}
              </p>
            </div>
          )}

          {/* Social Stats Strip */}
          <div className="flex items-center gap-6 mt-4 pt-3 border-t border-border">
            <button
              onClick={() => setActiveTab('posts')}
              className="text-center group cursor-pointer"
            >
              <span className="block text-sm font-bold text-text group-hover:text-primary transition-colors">{postsCount}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Posts</span>
            </button>
            <button
              onClick={() => setActiveTab('friends')}
              className="text-center group cursor-pointer"
            >
              <span className="block text-sm font-bold text-text group-hover:text-primary transition-colors">{friendsCount}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Friends</span>
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className="text-center group cursor-pointer"
            >
              <span className="block text-sm font-bold text-text group-hover:text-primary transition-colors">{followersCount}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Followers</span>
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className="text-center group cursor-pointer"
            >
              <span className="block text-sm font-bold text-text group-hover:text-primary transition-colors">{followingCount}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Following</span>
            </button>
          </div>
        </div>

        {/* 24-Hour Stories Carousel */}
        <div className="p-3 bg-bg/40 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Campus Stories (24h Active)</span>
            </span>
            <span className="text-[10px] text-muted">{stories.length} live</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-1 custom-scrollbar">
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => setShowNewStoryModal(true)}
                className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-primary/50 group-hover:border-primary flex items-center justify-center bg-surface group-hover:scale-105 transition-all">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[10px] font-semibold text-text truncate max-w-[60px]">Add Story</span>
              </button>
            )}

            {stories.map((story) => (
              <button
                key={story.id}
                type="button"
                onClick={() => setActiveStoryView(story)}
                className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
              >
                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-amber-500 group-hover:scale-105 transition-transform">
                  <div className="w-13 h-13 rounded-full border-2 border-surface overflow-hidden bg-bg">
                    <img
                      src={story.mediaUrl}
                      alt={story.authorName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-text truncate max-w-[64px]">
                  {story.authorName.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-border bg-surface shrink-0">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${
              activeTab === 'posts'
                ? 'border-text text-text'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            Photos & Videos
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${
              activeTab === 'friends'
                ? 'border-text text-text'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            Campus Friends
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-bg/30">
          {activeTab === 'posts' && (
            posts.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-muted text-xs">
                <ImageIcon className="w-8 h-8 opacity-40 mb-2" />
                <p>No photos or videos posted yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="group relative rounded-xl overflow-hidden aspect-square bg-surface border border-border shadow-sm hover:shadow-md transition-all"
                  >
                    <img
                      src={post.mediaUrl}
                      alt={post.caption || 'Post'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end text-white">
                      <p className="text-xs font-medium line-clamp-2">{post.caption}</p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-pink-300">
                        <Heart className="w-3 h-3 fill-pink-500" />
                        <span>{post.likes?.length || 0} likes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'friends' && (
            <div className="space-y-2">
              {classmates.filter(peer => connections.friends.includes(peer.uid)).length === 0 ? (
                <div className="py-8 text-center text-xs text-muted">
                  No friends added yet. Visit a student profile to send a friend request.
                </div>
              ) : (
                classmates.filter(peer => connections.friends.includes(peer.uid)).map((peer) => (
                  <div key={peer.uid || peer.id} className="p-3 bg-surface rounded-xl border border-border flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <DefaultAvatar
                        src={peer.avatar || peer.photoURL}
                        user={peer}
                        userId={peer.uid || peer.id}
                        name={peer.name}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-text truncate">{peer.name}</p>
                        <p className="text-[10px] text-muted truncate">{peer.dept || 'CSE'} &bull; {peer.prn || 'Classmate'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onStartChat(peer);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-text text-bg text-xs font-bold hover:opacity-90 shrink-0 cursor-pointer"
                    >
                      Chat
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {activeStoryView && (
          <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-sm w-full bg-black rounded-2xl overflow-hidden shadow-2xl"
            >
              <button
                onClick={() => setActiveStoryView(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 z-20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-3 absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
                  <img src={activeStoryView.mediaUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-xs font-bold">{activeStoryView.authorName}</p>
                  <p className="text-[10px] text-gray-300">Expires in 24 hours</p>
                </div>
              </div>

              <img
                src={activeStoryView.mediaUrl}
                alt="Story"
                className="w-full max-h-[70vh] object-contain"
              />

              {activeStoryView.caption && (
                <div className="p-4 bg-black/80 text-white text-xs text-center">
                  {activeStoryView.caption}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text">Create New Post</h3>
              <button onClick={() => setShowNewPostModal(false)} className="text-muted hover:text-text"><X className="w-4 h-4"/></button>
            </div>
            <form onSubmit={handleCreatePost} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-text">Photo / Video Media URL</label>
                <input
                  type="url"
                  required
                  value={newPostUrl}
                  onChange={(e) => setNewPostUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs text-text mt-1 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text">Caption</label>
                <textarea
                  value={newPostCaption}
                  onChange={(e) => setNewPostCaption(e.target.value)}
                  placeholder="Write a caption..."
                  rows={2}
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs text-text mt-1 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNewPostModal(false)} className="px-3 py-1 text-xs text-muted">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-1.5 rounded-lg bg-text text-bg text-xs font-bold hover:opacity-90">Post to Feed</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Story Modal */}
      {showNewStoryModal && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text">Add 24-Hour Campus Story</h3>
              <button onClick={() => setShowNewStoryModal(false)} className="text-muted hover:text-text"><X className="w-4 h-4"/></button>
            </div>
            <form onSubmit={handleCreateStory} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-text">Story Media URL</label>
                <input
                  type="url"
                  required
                  value={newStoryUrl}
                  onChange={(e) => setNewStoryUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs text-text mt-1 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text">Story Caption (Optional)</label>
                <input
                  type="text"
                  value={newStoryCaption}
                  onChange={(e) => setNewStoryCaption(e.target.value)}
                  placeholder="e.g. Festival vibes!"
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs text-text mt-1 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-muted">
                Story will automatically expire and disappear after 24 hours.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNewStoryModal(false)} className="px-3 py-1 text-xs text-muted">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-1.5 rounded-lg bg-text text-bg text-xs font-bold hover:opacity-90">Publish Story</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
