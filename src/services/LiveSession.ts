import { AudioStreamer } from './AudioStreamer';
import { systemMonitor } from './SystemMonitor';

export type AssistantState = 'disconnected' | 'connecting' | 'listening' | 'speaking';
export type BhapumVibe = 'siriGlow' | 'cyberNepal' | 'flirty' | 'sassy' | 'stealth' | 'golden';

export interface ToolActionItem {
  id: string;
  name: string;
  args: any;
  timestamp: number;
  status: 'executing' | 'completed';
}

export interface LiveTimer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  active: boolean;
}

export interface QuickNote {
  id: string;
  content: string;
  time: string;
  category: string;
}

export interface DeviceState {
  flashlight: boolean;
  mute: boolean;
  lowPower: boolean;
  nightMode: boolean;
  screenFlash: boolean;
  cameraOpen: boolean;
  cameraMode: 'photo' | 'portrait' | 'video' | 'scan';
}

export class LiveSession {
  private ws: WebSocket | null = null;
  private audioStreamer: AudioStreamer;
  private state: AssistantState = 'disconnected';
  private vibe: BhapumVibe = 'siriGlow';
  private isStarting = false;

  private deviceState: DeviceState = {
    flashlight: false,
    mute: false,
    lowPower: false,
    nightMode: true,
    screenFlash: false,
    cameraOpen: false,
    cameraMode: 'photo',
  };

  private notes: QuickNote[] = [
    {
      id: '1',
      content: 'सिरीसँग नेपालीमा खतरा कुरा गर्ने',
      time: '१०:३० AM',
      category: 'todo',
    },
  ];

  private stateListeners: ((state: AssistantState) => void)[] = [];
  private vibeListeners: ((vibe: BhapumVibe) => void)[] = [];
  private toolListeners: ((tool: ToolActionItem) => void)[] = [];
  private timerListeners: ((timer: LiveTimer) => void)[] = [];
  private noteListeners: ((notes: QuickNote[]) => void)[] = [];
  private deviceListeners: ((dev: DeviceState) => void)[] = [];
  private errorListeners: ((err: string) => void)[] = [];

  constructor() {
    this.audioStreamer = new AudioStreamer();

    this.audioStreamer.onPlaybackStarted(() => {
      this.setState('speaking');
    });

    this.audioStreamer.onPlaybackEnded(() => {
      if (this.state === 'speaking') {
        this.setState('listening');
      }
    });
  }

  getAudioStreamer(): AudioStreamer {
    return this.audioStreamer;
  }

  getState(): AssistantState {
    return this.state;
  }

  getVibe(): BhapumVibe {
    return this.vibe;
  }

  getDeviceState(): DeviceState {
    return this.deviceState;
  }

  getNotes(): QuickNote[] {
    return this.notes;
  }

  setDeviceProperty<K extends keyof DeviceState>(key: K, value: DeviceState[K]) {
    this.deviceState = { ...this.deviceState, [key]: value };
    this.deviceListeners.forEach((cb) => cb(this.deviceState));
  }

  private setState(newState: AssistantState) {
    if (this.state === newState) return;
    this.state = newState;
    this.stateListeners.forEach((cb) => cb(newState));
  }

  setVibe(newVibe: BhapumVibe) {
    this.vibe = newVibe;
    this.vibeListeners.forEach((cb) => cb(newVibe));
  }

