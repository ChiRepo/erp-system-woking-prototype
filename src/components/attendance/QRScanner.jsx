import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  MapPin, AlertTriangle, CheckCircle2, RotateCcw, 
  KeyRound, X, ZoomIn, ZoomOut, Zap, ZapOff, 
  Sliders, Navigation, SwitchCamera, Sparkles
} from 'lucide-react';
import { parseClassroomToken } from '../../utils/classroomToken';
import { locationService } from '../../services/locationService';

export default function QRScanner({ onScanSuccess, onClose, isFullscreen = true, initialMode = 'camera', initialToken = '' }) {
  const manualOnly = initialMode === 'manual' || Boolean(initialToken);
  const [status, setStatus] = useState(manualOnly ? 'scanning' : 'initializing'); // initializing, scanning, processing, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [locationStr, setLocationStr] = useState('Checking campus GPS...');
  const [manualToken, setManualToken] = useState(initialToken);
  const [showManualInput, setShowManualInput] = useState(manualOnly);
  const [zoom, setZoom] = useState(1.0);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorchCapability, setHasTorchCapability] = useState(false);
  const [hasHardwareZoom, setHasHardwareZoom] = useState(false);
  const [hardwareZoomRange, setHardwareZoomRange] = useState({ min: 1.0, max: 8.0, step: 0.1 });
  const [isPinching, setIsPinching] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // environment or user
  const [hudNotice, setHudNotice] = useState('');

  const pendingScanRef = useRef(false);
  const generationRef = useRef(0);
  const scannerRef = useRef(null);
  const videoTrackRef = useRef(null);
  const touchStartDistRef = useRef(null);
  const touchStartZoomRef = useRef(1.0);
  const lastTapRef = useRef(0);
  const trackCheckIntervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const startingPromiseRef = useRef(null);

  // GPS Proximity check
  useEffect(() => {
    isMountedRef.current = true;
    ++generationRef.current;
    const coords = locationService.getCurrentLocation();
    const dist = locationService.getDistanceFromCampus(coords);
    if (dist <= 100) {
      setLocationStr(`Location estimate: ${dist}m from campus`);
    } else {
      setLocationStr(`Outside Campus (${dist}m away)`);
    }

    if (!manualOnly) startScanner();

    // Escape key listener to close fullscreen
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isMountedRef.current = false;
      ++generationRef.current;
      stopScanner();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [facingMode,manualOnly]);

  // Periodic inspector to detect active video track and hardware capabilities
  const startTrackInspector = () => {
    if (trackCheckIntervalRef.current) {
      clearInterval(trackCheckIntervalRef.current);
    }

    let attempts = 0;
    trackCheckIntervalRef.current = setInterval(() => {
      attempts++;

      // Check 1: Query capabilities directly via Html5Qrcode API
      if (scannerRef.current) {
        try {
          const capabilities = scannerRef.current.getRunningTrackCapabilities();
          if (capabilities) {
            if (capabilities.torch) {
              setHasTorchCapability(true);
            }
            if (capabilities.zoom) {
              setHasHardwareZoom(true);
              setHardwareZoomRange({
                min: capabilities.zoom.min || 1.0,
                max: capabilities.zoom.max || 8.0,
                step: capabilities.zoom.step || 0.1
              });
            }
          }
        } catch {}
      }

      // Check 2: Inspect active video track from the rendered video element
      const videoEl = document.querySelector('#qr-reader video');
      if (videoEl && videoEl.srcObject) {
        const tracks = videoEl.srcObject.getVideoTracks();
        if (tracks.length > 0) {
          const track = tracks[0];
          videoTrackRef.current = track;
          
          if (track.getCapabilities) {
            const capabilities = track.getCapabilities();
            if (capabilities.torch) {
              setHasTorchCapability(true);
            }
            if (capabilities.zoom) {
              setHasHardwareZoom(true);
              setHardwareZoomRange({
                min: capabilities.zoom.min || 1.0,
                max: capabilities.zoom.max || 8.0,
                step: capabilities.zoom.step || 0.1
              });
            }
          }
          clearInterval(trackCheckIntervalRef.current);
          trackCheckIntervalRef.current = null;
        }
      }

      if (attempts > 30) { // Stop polling after ~9 seconds
        clearInterval(trackCheckIntervalRef.current);
        trackCheckIntervalRef.current = null;
      }
    }, 300);
  };

  // Dual-Layer Camera Zoom Engine (Hardware Sensor + Visual Magnification)
  useEffect(() => {
    // 1. Hardware Zoom Constraint (if supported by device sensor)
    if (videoTrackRef.current && hasHardwareZoom) {
      try {
        const minZ = hardwareZoomRange.min || 1.0;
        const maxZ = hardwareZoomRange.max || 8.0;
        const clampedHw = Math.max(minZ, Math.min(maxZ, zoom));
        videoTrackRef.current.applyConstraints({
          advanced: [{ zoom: clampedHw }]
        }).catch(() => {});
      } catch (err) {
        console.warn('Hardware zoom constraint notice:', err);
      }
    }

    // 2. CSS Magnification Viewport Transform (Guaranteed 60fps on ALL devices)
    const videoEls = document.querySelectorAll('#qr-reader video, #qr-reader__scan_region video');
    videoEls.forEach(v => {
      v.style.transform = `scale(${zoom})`;
      v.style.transformOrigin = 'center center';
      v.style.transition = isPinching ? 'none' : 'transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)';
    });
  }, [zoom, hasHardwareZoom, hardwareZoomRange, isPinching]);

  const stopScanner = async () => {
    if (trackCheckIntervalRef.current) {
      clearInterval(trackCheckIntervalRef.current);
      trackCheckIntervalRef.current = null;
    }

    // Wait for in-flight camera start task if running
    if (startingPromiseRef.current) {
      try {
        await startingPromiseRef.current;
      } catch {}
    }

    if (scannerRef.current) {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch (err) {
        console.warn('Scanner stop notice:', err);
      }
      try {
        scanner.clear();
      } catch (err) {
        console.warn('Scanner clear notice:', err);
      }
    }

    const container = document.getElementById('qr-reader');
    if (container) {
      container.innerHTML = '';
    }

    videoTrackRef.current = null;
    setIsTorchOn(false);
  };

  const startScanner = async () => {
    await stopScanner();

    if (!isMountedRef.current) return;

    setStatus('initializing');
    setErrorMsg('');

    // Brief delay to ensure portal DOM container #qr-reader is mounted and has layout
    await new Promise((resolve) => setTimeout(resolve, 80));
    if (!isMountedRef.current) return;

    const container = document.getElementById('qr-reader');
    if (!container) {
      console.warn('Target #qr-reader container not found in DOM');
      return;
    }

    const startTask = (async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader', /* verbose */ false);
        scannerRef.current = scanner;

        const qrConfig = {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const boxSize = Math.max(200, Math.floor(minEdge * 0.72));
            return { width: boxSize, height: boxSize };
          },
          disableFlip: false,
        };

        const onScan = (decodedText) => {
          handleDecodedText(decodedText);
        };

        let started = false;

        // Attempt 1: Try requested facingMode ('environment' or 'user')
        try {
          await scanner.start(
            { facingMode: facingMode },
            qrConfig,
            onScan,
            () => {}
          );
          started = true;
        } catch (firstErr) {
          console.warn(`Initial camera start ({ facingMode: '${facingMode}' }) failed:`, firstErr);

          if (!isMountedRef.current) {
            try { if (scanner.isScanning) await scanner.stop(); scanner.clear(); } catch {}
            return;
          }

          // Attempt 2: Query available hardware cameras and pick the closest match
          try {
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
              const preferred = devices.find((d) =>
                facingMode === 'environment'
                  ? /back|rear|environment|world/i.test(d.label)
                  : /front|user|facetime|selfie/i.test(d.label)
              ) || devices[0];

              await scanner.start(preferred.id, qrConfig, onScan, () => {});
              started = true;
            } else {
              // Attempt 3: Try alternate facing mode
              const altFacing = facingMode === 'environment' ? 'user' : 'environment';
              await scanner.start({ facingMode: altFacing }, qrConfig, onScan, () => {});
              started = true;
            }
          } catch (fallbackErr) {
            console.error('All camera attempts failed:', fallbackErr);
            throw fallbackErr;
          }
        }

        if (!isMountedRef.current) {
          try { if (scanner.isScanning) await scanner.stop(); scanner.clear(); } catch {}
          return;
        }

        if (started) {
          setStatus('scanning');
          startTrackInspector();
        }
      } catch (err) {
        console.error('Camera initialization failed:', err);
        if (!isMountedRef.current) return;

        setStatus('error');
        const errStr = (err && (err.name || err.message || String(err))) || '';
        if (/NotAllowedError|PermissionDenied|permission/i.test(errStr)) {
          setErrorMsg('Camera access was blocked. Please click the lock or camera icon in your browser address bar to allow camera access, then click "Retry Scan".');
        } else if (/NotFoundError|DevicesNotFound/i.test(errStr)) {
          setErrorMsg('No camera hardware was found on this device. Please connect a camera or enter the classroom broadcast token manually.');
        } else if (/NotReadableError|TrackStartError/i.test(errStr)) {
          setErrorMsg('Camera is currently in use by another application or video tab. Please close other camera apps and retry.');
        } else {
          setErrorMsg(`Unable to open camera (${err.message || 'Check camera permissions'}). You can enter the classroom code manually.`);
        }
      } finally {
        startingPromiseRef.current = null;
      }
    })();

    startingPromiseRef.current = startTask;
  };

  const handleToggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    setHudNotice(nextMode === 'environment' ? 'Rear Camera' : 'Front Camera');
    setTimeout(() => setHudNotice(''), 1200);
  };

  const toggleTorch = async () => {
    const nextTorch = !isTorchOn;
    let success = false;

    if (scannerRef.current) {
      try {
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: nextTorch }],
        });
        success = true;
      } catch (e) {
        console.warn('Scanner torch constraint notice:', e);
      }
    }

    if (!success && videoTrackRef.current) {
      try {
        await videoTrackRef.current.applyConstraints({
          advanced: [{ torch: nextTorch }],
        });
        success = true;
      } catch (e) {
        console.warn('Video track torch constraint notice:', e);
      }
    }

    if (success) {
      setIsTorchOn(nextTorch);
    }
  };

  const handleDecodedText = async (decodedText) => {
    if(pendingScanRef.current)return;
    pendingScanRef.current=true;
    const generation=generationRef.current;
    setStatus('processing');setErrorMsg('');
    await stopScanner();
    try {
      const payload=parseClassroomToken(decodedText);
      if(typeof onScanSuccess!=='function')throw new Error('Attendance saving is unavailable. Please contact your faculty.');
      const saved=await onScanSuccess(payload.courseId,decodedText);
      if(!saved?.attendanceId)throw new Error('The database did not confirm attendance. Please retry.');
      if(isMountedRef.current&&generation===generationRef.current)setStatus('success');
    } catch(error) {
      if(isMountedRef.current&&generation===generationRef.current) {
        setStatus('error');setErrorMsg(error?.code==='permission-denied'?'This session changed, expired or was already recorded. Ask your faculty for the current code.':error?.message || 'Attendance could not be saved. Please retry.');
      }
    } finally { pendingScanRef.current=false; }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    handleDecodedText(manualToken.trim());
  };

  // Multi-Touch Pinch-to-Zoom Gesture Handlers with preventDefault
  const getTouchDistance = (touches) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      setIsPinching(true);
      touchStartDistRef.current = getTouchDistance(e.touches);
      touchStartZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDistRef.current) {
      e.preventDefault();
      const currentDist = getTouchDistance(e.touches);
      if (currentDist) {
        const factor = currentDist / touchStartDistRef.current;
        const newZoom = Math.min(8.0, Math.max(1.0, parseFloat((touchStartZoomRef.current * factor).toFixed(1))));
        setZoom(newZoom);
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      touchStartDistRef.current = null;
      setIsPinching(false);
    }
  };

  // Double-tap on viewfinder to toggle zoom (1x <-> 2.5x)
  const handleViewfinderTap = (e) => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      e.preventDefault();
      setZoom((cur) => {
        const next = cur <= 1.2 ? 2.5 : 1.0;
        setHudNotice(next > 1.0 ? '2.5x Zoom' : '1.0x Reset');
        setTimeout(() => setHudNotice(''), 1200);
        return next;
      });
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const setPresetZoom = (level) => {
    setZoom(level);
    setHudNotice(`${level.toFixed(1)}x Zoom`);
    setTimeout(() => setHudNotice(''), 1000);
  };

  const content = (
    <div 
      aria-label="Attendance scanner"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full h-full flex flex-col justify-between select-none ${
        isFullscreen 
          ? 'p-3 sm:p-5 pt-[max(env(safe-area-inset-top),14px)] pb-[max(env(safe-area-inset-bottom),14px)]' 
          : 'bg-surface p-4 sm:p-6 rounded-2xl border border-border shadow-lg space-y-4'
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3 z-30 shrink-0 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse block" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
              Classroom QR Scanner
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {hasHardwareZoom ? 'Sensor Zoom' : 'HD Zoom'}
              </span>
            </h3>
            <p className="text-[11px] text-white/70 hidden sm:block">
              Pinch gesture, double-tap, or slider below to zoom from distant back rows.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Flashlight Button */}
          {hasTorchCapability && (
            <button
              onClick={toggleTorch}
              className={`p-2.5 rounded-full border transition-all touch-manipulation min-w-[42px] min-h-[42px] flex items-center justify-center ${
                isTorchOn 
                  ? 'bg-amber-400 text-black border-amber-300 shadow-lg shadow-amber-400/40' 
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
              title="Toggle Flashlight"
            >
              {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}

          {/* Switch Camera Button (Rear <-> Front) */}
          <button
            type="button"
            onClick={handleToggleCamera}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 transition-all touch-manipulation min-w-[42px] min-h-[42px] flex items-center justify-center"
            title={`Switch to ${facingMode === 'environment' ? 'Front' : 'Rear'} Camera`}
            aria-label="Switch Camera"
          >
            <SwitchCamera className="w-4 h-4" />
          </button>

          {/* Close Fullscreen Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white border border-white/20 transition-all touch-manipulation min-w-[42px] min-h-[42px] flex items-center justify-center"
              aria-label="Close Fullscreen Scanner"
              title="Close Scanner (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Center Viewport / Camera Box with Reticle, Laser & Tap-to-Zoom */}
      <div 
        onClick={handleViewfinderTap}
        className="relative flex-1 flex items-center justify-center overflow-hidden rounded-2xl bg-black border border-white/15 shadow-2xl touch-action-none cursor-pointer"
        title="Double-tap to toggle zoom (1x / 2.5x)"
      >
        {/* html5-qrcode Camera Feed Container */}
        <div id="qr-reader" className="w-full h-full flex items-center justify-center overflow-hidden"></div>

        {/* Initializing / Camera Starting Overlay */}
        {status === 'initializing' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 space-y-3 z-20 pointer-events-none">
            <div className="w-9 h-9 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <h4 className="text-sm font-bold text-white">Opening Camera...</h4>
            <p className="text-xs text-white/70 max-w-xs">
              Connecting to hardware video stream. Please allow browser camera access if prompted.
            </p>
          </div>
        )}

        {/* Viewfinder Reticle Overlay & Scanning Laser Line */}
        {(status === 'scanning' || status === 'initializing') && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 max-w-[82vw] max-h-[82vw] rounded-2xl border border-white/20">
              
              {/* 4 Corner Reticles */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

              {/* Animated Laser Scanning Line */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-laser-scan" />

              {/* Live Zoom HUD Badge */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/25 text-white font-mono text-xs font-bold shadow-xl flex items-center gap-1.5 transition-transform">
                <span className="text-emerald-400 font-extrabold">{zoom.toFixed(1)}x</span>
                <span className="text-[10px] text-white/80">ZOOM</span>
              </div>
            </div>
          </div>
        )}

        {/* Temporary HUD Notice Toast */}
        {hudNotice && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-emerald-400/40 text-emerald-300 font-mono text-xs font-bold shadow-2xl animate-in fade-in zoom-in-95 pointer-events-none z-30">
            {hudNotice}
          </div>
        )}

        {/* Status Overlays */}
        {status === 'processing' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 space-y-3 z-30">
            <div className="w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <h4 className="text-base font-bold text-white">Saving attendance</h4>
            <p className="text-xs text-white/70 max-w-xs">
              Checking the current classroom session and saving your attendance…
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 space-y-3 z-30">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-10 h-10 stroke-[2]" />
            </div>
            <h4 className="text-xl font-extrabold text-white">Attendance saved</h4>
            <p className="text-xs text-white/70">Your classroom check-in was confirmed by the database.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 space-y-3 z-30">
            <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-400 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-white">Scanning Issue</h4>
            <p className="text-xs text-red-300 max-w-xs">{errorMsg}</p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={manualOnly ? () => {setStatus('scanning');setShowManualInput(true);} : startScanner}
                className="px-4 py-2 bg-white text-black font-bold text-xs rounded-xl hover:opacity-90 flex items-center gap-1.5 touch-manipulation"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retry Scan
              </button>
              <button
                onClick={() => setShowManualInput(true)}
                className="px-3.5 py-2 bg-white/10 text-white font-bold text-xs rounded-xl border border-white/20 hover:bg-white/20 flex items-center gap-1.5 touch-manipulation"
              >
                <KeyRound className="w-3.5 h-3.5" /> Enter Code
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Controls: Slider, Gesture Guide, Presets & GPS */}
      <div className="mt-3 z-30 space-y-2.5 shrink-0">
        
        {/* Zoom Controls Container with Glassmorphism */}
        <div className="p-3 sm:p-4 rounded-2xl bg-black/75 backdrop-blur-2xl border border-white/20 space-y-3 shadow-2xl">
          
          {/* Zoom Header and Preset Pills */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-white/90 font-semibold">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Camera Zoom:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{zoom.toFixed(1)}x</span>
            </div>

            {/* Quick Preset Buttons (1x, 2x, 3x, 5x, 8x) */}
            <div className="flex items-center gap-1.5">
              {[
                { val: 1.0, label: '1x' },
                { val: 2.0, label: '2x' },
                { val: 3.0, label: '3x' },
                { val: 5.0, label: '5x' },
                { val: 8.0, label: '8x' }
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPresetZoom(val)}
                  className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold transition-all touch-manipulation ${
                    Math.abs(zoom - val) < 0.2
                      ? 'bg-emerald-400 text-black shadow-lg shadow-emerald-400/40 scale-105' 
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Smooth Zoom Range Slider with +/- Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom(z => Math.max(1.0, parseFloat((z - 0.5).toFixed(1))))}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center border border-white/15"
              title="Zoom Out (-0.5x)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <input
              type="range"
              min="1.0"
              max="8.0"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-2.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400 touch-manipulation"
              aria-label="Camera Zoom Slider"
            />

            <button
              type="button"
              onClick={() => setZoom(z => Math.min(8.0, parseFloat((z + 0.5).toFixed(1))))}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center border border-white/15"
              title="Zoom In (+0.5x)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/70 pt-0.5">
            <span className="flex items-center gap-1">
              <span>Double-tap viewfinder or pinch</span>
            </span>
            <span>Use 3x–8x for distance scan</span>
          </div>
        </div>

        {/* Footer Utilities: GPS Proximity & Manual Token Toggle */}
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 text-xs text-white/90">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{locationStr}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 underline flex items-center gap-1 shrink-0 touch-manipulation py-1"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{showManualInput ? 'Hide Code' : 'Manual Code'}</span>
          </button>
        </div>

        {/* Manual Token Entry Form Drawer */}
        {showManualInput && (
          <form onSubmit={handleManualSubmit} className="p-3 bg-black/80 backdrop-blur-xl rounded-xl border border-white/20 space-y-2 animate-in fade-in">
            <label className="text-[11px] font-semibold text-white block">
              Enter the current classroom attendance code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste official broadcast token..."
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 font-mono"
              />
              <button
                type="submit"
                disabled={status==='processing'}
                className="px-4 py-2 bg-emerald-400 text-black rounded-lg text-xs font-bold hover:opacity-90 shrink-0 touch-manipulation"
              >
                Verify
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  // If fullscreen mode, render through React Portal directly into document.body
  // This guarantees escape from parent CSS transforms and gives true edge-to-edge mobile fullscreen
  if (isFullscreen && typeof document !== 'undefined') {
    return createPortal(
      <motion.div
        key="qr-scanner-fullscreen-portal"
        initial={{ opacity: 0, scale: 0.94, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 30 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320, mass: 0.8 }}
        className="fixed inset-0 z-[99999] w-screen h-screen h-[100dvh] bg-black/95 backdrop-blur-3xl flex flex-col justify-between overflow-hidden select-none p-0 sm:p-4"
      >
        <div className="w-full h-full max-w-xl mx-auto flex flex-col justify-between">
          {content}
        </div>
      </motion.div>,
      document.body
    );
  }

  return content;
}
