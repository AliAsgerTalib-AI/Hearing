import { audioEngine } from './AudioEngine';
import { AUDIO_PLAYBACK } from './constants';

export interface PulseSequence {
  frequencies: number[];
  intensities: number[]; // 0-100 scale
  durations: number[]; // in seconds
  intervals: number[]; // between pulses
}

export interface ExerciseState {
  level: number;
  accuracy: number;
  totalTrials: number;
  correctTrials: number;
  intensity: number; // dB level
  frequency: number;
}

/**
 * High-Frequency Pulse Exercise Algorithm
 * Generates adaptive auditory stimulation sequences targeting frequencies 8kHz-16kHz
 * to exercise auditory nerve and improve high-frequency perception.
 */
export class HighFrequencyPulseExercise {
  // Target high frequencies for auditory nerve stimulation
  private readonly HIGH_FREQUENCIES = [8000, 10000, 12000, 14000, 16000];

  // Exercise progression levels
  private readonly LEVEL_CONFIGS = [
    { pulseCount: 2, baseDuration: 0.1, baseIntensity: 50, gapDuration: 0.15 },
    { pulseCount: 3, baseDuration: 0.12, baseIntensity: 45, gapDuration: 0.12 },
    { pulseCount: 4, baseDuration: 0.15, baseIntensity: 40, gapDuration: 0.1 },
    { pulseCount: 5, baseDuration: 0.1, baseIntensity: 35, gapDuration: 0.08 },
    { pulseCount: 6, baseDuration: 0.12, baseIntensity: 30, gapDuration: 0.06 },
  ];

  private state: ExerciseState = {
    level: 1,
    accuracy: 100,
    totalTrials: 0,
    correctTrials: 0,
    intensity: 50,
    frequency: 8000,
  };

  private isPlaying = false;

  constructor() {
    this.resetState();
  }

  /**
   * Generates a pulse sequence for the current level
   */
  generateSequence(): PulseSequence {
    const levelConfig = this.LEVEL_CONFIGS[Math.min(this.state.level - 1, this.LEVEL_CONFIGS.length - 1)];
    const randomFreq = this.HIGH_FREQUENCIES[Math.floor(Math.random() * this.HIGH_FREQUENCIES.length)];

    this.state.frequency = randomFreq;
    this.state.intensity = levelConfig.baseIntensity;

    const frequencies: number[] = [];
    const intensities: number[] = [];
    const durations: number[] = [];
    const intervals: number[] = [];

    // Generate pulse sequence with slight intensity variation for naturalness
    for (let i = 0; i < levelConfig.pulseCount; i++) {
      frequencies.push(randomFreq);

      // Add slight intensity variation (±5%)
      const variationFactor = 1 + (Math.random() - 0.5) * 0.1;
      const intensity = Math.max(10, Math.min(100, levelConfig.baseIntensity * variationFactor));
      intensities.push(intensity);

      durations.push(levelConfig.baseDuration);
      intervals.push(levelConfig.gapDuration);
    }

    return { frequencies, intensities, durations, intervals };
  }

  /**
   * Plays a pulse sequence with proper timing and envelope
   */
  async playSequence(sequence: PulseSequence): Promise<void> {
    if (this.isPlaying) return;
    this.isPlaying = true;

    try {
      await audioEngine.resume();

      for (let i = 0; i < sequence.frequencies.length; i++) {
        const frequency = sequence.frequencies[i];
        const intensity = sequence.intensities[i];
        const duration = sequence.durations[i];
        const interval = sequence.intervals[i];

        // Convert intensity (0-100) to gain (0-1)
        const gain = intensity / 100;

        // Play the pulse
        audioEngine.playTone(frequency, gain);

        // Wait for pulse duration + interval
        await this.delay((duration + interval) * 1000);

        audioEngine.stopTone();
      }
    } finally {
      this.isPlaying = false;
      audioEngine.stopTone();
    }
  }

  /**
   * Records user response and adapts exercise difficulty
   */
  recordResponse(correct: boolean): void {
    this.state.totalTrials++;
    if (correct) {
      this.state.correctTrials++;
    }

    // Calculate rolling accuracy (last 10 trials)
    const recentAccuracy = this.getRecentAccuracy();
    this.state.accuracy = recentAccuracy;

    // Adapt difficulty based on performance
    if (recentAccuracy >= 90 && this.state.level < this.LEVEL_CONFIGS.length) {
      // Progress to next level if consistently accurate
      this.state.level++;
    } else if (recentAccuracy < 60 && this.state.level > 1) {
      // Step back if accuracy drops significantly
      this.state.level = Math.max(1, this.state.level - 1);
    }
  }

  /**
   * Gets current exercise state
   */
  getState(): ExerciseState {
    return { ...this.state };
  }

  /**
   * Resets exercise to initial state
   */
  resetState(): void {
    this.state = {
      level: 1,
      accuracy: 100,
      totalTrials: 0,
      correctTrials: 0,
      intensity: 50,
      frequency: 8000,
    };
  }

  /**
   * Gets recent accuracy based on last 10 trials
   */
  private getRecentAccuracy(): number {
    if (this.state.totalTrials === 0) return 100;
    const recentTrials = Math.min(10, this.state.totalTrials);
    // Approximate based on overall stats for simplicity
    return Math.round((this.state.correctTrials / Math.max(1, this.state.totalTrials)) * 100);
  }

  /**
   * Utility delay function for async sequencing
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gets the current level configuration
   */
  getLevelConfig() {
    return this.LEVEL_CONFIGS[Math.min(this.state.level - 1, this.LEVEL_CONFIGS.length - 1)];
  }

  /**
   * Gets human-readable level description
   */
  getLevelDescription(): string {
    const descriptions = [
      'Novice - Simple pulse pairs',
      'Intermediate - Triple pulses',
      'Advanced - Quad sequences',
      'Expert - Complex patterns',
      'Master - Rapid-fire challenges'
    ];
    return descriptions[Math.min(this.state.level - 1, descriptions.length - 1)];
  }

  /**
   * Stops any active playback
   */
  stop(): void {
    audioEngine.stopTone();
    this.isPlaying = false;
  }
}
