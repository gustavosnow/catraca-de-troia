// Web Audio API helper for realistic sound cues (access chime, error beep, unlock pulse)

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  // Pleasant dual-tone chime when turnstile grants access
  public playAccessGranted() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now); // A5
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6

      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch {
      // Audio context might be restricted before user interaction
    }
  }

  // Mechanical solenoid click + pleasant confirmation tone for manual turnstile unlock
  public playManualUnlock() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      
      // Click pulse
      const oscClick = this.ctx.createOscillator();
      const gainClick = this.ctx.createGain();
      oscClick.type = 'square';
      oscClick.frequency.setValueAtTime(140, now);
      oscClick.frequency.exponentialRampToValueAtTime(40, now + 0.05);
      gainClick.gain.setValueAtTime(0.12, now);
      gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      oscClick.connect(gainClick);
      gainClick.connect(this.ctx.destination);
      oscClick.start(now);
      oscClick.stop(now + 0.05);

      // Chime
      const oscTone = this.ctx.createOscillator();
      const gainTone = this.ctx.createGain();
      oscTone.type = 'sine';
      oscTone.frequency.setValueAtTime(523.25, now + 0.06); // C5
      oscTone.frequency.exponentialRampToValueAtTime(1046.50, now + 0.22); // C6
      gainTone.gain.setValueAtTime(0.09, now + 0.06);
      gainTone.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      oscTone.connect(gainTone);
      gainTone.connect(this.ctx.destination);
      oscTone.start(now + 0.06);
      oscTone.stop(now + 0.4);
    } catch {
      // ignore
    }
  }

  // Warning buzz for blocked/unrecognized access attempt
  public playWarning() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.12);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // ignore
    }
  }
}

export const soundManager = new SoundManager();
