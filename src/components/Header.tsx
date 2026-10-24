import React from 'react';
import { AssistantState, BhapumVibe } from '../services/LiveSession';
import { Sparkles, SlidersHorizontal, Camera } from 'lucide-react';

interface HeaderProps {
  state: AssistantState;
  vibe: BhapumVibe;
  onOpenPersona: () => void;
  onOpenControlCenter: () => void;
  onOpenCamera: () => void;
  onToggleConnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  vibe,
  onOpenPersona,
  onOpenControlCenter,
  onOpenCamera,
  onToggleConnect,
}) => {
  return (
    <header className="w-full border-b border-white/10 bg-black/60 backdrop-blur-2xl px-6 py-3.5 flex items-center justify-between gap-8 z-30">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-xl font-extrabold tracking-tight text-white whitespace-nowrap">
          SIRI AI
        </span>
        <span className="hidden sm:inline text-xs text-cyan-400 font-mono tracking-tight">
          · iPhone 18 Pro Siri Nepali
        </span>
      </div>

      {/* Zone 2: Navigation Links (Single-line prose, no pills) */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={onOpenControlCenter}
          className="hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
          <span>कन्ट्रोल सेन्टर</span>
        </button>
        <button
          onClick={onOpenCamera}
          className="hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Camera className="w-3.5 h-3.5 text-pink-400" />
          <span>क्यामेरा</span>
        </button>
        <button
          onClick={onOpenPersona}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          सिरी प्रोफाइल
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenControlCenter}
          className="md:hidden p-2 rounded-xl bg-white/10 text-white"
          aria-label="कन्ट्रोल सेन्टर"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleConnect}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 whitespace-nowrap shrink-0 ${
            state === 'disconnected'
              ? 'bg-gradient-to-r from-cyan-500 via-pink-500 to-rose-500 hover:from-cyan-400 hover:to-rose-400 text-white shadow-lg shadow-cyan-500/25'
              : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
          }`}
        >
          {state === 'disconnected' ? 'बोल्न सुरु गर्नुहोस्' : 'सत्र समाप्त'}
        </button>
      </div>
    </header>
  );
};
