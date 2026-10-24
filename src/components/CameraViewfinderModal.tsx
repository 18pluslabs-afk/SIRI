import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, RefreshCw, Sparkles, Check, Download } from 'lucide-react';

interface CameraViewfinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'photo' | 'portrait' | 'video' | 'scan';
}

export const CameraViewfinderModal: React.FC<CameraViewfinderModalProps> = ({
  isOpen,
  onClose,
  mode = 'photo',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [zoom, setZoom] = useState<'1x' | '2x' | '5x'>('1x');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasCameraAccess, setHasCameraAccess] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCapturedPhoto(null);
      return;
    }

    // Try starting camera stream
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraAccess(true);
      })
      .catch((err) => {
        console.warn('Camera access not granted or unavailable:', err);
        setHasCameraAccess(false);
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCapture = () => {
    setIsCapturing(true);

    // Play shutter sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch {}

    setTimeout(() => {
      setIsCapturing(false);
      // Capture frame from video or fallback
      if (videoRef.current && hasCameraAccess) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0);
          setCapturedPhoto(canvas.toDataURL('image/jpeg'));
        }
      } else {
        // Fallback simulation snap
        setCapturedPhoto('/src/assets/images/bhapum_avatar_1792837857093.jpg');
      }
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-2xl">
      <div className="relative w-full max-w-md bg-black border border-white/20 rounded-[36px] overflow-hidden shadow-2xl flex flex-col text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/60 z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase">
              iPhone 18 Pro Max · 48MP Fusion
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="बन्द गर्नुहोस्"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Screen */}
        <div className="relative aspect-[3/4] w-full bg-slate-950 flex items-center justify-center overflow-hidden">
          {hasCameraAccess ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-transform duration-300 ${
                zoom === '2x' ? 'scale-125' : zoom === '5x' ? 'scale-175' : 'scale-100'
              }`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <Camera className="w-12 h-12 text-pink-400 mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-200">
                सिरी क्यामेरा भिउफाइन्डर
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                सटर बटन थिचेर फोटो खिच्नुहोस् वा सिरीलाई "मेरो फोटो खिच" भन्नुहोस्।
              </p>
            </div>
          )}

          {/* Flash animation */}
          {isCapturing && (
            <div className="absolute inset-0 bg-white transition-opacity duration-100 z-20 pointer-events-none" />
          )}

          {/* Captured Photo Overlay */}
          {capturedPhoto && (
            <div className="absolute inset-0 z-30 bg-black/95 flex flex-col items-center justify-center p-4">
              <img
                src={capturedPhoto}
                alt="Captured Snapshot"
                className="max-h-[70%] rounded-2xl border border-white/20 object-contain shadow-2xl"
              />
              <div className="flex items-center gap-3 mt-4">
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4" /> फोटो सुरक्षित भयो!
                </span>
                <button
                  onClick={() => setCapturedPhoto(null)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 rounded-xl"
                >
                  पुनः खिच्नुहोस्
                </button>
              </div>
            </div>
          )}

          {/* Viewfinder Overlays / Grid Marks */}
          <div className="absolute inset-4 pointer-events-none border border-white/15 rounded-2xl flex items-center justify-center">
            <div className="w-16 h-16 border border-yellow-400/50 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Camera Controls Bar */}
        <div className="p-4 bg-black flex flex-col items-center gap-3">
          {/* Zoom Selector */}
          <div className="flex items-center gap-2 p-1 bg-white/10 rounded-full">
            {(['1x', '2x', '5x'] as const).map((z) => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                  zoom === z ? 'bg-yellow-400 text-black shadow-md' : 'text-slate-300'
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          {/* Shutter Button */}
          <div className="flex items-center justify-center w-full">
            <button
              onClick={handleCapture}
              className="w-18 h-18 rounded-full border-4 border-white p-1 flex items-center justify-center transition-transform active:scale-90"
              aria-label="Take Photo"
            >
              <div className="w-full h-full rounded-full bg-white active:bg-slate-300 transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
