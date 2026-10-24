import React from 'react';
import { AssistantState, BhapumVibe } from '../services/LiveSession';

interface SiriEdgeGlowProps {
  state: AssistantState;
  vibe: BhapumVibe;
}

export const SiriEdgeGlow: React.FC<SiriEdgeGlowProps> = ({ state, vibe }) => {
  if (state === 'disconnected') return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {/* 4-side iridescent Siri Apple Intelligence border glow */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          state === 'speaking'
            ? 'opacity-90 animate-pulse'
            : state === 'listening'
            ? 'opacity-75'
            : 'opacity-40'
        }`}
        style={{
          boxShadow:
            vibe === 'cyberNepal'
              ? 'inset 0 0 35px 8px rgba(6, 182, 212, 0.45), inset 0 0 70px 15px rgba(239, 68, 68, 0.35)'
              : vibe === 'flirty'
              ? 'inset 0 0 40px 10px rgba(244, 63, 94, 0.5), inset 0 0 70px 20px rgba(217, 70, 239, 0.35)'
              : vibe === 'golden'
              ? 'inset 0 0 40px 10px rgba(245, 158, 11, 0.5), inset 0 0 70px 20px rgba(234, 179, 8, 0.3)'
              : 'inset 0 0 35px 8px rgba(56, 189, 248, 0.45), inset 0 0 70px 18px rgba(236, 72, 153, 0.4), inset 0 0 100px 30px rgba(168, 85, 247, 0.3)',
        }}
      />

      {/* Thin radiant border rim */}
      <div
        className={`absolute inset-0 border-2 rounded-[28px] sm:rounded-[42px] transition-all duration-300 ${
          state === 'speaking'
            ? 'border-pink-400/60 shadow-[0_0_20px_rgba(244,63,94,0.6)]'
            : state === 'listening'
            ? 'border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.6)]'
            : 'border-yellow-400/40'
        }`}
      />
    </div>
  );
};
