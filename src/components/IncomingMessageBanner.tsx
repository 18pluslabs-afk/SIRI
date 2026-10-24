import React from 'react';
import { MessageSquare, X, Volume2, ExternalLink, Check, User, CornerDownLeft } from 'lucide-react';
import { IncomingMessageData, systemMonitor } from '../services/SystemMonitor';

interface IncomingMessageBannerProps {
  message: IncomingMessageData | null;
  onDismiss: () => void;
}

export const IncomingMessageBanner: React.FC<IncomingMessageBannerProps> = ({
  message,
  onDismiss,
}) => {
  if (!message) return null;

  // 1. If Boss clicked "खोल्देउ", render Full Message Detail Modal
  if (message.isOpenModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
        <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 to-black border border-cyan-500/40 rounded-3xl p-5 shadow-[0_0_50px_rgba(6,182,212,0.35)] text-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-600/30 border border-cyan-400 flex items-center justify-center">
                <User className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{message.sender}</h3>
                <span className="text-[10px] text-cyan-400 font-mono">सन्देश विवरण · {message.time}</span>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Bubble Message */}
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 mb-4">
            <p className="text-sm text-slate-100 leading-relaxed font-sans">{message.content}</p>
          </div>

          {/* Quick Voice Read & Reply bar */}
          <div className="flex gap-2">
            <button
              onClick={() => systemMonitor.readCurrentMessage()}
              className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-600/30"
            >
              <Volume2 className="w-4 h-4" />
              <span>आवाजमा पढ्नुहोस्</span>
            </button>
            <button
              onClick={onDismiss}
              className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            >
              बन्द गर्नुहोस्
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Dynamic Island Style Top Banner with "पढेर सुनाऊँ कि खोल्दिऊँ?" Prompt
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md animate-slideDown select-none">
      <div className="bg-slate-950/95 border border-cyan-500/40 rounded-3xl p-3.5 shadow-[0_10px_40px_rgba(0,162,255,0.4)] backdrop-blur-2xl text-white">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-bold text-cyan-300 truncate">{message.sender} बाट म्यासेज</span>
              <span className="text-[10px] text-slate-400 font-mono shrink-0">{message.time}</span>
            </div>
            <p className="text-xs text-amber-300 font-medium leading-snug">
              &quot;पढेर सुनाऊँ कि खोल्दिऊँ?&quot;
            </p>
            {message.isRead && (
              <p className="text-[11px] text-slate-300 mt-1 italic border-l-2 border-cyan-500 pl-2">
                &ldquo;{message.content}&rdquo;
              </p>
            )}
          </div>

          <button
            onClick={onDismiss}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="बन्द गर्नुहोस्"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons: "पढ्देउ" & "खोल्देउ" */}
        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
          <span className="text-[10px] text-cyan-400/80 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            भ्वाइस: &quot;पढ्देउ&quot; वा &quot;खोल्देउ&quot;
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => systemMonitor.readCurrentMessage()}
              className="px-3 py-1.5 rounded-xl bg-cyan-600/80 hover:bg-cyan-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm shadow-cyan-500/30 active:scale-95"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>पढ्देउ</span>
            </button>

            <button
              onClick={() => systemMonitor.openCurrentMessage()}
              className="px-3 py-1.5 rounded-xl bg-purple-600/80 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm shadow-purple-500/30 active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>खोल्देउ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
