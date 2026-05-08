/**
 * AudioEngine utility for pure-tone audiometry.
 * Uses Web Audio API to generate precise sine waves.
 */
export class AudioEngine {
  private context: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private pannerNode: StereoPannerNode | null = null;

  private calibrationFactor: number = 1.0;

  constructor() {
    this.init();
  }

  /**
   * Adjusts the gain based on device type for better approximation.
   */
  public setDeviceCalibration(device: 'earbuds' | 'iem' | 'headphones' | 'speakers', noiseCancelling: boolean) {
    let factor = 1.0;
    switch (device) {
      case 'earbuds': factor = 0.75; break; // Direct coupled, standard seal
      case 'iem': factor = 0.6; break; // Professional seal, highly efficient
      case 'headphones': factor = 1.0; break; // Baseline
      case 'speakers': factor = 2.5; break; 
    }
    // Noise cancelling can lower perceived floor, impacting threshold testing
    if (noiseCancelling) factor *= 0.9;
    
    this.calibrationFactor = factor;
  }

  private init() {
    if (typeof window !== 'undefined' && !this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Resumes the audio context if it was suspended (browser policy).
   */
  public async resume() {
    if (this.context?.state === 'suspended') {
      await this.context.resume();
    }
  }

  /**
   * Plays a pulsed pure tone (two short beeps) to help the brain distinguish 
   * the signal from background hiss or noise floor.
   */
  public async playPulsedTone(frequency: number, gain: number, pan: number = 0) {
    this.stopTone();
    if (!this.context) this.init();
    if (!this.context) return;

    // Prevent digital clipping by clamping the gain to 0.95 (safety ceiling)
    const calibratedGain = Math.min(gain * this.calibrationFactor, 0.95);
    const now = this.context.currentTime;

    // First Pulse
    this.createTonePulse(frequency, calibratedGain, now, 0.4, pan);
    // Second Pulse
    this.createTonePulse(frequency, calibratedGain, now + 0.6, 0.4, pan);
  }

  private createTonePulse(freq: number, gain: number, startTime: number, duration: number, pan: number = 0) {
    if (!this.context) return;
    
    const osc = this.context.createOscillator();
    const g = this.context.createGain();
    const panner = this.context.createStereoPanner();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    panner.pan.setValueAtTime(pan, startTime);

    // Use exponential ramping for smoother onset/offset (avoids transients/scratching)
    // Gain starts at a non-zero minimum for exponential math
    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0001), startTime + 0.06);
    g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0001), startTime + duration - 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(g);
    g.connect(panner);
    panner.connect(this.context.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  /**
   * Plays a pure tone at a specific frequency and volume.
   * @param frequency - Frequency in Hz (e.g., 250, 1000, 8000)
   * @param gain - Pre-calculated gain or use dbToGain helper
   * @param pan - Stereo pan (-1 left, 1 right, 0 center)
   */
  public playTone(frequency: number, gain: number, pan: number = 0) {
    this.stopTone();

    if (!this.context) this.init();
    if (!this.context) return;

    const calibratedGain = Math.min(gain * this.calibrationFactor, 0.95);
    
    this.oscillator = this.context.createOscillator();
    this.gainNode = this.context.createGain();
    this.pannerNode = this.context.createStereoPanner();

    this.oscillator.type = 'sine';
    this.oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
    this.pannerNode.pan.setValueAtTime(pan, this.context.currentTime);

    // Initial gain 0.0001 to avoid exponential math errors/clicking
    this.gainNode.gain.setValueAtTime(0.0001, this.context.currentTime);
    this.gainNode.gain.exponentialRampToValueAtTime(Math.max(calibratedGain, 0.0001), this.context.currentTime + 0.06);

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.pannerNode);
    this.pannerNode.connect(this.context.destination);

    this.oscillator.start();
  }

  /**
   * Gradually stops the tone to prevent popping/clicking.
   */
  public stopTone() {
    if (this.oscillator && this.gainNode && this.context) {
      const stopTime = this.context.currentTime + 0.1;
      this.gainNode.gain.exponentialRampToValueAtTime(0.0001, stopTime);
      this.oscillator.stop(stopTime);
      
      this.oscillator = null;
      this.gainNode = null;
      this.pannerNode = null;
    }
  }

  /**
   * Closes the audio context and releases resources.
   */
  public dispose() {
    this.stopTone();
    if (this.context) {
      this.context.close();
      this.context = null;
    }
  }

  /**
   * Helper to map dB value to linear gain.
   * Note: This is an approximation for testing.
   */
  public static dbToGain(db: number): number {
    // 0dB = 0.0001, 100dB = 1.0 (approximate range for phone speakers)
    return Math.pow(10, (db - 100) / 20);
  }
}

export const audioEngine = new AudioEngine();
