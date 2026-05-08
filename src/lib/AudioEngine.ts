import {
  DEVICE_CALIBRATION_FACTORS,
  NOISE_CANCELLATION,
  AUDIO_PLAYBACK
} from './constants';

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
    let factor = (() => {
      switch (device) {
        case 'earbuds':
          return DEVICE_CALIBRATION_FACTORS.EARBUDS;
        case 'iem':
          return DEVICE_CALIBRATION_FACTORS.IEM;
        case 'headphones':
          return DEVICE_CALIBRATION_FACTORS.HEADPHONES;
        case 'speakers':
          return DEVICE_CALIBRATION_FACTORS.SPEAKERS;
        default:
          return DEVICE_CALIBRATION_FACTORS.HEADPHONES;
      }
    })();

    // Noise cancelling can lower perceived floor, impacting threshold testing
    if (noiseCancelling) {
      factor *= NOISE_CANCELLATION.ACTIVE_FACTOR;
    } else {
      factor *= NOISE_CANCELLATION.INACTIVE_FACTOR;
    }

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

    // Prevent digital clipping by clamping the gain to safety ceiling
    const calibratedGain = Math.min(gain * this.calibrationFactor, AUDIO_PLAYBACK.GAIN_SAFETY_CEILING);
    const now = this.context.currentTime;

    // First Pulse
    this.createTonePulse(frequency, calibratedGain, now, AUDIO_PLAYBACK.PULSE_DURATION, pan);
    // Second Pulse
    this.createTonePulse(frequency, calibratedGain, now + AUDIO_PLAYBACK.PULSE_INTERVAL, AUDIO_PLAYBACK.PULSE_DURATION, pan);
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
    const minGain = AUDIO_PLAYBACK.MIN_EXPONENTIAL_GAIN;
    const rampDuration = AUDIO_PLAYBACK.ENVELOPE_RAMP_DURATION;

    g.gain.setValueAtTime(minGain, startTime);
    g.gain.exponentialRampToValueAtTime(Math.max(gain, minGain), startTime + rampDuration);
    g.gain.exponentialRampToValueAtTime(Math.max(gain, minGain), startTime + duration - rampDuration);
    g.gain.exponentialRampToValueAtTime(minGain, startTime + duration);

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

    const calibratedGain = Math.min(gain * this.calibrationFactor, AUDIO_PLAYBACK.GAIN_SAFETY_CEILING);

    this.oscillator = this.context.createOscillator();
    this.gainNode = this.context.createGain();
    this.pannerNode = this.context.createStereoPanner();

    this.oscillator.type = 'sine';
    this.oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
    this.pannerNode.pan.setValueAtTime(pan, this.context.currentTime);

    // Initial gain set to minimum to avoid exponential math errors/clicking
    const minGain = AUDIO_PLAYBACK.MIN_EXPONENTIAL_GAIN;
    const rampDuration = AUDIO_PLAYBACK.ENVELOPE_RAMP_DURATION;

    this.gainNode.gain.setValueAtTime(minGain, this.context.currentTime);
    this.gainNode.gain.exponentialRampToValueAtTime(
      Math.max(calibratedGain, minGain),
      this.context.currentTime + rampDuration
    );

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
      const stopTime = this.context.currentTime + AUDIO_PLAYBACK.ENVELOPE_RAMP_DURATION;
      this.gainNode.gain.exponentialRampToValueAtTime(AUDIO_PLAYBACK.MIN_EXPONENTIAL_GAIN, stopTime);
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
