/**
 * @fileoverview Dedicated Student Social Profile Page - Nordic Editorial (Vibrant Edition)
 * Swiss minimalist magazine spread typography, large uppercase name header,
 * colorful portrait frame with avatar customization, customizable artifact categories,
 * artifact publishing, deletion, interactive comments modal, and universal public campus visibility.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MessageSquare, ShieldCheck, 
  Sparkles, Grid, Image as ImageIcon, Award, Calendar, 
  MapPin, Edit3, Heart, ExternalLink, Share2, Compass, X,
  LayoutDashboard, UserCheck, UserPlus, RefreshCw, FolderGit2,
  Camera, Plus, Trash2, MessageCircle, Send, Check, Upload, Tag,
  ZoomIn, Loader2, CloudUpload, Lock, CheckCircle2
} from 'lucide-react';
import ErrorBoundary from '../../common/ErrorBoundary.jsx';
import { studentSocialService } from '../../../services/studentSocialService.js';
import { studentChatService } from '../../../services/studentChatService.js';
import { studentRelationshipService } from '../../../services/studentRelationshipService.js';
import { sameStudentIdentity } from '../../../services/studentDirectory.js';
import { studentSearchService } from '../../../services/studentSearchService.js';
import { cloudStorageService } from '../../../services/cloudStorageService.js';
import { firestoreService } from '../../../services/firestoreService.js';
import { soundEffects } from '../../../utils/soundEffects.js';
import { showCampusAlert } from '../../common/CustomAlertModal.jsx';
import { auth } from '../../../firebase.js';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import DefaultAvatar from '../../common/DefaultAvatar.jsx';

const ARTIFACT_CATEGORIES = [
  'All',
  'Architecture',
  'Design Systems',
  'AI & ML',
  'Urban Studies',
  'Computational',
  'Research'
];

const CATEGORY_COLORS = {
  'Architecture': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Design Systems': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  'AI & ML': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Urban Studies': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  'Computational': 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  'Research': 'bg-violet-500/15 text-violet-400 border-violet-500/30'
};

const PRESET_AVATARS = [
  { label: 'Campus Scholar', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80' },
  { label: 'Studio Architect', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80' },
  { label: 'Creative Designer', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80' },
  { label: 'Systems Engineer', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=500&q=80' },
  { label: 'AI Researcher', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80' },
  { label: 'Nordic Explorer', url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=500&q=80' },
  { label: 'Computational Dev', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80' },
  { label: 'Urban Theorist', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=500&q=80' }
];

const PRESET_ARTIFACT_IMAGES = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80'
];

export default function DedicatedProfileView({
  targetStudent,
  currentStudent,
  onBack,
  onStartChat,
  beginChatAction = () => action => { action(); return true; },
  archetype
}) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [relationships, setRelationships] = useState({ following: [], followers: [], friends: [], incoming: [], outgoing: [] });
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [relationshipBusy, setRelationshipBusy] = useState(false);
  const [directoryPeers, setDirectoryPeers] = useState([]);
  const isFollowing = relationships.following.includes(targetStudent?.uid);
  const isFriend = relationships.friends.includes(targetStudent?.uid);
  const incomingRequest = relationships.incoming.includes(targetStudent?.uid);
  const outgoingRequest = relationships.outgoing.includes(targetStudent?.uid);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);

  // Customization state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showEditBioModal, setShowEditBioModal] = useState(false);
  const [showPfpModal, setShowPfpModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showExpandedPfp, setShowExpandedPfp] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState(null);

  // PFP Form state (AWS S3 Personal Partition)
  const [selectedPresetAvatar, setSelectedPresetAvatar] = useState('');
  const [personalS3Photos, setPersonalS3Photos] = useState([]);
  const [loadingS3Photos, setLoadingS3Photos] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [photoLibraryError, setPhotoLibraryError] = useState('');

  // Publish Artifact Form state (AWS S3 Artifacts Partition)
  const [artTitle, setArtTitle] = useState('');
  const [artCategory, setArtCategory] = useState('Architecture');
  const [artMediaUrl, setArtMediaUrl] = useState(PRESET_ARTIFACT_IMAGES[0]);
  const [artFile, setArtFile] = useState(null);
  const [artFilePreview, setArtFilePreview] = useState(null);
  const [uploadingArtifactMedia, setUploadingArtifactMedia] = useState(false);
  const [uploadedS3ArtifactKey, setUploadedS3ArtifactKey] = useState('');
  const [artCaption, setArtCaption] = useState('');
  const [artTags, setArtTags] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Comment state inside active artifact
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [postsError, setPostsError] = useState('');
  const [commentError, setCommentError] = useState('');
  const [likingPost, setLikingPost] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const student = targetStudent || currentStudent || {};
  const studentUid = student.uid || student.prn || student.id || currentStudent?.uid || currentStudent?.prn || '';

  const { updateUserName } = useAuth();
  const [savedBio, setSavedBio] = useState(() => {
    return studentUid ? (localStorage.getItem(`krc_nordic_bio_${studentUid}`) || '') : '';
  });
  const [bioInput, setBioInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  const isOwnProfile = sameStudentIdentity(student, currentStudent);

  // Dynamic Avatar Resolution (supports Firestore customAvatar, localStorage sync, or photoURL)
  const [currentAvatar, setCurrentAvatar] = useState(() => {
    return profile?.customAvatar || 
      student?.customAvatar || 
      student?.photoURL || 
      (studentUid ? localStorage.getItem(`krc_student_avatar_${studentUid}`) : '') || 
      '';
  });

  useEffect(() => {
    if (!studentUid) return;
    setLoading(true);
    const stopProfile = studentSocialService.subscribeProfile(studentUid, metadata => {
      setProfile({ ...student, ...metadata, name: student.name || student.fullName || metadata.name, displayName: student.name || student.displayName || metadata.displayName });
      setCurrentAvatar(metadata.customAvatar || metadata.photoURL || student.photoURL || student.avatar || '');
      setLoading(false);
    });
    const stopPosts = studentSocialService.subscribeStudentPosts(studentUid, (items, status = {}) => {
      setPosts(items);
      setPostsError(status.error || '');
    });
    const stopCounts = studentRelationshipService.subscribeFollowCounts(studentUid, setFollowCounts);
    const stopRelationships = studentRelationshipService.subscribe(currentStudent?.uid, setRelationships);
    const stopDirectory = studentSearchService.subscribeStudents(items => setDirectoryPeers(items), true);
    return () => { stopProfile(); stopPosts(); stopCounts(); stopRelationships(); stopDirectory(); };
  }, [studentUid, currentStudent?.uid, student]);

  useEffect(() => {
    if (!activeArtifact?.id) return;
    setActiveArtifact(posts.find(post => post.id === activeArtifact.id) || null);
  }, [posts, activeArtifact?.id]);

  useEffect(() => { setCommentText(''); setCommentError(''); }, [activeArtifact?.id]);

  const handleBackToMessages = () => {
    soundEffects.playClick();
    if (onBack) {
      onBack();
    } else {
      navigate('/student/chat');
    }
  };

  const handleReturnToDashboard = () => {
    soundEffects.playClick();
    navigate('/student/dashboard');
  };

  const handleToggleFollow = async () => {
    if (relationshipBusy) return;
    setRelationshipBusy(true);
    try {
      await studentRelationshipService.setFollowing(currentStudent.uid, studentUid, !isFollowing);
    } catch (error) {
      showCampusAlert({ title: 'Could not update follow', message: error.message, type: 'error' });
    } finally { setRelationshipBusy(false); }
  };

  const handleFriendAction = async () => {
    if (relationshipBusy || isFriend) return;
    setRelationshipBusy(true);
    try {
      if (incomingRequest) await studentRelationshipService.acceptFriend(currentStudent.uid, studentUid);
      else if (outgoingRequest) await studentRelationshipService.cancelFriendRequest(currentStudent.uid, studentUid);
      else await studentRelationshipService.requestFriend(currentStudent.uid, studentUid);
    } catch (error) {
      showCampusAlert({ title: 'Could not update friend request', message: error.message, type: 'error' });
    } finally { setRelationshipBusy(false); }
  };

  const handleMessageUser = async () => {
    if (startingChat) return;
    const finish = beginChatAction();
    setStartingChat(true);
    try {
      const conversation = await studentChatService.getOrCreateConversation(currentStudent, student);
      finish(() => {
        soundEffects.playThonk();
        if (onStartChat) onStartChat(conversation);
        else navigate('/student/chat', { state: { initialChat: conversation } });
      });
    } catch (error) {
      showCampusAlert({ title: 'Could not open conversation', message: error.message, type: 'error' });
    } finally {
      setStartingChat(false);
    }
  };

  // A failed listing stays visible; cached objects never become evidence of remote storage.
  useEffect(() => {
    if (!showPfpModal || !studentUid || !isOwnProfile) return;
    let active = true;
    setLoadingS3Photos(true);
    setPhotoLibraryError('');
    cloudStorageService.listUserProfilePhotos(studentUid).then(photos => {
      if (active) setPersonalS3Photos(photos);
    }).catch(() => {
      if (active) setPhotoLibraryError('Your photo library could not be loaded. Close and reopen it to retry.');
    }).finally(() => { if (active) setLoadingS3Photos(false); });
    return () => { active = false; };
  }, [showPfpModal, studentUid, isOwnProfile]);

  const { updateUserPhoto, deleteUserPhoto } = useAuth() || {};

  // Real-time synchronization for global avatar updates
  useEffect(() => {
    const handleAvatarUpdate = (e) => {
      const { uid, avatarUrl } = e.detail || {};
      if (avatarUrl === undefined) return;
      if (!uid || uid === studentUid || uid === 'current') {
        setCurrentAvatar(avatarUrl || '');
      }
    };
    window.addEventListener('krc_avatar_updated', handleAvatarUpdate);
    return () => window.removeEventListener('krc_avatar_updated', handleAvatarUpdate);
  }, [studentUid]);

  const handleSaveAvatar = async (avatarUrl, photoMeta = {}) => {
    const finalUrl = avatarUrl || selectedPresetAvatar;
    if (!finalUrl || savingAvatar) return false;
    setSavingAvatar(true);
    try {
      if (!isOwnProfile || studentUid !== currentStudent?.uid) throw new Error('Open your own profile to change your photo.');
      const metadata = personalS3Photos.find(photo => photo.url === finalUrl) || photoMeta;
      if (typeof updateUserPhoto === 'function') await updateUserPhoto(finalUrl, metadata);
      else await firestoreService.recordUserPhotoUpload(studentUid, finalUrl, metadata);
      setCurrentAvatar(finalUrl);
      setShowPfpModal(false);
      setSelectedPresetAvatar('');
      return true;
    } catch (error) {
      showCampusAlert({ title: 'Profile photo not saved', message: error.message || 'Please retry. Your selection is still here.', type: 'error' });
      return false;
    } finally { setSavingAvatar(false); }
  };

  // Upload Avatar directly to AWS S3 personal vault: users/{userId}/...
  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    soundEffects.playThonk();

    try {
      const myUid = auth?.currentUser?.uid || currentStudent?.uid || currentStudent?.prn || studentUid;
      const uploadResult = await cloudStorageService.uploadUserProfilePhoto(myUid, file);

      if (!uploadResult?.url) throw new Error('The upload did not return a saved photo.');
      setSelectedPresetAvatar(uploadResult.url);
      setPersonalS3Photos(previous => [uploadResult, ...previous.filter(photo => photo.key !== uploadResult.key)]);
      if (await handleSaveAvatar(uploadResult.url, uploadResult)) {
        showCampusAlert({ title: 'Profile photo saved', message: 'Your uploaded photo is now saved to your campus profile.', type: 'success' });
      }
    } catch (err) {
      console.error('[DedicatedProfileView] Avatar S3 upload failed:', err);
      showCampusAlert({
        title: 'Upload Notice',
        message: 'Your profile photo could not be uploaded. Please try again.',
        type: 'error'
      });
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleDeleteS3Photo = photo => {
    showCampusAlert({ title: 'Delete profile photo?', message: 'This deletes the stored photo and removes it from your profile library. This cannot be undone.',
      type: 'warning', confirmText: 'Delete photo', showCancel: true, cancelText: 'Keep photo', onConfirm: async () => {
        try {
          if (!isOwnProfile || studentUid !== currentStudent?.uid) throw new Error('Open your own photo library.');
          if (typeof deleteUserPhoto === 'function') await deleteUserPhoto(photo.url, photo.key);
          else {
            await cloudStorageService.deleteUserProfilePhoto(studentUid, photo.key, photo.url);
            await firestoreService.removeUserPhotoFromHistory(studentUid, photo.url, photo.key);
          }
          setPersonalS3Photos(previous => previous.filter(item => item.key !== photo.key));
        } catch (error) {
          showCampusAlert({ title: 'Photo deletion incomplete', message: 'Could not finish deleting this photo. Reopen the library and retry.', type: 'error' });
        }
      }
    });
  };

  // Upload Artifact Asset directly to AWS S3: artifacts/{userId}/...
  const handleArtifactFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setArtFile(file);
    setArtFilePreview(previewUrl);
    setUploadingArtifactMedia(true);
    soundEffects.playThonk();

    try {
      const myUid = auth?.currentUser?.uid || currentStudent?.uid || currentStudent?.prn || studentUid;
      const uploadResult = await cloudStorageService.uploadStudentArtifact(myUid, file);
      if (uploadResult?.url) {
        setArtMediaUrl(uploadResult.url);
        setUploadedS3ArtifactKey(uploadResult.key || '');
        showCampusAlert({
          title: 'Media Uploaded',
          message: 'Your media is ready to publish.',
          type: 'success'
        });
      }
    } catch (err) {
      console.error('[DedicatedProfileView] Artifact S3 upload failed:', err);
      showCampusAlert({
        title: 'Upload Notice',
        message: 'Your media could not be uploaded. Please try again.',
        type: 'error'
      });
    } finally {
      setUploadingArtifactMedia(false);
      e.target.value = '';
    }
  };

  // Publish Artifact Handler (with verified S3 asset)
  const handlePublishArtifact = async (e) => {
    e.preventDefault();
    if (publishing) return;
    if (!artTitle.trim()) {
      showCampusAlert({
        title: 'Title Required',
        message: 'Please provide a title for your artifact.',
        type: 'warning'
      });
      return;
    }
    if (!artMediaUrl.trim()) {
      showCampusAlert({
        title: 'Media Required',
        message: 'Please upload an image/render or choose an artifact visual asset.',
        type: 'warning'
      });
      return;
    }

    soundEffects.playThonk();
    setPublishing(true);

    try {
      const myUid = auth?.currentUser?.uid || currentStudent?.uid || currentStudent?.prn || studentUid;
      const myName = currentStudent?.displayName || currentStudent?.name || profile?.name || 'Student';
      const rawTags = artTags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);

      const created = await studentSocialService.createArtifact({
        authorUid: myUid,
        authorName: myName,
        authorAvatar: currentAvatar || null,
        authorPrn: currentStudent?.prn || studentUid,
        title: artTitle.trim(),
        category: artCategory,
        mediaUrl: artMediaUrl.trim(),
        caption: artCaption.trim(),
        tags: rawTags
      });

      setPosts(prev => prev.some(post => post.id === created.id) ? prev : [created, ...prev]);
      setShowPublishModal(false);
      setArtTitle('');
      setArtCaption('');
      setArtTags('');
      setArtFile(null);
      setArtFilePreview(null);
      setUploadedS3ArtifactKey('');
      setArtMediaUrl(PRESET_ARTIFACT_IMAGES[0]);

      showCampusAlert({
        title: 'Artifact Published',
        message: 'Your work is published on your campus profile!',
        type: 'success'
      });
    } catch (err) {
      console.warn('[DedicatedProfileView] Publish error:', err);
      showCampusAlert({
        title: 'Publish Error',
        message: err.message || 'Could not publish artifact.',
        type: 'error'
      });
    } finally {
      setPublishing(false);
    }
  };

  // Delete Artifact Handler
  const handleDeleteArtifact = (e, artifactId) => {
    e.stopPropagation();
    showCampusAlert({
      title: 'Delete Artifact',
      message: 'Are you sure you want to permanently delete this artifact? This cannot be undone.',
      type: 'warning',
      confirmText: 'Delete',
      showCancel: true,
      cancelText: 'Keep',
      onConfirm: async () => {
        soundEffects.playPop();
        try {
          const myUid = auth?.currentUser?.uid || currentStudent?.uid || currentStudent?.prn || studentUid;
          await studentSocialService.deleteArtifact(artifactId, myUid);
          setPosts(prev => prev.filter(p => p.id !== artifactId));
          if (activeArtifact?.id === artifactId) {
            setActiveArtifact(null);
          }
        } catch (err) {
          console.warn('[DedicatedProfileView] Delete artifact notice:', err);
          showCampusAlert({
            title: 'Delete Notice',
            message: err.message || 'Could not delete artifact.',
            type: 'error'
          });
        }
      }
    });
  };

  // Add Comment Handler
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (postingComment || !commentText.trim() || !activeArtifact?.id) return;

    soundEffects.playThonk();
    setPostingComment(true);
    setCommentError('');

    try {
      const myUid = auth?.currentUser?.uid || currentStudent?.uid || currentStudent?.prn || studentUid || 'student';
      const myName = currentStudent?.displayName || currentStudent?.name || 'Classmate';

      await studentSocialService.addComment(activeArtifact.id, {
        authorUid: myUid,
        authorName: myName,
        authorAvatar: currentAvatar || null,
        authorPrn: currentStudent?.prn || '',
        text: commentText.trim()
      });

      setCommentText('');
    } catch (err) {
      console.warn('[DedicatedProfileView] Add comment error:', err);
      setCommentError(err.message || 'Comment not saved. Please try again. Your draft is still here.');
    } finally {
      setPostingComment(false);
    }
  };

  // Filter posts by selected category
  const handleLikePost = async (event, postId) => {
    event.stopPropagation();
    if (likingPost) return;
    setLikingPost(postId);
    try { await studentSocialService.toggleLike(postId, currentStudent?.uid); }
    catch (error) { showCampusAlert({ title: 'Like not saved', message: error.message, type: 'error' }); }
    finally { setLikingPost(''); }
  };

  const filteredPosts = posts.filter(post => {
    if (!post) return false;
    if (selectedCategory === 'All') return true;
    return String(post.category || 'Architecture').toLowerCase() === String(selectedCategory || 'All').toLowerCase();
  });

  const canonicalStudent = directoryPeers.find(peer => peer.uid === studentUid) || student;
  const studentName = (
    canonicalStudent?.name ||
    canonicalStudent?.displayName ||
    profile?.name || 
    profile?.displayName || 
    currentStudent?.name || 
    currentStudent?.displayName || 
    'STUDENT'
  ).toUpperCase();
  const studentPrn = canonicalStudent?.prn || profile?.prn || currentStudent?.prn || '';
  const defaultCampusBio = `Student at KRC Institute of Technology • Department of ${student?.dept || profile?.dept || currentStudent?.dept || 'Engineering'}`;
  const studentBio = profile?.bio ?? (savedBio || student?.bio || defaultCampusBio);

  return (
    <ErrorBoundary 
      title="Profile View Recovery"
      message="The profile view encountered an unexpected state. Use the navigation buttons below to safely return to your workspace."
      onRecovery={handleBackToMessages}
    >
      <div className="flex-1 w-full h-full flex flex-col overflow-y-auto bg-bg text-text font-sans custom-scrollbar select-none transition-colors">
        {(postsError || profile?.error) && <div role="alert" className="p-3 text-xs text-rose-500 border-b border-rose-500/30">{postsError || profile.error} Reopen this profile to reconnect.</div>}
        {/* ========================================================================= */}
        {/* TOP EDITORIAL BREADCRUMB & RESILIENT NAVIGATION BAR */}
        {/* ========================================================================= */}
        <div className="px-4 sm:px-8 py-3.5 border-b border-border bg-surface/90 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackToMessages}
              className="px-3 py-1.5 rounded-xl border border-border bg-bg hover:bg-surface text-text transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold shadow-xs active:scale-95"
              title="Return to messages"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
              <span>Back to Messages</span>
            </button>

            <button
              type="button"
              onClick={handleReturnToDashboard}
              className="px-3 py-1.5 rounded-xl border border-border bg-bg hover:bg-surface text-muted hover:text-text transition-all cursor-pointer flex items-center gap-2 text-xs font-medium active:scale-95"
              title="Return to Student Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-muted" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[11px] font-semibold flex items-center gap-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Public Campus Profile
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIBRANT NORDIC EDITORIAL SPREAD HEADER */}
        {/* ========================================================================= */}
        <div className="max-w-6xl w-full mx-auto px-6 sm:px-10 lg:px-12 pt-8 sm:pt-12 pb-8 border-b border-border">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Typographic Hierarchy */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold tracking-wider uppercase mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Verified Campus Identity
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-text font-sans uppercase">
                  {studentName}
                </h1>
                <p className="text-sm font-mono text-muted tracking-wider mt-1.5 flex items-center gap-2">
                  <span className="text-indigo-400 font-semibold">{studentPrn}</span>
                  <span>&bull;</span>
                  <span className="px-2 py-0.5 rounded bg-surface border border-border text-text font-bold text-xs">
                    {student.dept || currentStudent?.dept || 'CSE'}
                  </span>
                </p>
              </div>

              <p className="text-xs sm:text-sm text-text/80 leading-relaxed font-light max-w-xl pt-1">
                {studentBio}
              </p>
            </div>

            {/* Middle Column: Colorful Portrait Frame with Click-to-Expand Lightbox */}
            <div className="lg:col-span-3 flex justify-center lg:justify-start">
              <div 
                onClick={() => {
                  soundEffects.playClick();
                  setShowExpandedPfp(true);
                }}
                className="w-36 h-44 sm:w-40 sm:h-48 rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-tr from-indigo-500/15 via-purple-500/10 to-pink-500/15 overflow-hidden shadow-xl relative group ring-4 ring-indigo-500/10 transition-all hover:ring-indigo-500/35 cursor-pointer"
                title="Click to view extended profile picture"
              >
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt={studentName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 text-white font-black text-3xl font-mono ${
                    currentAvatar ? 'hidden' : 'flex'
                  }`}
                >
                  {studentName[0] || 'S'}
                </div>

                {/* Extended view zoom badge on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="px-2.5 py-1.5 rounded-xl bg-black/70 text-white backdrop-blur-xs flex items-center gap-1.5 text-[11px] font-semibold border border-white/20 shadow-lg">
                    <ZoomIn className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Expand</span>
                  </div>
                </div>

                {/* Change Avatar Overlay Action (stops propagation so lightbox is not triggered) */}
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEffects.playClick();
                      setShowPfpModal(true);
                    }}
                    className="absolute bottom-2 right-2 p-2 rounded-xl bg-slate-950/85 backdrop-blur-md text-white hover:bg-indigo-600 transition-all shadow-lg cursor-pointer flex items-center gap-1.5 text-[11px] font-semibold border border-white/20 active:scale-95 z-10"
                    title="Change profile avatar"
                  >
                    <Camera className="w-3.5 h-3.5 text-indigo-300" />
                    <span className="hidden sm:inline">PFP</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Actions & Vibrant Stats Strip */}
            <div className="lg:col-span-3 flex flex-col justify-between h-full space-y-6">
              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                {!isOwnProfile ? (
                  <>
                    <button
                      type="button"
                      onClick={handleMessageUser}
                      disabled={startingChat}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-surface hover:bg-bg border border-border text-text text-xs font-semibold cursor-pointer transition-all text-center active:scale-95 shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{startingChat ? 'Opening…' : 'Direct Message'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleFollow}
                      disabled={relationshipBusy}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-all text-center active:scale-95 shadow-md shadow-indigo-600/20"
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button type="button" onClick={handleFriendAction} disabled={relationshipBusy || isFriend} className="flex-1 py-2.5 px-3 rounded-xl border border-border text-xs font-semibold disabled:opacity-60">{isFriend ? 'Friends' : incomingRequest ? 'Accept request' : outgoingRequest ? 'Cancel request' : 'Add friend'}</button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setBioInput(studentBio);
                      setNameInput(canonicalStudent?.name || canonicalStudent?.displayName || profile?.name || profile?.displayName || currentStudent?.name || currentStudent?.displayName || '');
                      setShowEditBioModal(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-surface hover:bg-bg border border-border text-text text-xs font-semibold cursor-pointer transition-all text-center flex items-center justify-center gap-2 active:scale-95 shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Edit Profile &amp; Bio</span>
                  </button>
                )}
              </div>

              {relationships.error && <p role="alert" className="text-xs text-rose-500">{relationships.error}</p>}
              {isOwnProfile && relationships.incoming.length > 0 && <div className="rounded-xl border border-border p-3 space-y-2">
                <h3 className="text-sm font-bold">Friend requests</h3>
                {relationships.incoming.map(uid => <div key={uid} className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="flex-1">{directoryPeers.find(peer => peer.uid === uid)?.name || 'Student request'}</span>
                  <button type="button" disabled={relationshipBusy} onClick={async () => {
                    setRelationshipBusy(true);
                    try { await studentRelationshipService.acceptFriend(currentStudent.uid, uid); }
                    catch (error) { showCampusAlert({ title: 'Could not accept request', message: error.message, type: 'error' }); }
                    finally { setRelationshipBusy(false); }
                  }} className="underline">Accept</button>
                  <button type="button" disabled={relationshipBusy} onClick={async () => {
                    setRelationshipBusy(true);
                    try { await studentRelationshipService.cancelFriendRequest(currentStudent.uid, uid); }
                    catch (error) { showCampusAlert({ title: 'Could not decline request', message: error.message, type: 'error' }); }
                    finally { setRelationshipBusy(false); }
                  }} className="underline">Decline</button>
                </div>)}
              </div>}

              {/* Colorful Stats Strip */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border text-center">
                <div className="p-2 rounded-xl bg-surface/50 border border-border/50">
                  <div className="text-xl sm:text-2xl font-light text-indigo-400 font-mono">
                    {isOwnProfile ? relationships.friends.length : (isFriend ? 'Yes' : '—')}
                  </div>
                  <div className="text-[11px] font-sans text-muted mt-0.5">
                    {isOwnProfile ? 'Friends' : 'Connected'}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-surface/50 border border-border/50">
                  <div className="text-xl sm:text-2xl font-light text-purple-400 font-mono">
                    {followCounts.followers}
                  </div>
                  <div className="text-[11px] font-sans text-muted mt-0.5">
                    Followers
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-surface/50 border border-border/50">
                  <div className="text-xl sm:text-2xl font-light text-emerald-400 font-mono">
                    {posts.length}
                  </div>
                  <div className="text-[11px] font-sans text-muted mt-0.5">
                    Artifacts
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ARTIFACT CATEGORIES FILTERING & PUBLISH ACTION BAR */}
        {/* ========================================================================= */}
        <div className="max-w-6xl w-full mx-auto px-6 sm:px-10 lg:px-12 py-6 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
              {ARTIFACT_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setSelectedCategory(cat);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all shrink-0 active:scale-95 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                        : 'bg-surface hover:bg-bg border border-border text-muted hover:text-text'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Publish Artifact Action (Author Only) */}
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setShowPublishModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Artifact</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLORFUL ARTIFACTS GALLERY GRID */}
        {/* ========================================================================= */}
        <div className="max-w-6xl w-full mx-auto px-6 sm:px-10 lg:px-12 py-8 flex-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted">
              {selectedCategory === 'All' ? 'All Studio Artifacts & Research' : `${selectedCategory} Artifacts`}
            </h3>
            <span className="text-xs font-mono text-indigo-400">
              {filteredPosts.length} Artifacts
            </span>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="border border-dashed border-border/80 bg-surface/30 rounded-2xl p-10 text-center max-w-md mx-auto my-6">
              <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center mx-auto mb-3 text-muted">
                <FolderGit2 className="w-5 h-5 text-indigo-400" />
              </div>
              <h4 className="text-sm font-semibold text-text">No Artifacts in {selectedCategory}</h4>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                {isOwnProfile
                  ? 'Click "Publish Artifact" above to upload architectural blueprints, models, or design systems.'
                  : 'This student has not yet published any artifacts under this category.'}
              </p>
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setShowPublishModal(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition active:scale-95 cursor-pointer"
                >
                  Publish First Artifact
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => {
                const categoryClass = CATEGORY_COLORS[post.category] || 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
                const commentsCount = Array.isArray(post.comments) ? post.comments.length : 0;
                const likesCount = Array.isArray(post.likes) ? post.likes.length : (typeof post.likes === 'number' ? post.likes : 0);
                const canDelete = isOwnProfile || (post.authorUid === (currentStudent?.uid || currentStudent?.prn));

                return (
                  <div
                    key={post.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open post ${post.title || 'Campus post'}`}
                    onKeyDown={event => { if (event.target === event.currentTarget && ['Enter', ' '].includes(event.key)) { event.preventDefault(); setActiveArtifact(post); } }}
                    onClick={() => {
                      soundEffects.playClick();
                      setActiveArtifact(post);
                    }}
                    className="border border-border bg-surface rounded-2xl p-3 space-y-3 group hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all shadow-sm cursor-pointer relative overflow-hidden"
                  >
                    {/* Visual Media Frame */}
                    <div className="aspect-[4/3] bg-bg rounded-xl overflow-hidden relative">
                      <img
                        src={post.mediaUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80';
                        }}
                      />

                      {/* Category Badge on Image */}
                      <span className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border backdrop-blur-md ${categoryClass}`}>
                        {post.category || 'Architecture'}
                      </span>

                      {/* Delete button (author only) */}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteArtifact(e, post.id)}
                          className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-white/80 hover:text-white transition-colors cursor-pointer border border-white/20"
                          title="Delete artifact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Metadata Strip */}
                    <div className="flex items-start justify-between gap-2 pt-1 px-1">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-text group-hover:text-indigo-400 transition-colors truncate">
                          {post.title}
                        </h4>
                        <p className="text-[11px] text-muted line-clamp-1 mt-0.5">
                          {post.caption || 'Published design artifact'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 text-muted">
                        <button type="button" aria-label={`Like post ${post.title || 'Campus post'}`} aria-pressed={post.likes?.includes?.(currentStudent?.uid) || false}
                          disabled={!!likingPost} onClick={event => handleLikePost(event, post.id)}
                          className="text-[11px] font-mono flex items-center gap-1 hover:text-rose-400 transition">
                          <Heart className={`w-3 h-3 text-rose-500 ${post.likes?.includes?.(currentStudent?.uid) ? 'fill-rose-500' : ''}`} /> {likesCount}
                        </button>
                        <span className="text-[11px] font-mono flex items-center gap-1 hover:text-indigo-400 transition">
                          <MessageCircle className="w-3 h-3 text-indigo-400" /> {commentsCount}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Minimal Nordic Editorial Footer */}
        <div className="mt-auto border-t border-border py-6 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted gap-4 bg-surface/50">
          <span>&copy; 2026 KRC Campus Mesh &bull; Nordic Editorial Archetype (Color Edition)</span>
          <div className="flex items-center gap-6">
            <button type="button" onClick={handleBackToMessages} className="hover:text-indigo-400 cursor-pointer transition-colors">
              Messages
            </button>
            <button type="button" onClick={handleReturnToDashboard} className="hover:text-indigo-400 cursor-pointer transition-colors">
              Dashboard
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL 0: EXTENDED PROFILE PICTURE VIEW (LIGHTBOX) */}
        {/* ========================================================================= */}
        {showExpandedPfp && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in"
            onClick={() => setShowExpandedPfp(false)}
          >
            <div 
              className="bg-surface/95 border border-border/80 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-left relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-surface/50">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold tracking-wider text-text uppercase">
                    Campus ID &bull; {studentName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExpandedPfp(false)}
                  className="p-1.5 rounded-xl text-muted hover:text-text hover:bg-bg cursor-pointer transition"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* High-res Image Display */}
              <div className="w-full aspect-square bg-slate-950 flex items-center justify-center relative overflow-hidden group">
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt={studentName}
                    className="w-full h-full object-cover sm:object-contain transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 text-white">
                    <span className="text-7xl font-black font-mono">{studentName[0] || 'S'}</span>
                    <span className="text-xs font-mono tracking-widest uppercase mt-3 opacity-80">No Avatar Uploaded</span>
                  </div>
                )}
              </div>

              {/* Details Footer */}
              <div className="p-5 bg-surface border-t border-border flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold text-text flex items-center gap-1.5">
                    {studentName}
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </h4>
                  <p className="text-xs font-mono text-muted mt-0.5">
                    {studentPrn} &bull; {student.dept || currentStudent?.dept || 'Computer Science'}
                  </p>
                </div>

                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowExpandedPfp(false);
                      setShowPfpModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Update PFP</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: PRIVATE S3 PROFILE PICTURE VAULT */}
        {/* ========================================================================= */}
        {showPfpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-surface border border-border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-left max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-400" /> My Profile Photos
                  </h3>
                  <p className="text-[11px] text-muted">Saved photos for your account</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPfpModal(false)}
                  className="text-muted hover:text-text p-1 rounded-lg hover:bg-bg cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Direct Upload to S3 Partition */}
              <div className="p-4 rounded-xl border border-dashed border-indigo-500/40 bg-indigo-500/5 text-center space-y-2">
                <div className="mx-auto w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  {uploadingAvatar ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CloudUpload className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-text">
                    {uploadingAvatar ? 'Uploading profile photo…' : 'Upload photo from device'}
                  </p>
                  <p className="text-[10px] font-mono text-muted mt-0.5">
                    Saved in your profile photo library
                  </p>
                </div>
                <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition shadow-md shadow-indigo-600/20 active:scale-95 ${uploadingAvatar ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingAvatar ? 'Uploading...' : 'Choose Photo File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingAvatar || savingAvatar}
                    onChange={handleAvatarFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {photoLibraryError && <p role="alert" className="text-xs text-rose-500">{photoLibraryError}</p>}
              {/* Profile photo library */}
              <div>
                <label className="block text-text font-semibold text-xs mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    Your Uploaded Photos
                  </span>
                  <span className="text-[10px] font-mono text-muted">
                    {personalS3Photos.length} {personalS3Photos.length === 1 ? 'file' : 'files'}
                  </span>
                </label>

                {loadingS3Photos ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-muted text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Loading your photos…</span>
                  </div>
                ) : personalS3Photos.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2.5 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                    {personalS3Photos.map((photo, idx) => (
                      <div
                        key={photo.key || idx}
                        role="button"
                        tabIndex={0}
                        aria-label={`Select photo ${photo.fileName || 'Profile photo'}`}
                        onKeyDown={event => { if (event.target === event.currentTarget && ['Enter', ' '].includes(event.key)) { event.preventDefault(); setSelectedPresetAvatar(photo.url); } }}
                        onClick={() => setSelectedPresetAvatar(photo.url)}
                        className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${
                          (selectedPresetAvatar === photo.url || currentAvatar === photo.url)
                            ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-95'
                            : 'border-border hover:border-text/40'
                        }`}
                      >
                        <img src={photo.url} alt={photo.fileName || 'Profile photo'} className="w-full h-full object-cover" />
                        {(selectedPresetAvatar === photo.url || currentAvatar === photo.url) && (
                          <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteS3Photo(photo);
                          }}
                          className="absolute top-1 right-1 p-1 rounded-md bg-black/70 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white transition cursor-pointer"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-bg border border-border text-center text-[11px] text-muted">
                    No uploaded photos yet. Choose a photo from your device.
                  </div>
                )}
              </div>

              {/* Preset Avatars Grid */}
              <div>
                <label className="block text-text font-semibold text-xs mb-2">
                  Or Choose from Curated Campus Avatars:
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {PRESET_AVATARS.map((av, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedPresetAvatar(av.url)}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        selectedPresetAvatar === av.url
                          ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-95'
                          : 'border-border hover:border-text/40'
                      }`}
                    >
                      <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                      {selectedPresetAvatar === av.url && (
                        <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowPfpModal(false)}
                  className="px-4 py-2 border border-border bg-bg hover:bg-surface text-muted hover:text-text rounded-xl text-xs font-medium cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveAvatar()}
                  disabled={!selectedPresetAvatar || savingAvatar || uploadingAvatar}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition active:scale-95 shadow-md shadow-indigo-600/20"
                >
                  Save Avatar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: PUBLISH NEW ARTIFACT (AWS S3 INTEGRATION) */}
        {/* ========================================================================= */}
        {showPublishModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
            <div className="bg-surface border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-left max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-400" /> Publish Campus Artifact
                  </h3>
                  <p className="text-[11px] font-mono text-muted">Published work is visible on your campus profile</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="text-muted hover:text-text p-1 rounded-lg hover:bg-bg cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePublishArtifact} className="space-y-4 text-xs">
                {/* Title */}
                <div>
                  <label className="block text-text font-semibold mb-1">
                    Artifact Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={artTitle}
                    onChange={(e) => setArtTitle(e.target.value)}
                    placeholder="e.g. Distributed Mesh Pavilion / Structural Analysis"
                    className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-text placeholder:text-muted focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-text font-semibold mb-1">
                    Category *
                  </label>
                  <select
                    value={artCategory}
                    onChange={(e) => setArtCategory(e.target.value)}
                    className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-text focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    {ARTIFACT_CATEGORIES.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* AWS S3 File Uploader for Artifact */}
                <div>
                  <label className="block text-text font-semibold mb-1">
                    Artifact Media *
                  </label>

                  {/* Upload area */}
                  <div className="p-4 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 text-center space-y-2 mb-3">
                    <div className="mx-auto w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      {uploadingArtifactMedia ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CloudUpload className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text">
                        {uploadingArtifactMedia 
                          ? 'Uploading media…' 
                          : 'Upload blueprint, render, or architectural model'}
                      </p>
                      <p className="text-[10px] font-mono text-muted mt-0.5">
                        Attached to your campus post
                      </p>
                    </div>
                    <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition shadow-md shadow-emerald-600/20 active:scale-95 ${uploadingArtifactMedia ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingArtifactMedia ? 'Uploading media…' : 'Select File from Device'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingArtifactMedia}
                        onChange={handleArtifactFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Preview of current media */}
                  {artMediaUrl && (
                    <div className="rounded-xl border border-border overflow-hidden bg-bg/50 p-2.5 flex items-center gap-3">
                      <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 border border-border bg-black">
                        <img 
                          src={artFilePreview || artMediaUrl} 
                          alt="Artifact Preview" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active Visual Asset</span>
                        </div>
                        <p className="text-[10px] font-mono text-muted truncate mt-0.5">
                          {artFile?.name || 'Selected media'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Curated Previews fallback */}
                  <div className="mt-3">
                    <span className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1.5">
                      Or select curated campus blueprint:
                    </span>
                    <div className="grid grid-cols-6 gap-2">
                      {PRESET_ARTIFACT_IMAGES.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setArtMediaUrl(imgUrl);
                            setArtFile(null);
                            setArtFilePreview(null);
                            setUploadedS3ArtifactKey('');
                          }}
                          className={`aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition ${
                            artMediaUrl === imgUrl ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-border hover:border-text/40'
                          }`}
                        >
                          <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Caption / Description */}
                <div>
                  <label className="block text-text font-semibold mb-1">
                    Description & Method
                  </label>
                  <textarea
                    rows={3}
                    value={artCaption}
                    onChange={(e) => setArtCaption(e.target.value)}
                    placeholder="Provide context regarding the design rationale, algorithms, or structural systems..."
                    className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-text placeholder:text-muted focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-text font-semibold mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={artTags}
                    onChange={(e) => setArtTags(e.target.value)}
                    placeholder="architecture, ai, distributed, systems"
                    className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-text placeholder:text-muted focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowPublishModal(false)}
                    className="px-4 py-2 border border-border bg-bg hover:bg-surface text-muted hover:text-text rounded-xl text-xs font-medium cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={publishing || uploadingArtifactMedia || !artTitle.trim() || !artMediaUrl.trim()}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition active:scale-95 shadow-md shadow-emerald-600/20 disabled:opacity-40"
                  >
                    {publishing ? 'Publishing...' : 'Publish Artifact'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: INTERACTIVE ARTIFACT VIEWER & COMMENTS MODAL */}
        {/* ========================================================================= */}
        {activeArtifact && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in"
            onClick={() => setActiveArtifact(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="artifact-viewer-title"
              className="bg-surface border border-border rounded-none max-w-[1240px] w-full h-[min(740px,calc(100dvh-3rem))] grid grid-rows-[minmax(0,42fr)_minmax(0,58fr)] md:grid-rows-1 md:grid-cols-[minmax(0,1fr)_360px] overflow-hidden shadow-2xl text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Column: Full-Resolution Image Frame */}
              <div className="bg-black flex items-center justify-center relative min-w-0 min-h-0 overflow-hidden px-4 pb-4 pt-12 sm:px-6 sm:pb-6">
                <img
                  src={activeArtifact.mediaUrl}
                  alt={activeArtifact.title}
                  className="block h-auto w-auto max-h-full max-w-full object-contain"
                />
                <span className={`absolute top-3 left-4 px-2.5 py-1 text-[10px] font-mono font-bold border ${CATEGORY_COLORS[activeArtifact.category] || 'bg-indigo-500/20 text-indigo-300'}`}>
                  {activeArtifact.category || 'Architecture'}
                </span>
              </div>

              {/* Right Column: Details & Real-time Comments Stream */}
              <div className="min-w-0 min-h-0 flex flex-col border-t md:border-t-0 md:border-l border-border bg-surface">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-start justify-between gap-3 shrink-0">
                  <div className="min-w-0">
                    <h3 id="artifact-viewer-title" className="text-base font-semibold text-text break-words leading-snug">
                      {activeArtifact.title}
                    </h3>
                    <p className="text-[11px] font-mono text-muted">
                      Published by {directoryPeers.find(peer => peer.uid === activeArtifact.authorUid)?.name || activeArtifact.authorName || 'Student'}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close artifact"
                    onClick={() => setActiveArtifact(null)}
                    className="p-1 shrink-0 text-muted hover:text-text hover:bg-bg cursor-pointer transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Artifact Description */}
                {activeArtifact.caption && (
                  <div className="max-h-[22%] shrink-0 overflow-y-auto px-4 py-3 bg-bg/40 border-b border-border text-xs text-text/90 leading-relaxed break-words">
                    {activeArtifact.caption}
                  </div>
                )}

                {/* Comments List */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  <div className="text-[10px] font-mono text-muted uppercase tracking-wider mb-2">
                    Campus Discussion ({Array.isArray(activeArtifact.comments) ? activeArtifact.comments.length : 0})
                  </div>

                  {!activeArtifact.comments || activeArtifact.comments.length === 0 ? (
                    <div className="text-center py-8 text-muted text-xs">
                      <MessageCircle className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                      <span>No comments yet. Start the conversation!</span>
                    </div>
                  ) : (
                    activeArtifact.comments.map((c) => (
                      <div key={c.id || c.createdAt} className="flex items-start gap-2.5 text-xs pb-3 border-b border-border/50 last:border-0 last:pb-0">
                        <DefaultAvatar 
                          src={c.authorAvatar || c.avatar} 
                          userId={c.authorUid || c.authorPrn}
                          name={c.authorName} 
                          className="w-6 h-6 rounded-full shrink-0 mt-0.5 object-cover" 
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-text text-[11px]">{directoryPeers.find(peer => peer.uid === c.authorUid)?.name || c.authorName || 'Student'}</span>
                            <span className="text-[9px] font-mono text-muted">
                              {new Date(c.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-text/90 mt-1 text-xs leading-relaxed break-words whitespace-pre-wrap">{c.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input Composer */}
                {commentError && <p role="alert" className="shrink-0 px-3 py-2 text-xs text-rose-500">{commentError}</p>}
                <form onSubmit={handlePostComment} className="shrink-0 p-3 border-t border-border bg-surface flex items-center gap-2">
                  <input
                    type="text"
                    aria-label="Comment on artifact"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a constructive critique or note..."
                    maxLength={2000}
                    className="min-w-0 flex-1 bg-bg border border-border rounded-sm px-3 py-2.5 text-xs text-text placeholder:text-muted focus:outline-none focus:border-indigo-500 font-sans"
                  />
                  <button
                    type="submit"
                    disabled={postingComment || !commentText.trim()}
                    className="shrink-0 p-2.5 rounded-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white cursor-pointer transition active:scale-95"
                    title="Send comment"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 4: EDIT BIO MODAL */}
        {/* ========================================================================= */}
        {showEditBioModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
            <div className="bg-surface border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-left">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text">Edit Nordic Profile</h3>
                  <p className="text-[11px] font-mono text-muted">Customize your bio & editorial spread</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditBioModal(false)}
                  className="text-muted hover:text-text p-1 rounded-lg hover:bg-bg cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (savingProfile) return;
                  setSavingProfile(true);
                  try {
                    const cleanBio = bioInput.trim();
                    const cleanName = nameInput.trim();
                    if (!isOwnProfile || !studentUid || !cleanName || !updateUserName) throw new Error('Enter your full student name.');
                    await updateUserName(cleanName, { bio: cleanBio });
                    setSavedBio(cleanBio);
                    setShowEditBioModal(false);
                  } catch (error) {
                    showCampusAlert({ title: 'Profile not saved', message: error.message || 'Please retry. Your draft is still here.', type: 'error' });
                  } finally { setSavingProfile(false); }
                }}
                className="space-y-4 text-xs"
              >
                {isOwnProfile && (
                  <div>
                    <label className="block text-text font-semibold mb-1">
                      Full Student Name
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Enter your student name..."
                      required
                      maxLength={120}
                      className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-text placeholder:text-muted focus:outline-none focus:border-indigo-500 transition-colors font-sans"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-text font-semibold mb-1">
                    Campus Bio / Tagline
                  </label>
                  <textarea
                    rows={4}
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    placeholder="Tell campus about your discipline, research, and focus..."
                    maxLength={1000}
                    className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-text placeholder:text-muted focus:outline-none focus:border-indigo-500 transition-colors font-sans"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowEditBioModal(false)}
                    className="px-4 py-2 border border-border bg-bg hover:bg-surface text-muted hover:text-text rounded-xl text-xs font-medium cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition active:scale-95 shadow-md shadow-indigo-600/20"
                  >
                    {savingProfile ? 'Saving…' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
