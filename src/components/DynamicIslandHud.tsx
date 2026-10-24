import React, { useState } from 'react';
import {
  Mic,
  Volume2,
  Flashlight,
  Timer as TimerIcon,
  Wifi,
  BatteryCharging,
  SlidersHorizontal,
  Camera,
  Moon,
} from 'lucide-react';
import { AssistantState, DeviceState, LiveTimer } from '../services/LiveSession';

interface DynamicIslandHudProps {
  state: AssistantState;
  deviceState: DeviceState;
  activeTimers: LiveTimer[];
  onOpenControlCenter: () => void;
  onOpenCamera: () => void;
}

export const DynamicIslandHud: React.FC<DynamicIslandHudProps> = ({
  state,
  deviceState,
  activeTimers,
  onOpenControlCenter,
  onOpenCamera,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const runningTimer = activeTimers.find((t) => t.active && t.remainingSeconds > 0);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex justify-center pt-2 pb-1 px-4 z-50">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`bg-black/90 text-white rounded-full border border-white/15 backdrop-blur-2xl transition-all duration-300 ease-out cursor-pointer flex items-center justify-between shadow-2xl shadow-black/80 select-none ${
          isExpanded
            ? 'w-[320px] sm:w-[360px] h-14 px-5 rounded-3xl'
            : runningTimer
            ? 'w-[230px] sm:w-[260px] h-9 px-3.5'
            : 'w-[185px] sm:w-[210px] h-9 px-3.5'
        }`}
        title="iPhone 18 Pro Max Dynamic Island"
      >
        {/* Left Side: Siri Status or Nepali Logo */}
        <div className="flex items-center gap-2">
          {state === 'speaking' ? (
            <div className="flex items-center gap-1 text-pink-400">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
              <Volume2 className="w-3.5 h-3.5" />
            </div>
          ) : state === 'listening' ? (
            <div className="flex items-center gap-1 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <Mic className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-cyan-400 via-pink-500 to-amber-300" />
          )}

          <span className="text-[11px] font-semibold tracking-tight text-slate-200">
            {state === 'speaking' ? 'सिरी बोल्दै' : state === 'listening' ? 'सिरी सुन्दै...' : 'SIRI Pro'}
          </span>
        </div>

        {/* Center / Timer (if active) */}
        {runningTimer && !isExpanded && (
          <div className="flex items-center gap-1 text-[11px] font-mono text-amber-300 font-semibold bg-amber-500/15 px-2 py-0.5 rounded-full">
            <TimerIcon className="w-3 h-3" />
            <span>{formatTimer(runningTimer.remainingSeconds)}</span>
          </div>
        )}

        {/* Right Side: Battery, Flashlight & Indicators */}
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
          {deviceState.flashlight && (
            <Flashlight className="w-3 h-3 text-yellow-300 animate-pulse" />
          )}
          {deviceState.mute && <Moon className="w-3 h-3 text-indigo-300" />}

          {isExpanded ? (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCamera();
                }}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                title="क्यामेरा खोल्नुहोस्"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenControlCenter();
                }}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                title="कन्ट्रोल सेन्टर"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-300">5G</span>
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">100%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
