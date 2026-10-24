import React, { useState } from 'react';
import { X, Sparkles, Flame, Heart, Zap, MessageCircle, ShieldCheck, Cpu } from 'lucide-react';
import { BhapumVibe } from '../services/LiveSession';

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVibe: BhapumVibe;
  onSelectVibe: (vibe: BhapumVibe) => void;
}

const VIBES: { id: BhapumVibe; label: string; desc: string }[] = [
  {
    id: 'siriGlow',
    label: 'Apple Intelligence Siri Glow',
    desc: 'इरिडेसेन्ट इन्द्रेणी लाइट बर्डर, iPhone 18 Pro Max को ओरिजिनल सिरी शैली।',
  },
  {
    id: 'cyberNepal',
    label: 'साइबर नेपाल (Crimson & Azure)',
    desc: 'नेपालको झन्डाको रातो र निलो आधुनिक नियोन साइबर थिम।',
  },
  {
    id: 'flirty',
    label: 'मायालु र जिस्क्याउने (Flirty)',
    desc: 'मिठो, न्यानो र चञ्चल बेस्टफ्रेन्ड लवजको गुलाबी प्रकाश।',
  },
  {
    id: 'sassy',
    label: 'चतुर र कडा (Sassy & Bold)',
    desc: 'तीखो बुद्धिमत्ता, रमाइलो व्यङ्ग्य र आत्मविश्वासी शैली।',
  },
  {
    id: 'golden',
    label: 'सुनौलो आभा (Golden Aura)',
    desc: 'शाही प्रिमियम गोल्ड ग्लो र शान्त ध्वनि।',
  },
  {
    id: 'stealth',
    label: 'स्टेल्थ प्रो (Titanium Dark)',
    desc: 'न्यूनतम प्रकाश र ब्याट्री-बचत सुपर डार्क मोड।',
  },
];

const NEPALI_PROMPTS = [
  '“सिरी, टर्च बालिदेऊ न”',
  '“युट्युबमा नयाँ नेपाली गीत बजाऊ”',
  '“काठमाडौँको मौसम कस्तो छ आज?”',
  '“एउटा ५ मिनेटको चिया टाइमर राख”',
  '“सिरी, तिम्रा मुख्य विशेषताहरू के-के हुन्?”',
  '“मेरो राम्रो फोटो खिच”',
  '“डलरको नेपाली भाउ कति पुग्यो?”',
  '“एउटा हाँसो उठ्ने जोक सुनाऊ न”',
];

export const PersonaModal: React.FC<PersonaModalProps> = ({
  isOpen,
  onClose,
  currentVibe,
  onSelectVibe,
}) => {
  const [imageError, setImageError] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-2xl">
      <div className="relative w-full max-w-lg bg-slate-950 border border-white/20 rounded-3xl overflow-hidden shadow-2xl animate-scaleUp text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/50">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold">SIRI (सिरी) को परिचय</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-xs text-cyan-400 font-mono">iPhone 18 Pro Max</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="बन्द गर्नुहोस्"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Avatar and Bio */}
          <div className="flex items-start gap-4">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 border-cyan-400/50 bg-slate-900 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              {!imageError ? (
                <img
                  src="/src/assets/images/bhapum_avatar_1792837857093.jpg"
                  alt="Siri Avatar"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-cyan-900 to-rose-900 text-cyan-200">
                  <Sparkles className="w-8 h-8" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight text-white">SIRI (सिरी)</h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Nepali Edition
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                iPhone 18 Pro Max को Apple Intelligence Siri, शुद्ध नेपाली बोल्ने चतुर, फूर्तिलो र शक्तिशाली भ्वाइस असिस्टेन्ट।
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2 font-mono">
                <span>१६kHz अडियो इनपुट</span>
                <span aria-hidden="true">·</span>
                <span>२४kHz लाइभ स्पिकर</span>
              </div>
            </div>
          </div>

          {/* Siri Glow Vibe Aura Customization */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              सिरी लाइट आभा र भाइब चयन गर्नुहोस्
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {VIBES.map((v) => {
                const isSelected = currentVibe === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => onSelectVibe(v.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                        : 'bg-white/5 border-white/10 hover:border-white/25 text-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold text-white mb-1">{v.label}</p>
                    <p className="text-[11px] text-slate-400 leading-tight">{v.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice Banter Examples */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <MessageCircle className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                सिरीसँग बोलेर अह्राउन सकिने कुराहरू
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {NEPALI_PROMPTS.map((prompt, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 font-mono tracking-tight"
                >
                  {prompt}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-black/60 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors shadow-lg shadow-cyan-400/30"
          >
            हुन्छ, कुरा गरौँ
          </button>
        </div>
      </div>
    </div>
  );
};
