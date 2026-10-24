import React, { useState, useEffect } from 'react';
import {
  X,
  Flashlight,
  Volume2,
  VolumeX,
  BatteryCharging,
  Battery,
  Camera,
  Calendar,
  CloudSun,
  FileText,
  Plus,
  Cpu,
  PhoneCall,
  MessageSquare,
  Zap,
  Volume1,
  WifiOff,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { DeviceState, QuickNote } from '../services/LiveSession';
import {
  systemMonitor,
  BatteryInfo,
  SystemMonitorConfig,
} from '../services/SystemMonitor';
import { weatherService, WeatherCondition } from '../services/WeatherService';

interface ControlCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceState: DeviceState;
  onToggleFlashlight: () => void;
  onToggleMute: () => void;
  onToggleLowPower: () => void;
  onOpenCamera: () => void;
  notes: QuickNote[];
  onAddNote: (content: string) => void;
  onOpenSetupWizard?: () => void;
  onReplayIntro?: () => void;
}

export const ControlCenterModal: React.FC<ControlCenterModalProps> = ({
  isOpen,
  onClose,
  deviceState,
  onToggleFlashlight,
  onToggleMute,
  onToggleLowPower,
  onOpenCamera,
  notes,
  onAddNote,
  onOpenSetupWizard,
  onReplayIntro,
}) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [battery, setBattery] = useState<BatteryInfo>(systemMonitor.getBatteryInfo());
  const [config, setConfig] = useState<SystemMonitorConfig>(systemMonitor.getConfig());
  const [weather, setWeather] = useState<WeatherCondition>(weatherService.getCurrentWeather());
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    const unsubBattery = systemMonitor.onBatteryChange((b) => setBattery(b));
    const unsubConfig = systemMonitor.onConfigChange((c) => setConfig(c));
    const unsubWeather = weatherService.onWeatherChange((w) => setWeather(w));
    return () => {
      unsubBattery();
      unsubConfig();
      unsubWeather();
    };
  }, []);

  if (!isOpen) return null;

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    onAddNote(newNoteText.trim());
    setNewNoteText('');
  };

  const showStatus = (msg: string) => {
    setTestStatus(msg);
    setTimeout(() => setTestStatus(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-2xl">
      <div className="relative w-full max-w-xl bg-slate-950 border border-cyan-500/30 rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(0,162,255,0.25)] animate-scaleUp text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/60">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse" />
            <div>
              <h3 className="text-base font-bold tracking-tight">
                SIRI · सेटिङ तथा प्रणाली जानकारी (Settings & Info)
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                ५ सेकेन्ड होल्ड गरी अनलक गरिएको गोप्य प्यानल
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenSetupWizard && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSetupWizard();
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-cyan-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-amber-500/20"
              >
                <span>👑 बोस १-पटक सेटअप</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="बन्द गर्नुहोस्"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Real-time Battery & Charger Announcer Section */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-black border border-cyan-500/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-cyan-300">
                <BatteryCharging className="w-5 h-5" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  स्मार्ट अटो-उद्घोषक (Auto Announcer & Battery)
                </h4>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-mono">
                <WifiOff className="w-3 h-3" />
                <span>१००% अफलाइन चल्ने</span>
              </div>
            </div>

            {/* Live Device Battery Gauge */}
            <div className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    battery.charging
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/10 text-cyan-300'
                  }`}
                >
                  {battery.charging ? (
                    <Zap className="w-6 h-6 animate-pulse" />
                  ) : (
                    <Battery className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-mono">{battery.level}%</span>
                    <span className="text-xs text-slate-300 font-semibold">
                      {battery.charging ? 'चार्जिङमा जोडिएको छ ⚡' : 'ब्याट्रीमा चलिरहेको छ'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {battery.supported
                      ? 'वास्तविक डिभाइस ब्याट्री सेन्सर सक्रिय छ'
                      : 'ब्याट्री सिम्युलेटर तथा भ्वाइस अलर्ट सक्रिय'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  systemMonitor.announceBatteryStatusNow();
                  showStatus('ब्याट्री स्थिति बोलियो!');
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-md shadow-cyan-600/30 cursor-pointer"
              >
                <Volume1 className="w-3.5 h-3.5" />
                <span>सोध्नुहोस्</span>
              </button>
            </div>

            {/* Live Test Triggers */}
            <p className="text-[11px] font-semibold text-slate-400 mb-2">
              नयाँ फिचरहरूको प्रत्यक्ष परीक्षण (Live Voice Tests):
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => {
                  systemMonitor.simulateLowBattery();
                  showStatus('थोरै ब्याट्री चेतावनी बोलियो!');
                }}
                className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 hover:bg-red-900/40 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold mb-1">
                  <Battery className="w-3.5 h-3.5" />
                  <span>थोरै ब्याट्री</span>
                </div>
                <p className="text-[10px] text-slate-300">
                  &quot;बोस, चार्ज एकदम थोरै...&quot;
                </p>
              </button>

              <button
                onClick={() => {
                  systemMonitor.simulateFullBattery();
                  showStatus('१००% फुल ब्याट्री चेतावनी बोलियो!');
                }}
                className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/40 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
                  <BatteryCharging className="w-3.5 h-3.5" />
                  <span>१००% फुल ब्याट्री</span>
                </div>
                <p className="text-[10px] text-slate-300">
                  &quot;नत्र फुल्लिन सक्छ...&quot;
                </p>
              </button>

              <button
                onClick={() => {
                  weatherService.triggerPowerOutageWeatherAlert();
                  showStatus('मौसम र लाइन जाने चेतावनी बज्यो!');
                }}
                className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 hover:bg-amber-900/40 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>लाइन जाने अलर्ट</span>
                </div>
                <p className="text-[10px] text-slate-300">
                  &quot;मौसम खराब छ, लाइन...&quot;
                </p>
              </button>

              <button
                onClick={() => {
                  onClose();
                  showStatus('फोन कल आउँदैछ...');
                  setTimeout(() => {
                    systemMonitor.triggerIncomingCall('राम शर्मा', '+९७७ ९८४१-१२३४५६');
                  }, 400);
                }}
                className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/60 text-left transition-all cursor-pointer shadow-lg shadow-cyan-900/30"
              >
                <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold mb-1">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>फोन कल टेस्ट</span>
                </div>
                <p className="text-[10px] text-cyan-200">
                  &quot;उठाऊँ कि काट्दिऊँ?&quot;
                </p>
              </button>

              <button
                onClick={() => {
                  systemMonitor.triggerIncomingMessage('आमा', 'बाबु घर कहिले आइपुग्छौ? खाना तयार छ।');
                  showStatus('म्यासेज आयो र सोधियो!');
                }}
                className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/40 hover:bg-purple-900/60 text-left transition-all cursor-pointer shadow-lg shadow-purple-900/30"
              >
                <div className="flex items-center gap-1.5 text-purple-300 text-xs font-bold mb-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>म्यासेज टेस्ट</span>
                </div>
                <p className="text-[10px] text-purple-200">
                  &quot;पढेर सुनाऊँ कि खोल्दिऊँ?&quot;
                </p>
              </button>

              <button
                onClick={() => {
                  systemMonitor.simulateChargerConnection(true);
                  showStatus('चार्जर जोडिएको आवाज परीक्षण...');
                }}
                className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 hover:bg-blue-900/40 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-blue-300 text-xs font-bold mb-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>चार्जिङ सुरु</span>
                </div>
                <p className="text-[10px] text-slate-300">
                  &quot;चार्जिङ सुरु भयो&quot;
                </p>
              </button>
            </div>

            {testStatus && (
              <div className="mt-2 text-center text-xs text-emerald-400 flex items-center justify-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{testStatus}</span>
              </div>
            )}

            {/* Replay Khatra Opening Animation Button */}
            {onReplayIntro && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => {
                    onClose();
                    onReplayIntro();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-900/60 via-purple-900/60 to-pink-900/60 hover:from-cyan-800/80 hover:via-purple-800/80 hover:to-pink-800/80 border border-cyan-400/40 text-cyan-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>खतरा ओपनिङ एनिमेसन पुनः हेर्नुहोस् (Replay Intro Animation)</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Hardware Controls */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              हार्डवेयर तथा डिभाइस नियन्त्रण
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Flashlight */}
              <button
                onClick={onToggleFlashlight}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  deviceState.flashlight
                    ? 'bg-yellow-400 text-black border-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.5)]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Flashlight className="w-6 h-6" />
                <span className="text-xs font-semibold">टर्च {deviceState.flashlight ? 'अन' : 'अफ'}</span>
              </button>

              {/* Camera */}
              <button
                onClick={() => {
                  onClose();
                  onOpenCamera();
                }}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 flex flex-col items-center justify-center gap-2 transition-all text-slate-300 cursor-pointer"
              >
                <Camera className="w-6 h-6 text-pink-400" />
                <span className="text-xs font-semibold">४८MP क्यामेरा</span>
              </button>

              {/* Silent Mode */}
              <button
                onClick={onToggleMute}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  deviceState.mute
                    ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.5)]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                {deviceState.mute ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                <span className="text-xs font-semibold">{deviceState.mute ? 'साइलेन्ट' : 'साउन्ड अन'}</span>
              </button>

              {/* Low Power Mode */}
              <button
                onClick={onToggleLowPower}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  deviceState.lowPower
                    ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <BatteryCharging className="w-6 h-6" />
                <span className="text-xs font-semibold">{deviceState.lowPower ? 'पावर सेभर अन' : 'ब्याट्री १००%'}</span>
              </button>
            </div>
          </div>

          {/* Widgets Row: Nepali Patro & Live Weather */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Nepali Date Widget */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-white/10">
              <div className="flex items-center gap-2 text-cyan-400 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">नेपाली क्यालेन्डर</span>
              </div>
              <p className="text-xl font-bold font-mono">२०८३ कार्तिक ०८ गते</p>
              <p className="text-xs text-slate-400 mt-1">
                शनिबार · शुक्ल पक्ष · शुभ साईत
              </p>
            </div>

            {/* Weather Widget */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-950/40 to-slate-900/60 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-amber-300">
                  <CloudSun className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">{weather.locationName} मौसम</span>
                </div>
                <span className="text-xs text-cyan-300 font-medium">{weather.conditionText}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono">{weather.temperature}°C</span>
                <span className="text-xs text-slate-400">
                  {weather.lineOutageRisk ? '⚠️ लाइन जान सक्ने जोखिम' : 'मौसम सामान्य'}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                <span className="text-[11px] text-slate-400">अपडेट: {weather.lastUpdated}</span>
                <button
                  onClick={() => weatherService.requestLocation(true)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                >
                  लोकेसन अपडेट
                </button>
              </div>
            </div>
          </div>

          {/* Quick Notes (Apple Intelligence Notes) */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-yellow-300">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">सिरी स्मार्ट नोटहरू</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">{notes.length} नोट सुरक्षित</span>
            </div>

            <form onSubmit={handleCreateNote} className="flex gap-2 mb-3">
              <input
                type="text"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="नयाँ नोट वा सम्झना थप्नुहोस्..."
                className="flex-1 px-3 py-1.5 text-xs bg-black/40 border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> थप्नुहोस्
              </button>
            </form>

            <div className="space-y-2 max-h-32 overflow-y-auto">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-start justify-between text-xs"
                >
                  <p className="text-slate-200">{note.content}</p>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
                    {note.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Siri System & Offline Info */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-sky-950/40 to-slate-900 border border-cyan-500/20 text-xs space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <Cpu className="w-4 h-4" />
              <span>Apple Intelligence · A19 Pro Bionic AI System</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono">
              <div className="p-2 rounded-lg bg-black/40">
                <span className="text-slate-500 block">भाषा:</span> १००% शुद्ध नेपाली
              </div>
              <div className="p-2 rounded-lg bg-black/40">
                <span className="text-slate-500 block">ब्याट्री / चार्जर अलर्ट:</span> सक्रिय (Background)
              </div>
              <div className="p-2 rounded-lg bg-black/40">
                <span className="text-slate-500 block">कल उद्घोषक:</span> &quot;काटौँ कि उठाऊँ&quot;
              </div>
              <div className="p-2 rounded-lg bg-black/40">
                <span className="text-slate-500 block">अफलाइन क्षमता:</span> पूर्ण समर्थित
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              माइक बटनलाई १ पटक क्लिक गर्दा सिरी सक्रिय वा रोकिन्छ। ५ सेकेन्ड लगातार थिचेर होल्ड गर्दा मात्र यो गोप्य सेटिङ तथा इन्फर्मेसन प्यानल खुल्दछ।
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-black/60 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors shadow-lg shadow-cyan-400/30 cursor-pointer"
          >
            बन्द गर्नुहोस्
          </button>
        </div>
      </div>
    </div>
  );
};
