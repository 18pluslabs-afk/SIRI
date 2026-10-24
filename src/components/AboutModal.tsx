import React from 'react';
import { X, Cpu, Mic, Volume2, Wrench, ShieldCheck } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-scaleUp">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-white">Voice Architecture Specs</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Gemini Live API</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-sm text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-3">
            <Mic className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white text-xs">नेपाली माइक्रोफोन इनपुट (16kHz PCM16)</p>
              <p className="text-xs text-slate-400 mt-1">
                नेपाली लवज र शब्दहरू स्पष्ट सुन्न AudioContext बाट १६,००० Hz मा लिनियर PCM अडियो प्रत्यक्ष रूपमा स्ट्रिम हुन्छ।
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-3">
            <Volume2 className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white text-xs">सिरी लाइभ स्पिकर आउटपुट (24kHz Raw Audio)</p>
              <p className="text-xs text-slate-400 mt-1">
                पूर्ण रूपमा अडियो-टु-अडियो मोडालिटी (`Modality.AUDIO`)। २४,००० Hz मा प्राकृतिक नेपाली स्वर र बीचमै रोक्न सकिने (Interruptible) क्षमता।
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-3">
            <Wrench className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white text-xs">iPhone 18 Pro Max सिरी टुल्स र एक्सन</p>
              <p className="text-xs text-slate-400 mt-1">
                टर्च अन/अफ, क्यामेरा स्न्याप, युट्युब/स्पोटिफाइ गीत प्ले, नेपाली क्यालेन्डर, मौसम, नोट थप्ने र हिसाब गर्ने रियल-टाइम टुल कलिङ।
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-3">
            <Cpu className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white text-xs">A19 Pro Bionic AI इन्जिन</p>
              <p className="text-xs text-slate-400 mt-1">
                Express/WebSocket सर्भर-साइड इन्जिन मार्फत सुरक्षित र अति-द्रुत नेपाली प्रोसेसिङ।
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-950/70 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
