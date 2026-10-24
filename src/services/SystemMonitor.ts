import { nepaliVoice } from './NepaliVoiceEngine';

export interface BatteryInfo {
  supported: boolean;
  charging: boolean;
  level: number; // 0 to 100
  chargingTime: number;
  dischargingTime: number;
}

export interface IncomingCallData {
  id: string;
  callerName: string;
  callerNumber: string;
  avatarUrl?: string;
  status: 'ringing' | 'connected' | 'ended';
  startedAt?: number;
}

export interface IncomingMessageData {
  id: string;
  sender: string;
  content: string;
  time: string;
  isOpenModal?: boolean;
  isRead?: boolean;
}

export interface SystemMonitorConfig {
  announceCharger: boolean;
  announceBatteryLow: boolean;
  announceBatteryFull: boolean;
  announceCalls: boolean;
  announceMessages: boolean;
  bossName: string;
}

class SystemMonitorService {
  private batteryInfo: BatteryInfo = {
    supported: false,
    charging: false,
    level: 85,
    chargingTime: 0,
    dischargingTime: 0,
  };

  private config: SystemMonitorConfig = {
    announceCharger: true,
    announceBatteryLow: true,
    announceBatteryFull: true,
    announceCalls: true,
    announceMessages: true,
    bossName: 'बोस',
  };

  private activeCall: IncomingCallData | null = null;
  private activeMessage: IncomingMessageData | null = null;
  private speechRecognizer: any = null;
  private isListeningForCommand = false;
  private listeningContext: 'call' | 'message' | null = null;

  private batteryListeners: ((info: BatteryInfo) => void)[] = [];
  private callListeners: ((call: IncomingCallData | null) => void)[] = [];
  private messageListeners: ((msg: IncomingMessageData | null) => void)[] = [];
  private configListeners: ((cfg: SystemMonitorConfig) => void)[] = [];

  private wakeLockSentinel: any = null;
  private lastLowBatteryAnnounceLevel: number | null = null;
  private lastFullBatteryAnnounced = false;

  constructor() {
    this.initBattery();
    this.initVoiceRecognizer();
    this.initWakeLock();
  }

