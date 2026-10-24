/**
 * Offline-ready Nepali Voice & Sound Engine
 * Uses browser Web Speech Synthesis with Nepali/Devanagari phonetics
 * and Web Audio API synthesized chimes (Charger, Ringtone, Message Alert).
 * Works 100% offline without any internet connection.
 */

class NepaliVoiceEngine {
  private synth: SpeechSynthesis | null = null;
  private audioCtx: AudioContext | null = null;
  private ringtoneInterval: number | null = null;
  private isSpeaking = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis || null;
    }
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Speaks text in clear, sweet Nepali using SpeechSynthesis.
   * Works completely offline.
   */
  speak(text: string, onEnd?: () => void): void {
    if (!this.synth) {
      console.warn('SpeechSynthesis not supported on this device');
      onEnd?.();
      return;
    }

    try {
      // Cancel any ongoing offline speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.93; // Natural, clear pacing for Nepali
      utterance.pitch = 1.05; // Friendly, sweet Siri tone
      utterance.volume = 1.0;

      // Find best matching voice (Nepali or Hindi Devanagari fallback)
      const voices = this.synth.getVoices();
      const nepaliVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('ne') ||
          v.name.toLowerCase().includes('nepal') ||
          v.name.toLowerCase().includes('nepali')
      );
      const hindiVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.toLowerCase().includes('india')
      );

      if (nepaliVoice) {
        utterance.voice = nepaliVoice;
        utterance.lang = nepaliVoice.lang;
      } else if (hindiVoice) {
        // Hindi voices correctly pronounce Devanagari script used in Nepali
        utterance.voice = hindiVoice;
        utterance.lang = hindiVoice.lang;
      } else {
        utterance.lang = 'ne-NP';
      }

      this.isSpeaking = true;

      utterance.onend = () => {
        this.isSpeaking = false;
        onEnd?.();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        this.isSpeaking = false;
        onEnd?.();
      };

      this.synth.speak(utterance);
    } catch (e) {
      console.error('TTS execution failed:', e);
      this.isSpeaking = false;
      onEnd?.();
    }
  }

  stopSpeaking(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Sound: Charger Connected (Crisp ascending Apple chime)
   */
  playChargerConnectedSound(): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      // High-tech ascending dual harmonic
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.001, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.07 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.36);
      });
    } catch (e) {
      console.warn('Charger sound error:', e);
    }
  }

  /**
   * Sound: Charger Disconnected (Gentle descending chime)
   */
  playChargerDisconnectedSound(): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const notes = [783.99, 523.25]; // G5, C5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.001, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.31);
      });
    } catch (e) {
      console.warn('Charger disconnect sound error:', e);
    }
  }

  /**
   * Sound: iPhone Style Incoming Call Ringtone
   */
  startRingtone(): void {
    this.stopRingtone();
    const playRingCycle = () => {
      try {
        const ctx = this.getAudioContext();
        const now = ctx.currentTime;
        // Marimba-like pattern
        const pattern = [
          { f: 659.25, t: 0.0 }, // E5
          { f: 587.33, t: 0.12 }, // D5
          { f: 739.99, t: 0.24 }, // F#5
          { f: 830.61, t: 0.36 }, // G#5
          { f: 659.25, t: 0.48 }, // E5
        ];

        pattern.forEach(({ f, t }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + t);

          gain.gain.setValueAtTime(0.001, now + t);
          gain.gain.linearRampToValueAtTime(0.2, now + t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.18);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + t);
          osc.stop(now + t + 0.19);
        });
      } catch (e) {
        console.warn('Ringtone error:', e);
      }
    };

    playRingCycle();
    this.ringtoneInterval = window.setInterval(playRingCycle, 2400);
  }

  stopRingtone(): void {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  /**
   * Sound: Incoming Message Chime (iPhone Tri-Tone)
   */
  playMessageSound(): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const notes = [
        { f: 783.99, t: 0.0 }, // G5
        { f: 987.77, t: 0.1 }, // B5
        { f: 1174.66, t: 0.2 }, // D6
      ];

      notes.forEach(({ f, t }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + t);

        gain.gain.setValueAtTime(0.001, now + t);
        gain.gain.linearRampToValueAtTime(0.28, now + t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + 0.26);
      });
    } catch (e) {
      console.warn('Message chime error:', e);
    }
  }
}

export const nepaliVoice = new NepaliVoiceEngine();
