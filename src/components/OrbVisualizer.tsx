import React, { useEffect, useRef } from 'react';
import { Mic, Power, Sparkles, Volume2 } from 'lucide-react';
import { AssistantState, BhapumVibe } from '../services/LiveSession';
import { AudioStreamer } from '../services/AudioStreamer';

interface OrbVisualizerProps {
  state: AssistantState;
  vibe: BhapumVibe;
  audioStreamer: AudioStreamer;
  onToggle: () => void;
}

const VIBE_PALETTES: Record<
  BhapumVibe,
  { primary: string; secondary: string; tertiary: string; glow: string }
> = {
  siriGlow: {
    primary: '#38bdf8', // sky-400
    secondary: '#f43f5e', // rose-500
    tertiary: '#a855f7', // purple-500
    glow: 'rgba(56, 189, 248, 0.5)',
  },
  cyberNepal: {
    primary: '#ef4444', // red (Nepal flag crimson)
    secondary: '#3b82f6', // blue (Nepal flag border)
    tertiary: '#f59e0b', // amber
    glow: 'rgba(239, 68, 68, 0.5)',
  },
  flirty: {
    primary: '#fb7185',
    secondary: '#ec4899',
    tertiary: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.55)',
  },
  sassy: {
    primary: '#ec4899',
    secondary: '#8b5cf6',
    tertiary: '#06b6d4',
    glow: 'rgba(236, 72, 153, 0.5)',
  },
  stealth: {
    primary: '#64748b',
    secondary: '#94a3b8',
    tertiary: '#334155',
    glow: 'rgba(100, 116, 139, 0.4)',
  },
  golden: {
    primary: '#f59e0b',
    secondary: '#eab308',
    tertiary: '#f97316',
    glow: 'rgba(245, 158, 11, 0.5)',
  },
};

