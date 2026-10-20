import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cloudStorageService } from '../../services/cloudStorageService';
import { 
  Camera, 
  UploadCloud, 
  RotateCcw, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon, 
  Sparkles, 
  Loader2,
  AlertCircle,
  Cloud,
  CheckCircle2,
  Trash2,
  ImageOff,
  AlertTriangle
} from 'lucide-react';
import BootstrapSpinner from '../ui/BootstrapSpinner';
import DefaultAvatar from '../common/DefaultAvatar';

export default function ProfilePhotoManager({ onPhotoChange }) {
  const { user, updateUserPhoto, revertUserPhoto, deleteUserPhoto } = useAuth();
  const fileInputRef = useRef(null);

  const [photos, setPhotos] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [applying, setApplying] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [brokenUrls, setBrokenUrls] = useState(new Set());
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const userId = user?.uid || '';
  const currentPhotoURL = user?.photoURL || '';
  const initialPhotoURL = user?.initialPhotoURL || '';

  // Touch swipe support state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Load photos from secure cloud storage and user history
  useEffect(() => {
    let isMounted = true;

    async function loadGallery() {
      if (!userId) return;
      try {
        let cloudList = [];
        try { cloudList = await cloudStorageService.listUserProfilePhotos(userId); if (isMounted) setErrorMessage(null); }
        catch { if (isMounted) setErrorMessage('Storage listing is unavailable. Showing your saved profile references.'); }
        
        // Merge with any photos tracked in user.uploadedPhotos
        const allPhotosMap = new Map();
        
        // 1. Add cloud listed photos
        cloudList.forEach(p => allPhotosMap.set(p.url, p));

        // 2. Add user.uploadedPhotos from Firestore
        if (Array.isArray(user?.uploadedPhotos)) {
          user.uploadedPhotos.forEach(p => {
            const url = typeof p === 'string' ? p : p.url;
            if (url && !allPhotosMap.has(url)) {
              allPhotosMap.set(url, {
                url,
                key: p.key || null,
                fileName: p.fileName || 'Uploaded Photo',
                uploadedAt: p.uploadedAt || new Date().toISOString()
              });
            }
          });
        }

        // 3. If user has current photoURL and not yet in map, include it
        if (currentPhotoURL && !allPhotosMap.has(currentPhotoURL)) {
          allPhotosMap.set(currentPhotoURL, {
            url: currentPhotoURL,
            fileName: 'Current Profile Photo',
            uploadedAt: new Date().toISOString()
          });
        }

        // 4. If initial photo exists and not in map, include it
        if (initialPhotoURL && !allPhotosMap.has(initialPhotoURL)) {
          allPhotosMap.set(initialPhotoURL, {
            url: initialPhotoURL,
            fileName: 'Initial Profile Photo',
            isInitial: true,
            uploadedAt: new Date().toISOString()
          });
        }

        const gallery = Array.from(allPhotosMap.values());
        if (isMounted) {
          setPhotos(gallery);

          // Sync active carousel index to currently applied photo
          const activeIdx = gallery.findIndex(p => p.url === currentPhotoURL);
          if (activeIdx >= 0) {
            setActiveIndex(activeIdx);
          }
        }
      } catch (err) {
        console.warn('[ProfilePhotoManager] Error loading photo gallery:', err);
      }
    }

    loadGallery();
    return () => {
      isMounted = false;
    };
  }, [userId, currentPhotoURL, initialPhotoURL, user?.uploadedPhotos]);

  /**
   * Automatically applies the photo at the given index as the active profile photo
   */
  const applyPhotoAtIndex = async (index, photoList = photos) => {
    if (applying || !photoList || photoList.length === 0) return;
    const boundedIndex = (index + photoList.length) % photoList.length;
    setActiveIndex(boundedIndex);

    const selectedPhoto = photoList[boundedIndex];
    if (selectedPhoto && selectedPhoto.url !== currentPhotoURL) {
      setApplying(true);
      try {
        await updateUserPhoto(selectedPhoto.url, selectedPhoto);
        if (onPhotoChange) onPhotoChange(selectedPhoto.url);
        setStatusMessage('Photo automatically applied as active profile picture');
        setTimeout(() => setStatusMessage(null), 3000);
      } catch (err) {
        setActiveIndex(activeIndex);
        setErrorMessage('This photo could not be applied. Your current profile photo is unchanged.');
      } finally { setApplying(false); }
    }
  };

  /**
   * Carousel Navigation: Previous
   */
  const handlePrev = () => {
    if (photos.length <= 1) return;
    const newIdx = (activeIndex - 1 + photos.length) % photos.length;
    applyPhotoAtIndex(newIdx);
  };

  /**
   * Carousel Navigation: Next
   */
  const handleNext = () => {
    if (photos.length <= 1) return;
    const newIdx = (activeIndex + 1) % photos.length;
    applyPhotoAtIndex(newIdx);
  };

  /**
   * Touch Handlers for Mobile Swipe
   */
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;
    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        // Swiped left -> Next photo
        handleNext();
      } else {
        // Swiped right -> Previous photo
        handlePrev();
      }
    }
  };

  /**
   * Upload Handler: Uploads to user's isolated cloud vault partition: users/{userId}/
   * and automatically sets the uploaded file as the active profile photo.
   */
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    setUploading(true);
    setErrorMessage(null);
    setStatusMessage('Uploading your photo…');

    try {
      // Upload to user-specific directory in cloud storage
      const uploadedMeta = await cloudStorageService.uploadUserProfilePhoto(userId, file);

      // Add to gallery
      const updatedGallery = [uploadedMeta, ...photos.filter(p => p.url !== uploadedMeta.url)];
      setPhotos(updatedGallery);
      setActiveIndex(0);

      // Automatically apply the latest uploaded file
      await updateUserPhoto(uploadedMeta.url, uploadedMeta);
      if (onPhotoChange) onPhotoChange(uploadedMeta.url);

      setStatusMessage('Your uploaded photo is saved to your profile.');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('[ProfilePhotoManager] Upload notice:', err);
      setErrorMessage(err.message || 'Failed to upload photo to cloud storage.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /**
   * Revert to the first ever picture when the user signed in for the first time
   */
  const handleRevertToInitial = async () => {
    if (!initialPhotoURL) {
      setErrorMessage('No initial photo found to revert to.');
      return;
    }

    setReverting(true);
    setErrorMessage(null);
    try {
      const reverted = await revertUserPhoto();
      if (reverted) {
        if (onPhotoChange) onPhotoChange(reverted);
        // Find index in photos
        const initialIdx = photos.findIndex(p => p.url === reverted);
        if (initialIdx >= 0) {
          setActiveIndex(initialIdx);
        }
        setStatusMessage('Reverted successfully to your original initial sign-in photo!');
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err) {
      console.error('[ProfilePhotoManager] Revert error:', err);
      setErrorMessage('Failed to revert to initial photo.');
    } finally {
      setReverting(false);
    }
  };

  /**
   * Tracks broken / unavailable image URLs so they can be surfaced with explicit delete action
   */
  const handleImageError = (url) => {
    setBrokenUrls(prev => {
      if (prev.has(url)) return prev;
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  };

  /**
   * Permanently deletes a photo from Cloud storage, Firestore record, and local cache
   */
  const executeDeletePhoto = async (targetPhoto) => {
    if (!targetPhoto) return;
    setDeleting(true);
    setErrorMessage(null);

    try {
      // Delete via AuthContext
      const nextActiveUrl = await deleteUserPhoto(targetPhoto.url, targetPhoto.key);

      // Remove from state list
      const updatedList = photos.filter(p => p.url !== targetPhoto.url && (targetPhoto.key ? p.key !== targetPhoto.key : true));
      setPhotos(updatedList);

      // Clean broken tracker
      setBrokenUrls(prev => {
        const next = new Set(prev);
        next.delete(targetPhoto.url);
        return next;
      });

      // Adjust carousel active index
      if (updatedList.length > 0) {
        const nextIdx = Math.min(activeIndex, updatedList.length - 1);
        setActiveIndex(nextIdx);
        if (targetPhoto.url === currentPhotoURL) {
          const appliedUrl = nextActiveUrl || updatedList[nextIdx].url;
          if (onPhotoChange) onPhotoChange(appliedUrl);
        }
      } else {
        setActiveIndex(0);
        if (onPhotoChange) onPhotoChange('');
      }

      setStatusMessage('Photo permanently deleted from cloud list.');
      setTimeout(() => setStatusMessage(null), 3500);
      setPhotoToDelete(null);
    } catch (err) {
      console.error('[ProfilePhotoManager] Deletion error:', err);
      setErrorMessage(err.message || 'Failed to delete photo from cloud storage.');
    } finally {
      setDeleting(false);
    }
  };

  const activePhoto = photos[activeIndex] || { url: currentPhotoURL, fileName: 'Current Photo' };
  const isOriginalActive = currentPhotoURL === initialPhotoURL && Boolean(initialPhotoURL);

  return (
    <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
      
      {/* Header with Cloud Vault Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-text flex items-center gap-2">
            <Camera className="w-5 h-5 text-text" />
            <span>Profile Photo & Cloud Gallery</span>
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Choose and manage the photos saved to your profile.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 rounded-full text-[11px] font-medium self-start sm:self-auto">
          <Cloud className="w-3.5 h-3.5" />
          <span>Photo library</span>
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-500/30 text-red-700 dark:text-red-400 rounded-lg text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Upload & Current Avatar + Bootstrap Carousel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Left Column: Upload New Photo & Quick Actions */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {/* Precision Avatar Frame */}
            <div className="relative group w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-border shadow-md bg-bg shrink-0 flex items-center justify-center">
              <DefaultAvatar
                src={currentPhotoURL}
                user={user}
                alt="Active Profile"
                className="w-full h-full rounded-2xl"
              />

              {/* Upload Overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 cursor-pointer"
                title="Click to Upload New Photo"
              >
                <UploadCloud className="w-6 h-6 mb-1 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
              </button>
            </div>

            <div className="space-y-1.5 min-w-0">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold uppercase tracking-wider">
                <Check className="w-3 h-3" /> Live Active Photo
              </span>
              <h3 className="font-bold text-sm text-text truncate">{user?.displayName || 'User'}</h3>
              <p className="text-xs text-muted leading-relaxed">
                PNG, JPG or WEBP. Your photo is applied after its save completes.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept="image/*" 
              className="hidden" 
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-text text-bg hover:opacity-90 rounded-lg text-xs font-semibold transition disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {uploading ? (
                <>
                  <BootstrapSpinner type="border" size="sm" />
                  <span>Uploading to Cloud...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload New Photo</span>
                </>
              )}
            </button>

            {/* Revert to Initial Photo Button */}
            {initialPhotoURL && (
              <button
                type="button"
                onClick={handleRevertToInitial}
                disabled={reverting || isOriginalActive}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                  isOriginalActive 
                    ? 'border-border bg-bg text-muted cursor-default opacity-60' 
                    : 'border-border bg-surface hover:bg-bg text-text dark:border-white/20'
                }`}
                title={isOriginalActive ? "Original photo is already active" : "Revert to original photo when first signed in"}
              >
                {reverting ? (
                  <>
                    <BootstrapSpinner type="border" size="sm" />
                    <span>Reverting...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                    <span>Revert to First Photo</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="text-[11px] text-muted space-y-1 pt-1">
            <p>• <strong>Automatic Sync:</strong> Swiping or clicking Next/Previous in the carousel automatically sets that photo as active.</p>
            <p>• <strong>Revert Safe:</strong> Your original sign-in picture is permanently preserved and can be restored at any time.</p>
          </div>
        </div>

        {/* Right Column: Bootstrap Carousel of Uploaded Photos with Inclusive Pagination */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Cloud Gallery ({photos.length})</span>
            </label>
            
            {/* Pagination page counter & step buttons */}
            {photos.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-muted bg-bg border border-border px-2 py-0.5 rounded-md">
                  {activeIndex + 1} / {photos.length}
                </span>
                {photos.length > 1 && (
                  <div className="inline-flex rounded-md border border-border bg-bg overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="p-1 hover:bg-surface text-muted hover:text-text transition cursor-pointer"
                      title="Previous Page"
                      aria-label="Previous Page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px bg-border" />
                    <button
                      type="button"
                      onClick={handleNext}
                      className="p-1 hover:bg-surface text-muted hover:text-text transition cursor-pointer"
                      title="Next Page"
                      aria-label="Next Page"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {photos.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-8 text-center bg-bg/50 space-y-2">
              <ImageIcon className="w-8 h-8 text-muted mx-auto" />
              <p className="text-xs font-medium text-text">No uploaded photos yet</p>
              <p className="text-[11px] text-muted">Upload an image to start your personal cloud gallery.</p>
            </div>
          ) : (
            /* Bootstrap Carousel Implementation with Precision Image Alignment */
            <div 
              className="carousel slide relative bg-bg border border-border rounded-2xl overflow-hidden shadow-inner select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Carousel Inner / Slides Container */}
              <div className="carousel-inner relative w-full aspect-square max-h-[280px] overflow-hidden flex items-center justify-center bg-neutral-900/10 dark:bg-black/40">
                {photos.map((photo, idx) => {
                  const isActive = idx === activeIndex;
                  const isBroken = brokenUrls.has(photo.url);

                  return (
                    <div 
                      key={photo.url || idx}
                      className={`carousel-item absolute inset-0 w-full h-full transition-opacity duration-300 flex items-center justify-center ${
                        isActive ? 'active opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
                      }`}
                    >
                      {isBroken ? (
                        <div className="w-full h-full bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-white">
                          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-2.5 border border-rose-500/30">
                            <ImageOff className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-bold text-rose-300">Unavailable / Broken Image</span>
                          <span className="text-[10px] text-zinc-400 mt-1 max-w-[220px] truncate font-mono">
                            {photo.fileName || photo.url}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPhotoToDelete(photo)}
                            className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Unavailable Image</span>
                          </button>
                        </div>
                      ) : (
                        <img 
                          src={photo.url} 
                          alt={photo.fileName || `Photo ${idx + 1}`}
                          className="w-full h-full object-cover object-center"
                          loading="lazy"
                          onError={() => handleImageError(photo.url)}
                        />
                      )}

                      {/* Top Badges and Delete Button */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto z-20">
                        {/* Delete Button on Picture Card */}
                        <button
                          type="button"
                          onClick={() => setPhotoToDelete(photo)}
                          className="bg-black/75 hover:bg-rose-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:border-rose-500/50 flex items-center gap-1 shadow-md transition-all cursor-pointer backdrop-blur-sm group"
                          title="Delete image from list"
                          aria-label="Delete image"
                        >
                          <Trash2 className="w-3 h-3 text-rose-400 group-hover:text-white transition-colors" />
                          <span>Delete</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {photo.url === currentPhotoURL && (
                            <div className="bg-black/75 backdrop-blur-md text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1 shadow-md">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Active</span>
                            </div>
                          )}

                          {photo.isInitial && (
                            <div className="bg-black/75 backdrop-blur-md text-amber-300 px-2.5 py-1 rounded-full text-[10px] font-bold border border-amber-500/40 flex items-center gap-1 shadow-md">
                              <RotateCcw className="w-3 h-3" />
                              <span>Initial</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Caption Pill */}
                      <div className="absolute bottom-10 left-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-center text-[11px] truncate border border-white/10">
                        <span className="font-semibold">{photo.fileName || `Photo #${idx + 1}`}</span>
                        {photo.uploadedAt && (
                          <span className="text-[10px] text-white/70 ml-2">
                            ({new Date(photo.uploadedAt).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Inline Safe Delete Confirmation Overlay */}
                {photoToDelete && (
                  <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4 text-center text-white animate-in fade-in duration-200">
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-2.5 border border-rose-500/30">
                      <Trash2 className="w-5 h-5 text-rose-400" />
                    </div>
                    <h4 className="text-xs font-bold">Delete this photo from cloud?</h4>
                    <p className="text-[11px] text-zinc-300 mt-1 max-w-[220px]">
                      {photoToDelete.fileName || 'Selected photo'} will be permanently removed from your gallery.
                    </p>
                    <div className="flex items-center gap-2 mt-3.5">
                      <button
                        type="button"
                        onClick={() => setPhotoToDelete(null)}
                        disabled={deleting}
                        className="px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-medium transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => executeDeletePhoto(photoToDelete)}
                        disabled={deleting}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Confirm Delete</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bootstrap Carousel Controls: Previous */}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="carousel-control-prev absolute top-0 bottom-0 left-0 w-12 flex items-center justify-center text-white/80 hover:text-white bg-gradient-to-r from-black/40 to-transparent hover:from-black/60 transition-all z-20 focus:outline-none"
                    aria-label="Previous Slide"
                  >
                    <div className="p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/70 transition">
                      <ChevronLeft className="w-5 h-5" />
                    </div>
                  </button>

                  {/* Bootstrap Carousel Controls: Next */}
                  <button
                    type="button"
                    onClick={handleNext}
                    className="carousel-control-next absolute top-0 bottom-0 right-0 w-12 flex items-center justify-center text-white/80 hover:text-white bg-gradient-to-l from-black/40 to-transparent hover:from-black/60 transition-all z-20 focus:outline-none"
                    aria-label="Next Slide"
                  >
                    <div className="p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/70 transition">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </button>

                  {/* Bootstrap Carousel Indicators */}
                  <div className="carousel-indicators absolute bottom-3 left-0 right-0 flex justify-center items-center gap-1.5 z-20">
                    {photos.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        type="button"
                        onClick={() => applyPhotoAtIndex(dotIdx)}
                        className={`h-1.5 rounded-full transition-all ${
                          dotIdx === activeIndex 
                            ? 'w-6 bg-white shadow-sm' 
                            : 'w-1.5 bg-white/40 hover:bg-white/70'
                        }`}
                        aria-label={`Go to slide ${dotIdx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Inclusive Thumbnail Pagination Strip */}
          {photos.length > 1 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-muted px-1">
                <span className="font-semibold text-text">Slide Pagination</span>
                <span className="font-mono text-[10px]">Click thumbnail to jump</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 custom-scrollbar">
                {photos.map((photo, pIdx) => {
                  const isSel = pIdx === activeIndex;
                  const isItemBroken = brokenUrls.has(photo.url);

                  return (
                    <button
                      key={photo.url || pIdx}
                      type="button"
                      onClick={() => applyPhotoAtIndex(pIdx)}
                      className={`relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                        isSel
                          ? 'border-emerald-500 ring-2 ring-emerald-500/50 scale-105 shadow-md'
                          : 'border-border hover:border-text/40 opacity-70 hover:opacity-100'
                      }`}
                      title={`Page ${pIdx + 1}: ${photo.fileName || 'Photo'}`}
                    >
                      {isItemBroken ? (
                        <div className="w-full h-full bg-rose-950/80 flex items-center justify-center text-rose-400">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      ) : (
                        <img
                          src={photo.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Page number badge */}
                      <div className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] font-mono text-white text-center leading-tight py-0.5">
                        {pIdx + 1}
                      </div>

                      {/* Active profile marker */}
                      {photo.url === currentPhotoURL && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-black shadow-sm" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-muted px-1">
            <span>Photo {photos.length > 0 ? activeIndex + 1 : 0} of {photos.length}</span>
            <span className="font-mono text-[10px]">Auto-applied on swipe / select</span>
          </div>
        </div>

      </div>

    </div>
  );
}
