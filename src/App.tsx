import React, { useEffect, useMemo, useState } from 'react';
import { SiriOrbButton } from './components/SiriOrbButton';
import { ControlCenterModal } from './components/ControlCenterModal';
import { CameraViewfinderModal } from './components/CameraViewfinderModal';
import { IncomingCallModal } from './components/IncomingCallModal';
import { IncomingMessageBanner } from './components/IncomingMessageBanner';
import { WeatherAlertBanner } from './components/WeatherAlertBanner';
import { BossSetupWizard } from './components/BossSetupWizard';
import { OpeningSplashAnimation } from './components/OpeningSplashAnimation';
import {
  AssistantState,
  DeviceState,
  LiveSession,
  QuickNote,
} from './services/LiveSession';
import {
  systemMonitor,
  IncomingCallData,
  IncomingMessageData,
} from './services/SystemMonitor';
import { weatherService, WeatherAlertState } from './services/WeatherService';
import { Flashlight, Crown, Sparkles, Mic, MicOff } from 'lucide-react';

export default function App() {
  const session = useMemo(() => new LiveSession(), []);

  const [state, setState] = useState<AssistantState>('disconnected');
  const [deviceState, setDeviceState] = useState<DeviceState>(session.getDeviceState());
  const [notes, setNotes] = useState<QuickNote[]>(session.getNotes());

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);
  const [showOpeningAnimation, setShowOpeningAnimation] = useState(true);

  // Background System Monitor states (Battery, Incoming Call & Message)
  const [activeCall, setActiveCall] = useState<IncomingCallData | null>(null);
  const [activeMessage, setActiveMessage] = useState<IncomingMessageData | null>(null);
  const [activeWeatherAlert, setActiveWeatherAlert] = useState<WeatherAlertState | null>(null);

  useEffect(() => {
    const unsubState = session.onStateChange((s) => setState(s));
    const unsubDevice = session.onDeviceChange((d) => {
      setDeviceState(d);
      if (d.cameraOpen) {
        setIsCameraOpen(true);
      }
    });
    const unsubNotes = session.onNotesChange((n) => setNotes(n));

    // Listen to background system alerts (even when assistant is disconnected)
    const unsubCall = systemMonitor.onCallChange((call) => setActiveCall(call));
    const unsubMsg = systemMonitor.onMessageChange((msg) => setActiveMessage(msg));
    const unsubWeather = weatherService.onAlertChange((alert) => setActiveWeatherAlert(alert));

    // Check if Boss Setup has been completed initially
    if (typeof localStorage !== 'undefined') {
      const setupCompleted = localStorage.getItem('siri_boss_setup_completed');
      if (!setupCompleted) {
        const timer = window.setTimeout(() => {
          setIsSetupWizardOpen(true);
        }, 1000);
        return () => {
          window.clearTimeout(timer);
          unsubState();
          unsubDevice();
          unsubNotes();
          unsubCall();
          unsubMsg();
          unsubWeather();
        };
      }
    }

    return () => {
      unsubState();
      unsubDevice();
      unsubNotes();
      unsubCall();
      unsubMsg();
      unsubWeather();
      session.stop();
    };
  }, [session]);

  const toggleSession = () => {
    if (state === 'disconnected') {
      session.start();
    } else {
      session.stop();
    }
  };

  const handleToggleFlashlight = () => {
    session.setDeviceProperty('flashlight', !deviceState.flashlight);
  };

  const handleToggleMute = () => {
    session.setDeviceProperty('mute', !deviceState.mute);
  };

  const handleToggleLowPower = () => {
    session.setDeviceProperty('lowPower', !deviceState.lowPower);
  };

  const handleAddNote = (content: string) => {
    const newNote: QuickNote = {
      id: String(Date.now()),
      content,
      time: new Date().toLocaleTimeString('ne-NP', { hour: '2-digit', minute: '2-digit' }),
      category: 'todo',
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
  };

  return (
    <div className="relative w-screen h-screen bg-[#000000] overflow-hidden flex items-center justify-center select-none">
      {/* Screen Flashlight Torch Mode (when flashlight is ON) */}
      {deviceState.flashlight && (
        <div className="fixed top-4 right-4 z-50 pointer-events-none">
          <div className="bg-yellow-400 text-black px-3.5 py-1.5 rounded-full text-xs font-bold shadow-[0_0_30px_rgba(250,204,21,0.9)] flex items-center gap-1.5 animate-pulse">
            <Flashlight className="w-4 h-4" />
            <span>टर्च अन छ</span>
          </div>
        </div>
      )}

      {/* Severe Weather / Power Cut Warning Banner */}
      <WeatherAlertBanner
        alert={activeWeatherAlert}
        onDismiss={() => weatherService.dismissAlert()}
      />

      {/* Dynamic Island Style Message Notification Banner ("पढेर सुनाऊँ कि खोल्दिऊँ?") */}
      <IncomingMessageBanner
        message={activeMessage}
        onDismiss={() => systemMonitor.dismissCurrentMessage()}
      />

      {/* Floating Active Mic Status & Instant Mute Bar (Top Center) */}
      {state !== 'disconnected' && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 sm:gap-3 px-4 py-2 rounded-full bg-black/90 border border-red-500/70 shadow-[0_0_25px_rgba(239,68,68,0.55)] backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping absolute" />
            <span className="w-2 h-2 rounded-full bg-red-400 relative" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-red-200">
            {state === 'speaking' ? '🔊 सिरी जवाफ दिँदैछ' : '🔴 माइक अन छ (सुन्दैछ...)'}
          </span>
          <button
            onClick={toggleSession}
            className="ml-1 px-3 py-1 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.8)] cursor-pointer active:scale-95 transition-all"
            title="माइक तत्काल बन्द गर्नुहोस् (Turn Off Mic)"
          >
            <MicOff className="w-3.5 h-3.5" />
            <span>माइक बन्द (Off)</span>
          </button>
        </div>
      )}

      {/* Pure Black Canvas with the Exact Photo Glowing Microphone Orb in Center */}
      <main className="relative z-10 flex items-center justify-center w-full h-full">
        <SiriOrbButton
          state={state}
          audioStreamer={session.getAudioStreamer()}
          onTap={toggleSession}
          onLongPressComplete={() => setIsSettingsOpen(true)}
        />
      </main>

      {/* Discreet VIP Boss Setup Shortcut & Intro Replay (Bottom corner) */}
      <div className="fixed bottom-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setShowOpeningAnimation(true)}
          className="opacity-30 hover:opacity-100 transition-opacity p-2 rounded-full bg-white/5 hover:bg-white/10 text-cyan-400 text-xs flex items-center gap-1 cursor-pointer"
          title="ओपनिङ एनिमेसन पुनः हेर्नुहोस् (Replay Intro Animation)"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span className="text-[10px] hidden sm:inline">इन्ट्रो</span>
        </button>

        <button
          onClick={() => setIsSetupWizardOpen(true)}
          className="opacity-30 hover:opacity-100 transition-opacity p-2 rounded-full bg-white/5 hover:bg-white/10 text-cyan-400 text-xs flex items-center gap-1 cursor-pointer"
          title="बोस १-पटक सेटअप खोल्नुहोस्"
        >
          <Crown className="w-3.5 h-3.5 text-amber-300" />
          <span className="text-[10px] hidden sm:inline">बोस सेटअप</span>
        </button>
      </div>

      {/* Incoming Phone Call Modal ("उठाऊँ कि काट्दिऊँ?") */}
      <IncomingCallModal call={activeCall} />

      {/* VIP Boss Setup Wizard (1-Time Setup & Test Command Center) */}
      <BossSetupWizard
        isOpen={isSetupWizardOpen}
        onClose={() => setIsSetupWizardOpen(false)}
      />

      {/* Hidden Settings & Information Modal (Unlocked ONLY after 5 seconds click & hold) */}
      <ControlCenterModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        deviceState={deviceState}
        onToggleFlashlight={handleToggleFlashlight}
        onToggleMute={handleToggleMute}
        onToggleLowPower={handleToggleLowPower}
        onOpenCamera={() => setIsCameraOpen(true)}
        notes={notes}
        onAddNote={handleAddNote}
        onOpenSetupWizard={() => setIsSetupWizardOpen(true)}
        onReplayIntro={() => setShowOpeningAnimation(true)}
      />

      {/* Camera Viewfinder (Voice or Control Center trigger) */}
      <CameraViewfinderModal
        isOpen={isCameraOpen}
        onClose={() => {
          setIsCameraOpen(false);
          session.setDeviceProperty('cameraOpen', false);
        }}
        mode={deviceState.cameraMode}
      />

      {/* Khatra Opening Animation on App Launch or Replay */}
      {showOpeningAnimation && (
        <OpeningSplashAnimation
          onComplete={() => setShowOpeningAnimation(false)}
        />
      )}
    </div>
  );
}
