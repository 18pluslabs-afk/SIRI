import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, ArrowRight, Volume2, VolumeX } from 'lucide-react';

interface OpeningSplashAnimationProps {
  onComplete: () => void;
  autoDismissMs?: number; // default ~3600ms
}

export const OpeningSplashAnimation: React.FC<OpeningSplashAnimationProps> = ({
  onComplete,
  autoDismissMs = 3800,
}) => {
  const [stage, setStage] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Synthesize futuristic cinematic startup chime using Web Audio API (Offline & Instant)
  const playCinematicChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const now = ctx.currentTime;

      // 1. Deep Sub-bass warm swell (40Hz -> 80Hz)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(45, now);
      subOsc.frequency.exponentialRampToValueAtTime(75, now + 1.2);
      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.35, now + 0.4);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 2.3);

      // 2. Crystal Chime Harmonics (Ethereal Apple / Sci-fi Chord: C#5, G#5, C#6, F#6)
      const freqs = [554.37, 830.61, 1108.73, 1479.98];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.2 + idx * 0.12);

        const startTime = now + 0.2 + idx * 0.12;
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.0);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 2.1);
      });

      // 3. Futuristic High Shimmer sweep
      const shimmerOsc = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmerOsc.type = 'triangle';
      shimmerOsc.frequency.setValueAtTime(1200, now + 1.0);
      shimmerOsc.frequency.exponentialRampToValueAtTime(2400, now + 1.8);
      shimmerGain.gain.setValueAtTime(0.0001, now + 1.0);
      shimmerGain.gain.linearRampToValueAtTime(0.08, now + 1.2);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      shimmerOsc.start(now + 1.0);
      shimmerOsc.stop(now + 2.5);
    } catch {
      // Audio autoplay policy fallback silently ignored
    }
  };

  useEffect(() => {
    // Attempt startup sound
    if (soundEnabled) {
      playCinematicChime();
    }

    // Sequence stages for dramatic entrance
    const t1 = setTimeout(() => setStage(1), 150); // Ambient glow & BHAPUMA
    const t2 = setTimeout(() => setStage(2), 700); // SIRI majestic glow
    const t3 = setTimeout(() => setStage(3), 1400); // Bharat Pun Magar lock
    const t4 = setTimeout(() => setStage(4), 2200); // System ready pulse
    const tFade = setTimeout(() => {
      setIsFadingOut(true);
    }, autoDismissMs - 600);
    const tComplete = setTimeout(() => {
      onComplete();
    }, autoDismissMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tFade);
      clearTimeout(tComplete);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [autoDismissMs, onComplete, soundEnabled]);

  const handleDismiss = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-[#04060b] text-white select-none overflow-hidden cursor-pointer transition-opacity duration-700 ease-out ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Deep Vignette & Dark Atmospheric Background matching photo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.85)_0%,rgba(0,0,0,0.98)_70%,#000000_100%)] pointer-events-none" />

      {/* Radiant Glowing Siri / Apple Intelligence Orb Aura in background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {/* Core multi-color swirling nebula */}
        <div
          className={`w-[450px] h-[450px] md:w-[650px] md:h-[650px] rounded-full blur-[90px] md:blur-[120px] transition-all duration-1000 ${
            stage >= 1
              ? 'opacity-70 scale-100'
              : 'opacity-0 scale-50'
          }`}
          style={{
            background:
              'radial-gradient(circle, rgba(56,189,248,0.35) 0%, rgba(168,85,247,0.3) 35%, rgba(236,72,153,0.25) 60%, rgba(34,211,238,0.1) 85%, transparent 100%)',
          }}
        />

        {/* Pulsing ring aura */}
        <div
          className={`absolute w-[320px] h-[320px] md:w-[480px] md:h-[480px] rounded-full border border-cyan-400/20 blur-[1px] animate-siri-rotate transition-opacity duration-1000 ${
            stage >= 2 ? 'opacity-90' : 'opacity-0'
          }`}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-cyan-400 rounded-full blur-[6px] shadow-[0_0_20px_#22d3ee]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-400 rounded-full blur-[4px] shadow-[0_0_15px_#c084fc]" />
        </div>

        {/* Subtle grid and particle dust */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>

      {/* Top Header Bar: Sound indicator & Skip button */}
      <div className="relative z-20 w-full max-w-4xl px-6 pt-6 flex items-center justify-between text-xs text-white/60">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-mono tracking-wider text-[11px] text-cyan-300 font-semibold uppercase">
            NEPALESE AI • V18 PRO
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playCinematicChime();
            }}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/10"
            title={soundEnabled ? 'आवाज बन्द गर्नुहोस्' : 'आवाज सुन्नुहोस्'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-white/40" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium tracking-wide transition-all border border-white/15 backdrop-blur-md"
          >
            <span>सिधै सुरु गर्नुहोस्</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* CENTER HERO: Exact Visual Layout from Photo:
          Line 1: BHAPUMA
          Line 2: SIRI
          Line 3: Bharat Pun Magar (STRICT SINGLE LINE / "yeutai dikkama hunu parxa")
      */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 my-auto select-none">
        
        {/* Decorative Top Sparkle / Crown */}
        <div
          className={`mb-3 flex items-center gap-2 text-cyan-300 transition-all duration-700 ease-out transform ${
            stage >= 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-75'
          }`}
        >
          <div className="h-[1px] w-8 md:w-16 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />
          <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" style={{ animationDuration: '6s' }} />
          <div className="h-[1px] w-8 md:w-16 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />
        </div>

        {/* LINE 1: BHAPUMA (Cinematic Tracked Caps) */}
        <div
          className={`transition-all duration-1000 ease-out transform ${
            stage >= 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-6 scale-90'
          }`}
        >
          <h2 className="font-cinzel text-xs sm:text-sm md:text-base font-semibold tracking-[0.45em] sm:tracking-[0.6em] uppercase text-cyan-200/90 drop-shadow-[0_0_15px_rgba(34,211,238,0.7)] pl-2">
            BHAPUMA
          </h2>
        </div>

        {/* LINE 2: SIRI (Massive Iconic Display Serif matching Reference Photo) */}
        <div
          className={`relative my-1 md:my-2 transition-all duration-1000 ease-out transform ${
            stage >= 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 scale-75 blur-md'
          }`}
        >
          {/* Neon back-glow for SIRI */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-cinzel text-6xl sm:text-8xl md:text-9xl lg:text-[140px] font-black tracking-[0.08em] text-cyan-400/20 blur-xl select-none">
              SIRI
            </span>
          </div>

          {/* Shimmering Metallic Gradient Text */}
          <h1 className="relative font-cinzel text-6xl sm:text-8xl md:text-9xl lg:text-[140px] font-black tracking-[0.08em] leading-none text-white drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)] animate-shimmer-text">
            SIRI
          </h1>

          {/* Subtle horizontal light streak across SIRI */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="w-20 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent transform -skew-x-25 animate-beam-sweep" />
          </div>
        </div>

        {/* LINE 3: Bharat Pun Magar (MUST BE STRICTLY ON A SINGLE LINE / "yeutai dikkama hunu parxa") */}
        <div
          className={`w-full max-w-xl transition-all duration-1000 ease-out transform ${
            stage >= 3 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'
          }`}
        >
          {/* Subtle luxury accent line with diamond icon */}
          <div className="flex items-center justify-center gap-3 my-2 opacity-80">
            <div className="h-[1px] flex-1 max-w-[80px] sm:max-w-[120px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            <span className="text-[10px] text-cyan-300 font-mono tracking-widest">✦</span>
            <div className="h-[1px] flex-1 max-w-[80px] sm:max-w-[120px] bg-gradient-to-l from-transparent via-cyan-400 to-transparent" />
          </div>

          {/* SINGLE-LINE NAME: Bharat Pun Magar (nowrap enforced) */}
          <h3 className="font-italiana text-lg sm:text-2xl md:text-3xl lg:text-4xl tracking-[0.25em] sm:tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-white to-cyan-100 font-normal uppercase whitespace-nowrap overflow-hidden text-ellipsis drop-shadow-[0_0_20px_rgba(255,255,255,0.6)] px-2">
            Bharat Pun Magar
          </h3>

          <p className="mt-2 text-[10px] sm:text-xs text-white/45 tracking-[0.3em] uppercase font-mono">
            ARCHITECT &amp; CREATOR
          </p>
        </div>

        {/* System Initialized Confirmation Status */}
        <div
          className={`mt-6 transition-all duration-700 ease-out ${
            stage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_25px_rgba(6,182,212,0.25)]">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[11px] font-mono tracking-wider text-cyan-200">
              भ्वाइस सिस्टम तयार भयो • ट्याप गरी सुरु गर्नुहोस्
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Progress Bar & Tap Hint */}
      <div className="relative z-20 w-full max-w-md px-6 pb-6 flex flex-col items-center gap-3 text-center">
        {/* Animated Loading Bar */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full transition-all ease-linear"
            style={{
              width: `${Math.min(100, (stage / 4) * 100)}%`,
              transitionDuration: '700ms',
            }}
          />
        </div>

        <p className="text-[11px] text-white/40 tracking-wider">
          खोल्नको लागि कतै पनि ट्याप गर्नुहोस् (Tap anywhere to open)
        </p>
      </div>
    </div>
  );
};
