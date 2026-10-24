import React, { useState, useEffect } from 'react';
import {
  X,
  Crown,
  MapPin,
  Volume2,
  Download,
  CheckCircle2,
  Sparkles,
  Zap,
  BatteryCharging,
  BatteryWarning,
  PhoneCall,
  MessageSquare,
  CloudLightning,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { systemMonitor } from '../services/SystemMonitor';
import { weatherService } from '../services/WeatherService';
import { nepaliVoice } from '../services/NepaliVoiceEngine';

interface BossSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BossSetupWizard: React.FC<BossSetupWizardProps> = ({ isOpen, onClose }) => {
  const [bossName, setBossName] = useState('बोस');
  const [locationGranted, setLocationGranted] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    // Check if location already granted
    setLocationGranted(weatherService.hasLocationPermission());

    // Listen for PWA beforeinstallprompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    // Check if running in standalone display mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;

  const showTestFeedback = (msg: string) => {
    setTestStatus(msg);
    setTimeout(() => setTestStatus(null), 3500);
  };

  const handleGrantLocation = async () => {
    const success = await weatherService.requestLocation(true);
    setLocationGranted(success);
    if (success) {
      showTestFeedback('लोकेसन अनुमति प्राप्त भयो! मौसम निगरानी सक्रिय।');
    }
  };

  const handleUnlockAudio = () => {
    nepaliVoice.playChargerConnectedSound();
    nepaliVoice.speak(`नमस्ते ${bossName}, अडियो र भ्वाइस पूर्ण रूपमा अनलक भयो!`);
    setAudioUnlocked(true);
    systemMonitor.initWakeLock();
    showTestFeedback('अडियो पूर्ण सक्रिय! अफलाइन अलर्ट तयार छ।');
  };

  const handleInstallPWA = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        nepaliVoice.speak('बोस, एप तपाईंको होम स्क्रिनमा इन्स्टल भयो!');
      }
      setInstallPrompt(null);
    } else {
      // Show instructions for iOS Safari / Chrome
      alert('ब्राउजरको सेयर (Share) बटन थिचेर "Add to Home Screen" छान्नुहोस्।');
    }
  };

  const handleSaveSetup = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('siri_boss_setup_completed', 'true');
      localStorage.setItem('siri_boss_name', bossName);
    }
    systemMonitor.updateConfig({ bossName });
    nepaliVoice.speak(
      `हजुर ${bossName}, स्थायी सेटअप पूरा भयो! अब माइक बन्द भए पनि वा नेट नभए पनि सबै अलर्टहरू स्वतः चल्नेछन्!`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-2xl animate-fadeIn select-none">
      <div className="relative w-full max-w-xl bg-slate-950 border border-cyan-500/40 rounded-[32px] overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.3)] text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-black">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                बोसको स्थायी १-पटक सेटअप
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  VIP Mode
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                नेट भए पनि नभए पनि, माइक अन वा अफ भए पनि अलर्ट बज्ने प्रणाली
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="बन्द गर्नुहोस्"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Status Feedback Banner */}
          {testStatus && (
            <div className="p-3 rounded-2xl bg-cyan-950/80 border border-cyan-400/50 flex items-center gap-2 text-cyan-200 text-xs font-semibold animate-fadeIn">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{testStatus}</span>
            </div>
          )}

          {/* 1. Boss Name Personalization */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              १. सम्बोधन (Title):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={bossName}
                onChange={(e) => setBossName(e.target.value)}
                placeholder="बोस / Boss / हजुर"
                className="flex-1 px-3.5 py-2 text-sm bg-black/50 border border-white/15 rounded-xl text-white focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => {
                  nepaliVoice.speak(`हजुर ${bossName}! म सधैं हजुरको सेवामा हाजिर छु।`);
                  showTestFeedback(`सम्बोधन: "${bossName}" सेट गरियो!`);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-cyan-600/30"
              >
                परीक्षण
              </button>
            </div>
          </div>

          {/* 2. Core Setup Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Location Permission for Weather & Power Outage */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold">
                    <MapPin className="w-4 h-4" />
                    <span>लोकेसन अनुमति</span>
                  </div>
                  {locationGranted ? (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> सक्रिय
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-bold">बाँकी</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  मौसम खराब भएर लाइन जान सक्ने बेला ब्याट्री फुल गर्ने चेतावनी दिन।
                </p>
              </div>
              <button
                onClick={handleGrantLocation}
                className={`mt-3 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  locationGranted
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{locationGranted ? 'अनुमति सुरक्षित छ' : 'अनुमति दिनुहोस्'}</span>
              </button>
            </div>

            {/* Audio Unlock for Background & Offline Voice */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold">
                    <Volume2 className="w-4 h-4" />
                    <span>स्थायी अडियो अनलक</span>
                  </div>
                  {audioUnlocked ? (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> अनलक
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-bold">आवश्यक</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  ब्राउजरले अडियो नरोकोस् भनी १ पटक क्लिक गरी स्थायी सक्रिय गर्नुहोस्।
                </p>
              </div>
              <button
                onClick={handleUnlockAudio}
                className="mt-3 py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-600/30"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>अडियो अनलक गर्नुहोस्</span>
              </button>
            </div>
          </div>

          {/* 3. Install to Home Screen (PWA Standalone) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/40 to-slate-900 border border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">होम स्क्रिनमा राख्नुहोस् (Install PWA)</h4>
                <p className="text-[11px] text-slate-400">
                  {isInstalled
                    ? 'एप पहिले नै होम स्क्रिनमा इन्स्टल छ'
                    : 'होम स्क्रिनबाट सिधै स्थायी रूपमा चलाउनुहोस्'}
                </p>
              </div>
            </div>
            <button
              onClick={handleInstallPWA}
              disabled={isInstalled}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isInstalled
                  ? 'bg-white/10 text-slate-400 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/30'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>{isInstalled ? 'इन्स्टल भइसकेको' : 'इन्स्टल'}</span>
            </button>
          </div>

          {/* 4. Live Trigger Tests (The "खतरा खतरा" User Features) */}
          <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30">
            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>प्रत्यक्ष अलर्ट परीक्षण (Live Voice Tests):</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* Test Low Battery */}
              <button
                onClick={() => {
                  systemMonitor.simulateLowBattery();
                  showTestFeedback('थोरै ब्याट्री अलर्ट बोलियो!');
                }}
                className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 hover:bg-red-900/50 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1 text-red-400 text-xs font-bold mb-1">
                  <BatteryWarning className="w-4 h-4" />
                  <span>थोरै ब्याट्री</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight">
                  &quot;बोस, चार्ज एकदम थोरै भएको छ...&quot;
                </p>
              </button>

              {/* Test Full Battery */}
              <button
                onClick={() => {
                  systemMonitor.simulateFullBattery();
                  showTestFeedback('१००% फुल ब्याट्री चेतावनी बोलियो!');
                }}
                className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-900/50 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold mb-1">
                  <BatteryCharging className="w-4 h-4" />
                  <span>फुल ब्याट्री (१००%)</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight">
                  &quot;नत्र ब्याट्री फुल्लिन सक्छ...&quot;
                </p>
              </button>

              {/* Test Weather Power Outage Alert */}
              <button
                onClick={() => {
                  weatherService.triggerPowerOutageWeatherAlert('हावाहुरी र चट्याङ');
                  showTestFeedback('मौसम र लाइन जाने अलर्ट बज्यो!');
                }}
                className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 hover:bg-amber-900/50 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1 text-amber-400 text-xs font-bold mb-1">
                  <CloudLightning className="w-4 h-4" />
                  <span>लाइन जाने अलर्ट</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight">
                  &quot;मौसम खराब छ, लाइन जान सक्छ...&quot;
                </p>
              </button>

              {/* Test Phone Call */}
              <button
                onClick={() => {
                  onClose();
                  setTimeout(() => {
                    systemMonitor.triggerIncomingCall('राम शर्मा', '+९७७ ९८४१-xxxxxx');
                  }, 300);
                }}
                className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 hover:bg-cyan-900/50 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1 text-cyan-300 text-xs font-bold mb-1">
                  <PhoneCall className="w-4 h-4" />
                  <span>फोन कल टेस्ट</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight">
                  &quot;उठाऊँ कि काट्दिऊँ?&quot;
                </p>
              </button>

              {/* Test Message */}
              <button
                onClick={() => {
                  systemMonitor.triggerIncomingMessage('आमा', 'बाबु घर कहिले आइपुग्छौ? खाना तयार छ।');
                  showTestFeedback('म्यासेज आयो र सोध्यो!');
                }}
                className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/40 hover:bg-purple-900/50 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1 text-purple-300 text-xs font-bold mb-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>म्यासेज टेस्ट</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight">
                  &quot;पढेर सुनाऊँ कि खोल्दिऊँ?&quot;
                </p>
              </button>

              {/* Test Charger Plugged/Unplugged */}
              <button
                onClick={() => {
                  systemMonitor.simulateChargerConnection(true);
                  showTestFeedback('चार्जिङ सुरु भयो!');
                }}
                className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/40 hover:bg-blue-900/50 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1 text-blue-300 text-xs font-bold mb-1">
                  <Zap className="w-4 h-4" />
                  <span>चार्जर प्लग टेस्ट</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight">
                  &quot;हजुर बोस, चार्जिङ सुरु भयो...&quot;
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-black/80 border-t border-white/10 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 font-mono">
            १ पटक सेटअप भएपछि सधैं स्थायी रूपमा चल्छ
          </p>
          <button
            onClick={handleSaveSetup}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-extrabold text-xs shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all active:scale-95 cursor-pointer"
          >
            स्थायी सेटअप सुरक्षित गर्नुहोस्
          </button>
        </div>
      </div>
    </div>
  );
};
