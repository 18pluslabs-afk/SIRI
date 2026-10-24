import React, { useEffect, useRef } from 'react';
import { AudioStreamer } from '../services/AudioStreamer';
import { AssistantState, BhapumVibe } from '../services/LiveSession';

interface WaveformVisualizerProps {
  state: AssistantState;
  mood?: string;
  audioStreamer: AudioStreamer;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  state,
  mood,
  audioStreamer,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      let freqData: Uint8Array;
      if (state === 'speaking') {
        freqData = audioStreamer.getSpeakerFrequencies();
      } else if (state === 'listening') {
        freqData = audioStreamer.getMicFrequencies();
      } else {
        freqData = new Uint8Array(32);
      }

      const barCount = 36;
      const barWidth = Math.floor(width / (barCount * 1.6));
      const spacing = (width - barCount * barWidth) / (barCount - 1);

      for (let i = 0; i < barCount; i++) {
        const binIndex = Math.floor((i / barCount) * (freqData.length * 0.75));
        const val = (freqData[binIndex] || 0) / 255;

        // Base height when idle vs active
        const minHeight = state === 'disconnected' ? 2 : 4;
        const barHeight = Math.max(minHeight, val * (height * 0.85));

        const x = i * (barWidth + spacing);
        const y = centerY - barHeight / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (state === 'speaking') {
          grad.addColorStop(0, '#f43f5e'); // rose
          grad.addColorStop(0.5, '#ec4899'); // pink
          grad.addColorStop(1, '#a855f7'); // purple
        } else if (state === 'listening') {
          grad.addColorStop(0, '#22d3ee'); // cyan
          grad.addColorStop(0.5, '#06b6d4'); // teal-cyan
          grad.addColorStop(1, '#6366f1'); // indigo
        } else {
          grad.addColorStop(0, '#334155');
          grad.addColorStop(1, '#1e293b');
        }

        ctx.fillStyle = grad;
        // Rounded bar caps
        ctx.beginPath();
        const radius = Math.min(barWidth / 2, barHeight / 2);
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, mood, audioStreamer]);

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-2 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={480}
        height={64}
        className="w-full h-12 max-h-16 opacity-85"
      />
    </div>
  );
};
