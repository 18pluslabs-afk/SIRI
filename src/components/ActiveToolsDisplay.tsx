import React, { useEffect, useState } from 'react';
import {
  ExternalLink,
  Timer as TimerIcon,
  X,
  CheckCircle,
  BellRing,
  Flashlight,
  Camera,
  Music,
  CloudSun,
  Calculator,
  FileText,
} from 'lucide-react';
import { LiveTimer, ToolActionItem } from '../services/LiveSession';

interface ActiveToolsDisplayProps {
  toolActions: ToolActionItem[];
  timers: LiveTimer[];
  onDismissTool: (id: string) => void;
  onDismissTimer: (id: string) => void;
}

export const ActiveToolsDisplay: React.FC<ActiveToolsDisplayProps> = ({
  toolActions,
  timers,
  onDismissTool,
  onDismissTimer,
}) => {
  const [activeTimers, setActiveTimers] = useState<LiveTimer[]>([]);

  useEffect(() => {
    setActiveTimers(timers);
  }, [timers]);

  useEffect(() => {
    if (activeTimers.length === 0) return;

    const interval = setInterval(() => {
      setActiveTimers((prev) =>
        prev.map((t) => {
          if (!t.active || t.remainingSeconds <= 0) return t;
          const nextVal = t.remainingSeconds - 1;
          if (nextVal === 0) {
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
              osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15);
              gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.6);
            } catch {}
          }
          return { ...t, remainingSeconds: nextVal };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimers.length]);

  if (toolActions.length === 0 && activeTimers.length === 0) {
    return null;
  }

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'deviceControl':
        return <Flashlight className="w-5 h-5 text-yellow-300" />;
      case 'openCameraSnap':
        return <Camera className="w-5 h-5 text-pink-400" />;
      case 'playMusicTrack':
        return <Music className="w-5 h-5 text-emerald-400" />;
      case 'getWeatherInfo':
        return <CloudSun className="w-5 h-5 text-amber-300" />;
      case 'calculateMath':
        return <Calculator className="w-5 h-5 text-cyan-400" />;
      case 'addQuickNote':
        return <FileText className="w-5 h-5 text-purple-400" />;
      default:
        return <ExternalLink className="w-5 h-5 text-sky-400" />;
    }
  };

  const getToolTitle = (item: ToolActionItem) => {
    switch (item.name) {
      case 'deviceControl':
        return `आईफोन डिभाइस नियन्त्रण: ${
          item.args?.feature === 'flashlight'
            ? 'टर्च'
            : item.args?.feature === 'mute'
            ? 'साइलेन्ट मोड'
            : item.args?.feature || ''
        }`;
      case 'openCameraSnap':
        return 'iPhone 18 Pro क्यामेरा खोलियो';
      case 'playMusicTrack':
        return `गीत बजाइयो: ${item.args?.query || ''}`;
      case 'getWeatherInfo':
        return `${item.args?.city || 'सहर'}को मौसम जानकारी`;
      case 'calculateMath':
        return `हिसाब: ${item.args?.expression || ''} = ${item.args?.result || ''}`;
      case 'addQuickNote':
        return `स्मार्ट नोट सुरक्षित: "${item.args?.content || ''}"`;
      case 'openWebsite':
        return `वेबसाइट खोलियो: ${item.args?.label || item.args?.url || ''}`;
      default:
        return `कार्य सम्पन्न: ${item.name}`;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-2.5 px-4 z-20">
      {/* Active Timers */}
      {activeTimers.map((timer) => {
        const isDone = timer.remainingSeconds === 0;

        return (
          <div
            key={timer.id}
            className={`p-3.5 rounded-2xl border backdrop-blur-xl transition-all duration-300 flex items-center justify-between shadow-xl ${
              isDone
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-200 animate-pulse'
                : 'bg-black/75 border-white/15 text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  isDone ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/20 text-cyan-300'
                }`}
              >
                {isDone ? <BellRing className="w-5 h-5 animate-bounce" /> : <TimerIcon className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400">{timer.label}</p>
                <p className="text-xl font-bold font-mono tabular-nums tracking-wide">
                  {isDone ? 'समय सकियो! 🔔' : formatTime(timer.remainingSeconds)}
                </p>
              </div>
            </div>

            <button
              onClick={() => onDismissTimer(timer.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="टाइमर हटाउनुहोस्"
              aria-label="टाइमर हटाउनुहोस्"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}

      {/* Tool Action Notifications */}
      {toolActions.map((action) => {
        const isWeb = action.name === 'openWebsite';
        const isMusic = action.name === 'playMusicTrack';

        return (
          <div
            key={action.id}
            className="p-3.5 rounded-2xl bg-black/80 border border-white/15 backdrop-blur-xl shadow-xl flex items-center justify-between text-white animate-fadeIn"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10 shrink-0">
                {getToolIcon(action.name)}
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-200 truncate">
                    {getToolTitle(action)}
                  </span>
                </div>
                {action.args?.nepaliNotice && (
                  <p className="text-xs text-cyan-300 mt-0.5 truncate">{action.args.nepaliNotice}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              {isWeb && action.args?.url && (
                <a
                  href={
                    action.args.url.startsWith('http')
                      ? action.args.url
                      : `https://${action.args.url}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg flex items-center gap-1 transition-colors"
                >
                  खोल्नुहोस् <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {isMusic && (
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                    action.args.query || 'nepali song'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg flex items-center gap-1 transition-colors"
                >
                  युट्युब <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <button
                onClick={() => onDismissTool(action.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
                aria-label="हटाउनुहोस्"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
