import { nepaliVoice } from './NepaliVoiceEngine';

export interface WeatherCondition {
  locationName: string;
  temperature: number;
  conditionText: string;
  isSevere: boolean;
  severeReason?: string;
  lineOutageRisk: boolean;
  latitude?: number;
  longitude?: number;
  lastUpdated: string;
}

export interface WeatherAlertState {
  active: boolean;
  title: string;
  message: string;
  voiceText: string;
  riskLevel: 'moderate' | 'high' | 'extreme';
  timestamp: string;
}

class WeatherService {
  private currentLocation: { lat: number; lon: number } | null = null;
  private permissionGranted = false;
  private lastAlert: WeatherAlertState | null = null;
  private weatherData: WeatherCondition = {
    locationName: 'काठमाडौँ',
    temperature: 22,
    conditionText: 'सफा घाम',
    isSevere: false,
    lineOutageRisk: false,
    lastUpdated: 'अहिले',
  };

  private alertListeners: ((alert: WeatherAlertState | null) => void)[] = [];
  private weatherListeners: ((weather: WeatherCondition) => void)[] = [];

  constructor() {
    // Check if permission was already granted previously
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('siri_location_permitted');
      if (saved === 'true') {
        this.permissionGranted = true;
        this.requestLocation(false);
      }
    }
  }

  hasLocationPermission(): boolean {
    return this.permissionGranted;
  }

  getCurrentWeather(): WeatherCondition {
    return { ...this.weatherData };
  }

  getActiveAlert(): WeatherAlertState | null {
    return this.lastAlert;
  }

  /**
   * Request Location Permission from browser/phone
   */
  async requestLocation(announceVoice = true): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (announceVoice) {
        nepaliVoice.speak('बोस, यो डिभाइसमा लोकेसन सपोर्ट उपलब्ध छैन।');
      }
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          this.permissionGranted = true;
          this.currentLocation = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          };
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('siri_location_permitted', 'true');
          }

          if (announceVoice) {
            nepaliVoice.speak(
              'बोस, लोकेसन अनुमति प्राप्त भयो! अब मौसम खराब भएर लाइन जान सक्ने जोखिमको प्रत्यक्ष निगरानी सुरु भयो।'
            );
          }

          await this.fetchRealWeather(pos.coords.latitude, pos.coords.longitude);
          resolve(true);
        },
        (err) => {
          console.warn('Geolocation permission denied or failed:', err);
          this.permissionGranted = false;
          if (announceVoice) {
            nepaliVoice.speak('बोस, लोकेसन अनुमति दिइएन। तपाईंले सेटिङबाट कुनै पनि बेला खुला गर्न सक्नुहुन्छ।');
          }
          resolve(false);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    });
  }

  /**
   * Fetches real live weather data from Open-Meteo free API
   */
  async fetchRealWeather(lat: number, lon: number): Promise<void> {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather API status not ok');

      const data = await res.json();
      const current = data.current;
      const code = current?.weather_code ?? 0;
      const temp = Math.round(current?.temperature_2m ?? 22);
      const wind = current?.wind_speed_10m ?? 10;
      const precip = current?.precipitation ?? 0;

      // WMO Weather codes:
      // 51..57: Drizzle
      // 61..67: Rain
      // 71..77: Snow
      // 80..82: Showers
      // 95..99: Thunderstorm / Squall / Hail
      const isThunderstorm = code >= 95;
      const isHeavyRain = (code >= 63 && code <= 67) || code === 82 || precip > 5;
      const isSevereWind = wind > 35;

      const isSevere = isThunderstorm || isHeavyRain || isSevereWind;

      let conditionText = 'सफा मौसम';
      if (isThunderstorm) conditionText = 'चट्याङ र हावाहुरी';
      else if (isHeavyRain) conditionText = 'भारी वर्षा';
      else if (precip > 0) conditionText = 'हल्का झरी/पानी';
      else if (code > 2) conditionText = 'बादली';

      this.weatherData = {
        locationName: 'स्थानीय क्षेत्र',
        temperature: temp,
        conditionText,
        isSevere,
        lineOutageRisk: isSevere,
        latitude: lat,
        longitude: lon,
        lastUpdated: new Date().toLocaleTimeString('ne-NP', { hour: '2-digit', minute: '2-digit' }),
      };

      this.notifyWeatherListeners();

      if (isSevere) {
        this.triggerPowerOutageWeatherAlert(conditionText);
      }
    } catch (e) {
      console.warn('Weather fetch offline fallback used:', e);
      // Fallback stays intact
    }
  }

  /**
   * Trigger the Boss Line Cut / Storm Battery Alert:
   * "बोस, मौसम एकदम खराब छ, लाइन जान सक्छ, त्यसैले ब्याट्री फुल गरिहाल्नुहोस्!"
   */
  triggerPowerOutageWeatherAlert(reason = 'हावाहुरी र भारी वर्षा'): void {
    const alert: WeatherAlertState = {
      active: true,
      title: 'मौसम चेतावनी · बत्ती जान सक्ने जोखिम!',
      message: `मौसम खराब (${reason}) भएकाले लाइन जान सक्छ। कृपया डिभाइस तुरुन्त १००% चार्ज गर्नुहोस्!`,
      voiceText: 'बोस, मौसम एकदम खराब छ, लाइन जान सक्छ, त्यसैले ब्याट्री फुल गरिहाल्नुहोस्!',
      riskLevel: 'high',
      timestamp: new Date().toLocaleTimeString('ne-NP', { hour: '2-digit', minute: '2-digit' }),
    };

    this.lastAlert = alert;
    this.notifyAlertListeners();

    // Voice announcement with chime
    nepaliVoice.playChargerDisconnectedSound();
    setTimeout(() => {
      nepaliVoice.speak(alert.voiceText);
    }, 400);
  }

  dismissAlert(): void {
    this.lastAlert = null;
    this.notifyAlertListeners();
  }

  onAlertChange(cb: (alert: WeatherAlertState | null) => void): () => void {
    this.alertListeners.push(cb);
    return () => {
      this.alertListeners = this.alertListeners.filter((c) => c !== cb);
    };
  }

  onWeatherChange(cb: (weather: WeatherCondition) => void): () => void {
    this.weatherListeners.push(cb);
    return () => {
      this.weatherListeners = this.weatherListeners.filter((c) => c !== cb);
    };
  }

  private notifyAlertListeners(): void {
    this.alertListeners.forEach((cb) => cb(this.lastAlert));
  }

  private notifyWeatherListeners(): void {
    this.weatherListeners.forEach((cb) => cb({ ...this.weatherData }));
  }
}

export const weatherService = new WeatherService();