  async start(): Promise<void> {
    if (this.isStarting || this.state !== 'disconnected') return;
    this.isStarting = true;
    this.setState('connecting');

    try {
      // 1. Start Audio Streamer at 16kHz
      await this.audioStreamer.startRecording((base64Chunk: string) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({
              type: 'audio',
              audio: base64Chunk,
            })
          );
        }
      });

      // If user stopped while mic permission was being requested
      if (!this.isStarting || this.state === 'disconnected') {
        this.stop();
        return;
      }

      // 2. Connect WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/live`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {};

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'connected') {
            this.setState('listening');
          } else if (msg.type === 'audio' && msg.audio) {
            this.audioStreamer.queueAudioChunk(msg.audio);
          } else if (msg.type === 'interrupted') {
            this.audioStreamer.interrupt();
            this.setState('listening');
          } else if (msg.type === 'turnComplete') {
            if (!this.audioStreamer.getIsSpeaking()) {
              this.setState('listening');
            }
          } else if (msg.type === 'toolCall' && msg.toolCall) {
            this.handleToolExecution(msg.toolCall);
          } else if (msg.type === 'error') {
            this.notifyError(msg.error || 'लाइभ अडियोमा समस्या आयो');
          } else if (msg.type === 'sessionClosed') {
            this.stop();
          }
        } catch (e) {
          console.error('WebSocket parse error:', e);
        }
      };

      this.ws.onerror = (e) => {
        console.error('WebSocket connection error:', e);
        this.notifyError('सिरी सर्भरसँग सम्पर्क हुन सकेन। कृपया इन्टरनेट जाँच्नुहोस्।');
        this.stop();
      };

      this.ws.onclose = () => {
        this.stop();
      };
    } catch (err: any) {
      console.error('Failed to start Live session:', err);
      let errorMsg = 'माइक्रोफोन अनुमति दिनुहोस्, सिरी तयार छ!';
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied')) {
        errorMsg = 'माइक्रोफोन अनुमति अस्विकार गरियो। सिरीसँग बोल्न अनुमति चाहिन्छ।';
      } else if (err?.message) {
        errorMsg = err.message;
      }
      this.notifyError(errorMsg);
      this.stop();
    } finally {
      this.isStarting = false;
    }
  }

  private handleToolExecution(call: { id: string; name: string; args: any }) {
    const item: ToolActionItem = {
      id: call.id,
      name: call.name,
      args: call.args,
      timestamp: Date.now(),
      status: 'executing',
    };
    this.toolListeners.forEach((cb) => cb(item));

    // Execute device-level actions
    if (call.name === 'deviceControl') {
      const feat = call.args?.feature;
      const enabled = Boolean(call.args?.enabled);
      if (feat === 'flashlight') {
        this.setDeviceProperty('flashlight', enabled);
      } else if (feat === 'mute') {
        this.setDeviceProperty('mute', enabled);
      } else if (feat === 'lowPower') {
        this.setDeviceProperty('lowPower', enabled);
      } else if (feat === 'nightMode') {
        this.setDeviceProperty('nightMode', enabled);
      } else if (feat === 'screenFlash') {
        this.setDeviceProperty('screenFlash', enabled);
        if (enabled) {
          setTimeout(() => this.setDeviceProperty('screenFlash', false), 800);
        }
      }
    } else if (call.name === 'openCameraSnap') {
      const mode = (call.args?.mode as any) || 'photo';
      this.setDeviceProperty('cameraMode', mode);
      this.setDeviceProperty('cameraOpen', true);
    } else if (call.name === 'playMusicTrack') {
      const query = encodeURIComponent(call.args?.query || 'Nepali new song');
      const platform = call.args?.platform || 'youtube';
      const url =
        platform === 'spotify'
          ? `https://open.spotify.com/search/${query}`
          : `https://www.youtube.com/results?search_query=${query}`;
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('Popup blocked:', e);
      }
    } else if (call.name === 'openWebsite') {
      const rawUrl = call.args?.url || '';
      let finalUrl = rawUrl.trim();
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
      }
      try {
        window.open(finalUrl, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('Popup blocked:', e);
      }
    } else if (call.name === 'setAlarmOrTimer') {
      const seconds = Number(call.args?.seconds) || 60;
      const label = call.args?.label || 'सिरी टाइमर';
      const timer: LiveTimer = {
        id: call.id || String(Date.now()),
        label,
        totalSeconds: seconds,
        remainingSeconds: seconds,
        active: true,
      };
      this.timerListeners.forEach((cb) => cb(timer));
    } else if (call.name === 'addQuickNote') {
      const newNote: QuickNote = {
        id: String(Date.now()),
        content: call.args?.content || 'नयाँ नोट',
        time: new Date().toLocaleTimeString('ne-NP', { hour: '2-digit', minute: '2-digit' }),
        category: call.args?.category || 'reminder',
      };
      this.notes = [newNote, ...this.notes];
      this.noteListeners.forEach((cb) => cb(this.notes));
    } else if (call.name === 'changeVibeAura') {
      const vibeArg = call.args?.vibe as BhapumVibe;
      const validVibes: BhapumVibe[] = ['siriGlow', 'cyberNepal', 'flirty', 'sassy', 'stealth', 'golden'];
      if (validVibes.includes(vibeArg)) {
        this.setVibe(vibeArg);
      }
    } else if (call.name === 'checkBatteryStatus') {
      systemMonitor.announceBatteryStatusNow();
    } else if (call.name === 'simulateIncomingCallPrompt') {
      const caller = call.args?.callerName || 'राम शर्मा';
      const number = call.args?.callerNumber || '+९७७ ९८४१-xxxxxx';
      systemMonitor.triggerIncomingCall(caller, number);
    } else if (call.name === 'readLatestMessages') {
      const sender = call.args?.sender || 'आमा';
      const content = call.args?.message || 'बाबु घर कहिले आइपुग्छौ? खाना तयार छ।';
      systemMonitor.triggerIncomingMessage(sender, content);
    }
  }

  stop(): void {
    this.isStarting = false;
    if (this.state === 'disconnected') return;
    this.setState('disconnected');

    this.audioStreamer.stop();

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }

  onStateChange(cb: (state: AssistantState) => void): () => void {
    this.stateListeners.push(cb);
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== cb);
    };
  }

  onVibeChange(cb: (vibe: BhapumVibe) => void): () => void {
    this.vibeListeners.push(cb);
    return () => {
      this.vibeListeners = this.vibeListeners.filter((l) => l !== cb);
    };
  }

  onToolCall(cb: (tool: ToolActionItem) => void): () => void {
    this.toolListeners.push(cb);
    return () => {
      this.toolListeners = this.toolListeners.filter((l) => l !== cb);
    };
  }

  onTimerCreated(cb: (timer: LiveTimer) => void): () => void {
    this.timerListeners.push(cb);
    return () => {
      this.timerListeners = this.timerListeners.filter((l) => l !== cb);
    };
  }

  onNotesChange(cb: (notes: QuickNote[]) => void): () => void {
    this.noteListeners.push(cb);
    return () => {
      this.noteListeners = this.noteListeners.filter((l) => l !== cb);
    };
  }

  onDeviceChange(cb: (dev: DeviceState) => void): () => void {
    this.deviceListeners.push(cb);
    return () => {
      this.deviceListeners = this.deviceListeners.filter((l) => l !== cb);
    };
  }

  onError(cb: (err: string) => void): () => void {
    this.errorListeners.push(cb);
    return () => {
      this.errorListeners = this.errorListeners.filter((l) => l !== cb);
    };
  }

  private notifyError(err: string) {
    this.errorListeners.forEach((cb) => cb(err));
  }
}
