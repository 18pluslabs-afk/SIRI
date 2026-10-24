/**
 * AudioStreamer handles:
 * - 16kHz PCM microphone capture and base64 streaming
 * - 24kHz Web Audio API gapless playback
 * - Real-time frequency analysis for visualization
 * - Instant interrupt / stop capabilities
 */

export class AudioStreamer {
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private speakerAnalyser: AnalyserNode | null = null;

  private nextPlayTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private onAudioChunkCallback: ((base64: string) => void) | null = null;
  private onPlaybackEndedCallback: (() => void) | null = null;
  private onPlaybackStartedCallback: (() => void) | null = null;

  private isRecording: boolean = false;
  private isSpeaking: boolean = false;

  constructor() {}

  /**
   * Initializes both input (16kHz) and output (24kHz) AudioContexts.
   * Must be called inside a user gesture (e.g. click).
   */
  async startRecording(onAudioChunk: (base64: string) => void): Promise<void> {
    this.onAudioChunkCallback = onAudioChunk;
    this.isRecording = true;

    // 1. Setup output AudioContext at 24kHz for Gemini Live responses
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!this.outputAudioCtx || this.outputAudioCtx.state === 'closed') {
      this.outputAudioCtx = new AudioContextClass({ sampleRate: 24000 });
    }
    if (this.outputAudioCtx.state === 'suspended') {
      await this.outputAudioCtx.resume();
    }

    this.speakerAnalyser = this.outputAudioCtx.createAnalyser();
    this.speakerAnalyser.fftSize = 128;
    this.speakerAnalyser.smoothingTimeConstant = 0.8;
    this.speakerAnalyser.connect(this.outputAudioCtx.destination);
    this.nextPlayTime = this.outputAudioCtx.currentTime;

    // 2. Setup input AudioContext for microphone capture
    let inputCtx: AudioContext;
    try {
      inputCtx = new AudioContextClass({ sampleRate: 16000 });
    } catch {
      inputCtx = new AudioContextClass();
    }

    if (inputCtx.state === 'suspended') {
      await inputCtx.resume();
    }
    this.inputAudioCtx = inputCtx;

    this.micAnalyser = inputCtx.createAnalyser();
    this.micAnalyser.fftSize = 128;
    this.micAnalyser.smoothingTimeConstant = 0.75;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Guard: If stopped or canceled while waiting for mic permission, release stream and exit cleanly
    if (!this.isRecording || !this.inputAudioCtx || this.inputAudioCtx.state === 'closed') {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    this.micStream = stream;
    this.micSource = inputCtx.createMediaStreamSource(stream);
    this.micSource.connect(this.micAnalyser);

    // Buffer size 4096 samples = 256ms at 16kHz
    this.scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
    this.micSource.connect(this.scriptProcessor);
    // Connect to destination to keep processor active in Chrome/Safari (silenced)
    this.scriptProcessor.connect(inputCtx.destination);

    this.scriptProcessor.onaudioprocess = (e: AudioProcessingEvent) => {
      if (!this.isRecording) return;
      const inputChannel = e.inputBuffer.getChannelData(0);

      // Convert Float32Array to 16-bit PCM (little endian)
      const pcm16 = new Int16Array(inputChannel.length);
      for (let i = 0; i < inputChannel.length; i++) {
        const sample = Math.max(-1, Math.min(1, inputChannel[i]));
        pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      }

      // Convert to base64 string
      const bytes = new Uint8Array(pcm16.buffer);
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      if (this.onAudioChunkCallback) {
        this.onAudioChunkCallback(base64);
      }
    };

    this.isRecording = true;
  }

  /**
   * Enqueues a 24kHz PCM chunk received from Gemini Live API
   */
  queueAudioChunk(base64Pcm: string): void {
    if (!this.outputAudioCtx || this.outputAudioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.outputAudioCtx = new AudioContextClass({ sampleRate: 24000 });
      this.speakerAnalyser = this.outputAudioCtx.createAnalyser();
      this.speakerAnalyser.fftSize = 128;
      this.speakerAnalyser.smoothingTimeConstant = 0.8;
      this.speakerAnalyser.connect(this.outputAudioCtx.destination);
      this.nextPlayTime = this.outputAudioCtx.currentTime;
    }

    if (this.outputAudioCtx.state === 'suspended') {
      this.outputAudioCtx.resume();
    }

    try {
      // Decode base64 to raw bytes
      const binary = atob(base64Pcm);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // Live API audio is 16-bit PCM little endian at 24kHz
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.copyToChannel(float32, 0);

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.speakerAnalyser || this.outputAudioCtx.destination);

      const now = this.outputAudioCtx.currentTime;
      // If we fell behind, add a small 30ms jitter safety
      if (this.nextPlayTime < now) {
        this.nextPlayTime = now + 0.03;
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;

      if (!this.isSpeaking) {
        this.isSpeaking = true;
        this.onPlaybackStartedCallback?.();
      }

      this.activeSources.push(source);
      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
        if (this.activeSources.length === 0) {
          this.isSpeaking = false;
          this.onPlaybackEndedCallback?.();
        }
      };
    } catch (err) {
      console.error('Failed to decode/queue audio chunk:', err);
    }
  }

  /**
   * Instantly stops all playing audio when the user interrupts Mahi
   */
  interrupt(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Source might already have ended
      }
    }
    this.activeSources = [];
    if (this.outputAudioCtx) {
      this.nextPlayTime = this.outputAudioCtx.currentTime;
    }
    if (this.isSpeaking) {
      this.isSpeaking = false;
      this.onPlaybackEndedCallback?.();
    }
  }

  /**
   * Stops recording and releases microphone hardware
   */
  stop(): void {
    this.isRecording = false;
    this.interrupt();

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }

    if (this.inputAudioCtx) {
      this.inputAudioCtx.close().catch(() => {});
      this.inputAudioCtx = null;
    }

    if (this.outputAudioCtx) {
      this.outputAudioCtx.close().catch(() => {});
      this.outputAudioCtx = null;
    }
  }

  onPlaybackStarted(cb: () => void) {
    this.onPlaybackStartedCallback = cb;
  }

  onPlaybackEnded(cb: () => void) {
    this.onPlaybackEndedCallback = cb;
  }

  /**
   * Retrieves live mic frequency bins [0-255] for visualizer
   */
  getMicFrequencies(): Uint8Array {
    if (!this.micAnalyser) return new Uint8Array(64);
    const data = new Uint8Array(this.micAnalyser.frequencyBinCount);
    this.micAnalyser.getByteFrequencyData(data);
    return data;
  }

  /**
   * Retrieves live speaker frequency bins [0-255] for visualizer
   */
  getSpeakerFrequencies(): Uint8Array {
    if (!this.speakerAnalyser) return new Uint8Array(64);
    const data = new Uint8Array(this.speakerAnalyser.frequencyBinCount);
    this.speakerAnalyser.getByteFrequencyData(data);
    return data;
  }

  /**
   * Checks if Mahi is actively outputting sound
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}
