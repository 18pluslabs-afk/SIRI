import React, { useEffect, useRef, useState } from 'react';
import { AssistantState } from '../services/LiveSession';
import { AudioStreamer } from '../services/AudioStreamer';
import { Mic, MicOff, Volume2, Radio } from 'lucide-react';

interface SiriOrbButtonProps {
  state: AssistantState;
  audioStreamer: AudioStreamer;
  onTap: () => void;
  onLongPressComplete: () => void;
}

export const SiriOrbButton: React.FC<SiriOrbButtonProps> = ({
  state,
  audioStreamer,
  onTap,
  onLongPressComplete,
}) => {
  const holdStartTimeRef = useRef<number | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const isCompleteRef = useRef<boolean>(false);
  const lastTapTimeRef = useRef<number>(0);

  // Audio reactivity level
  const [audioScale, setAudioScale] = useState(1);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const updateAudio = () => {
      let level = 0;
      if (state === 'speaking') {
        const freqs = audioStreamer.getSpeakerFrequencies();
        let sum = 0;
        for (let i = 0; i < freqs.length; i++) sum += freqs[i];
        level = sum / (freqs.length * 255);
      } else if (state === 'listening') {
        const freqs = audioStreamer.getMicFrequencies();
        let sum = 0;
        for (let i = 0; i < freqs.length; i++) sum += freqs[i];
        level = sum / (freqs.length * 255);
      }

      setAudioScale(1 + level * 0.22);
      animFrameRef.current = requestAnimationFrame(updateAudio);
    };

    animFrameRef.current = requestAnimationFrame(updateAudio);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [state, audioStreamer]);

  // Play a distinct futuristic unlock sound when 5 seconds hold completes
  const playDistinctUnlockSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Harmonic futuristic chord: F#4 (369.99), C#5 (554.37), F#5 (739.99), C#6 (1108.73)
      const frequencies = [369.99, 554.37, 739.99, 1108.73];
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        const startTime = now + idx * 0.04;
        const duration = 0.7 - idx * 0.08;

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch (e) {
      console.warn('Unlock sound could not play:', e);
    }
  };

  // Handle 5-second stealth hold (nothing shows on screen while holding)
  const startHold = () => {
    holdStartTimeRef.current = Date.now();
    isCompleteRef.current = false;

    const checkInterval = () => {
      if (!holdStartTimeRef.current) return;
      const elapsed = Date.now() - holdStartTimeRef.current;

      // 5 seconds threshold (5000 ms)
      if (elapsed >= 5000) {
        isCompleteRef.current = true;
        holdStartTimeRef.current = null;

        // Distinct futuristic unlock chime
        playDistinctUnlockSound();

        // Trigger opening of settings & information modal
        onLongPressComplete();
        return;
      }

      holdTimerRef.current = requestAnimationFrame(checkInterval);
    };

    holdTimerRef.current = requestAnimationFrame(checkInterval);
  };

  const endHold = () => {
    if (holdTimerRef.current) {
      cancelAnimationFrame(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (holdStartTimeRef.current) {
      const elapsed = Date.now() - holdStartTimeRef.current;
      holdStartTimeRef.current = null;

      // If it was a quick tap (< 450ms) and didn't complete 5s hold, trigger normal mic tap action
      if (elapsed < 450 && !isCompleteRef.current) {
        const now = Date.now();
        if (now - lastTapTimeRef.current > 250) {
          lastTapTimeRef.current = now;
          onTap();
        }
      }
    }
  };

  const isActive = state !== 'disconnected';

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-6">
      {/* Top Status Pill: Unmistakably displays whether Mic is ON or OFF */}
      <div className="mb-4 sm:mb-6">
        {isActive ? (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/70 border border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.4)] backdrop-blur-md animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs sm:text-sm font-bold text-red-200 tracking-wide">
              {state === 'speaking'
                ? '🔊 सिरी जवाफ दिँदैछ...'
                : state === 'listening'
                ? '🔴 माइक अन छ • सुन्दैछ...'
                : '⚡ माइक अन हुँदैछ...'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/60 border border-slate-700/50 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-xs text-slate-300 font-medium tracking-wide">
              माइक बन्द छ (OFF)
            </span>
          </div>
        )}
      </div>

      {/* Center Siri Orb Area */}
      <div className="relative flex items-center justify-center">
        {/* Active Animations: Animated Concentric Neon Ripples when Mic is ON */}
        {isActive && (
          <>
            <div
              className="absolute rounded-full border border-red-400/40 pointer-events-none animate-siri-ripple-1 w-[260px] h-[260px] sm:w-[290px] sm:h-[290px]"
              style={{
                boxShadow: '0 0 25px rgba(239, 68, 68, 0.4), inset 0 0 15px rgba(244, 63, 94, 0.3)',
              }}
            />
            <div
              className="absolute rounded-full border border-cyan-400/35 pointer-events-none animate-siri-ripple-2 w-[260px] h-[260px] sm:w-[290px] sm:h-[290px]"
              style={{
                boxShadow: '0 0 30px rgba(0, 200, 255, 0.35)',
              }}
            />
            <div
              className="absolute rounded-full border border-violet-500/30 pointer-events-none animate-siri-ripple-3 w-[260px] h-[260px] sm:w-[290px] sm:h-[290px]"
              style={{
                boxShadow: '0 0 35px rgba(139, 92, 246, 0.3)',
              }}
            />
          </>
        )}

        {/* Main Siri Microphone Orb Button */}
        <div
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            transform: `scale(${audioScale})`,
            transition: 'transform 0.08s ease',
            touchAction: 'none',
          }}
          className="relative w-[250px] h-[250px] sm:w-[285px] sm:h-[285px] rounded-full flex items-center justify-center cursor-pointer select-none active:scale-95"
          title={isActive ? 'माइक बन्द गर्न यहाँ थिच्नुहोस्' : 'माइक सुरु गर्न यहाँ थिच्नुहोस्'}
        >
          {/* Outer Electric Blue & Violet / Coral Radiance Glow */}
          <div
            className={`absolute inset-0 rounded-full pointer-events-none transition-all duration-700 ${
              isActive ? 'animate-siri-rotate' : ''
            }`}
            style={{
              background: isActive
                ? 'conic-gradient(from 0deg, rgba(239, 68, 68, 0.75), rgba(0, 210, 255, 0.7), rgba(244, 63, 94, 0.8), rgba(239, 68, 68, 0.75))'
                : 'radial-gradient(circle, rgba(0, 162, 255, 0.45) 0%, rgba(112, 0, 255, 0.3) 55%, transparent 75%)',
              filter: isActive ? 'blur(22px)' : 'blur(16px)',
              opacity: isActive ? 0.98 : 0.75,
            }}
          />

          {/* Outer Luminous Ring */}
          <div
            className={`absolute inset-2 sm:inset-3 rounded-full pointer-events-none transition-all duration-500 ${
              isActive ? 'animate-siri-breathe' : ''
            }`}
            style={{
              border: isActive
                ? '2.8px solid rgba(248, 113, 113, 1)'
                : '2.5px solid rgba(0, 200, 255, 0.95)',
              boxShadow: isActive
                ? '0 0 35px rgba(239, 68, 68, 0.95), inset 0 0 20px rgba(244, 63, 94, 0.75), 0 0 65px rgba(0, 200, 255, 0.5)'
                : '0 0 25px rgba(0, 162, 255, 0.8), inset 0 0 15px rgba(0, 140, 255, 0.6), 0 0 50px rgba(112, 0, 255, 0.4)',
            }}
          />

          {/* Inner Dark Glossy Metallic Sphere with Glass Crescent Highlight */}
          <div
            className="relative w-[210px] h-[210px] sm:w-[235px] sm:h-[235px] rounded-full flex flex-col items-center justify-center overflow-hidden border border-cyan-500/40 shadow-2xl"
            style={{
              background: isActive
                ? 'radial-gradient(circle at 35% 35%, #2a0b16 0%, #15060d 55%, #050103 100%)'
                : 'radial-gradient(circle at 35% 35%, #0d1e38 0%, #050b16 55%, #01040a 100%)',
              boxShadow: isActive
                ? 'inset 0 0 35px rgba(239, 68, 68, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.35), 0 10px 40px rgba(0, 0, 0, 0.95)'
                : 'inset 0 0 25px rgba(0, 150, 255, 0.45), inset 0 2px 4px rgba(255, 255, 255, 0.3), 0 10px 40px rgba(0, 0, 0, 0.9)',
            }}
          >
            {/* Glass Specular Crescent Reflection */}
            <div
              className="absolute top-2 right-3 w-[120px] h-[95px] rounded-full pointer-events-none transform -rotate-25"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0.08) 50%, transparent 75%)',
                filter: 'blur(1.5px)',
              }}
            />

            {/* DYNAMIC ICON: When OFF -> Cyan Mic; When ON -> Distinct Red/Coral MIC OFF Icon */}
            {!isActive ? (
              /* Microphone ON prompt (Currently OFF, glowing cyan capsule matching photo) */
              <svg
                className="w-20 h-20 sm:w-24 sm:h-24 pointer-events-none transition-all duration-300 filter drop-shadow-[0_0_10px_rgba(0,190,255,0.85)] drop-shadow-[0_0_22px_rgba(0,100,255,0.5)]"
                viewBox="0 0 24 24"
                fill="none"
              >
                {/* Mic Center Capsule */}
                <path
                  d="M12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2Z"
                  fill="url(#micGrad)"
                />
                {/* Mic Cradle Arc */}
                <path
                  d="M19 10V11C19 14.53 16.39 17.44 13 17.93V21H11V17.93C7.61 17.44 5 14.53 5 11V10"
                  stroke="url(#micGrad)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Mic Base Stand */}
                <path
                  d="M8 21H16"
                  stroke="url(#micGrad)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="micGrad" x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="45%" stopColor="#e0f7ff" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
              </svg>
            ) : (
              /* Distinct MIC OFF ICON (When mic is active, show clear slashed MicOff icon to turn it off) */
              <div className="flex flex-col items-center justify-center pointer-events-none transition-all duration-300">
                <svg
                  className="w-18 h-18 sm:w-22 sm:h-22 filter drop-shadow-[0_0_16px_rgba(239,68,68,0.95)] drop-shadow-[0_0_32px_rgba(244,63,94,0.7)]"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  {/* Distinct Diagonal Slash */}
                  <line
                    x1="2"
                    y1="2"
                    x2="22"
                    y2="22"
                    stroke="url(#micOffSlashGrad)"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                  {/* Mic Right Arc */}
                  <path
                    d="M18.89 13.23A7.12 7.12 0 0 0 19 11v-1"
                    stroke="url(#micOffGrad)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  {/* Mic Left Arc */}
                  <path
                    d="M5 10v1a7 7 0 0 0 12 5"
                    stroke="url(#micOffGrad)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  {/* Mic Capsule Top */}
                  <path
                    d="M15 9.34V5a3 3 0 0 0-5.68-1.33"
                    stroke="url(#micOffGrad)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  {/* Mic Capsule Bottom */}
                  <path
                    d="M9 9v2a3 3 0 0 0 5.12 2.12"
                    stroke="url(#micOffGrad)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  {/* Mic Stem */}
                  <path
                    d="M12 18v3"
                    stroke="url(#micOffGrad)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  {/* Mic Base */}
                  <path
                    d="M8 21h8"
                    stroke="url(#micOffGrad)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="micOffGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="45%" stopColor="#fca5a5" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                    <linearGradient id="micOffSlashGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="50%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#991b1b" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Clear label inside orb */}
                <div className="mt-1 px-2.5 py-0.5 rounded-full bg-red-950/85 border border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                  <span className="text-[10px] sm:text-[11px] font-bold text-red-200 tracking-wider">
                    बन्द गर्न थिच्नुहोस्
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dedicated Action Button: Prominent Off/On Switch (No more ambiguity) */}
      <div className="mt-6 z-20">
        {isActive ? (
          /* Prominent Red MIC OFF Button */
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTap();
            }}
            className="px-6 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-red-950/95 via-red-900/90 to-rose-950/95 border-2 border-red-500/80 text-white font-bold text-xs sm:text-sm flex items-center gap-3 shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:shadow-[0_0_40px_rgba(239,68,68,0.9)] hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          >
            <div className="relative flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping absolute" />
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 relative" />
            </div>
            <div className="p-1 rounded-full bg-red-600 text-white shadow-inner flex items-center justify-center">
              <MicOff className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-red-300 font-bold uppercase tracking-wider">
                माइक अन छ (MIC IS ON)
              </span>
              <span className="text-xs sm:text-sm font-bold text-white group-hover:text-red-100">
                माइक बन्द गर्नुहोस् (MIC OFF)
              </span>
            </div>
          </button>
        ) : (
          /* Sleek Cyan MIC ON Button */
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTap();
            }}
            className="px-5 py-2 sm:py-2.5 rounded-full bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 font-semibold text-xs sm:text-sm flex items-center gap-2.5 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.45)] hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          >
            <div className="p-1 rounded-full bg-cyan-500/20 text-cyan-300">
              <Mic className="w-4 h-4 text-cyan-300" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-cyan-400/80 uppercase tracking-wider font-semibold">
                माइक बन्द छ (OFF)
              </span>
              <span className="text-xs sm:text-sm text-cyan-100 font-semibold">
                माइक सुरु गर्न यहाँ थिच्नुहोस् (MIC ON)
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

