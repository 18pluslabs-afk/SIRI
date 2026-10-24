import React from 'react';
import { AlertTriangle, CloudLightning, X, Zap } from 'lucide-react';
import { WeatherAlertState, weatherService } from '../services/WeatherService';

interface WeatherAlertBannerProps {
  alert: WeatherAlertState | null;
  onDismiss: () => void;
}

export const WeatherAlertBanner: React.FC<WeatherAlertBannerProps> = ({
  alert,
  onDismiss,
}) => {
  if (!alert) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md animate-bounce select-none">
      <div className="bg-gradient-to-r from-red-950/95 via-amber-950/95 to-slate-950/95 border-2 border-amber-500/70 rounded-3xl p-4 shadow-[0_0_50px_rgba(245,158,11,0.5)] backdrop-blur-2xl text-white">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center shrink-0">
            <CloudLightning className="w-6 h-6 text-amber-300 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                {alert.title}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{alert.timestamp}</span>
            </div>

            <p className="text-xs font-semibold text-white mt-1 leading-snug">
              &quot;{alert.voiceText}&quot;
            </p>
            <p className="text-[11px] text-amber-200/90 mt-1 font-sans">
              {alert.message}
            </p>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="बन्द गर्नुहोस्"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Indicator */}
        <div className="mt-3 pt-2 border-t border-amber-500/30 flex items-center justify-between">
          <span className="text-[10px] text-amber-300 font-medium flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            बत्ती जान सक्ने उच्च जोखिम छ
          </span>
          <button
            onClick={() => {
              weatherService.triggerPowerOutageWeatherAlert();
            }}
            className="px-2.5 py-1 rounded-lg bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 text-[10px] font-bold transition-all"
          >
            आवाज पुन: सुन्नुहोस्
          </button>
        </div>
      </div>
    </div>
  );
};
