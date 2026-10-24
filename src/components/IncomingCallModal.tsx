import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Mic, Volume2, User, Grid } from 'lucide-react';
import { IncomingCallData, systemMonitor } from '../services/SystemMonitor';

interface IncomingCallModalProps {
  call: IncomingCallData | null;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({ call }) => {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);

  useEffect(() => {
    let timer: number | null = null;
    if (call?.status === 'connected') {
      const startTime = call.startedAt || Date.now();
      timer = window.setInterval(() => {
        setCallDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      setCallDuration(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [call?.status, call?.startedAt]);

  if (!call) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isRinging = call.status === 'ringing';
  const isConnected = call.status === 'connected';
  const isEnded = call.status === 'ended';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fadeIn">
      {/* iPhone Glassmorphic Call Card */}
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900/90 via-black to-black border border-cyan-500/40 rounded-[40px] p-6 shadow-[0_0_70px_rgba(6,182,212,0.35)] text-white flex flex-col items-center justify-between min-h-[520px]">
        {/* Top Header */}
        <div className="w-full flex flex-col items-center pt-2">
          <div className="w-12 h-1 bg-white/20 rounded-full mb-4" />
          <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold mb-1">
            {isRinging && 'आगमन कल · Incoming Call'}
            {isConnected && 'कल चलिरहेको छ · In Call'}
            {isEnded && 'कल समाप्त भयो'}
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">{call.callerName}</h2>
          <p className="text-xs text-slate-400 font-mono mt-1">{call.callerNumber}</p>
        </div>

        {/* Central Avatar & Status */}
        <div className="relative my-6 flex flex-col items-center">
          <div
            className={`w-28 h-28 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.5)] ${
              isRinging ? 'animate-pulse scale-105' : ''
            }`}
          >
            <User className="w-14 h-14 text-white" />
          </div>

          {/* Voice Prompt Badge */}
          {isRinging && (
            <div className="mt-5 px-4 py-2 rounded-full bg-cyan-950/80 border border-cyan-400/40 flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-bounce">
              <Mic className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span className="text-xs font-semibold text-cyan-200">
                भन्नुहोस्: &quot;उठाऊ&quot; वा &quot;काट&quot;
              </span>
            </div>
          )}

          {isConnected && (
            <div className="mt-4 text-center">
              <span className="text-xl font-mono text-cyan-300 font-bold tracking-wider">
                {formatDuration(callDuration)}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">HD अडियो कल सक्रिय</p>
            </div>
          )}

          {isEnded && (
            <div className="mt-4 text-center">
              <span className="text-sm font-semibold text-rose-400">कल काटियो</span>
            </div>
          )}
        </div>

        {/* In-Call Controls (when connected) */}
        {isConnected && (
          <div className="grid grid-cols-3 gap-4 w-full mb-6 px-4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3.5 rounded-2xl flex flex-col items-center gap-1 transition-all ${
                isMuted ? 'bg-rose-500/30 text-rose-300' : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              <Mic className="w-5 h-5" />
              <span className="text-[10px]">{isMuted ? 'म्युट छ' : 'म्युट'}</span>
            </button>
            <button
              onClick={() => setIsSpeaker(!isSpeaker)}
              className={`p-3.5 rounded-2xl flex flex-col items-center gap-1 transition-all ${
                isSpeaker ? 'bg-cyan-500/30 text-cyan-300' : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              <Volume2 className="w-5 h-5" />
              <span className="text-[10px]">स्पिकर</span>
            </button>
            <button
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white flex flex-col items-center gap-1 transition-all"
            >
              <Grid className="w-5 h-5" />
              <span className="text-[10px]">कीप्याड</span>
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex items-center justify-around pb-2">
          {isRinging && (
            <>
              {/* Decline (काट) */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => systemMonitor.declineCall()}
                  className="w-18 h-18 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 flex items-center justify-center shadow-[0_0_30px_rgba(225,29,72,0.6)] transition-all cursor-pointer"
                  aria-label="कल काट्नुहोस्"
                >
                  <PhoneOff className="w-8 h-8 text-white rotate-[135deg]" />
                </button>
                <span className="text-xs font-bold text-rose-300">काट (Decline)</span>
              </div>

              {/* Accept (उठाऊ) */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => systemMonitor.answerCall()}
                  className="w-18 h-18 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.7)] transition-all cursor-pointer animate-pulse"
                  aria-label="कल उठाउनुहोस्"
                >
                  <Phone className="w-8 h-8 text-white" />
                </button>
                <span className="text-xs font-bold text-emerald-300">उठाऊ (Answer)</span>
              </div>
            </>
          )}

          {isConnected && (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => systemMonitor.declineCall()}
                className="w-18 h-18 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 flex items-center justify-center shadow-[0_0_30px_rgba(225,29,72,0.6)] transition-all cursor-pointer"
                aria-label="कल समाप्त गर्नुहोस्"
              >
                <PhoneOff className="w-8 h-8 text-white" />
              </button>
              <span className="text-xs font-bold text-rose-300">काट (End Call)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