  // --- Background Wake Lock Keep-Alive ---
  async initWakeLock(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
        });
        return true;
      } catch (err) {
        console.warn('Wake Lock request ignored or failed:', err);
      }
    }
    return false;
  }

  // --- Configuration ---
  getConfig(): SystemMonitorConfig {
    return { ...this.config };
  }

  updateConfig(partial: Partial<SystemMonitorConfig>): void {
    this.config = { ...this.config, ...partial };
    this.configListeners.forEach((cb) => cb(this.config));
  }

  onConfigChange(cb: (cfg: SystemMonitorConfig) => void): () => void {
    this.configListeners.push(cb);
    return () => {
      this.configListeners = this.configListeners.filter((c) => c !== cb);
    };
  }

  // --- Real-Time Battery API & Boss Low/Full Battery Alerts ---
  private async initBattery(): Promise<void> {
    if (typeof navigator === 'undefined') return;

    if ('getBattery' in navigator) {
      try {
        const battery: any = await (navigator as any).getBattery();
        this.updateBatteryState(battery, true);

        battery.addEventListener('chargingchange', () => {
          this.handleChargingChange(battery);
        });

        battery.addEventListener('levelchange', () => {
          this.handleLevelChange(battery);
        });
      } catch (err) {
        console.warn('Battery API not permitted or available:', err);
      }
    } else {
      this.batteryInfo = {
        supported: false,
        charging: false,
        level: 82,
        chargingTime: 0,
        dischargingTime: 0,
      };
      this.notifyBatteryListeners();
    }
  }

  private updateBatteryState(battery: any, isInitial = false): void {
    const levelPercent = Math.round((battery.level || 1) * 100);
    const charging = Boolean(battery.charging);

    this.batteryInfo = {
      supported: true,
      charging,
      level: levelPercent,
      chargingTime: battery.chargingTime || 0,
      dischargingTime: battery.dischargingTime || 0,
    };

    if (isInitial) {
      // Check immediately on startup
      if (!charging && levelPercent <= 20) {
        this.announceLowBattery(levelPercent);
      } else if (charging && levelPercent >= 100) {
        this.announceFullBattery();
      }
    }

    this.notifyBatteryListeners();
  }

  private handleChargingChange(battery: any): void {
    const wasCharging = this.batteryInfo.charging;
    this.updateBatteryState(battery);
    const isNowCharging = this.batteryInfo.charging;

    if (wasCharging === isNowCharging) return;

    if (this.config.announceCharger) {
      if (isNowCharging) {
        nepaliVoice.playChargerConnectedSound();
        const text = `हजुर ${this.config.bossName}, चार्जिङ सुरु भयो! ब्याट्री ${this.batteryInfo.level}% पुग्यो।`;
        setTimeout(() => nepaliVoice.speak(text), 250);

        // Check if already 100% when plugged in
        if (this.batteryInfo.level >= 100) {
          setTimeout(() => this.announceFullBattery(), 3500);
        }
      } else {
        nepaliVoice.playChargerDisconnectedSound();
        const text = `${this.config.bossName}, चार्जर हट्यो! हालको ब्याट्री ${this.batteryInfo.level}% छ।`;
        setTimeout(() => nepaliVoice.speak(text), 250);
        this.lastFullBatteryAnnounced = false;
      }
    }
  }

  private handleLevelChange(battery: any): void {
    this.updateBatteryState(battery);
    const { level, charging } = this.batteryInfo;

    // 1. Extreme Low Battery Alert (< 20%)
    if (!charging && level <= 20) {
      if (this.lastLowBatteryAnnounceLevel !== level) {
        this.lastLowBatteryAnnounceLevel = level;
        this.announceLowBattery(level);
      }
    } else if (level > 20) {
      this.lastLowBatteryAnnounceLevel = null;
    }

    // 2. Full Battery Alert (100% while charging)
    if (charging && level >= 100) {
      if (!this.lastFullBatteryAnnounced) {
        this.lastFullBatteryAnnounced = true;
        this.announceFullBattery();
      }
    }
  }

  /**
   * User exact low battery phrasing:
   * "बोस, चार्ज एकदम थोरै भएको छ ([level]%), त्यसैले चार्ज लगाउनुहोस्!"
   */
  announceLowBattery(level = this.batteryInfo.level): void {
    if (!this.config.announceBatteryLow) return;
    nepaliVoice.playChargerDisconnectedSound();
    const prompt = `बोस, चार्ज एकदम थोरै भएको छ, जम्मा ${level}% मात्र बाँकी छ, त्यसैले तुरुन्त चार्ज लगाउनुहोस्!`;
    setTimeout(() => {
      nepaliVoice.speak(prompt);
    }, 300);
  }

  /**
   * User exact full battery phrasing:
   * "ब्याट्री फुल भएको छ बोस, कृपया चार्जर निकाल्नुहोस् नत्र ब्याट्री फुल्लिन सक्छ!"
   */
  announceFullBattery(): void {
    if (!this.config.announceBatteryFull) return;
    nepaliVoice.playChargerConnectedSound();
    const prompt = 'ब्याट्री फुल भएको छ बोस, कृपया चार्जर निकाल्नुहोस् नत्र ब्याट्री फुल्लिन सक्छ!';
    setTimeout(() => {
      nepaliVoice.speak(prompt);
    }, 300);
  }

  getBatteryInfo(): BatteryInfo {
    return this.batteryInfo;
  }

  announceBatteryStatusNow(): void {
    const { level, charging } = this.batteryInfo;
    const chargingText = charging ? 'अहिले चार्जिङ भइरहेको छ।' : 'चार्जिङमा जोडिएको छैन।';
    const text = `हजुर ${this.config.bossName}, तपाईंको ब्याट्री हाल ${level}% छ। ${chargingText}`;
    nepaliVoice.speak(text);
  }

  simulateChargerConnection(connected: boolean): void {
    this.batteryInfo.charging = connected;
    this.notifyBatteryListeners();

    if (connected) {
      nepaliVoice.playChargerConnectedSound();
      const text = `हजुर ${this.config.bossName}, चार्जिङ सुरु भयो! ब्याट्री ${this.batteryInfo.level}% पुग्यो।`;
      setTimeout(() => nepaliVoice.speak(text), 250);
      if (this.batteryInfo.level >= 100) {
        setTimeout(() => this.announceFullBattery(), 3500);
      }
    } else {
      nepaliVoice.playChargerDisconnectedSound();
      const text = `${this.config.bossName}, चार्जर हट्यो! हालको ब्याट्री ${this.batteryInfo.level}% छ।`;
      setTimeout(() => nepaliVoice.speak(text), 250);
      this.lastFullBatteryAnnounced = false;
    }
  }

  simulateLowBattery(): void {
    this.batteryInfo.level = 12;
    this.batteryInfo.charging = false;
    this.notifyBatteryListeners();
    this.announceLowBattery(12);
  }

  simulateFullBattery(): void {
    this.batteryInfo.level = 100;
    this.batteryInfo.charging = true;
    this.notifyBatteryListeners();
    this.announceFullBattery();
  }

  // --- Voice Commands Setup (Call: उठाऊ/काट | Message: पढ्देउ/खोल्देउ) ---

  private initVoiceRecognizer(): void {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognizer = new SpeechRecognition();
        recognizer.continuous = true;
        recognizer.interimResults = true;
        recognizer.lang = 'ne-NP';

        recognizer.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.toLowerCase().trim();
            console.log('Recognized speech command for background trigger:', transcript);

            // 1. INCOMING CALL CONTEXT ("उठाऊँ कि काट्दिऊँ?")
            if (this.listeningContext === 'call' && this.activeCall?.status === 'ringing') {
              // Answer
              if (
                transcript.includes('उठाऊ') ||
                transcript.includes('उठाउ') ||
                transcript.includes('उठा') ||
                transcript.includes('pickup') ||
                transcript.includes('answer') ||
                transcript.includes('रिसिभ') ||
                transcript.includes('हेलो')
              ) {
                this.answerCall();
                break;
              }
              // Decline
              if (
                transcript.includes('काट') ||
                transcript.includes('काटौ') ||
                transcript.includes('काटदेउ') ||
                transcript.includes('काटिदेउ') ||
                transcript.includes('reject') ||
                transcript.includes('decline') ||
                transcript.includes('cut')
              ) {
                this.declineCall();
                break;
              }
            }

            // 2. INCOMING MESSAGE CONTEXT ("पढेर सुनाऊँ कि खोल्दिऊँ?")
            if (this.listeningContext === 'message' && this.activeMessage) {
              // Read Aloud ("पढ्देउ" / "पढ")
              if (
                transcript.includes('पढ्देउ') ||
                transcript.includes('पढ') ||
                transcript.includes('पढिदेउ') ||
                transcript.includes('सुनाउ') ||
                transcript.includes('सुनाइदेउ') ||
                transcript.includes('read')
              ) {
                this.readCurrentMessage();
                break;
              }
              // Open ("खोल्देउ" / "खोल")
              if (
                transcript.includes('खोल्देउ') ||
                transcript.includes('खोल') ||
                transcript.includes('खोल्दिउ') ||
                transcript.includes('open')
              ) {
                this.openCurrentMessage();
                break;
              }
            }
          }
        };

        recognizer.onerror = (e: any) => {
          console.warn('Voice command recognition error:', e);
        };

        this.speechRecognizer = recognizer;
      } catch (e) {
        console.warn('Voice command recognizer setup failed:', e);
      }
    }
  }

  private startListeningFor(context: 'call' | 'message'): void {
    this.listeningContext = context;
    if (this.speechRecognizer && !this.isListeningForCommand) {
      try {
        this.speechRecognizer.start();
        this.isListeningForCommand = true;
      } catch {
        this.isListeningForCommand = false;
      }
    }
  }

  private stopListening(): void {
    this.listeningContext = null;
    if (this.speechRecognizer && this.isListeningForCommand) {
      try {
        this.speechRecognizer.stop();
      } catch {}
      this.isListeningForCommand = false;
    }
  }

  // --- Incoming Call Feature ("बोस, [कलरको नाम] को फोन आएको छ, उठाऊँ कि काट्दिऊँ?") ---

  triggerIncomingCall(
    callerName = 'राम शर्मा',
    callerNumber = '+९७७ ९८४१-xxxxxx',
    avatarUrl?: string
  ): void {
    const call: IncomingCallData = {
      id: String(Date.now()),
      callerName,
      callerNumber,
      avatarUrl,
      status: 'ringing',
    };

    this.activeCall = call;
    this.notifyCallListeners();

    // Start iPhone Ringtone
    nepaliVoice.startRingtone();

    // User exact prompt:
    // "phone aa bela pani kasko phone ho tyo vamos rw uthane ki katdine tyo pani vanos"
    if (this.config.announceCalls) {
      const prompt = `बोस, ${callerName} को फोन आएको छ, उठाऊँ कि काट्दिऊँ?`;
      setTimeout(() => {
        nepaliVoice.speak(prompt, () => {
          this.startListeningFor('call');
        });
      }, 500);
    } else {
      this.startListeningFor('call');
    }
  }

  answerCall(): void {
    if (!this.activeCall) return;
    this.stopListening();
    nepaliVoice.stopRingtone();
    nepaliVoice.stopSpeaking();

    this.activeCall = {
      ...this.activeCall,
      status: 'connected',
      startedAt: Date.now(),
    };
    this.notifyCallListeners();

    nepaliVoice.speak(`कल जोडियो, कुरा गर्नुहोस् ${this.config.bossName}!`);
  }

  declineCall(): void {
    if (!this.activeCall) return;
    this.stopListening();
    nepaliVoice.stopRingtone();
    nepaliVoice.stopSpeaking();

    this.activeCall = {
      ...this.activeCall,
      status: 'ended',
    };
    this.notifyCallListeners();

    nepaliVoice.speak(`कल काटियो ${this.config.bossName}!`);

    setTimeout(() => {
      this.activeCall = null;
      this.notifyCallListeners();
    }, 1500);
  }

  getActiveCall(): IncomingCallData | null {
    return this.activeCall;
  }

  // --- Incoming Message Feature ("बोस, [प्रेषक] बाट म्यासेज आएको छ, पढेर सुनाऊँ कि खोल्दिऊँ?") ---

  triggerIncomingMessage(
    sender = 'आमा',
    content = 'बाबु घर कहिले आइपुग्छौ? खाना तयार छ।'
  ): void {
    const msg: IncomingMessageData = {
      id: String(Date.now()),
      sender,
      content,
      time: new Date().toLocaleTimeString('ne-NP', { hour: '2-digit', minute: '2-digit' }),
      isOpenModal: false,
      isRead: false,
    };

    this.activeMessage = msg;
    this.notifyMessageListeners(msg);

    // Play Tri-tone chime
    nepaliVoice.playMessageSound();

    // User exact prompt:
    // "msg aako bela kasko ho tyo vamos rw padnine ki kholdine sodhos k"
    if (this.config.announceMessages) {
      const prompt = `बोस, ${sender} बाट म्यासेज आएको छ, पढेर सुनाऊँ कि खोल्दिऊँ?`;
      setTimeout(() => {
        nepaliVoice.speak(prompt, () => {
          this.startListeningFor('message');
        });
      }, 400);
    } else {
      this.startListeningFor('message');
    }
  }

  /**
   * Action: "पढ्देउ" / "पढ"
   */
  readCurrentMessage(): void {
    if (!this.activeMessage) return;
    this.stopListening();
    const msg = this.activeMessage;
    msg.isRead = true;
    this.notifyMessageListeners({ ...msg });

    const speech = `${msg.sender} को म्यासेज यस्तो छ: "${msg.content}"`;
    nepaliVoice.speak(speech);
  }

  /**
   * Action: "खोल्देउ" / "खोल"
   */
  openCurrentMessage(): void {
    if (!this.activeMessage) return;
    this.stopListening();
    const msg = this.activeMessage;
    msg.isOpenModal = true;
    this.notifyMessageListeners({ ...msg });

    nepaliVoice.speak(`हजुर ${this.config.bossName}, म्यासेज खोलियो!`);
  }

  dismissCurrentMessage(): void {
    this.stopListening();
    this.activeMessage = null;
    this.notifyMessageListeners(null);
  }

  getActiveMessage(): IncomingMessageData | null {
    return this.activeMessage;
  }

  // --- Listeners ---
  onBatteryChange(cb: (info: BatteryInfo) => void): () => void {
    this.batteryListeners.push(cb);
    cb(this.batteryInfo);
    return () => {
      this.batteryListeners = this.batteryListeners.filter((c) => c !== cb);
    };
  }

  onCallChange(cb: (call: IncomingCallData | null) => void): () => void {
    this.callListeners.push(cb);
    return () => {
      this.callListeners = this.callListeners.filter((c) => c !== cb);
    };
  }

  onMessageChange(cb: (msg: IncomingMessageData | null) => void): () => void {
    this.messageListeners.push(cb);
    return () => {
      this.messageListeners = this.messageListeners.filter((c) => c !== cb);
    };
  }

  private notifyBatteryListeners(): void {
    this.batteryListeners.forEach((cb) => cb({ ...this.batteryInfo }));
  }

  private notifyCallListeners(): void {
    this.callListeners.forEach((cb) => cb(this.activeCall ? { ...this.activeCall } : null));
  }

  private notifyMessageListeners(msg: IncomingMessageData | null): void {
    this.messageListeners.forEach((cb) => cb(msg ? { ...msg } : null));
  }
}

export const systemMonitor = new SystemMonitorService();