export const OrbVisualizer: React.FC<OrbVisualizerProps> = ({
  state,
  vibe,
  audioStreamer,
  onToggle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rotation = 0;
    const particles: { angle: number; speed: number; radius: number; size: number; alpha: number }[] = [];
    const particleCount = 36;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        angle: (i / particleCount) * Math.PI * 2,
        speed: 0.008 + Math.random() * 0.015,
        radius: 105 + Math.random() * 45,
        size: 1.8 + Math.random() * 2.2,
        alpha: 0.25 + Math.random() * 0.7,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const palette = VIBE_PALETTES[vibe] || VIBE_PALETTES.siriGlow;

      let audioLevel = 0;
      let freqArray: Uint8Array;

      if (state === 'speaking') {
        freqArray = audioStreamer.getSpeakerFrequencies();
        let sum = 0;
        for (let i = 0; i < freqArray.length; i++) {
          sum += freqArray[i];
        }
        audioLevel = sum / (freqArray.length * 255);
      } else if (state === 'listening') {
        freqArray = audioStreamer.getMicFrequencies();
        let sum = 0;
        for (let i = 0; i < freqArray.length; i++) {
          sum += freqArray[i];
        }
        audioLevel = sum / (freqArray.length * 255);
      } else {
        freqArray = new Uint8Array(64);
        audioLevel = 0.04;
      }

      rotation += (0.012 + audioLevel * 0.05);

      const baseRadius = 92 + audioLevel * 48;

      // 1. Ambient outer aura
      const ambientGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.3,
        centerX,
        centerY,
        baseRadius * 2.3
      );
      ambientGrad.addColorStop(0, palette.glow);
      ambientGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.15)');
      ambientGrad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 2.3, 0, Math.PI * 2);
      ctx.fillStyle = ambientGrad;
      ctx.fill();

      // 2. Multi-layer fluid Siri Apple Intelligence waves
      const waveCount = state === 'speaking' ? 4 : state === 'listening' ? 3 : 2;
      for (let w = 0; w < waveCount; w++) {
        const ringRadius = baseRadius + (w + 1) * 14 + (state === 'speaking' ? audioLevel * 30 : 0);
        ctx.beginPath();
        const segments = 72;
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2 + rotation * (w % 2 === 0 ? 1 : -1.2);
          const freqIndex = Math.floor((i / segments) * (freqArray.length / 2));
          const freqOffset = (freqArray[freqIndex] || 0) / 255;
          const offsetRadius =
            ringRadius + Math.sin(angle * 7 + rotation * 2.5) * (4 + freqOffset * 26);

          const x = centerX + Math.cos(angle) * offsetRadius;
          const y = centerY + Math.sin(angle) * offsetRadius;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, centerY - ringRadius, 0, centerY + ringRadius);
        grad.addColorStop(0, palette.primary);
        grad.addColorStop(0.5, palette.secondary);
        grad.addColorStop(1, palette.tertiary);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2 + audioLevel * 2.8;
        ctx.globalAlpha = 0.4 + (w === 0 ? 0.45 : 0.25) + audioLevel * 0.25;
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      // 3. Orbiting iridescent particles
      particles.forEach((p) => {
        p.angle += p.speed + audioLevel * 0.025;
        const currentDist = p.radius + audioLevel * 35;
        const px = centerX + Math.cos(p.angle) * currentDist;
        const py = centerY + Math.sin(p.angle) * currentDist;

        ctx.beginPath();
        ctx.arc(px, py, p.size + audioLevel * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.angle % 2 > 1 ? palette.primary : palette.secondary;
        ctx.globalAlpha = p.alpha * (state === 'disconnected' ? 0.35 : 0.9);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // 4. Central Siri 3D Glass Orb
      const coreGrad = ctx.createRadialGradient(
        centerX - baseRadius * 0.3,
        centerY - baseRadius * 0.3,
        6,
        centerX,
        centerY,
        baseRadius
      );
      if (state === 'disconnected') {
        coreGrad.addColorStop(0, '#475569');
        coreGrad.addColorStop(0.7, '#1e293b');
        coreGrad.addColorStop(1, '#090d16');
      } else if (state === 'connecting') {
        coreGrad.addColorStop(0, '#fef08a');
        coreGrad.addColorStop(0.5, palette.primary);
        coreGrad.addColorStop(1, '#020617');
      } else if (state === 'speaking') {
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.25, palette.primary);
        coreGrad.addColorStop(0.65, palette.secondary);
        coreGrad.addColorStop(1, '#020408');
      } else {
        // Listening
        coreGrad.addColorStop(0, '#a5f3fc');
        coreGrad.addColorStop(0.35, palette.primary);
        coreGrad.addColorStop(0.75, palette.tertiary);
        coreGrad.addColorStop(1, '#020408');
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Sharp glass rim
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = palette.primary;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = state === 'disconnected' ? 0.3 : 0.85;
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [state, vibe, audioStreamer]);

  const palette = VIBE_PALETTES[vibe] || VIBE_PALETTES.siriGlow;

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <div className="relative flex items-center justify-center w-[330px] h-[330px] sm:w-[420px] sm:h-[420px]">
        <canvas
          ref={canvasRef}
          width={440}
          height={440}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Central Siri Touch & Power Button */}
        <button
          onClick={onToggle}
          aria-label={state === 'disconnected' ? 'सिरी सुरु गर्नुहोस्' : 'सत्र अन्त्य गर्नुहोस्'}
          className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            state === 'disconnected'
              ? 'bg-slate-950/80 text-slate-300 hover:text-white border border-white/20 hover:border-white/40 shadow-slate-950/80'
              : state === 'connecting'
              ? 'bg-black/90 text-yellow-300 border border-yellow-400/50 animate-pulse'
              : state === 'speaking'
              ? 'bg-black/85 text-pink-300 border border-pink-400/80 shadow-[0_0_40px_rgba(244,63,94,0.7)]'
              : 'bg-black/85 text-cyan-300 border border-cyan-400/80 shadow-[0_0_40px_rgba(56,189,248,0.7)]'
          }`}
          style={{
            backdropFilter: 'blur(20px)',
          }}
        >
          {state === 'disconnected' && (
            <>
              <Power className="w-8 h-8 sm:w-9 sm:h-9 text-cyan-400 transition-transform group-hover:scale-110" />
              <span className="text-[11px] font-bold tracking-wider mt-1 text-slate-200">
                बोल्न थिच्नुहोस्
              </span>
            </>
          )}

          {state === 'connecting' && (
            <>
              <Sparkles className="w-8 h-8 animate-spin text-yellow-300" />
              <span className="text-[11px] font-semibold mt-1 text-yellow-300">
                जोडिँदैछ...
              </span>
            </>
          )}

          {state === 'listening' && (
            <>
              <Mic className="w-9 h-9 animate-pulse text-cyan-300" />
              <span className="text-[10px] font-bold tracking-wider uppercase mt-1 text-cyan-200">
                सिरी सुन्दैछिन्
              </span>
            </>
          )}

          {state === 'speaking' && (
            <>
              <Volume2 className="w-9 h-9 text-pink-300 animate-bounce" />
              <span className="text-[10px] font-bold tracking-wider uppercase mt-1 text-pink-200">
                सिरी बोल्दैछिन्
              </span>
            </>
          )}
        </button>
      </div>

      {/* Real-time Nepali Status Text */}
      <div className="mt-3 flex flex-col items-center">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide">
          <span
            className="w-2.5 h-2.5 rounded-full transition-colors duration-300"
            style={{
              backgroundColor:
                state === 'disconnected'
                  ? '#64748b'
                  : state === 'connecting'
                  ? '#facc15'
                  : state === 'speaking'
                  ? palette.secondary
                  : '#38bdf8',
              boxShadow: state !== 'disconnected' ? `0 0 12px ${palette.glow}` : 'none',
            }}
          />
          <span className="text-white text-sm font-medium">
            {state === 'disconnected' && 'सिरी विश्राममा छिन्'}
            {state === 'connecting' && 'सिरी सक्रिय हुँदैछिन्...'}
            {state === 'listening' && 'नेपालीमा केही भन्नुहोस्, सिरी सुन्दैछिन्'}
            {state === 'speaking' && 'सिरी जवाफ दिँदैछिन्'}
          </span>
        </div>

        <p className="mt-1.5 text-xs text-center text-slate-400 max-w-xs sm:max-w-md leading-relaxed">
          {state === 'disconnected' && 'iPhone 18 Pro Max Siri भन्दा पनि एडभान्स नेपाली भ्वाइस AI।'}
          {state === 'connecting' && '२४kHz हाई-फिडेलिटी अडियो च्यानल तयार पार्दै...'}
          {state === 'listening' && 'टर्च बाल, युट्युब खोल, फोटो खिच वा जे पनि नेपालीमा अह्राउनुहोस्!'}
          {state === 'speaking' && 'बिचमै रोकेर अरू कुरा सोध्न पनि सक्नुहुन्छ (Real-time Interruptible)।'}
        </p>
      </div>
    </div>
  );
};
