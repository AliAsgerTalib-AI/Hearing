/**
 * Noise Simulator: Generate realistic acoustic environments for training
 *
 * Provides multiple noise types that can be layered into exercises to simulate
 * real-world listening conditions (traffic, speech, babble, etc.)
 */

export type NoiseType = 'silent' | 'white' | 'traffic' | 'babble' | 'cocktail' | 'office';

export interface NoiseCharacteristics {
  name: string;
  description: string;
  frequencies: { [key: number]: number }; // freq Hz -> amplitude (0-1)
  realWorldExample: string;
  difficulty: number; // 0-5, where 5 is hardest
}

export const NOISE_PRESETS: Record<NoiseType, NoiseCharacteristics> = {
  silent: {
    name: 'Silent',
    description: 'Minimal ambient noise',
    frequencies: {},
    realWorldExample: 'Quiet bedroom',
    difficulty: 0
  },
  white: {
    name: 'White Noise',
    description: 'Equal power across frequencies',
    frequencies: {
      100: 1.0, 200: 1.0, 300: 1.0, 400: 1.0, 500: 1.0,
      1000: 1.0, 2000: 1.0, 4000: 1.0, 8000: 1.0, 16000: 1.0
    },
    realWorldExample: 'Fan, TV static',
    difficulty: 2
  },
  traffic: {
    name: 'Traffic',
    description: 'Road noise with engine rumble and tire sounds',
    frequencies: {
      50: 0.8, 100: 1.0, 150: 0.9, 200: 0.85, 300: 0.7, // Low rumble
      500: 0.6, 1000: 0.5, 2000: 0.4, 4000: 0.35, 8000: 0.3 // High frequency tires
    },
    realWorldExample: 'Busy highway or urban street',
    difficulty: 3
  },
  babble: {
    name: 'Speech Babble',
    description: 'Multiple overlapping conversations',
    frequencies: {
      200: 0.7, 300: 0.8, 500: 0.85, 800: 0.9, 1000: 0.95,
      1500: 0.9, 2000: 0.85, 3000: 0.8, 4000: 0.75, 5000: 0.7
    },
    realWorldExample: 'Crowded restaurant, party',
    difficulty: 4
  },
  cocktail: {
    name: 'Cocktail Party',
    description: 'Dense speech noise with spectral peaks',
    frequencies: {
      150: 0.6, 200: 0.7, 300: 0.75, 400: 0.8, 500: 0.85,
      700: 0.9, 1000: 0.95, 1500: 0.92, 2000: 0.88, 3000: 0.85,
      4000: 0.82, 5000: 0.8, 6000: 0.75, 8000: 0.7
    },
    realWorldExample: 'Busy coffee shop, noisy bar',
    difficulty: 5
  },
  office: {
    name: 'Office Ambient',
    description: 'Low-level office background noise',
    frequencies: {
      200: 0.3, 400: 0.35, 600: 0.4, 1000: 0.45, 2000: 0.4, 4000: 0.35
    },
    realWorldExample: 'Quiet office with keyboard clicks, conversations',
    difficulty: 1
  }
};

export class NoiseSimulator {
  private audioContext: AudioContext;
  private noiseGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private bufferSource: AudioBufferSourceNode | null = null;
  private isPlaying = false;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Start playing noise at specified dB level
   */
  startNoise(noiseType: NoiseType, dbLevel: number): void {
    if (this.isPlaying) {
      this.stopNoise();
    }

    const preset = NOISE_PRESETS[noiseType];
    if (noiseType === 'silent') {
      return;
    }

    // Create noise using multiple sine waves at different frequencies
    const frequencies = Object.keys(preset.frequencies).map(Number);
    const gain = this.dbToGain(dbLevel);

    // Create master gain node for noise
    this.noiseGain = this.audioContext.createGain();
    this.noiseGain.gain.value = gain;
    this.noiseGain.connect(this.audioContext.destination);

    // Create sine wave components for each frequency in the preset
    frequencies.forEach((freq) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      // Set amplitude based on preset
      const amplitude = preset.frequencies[freq];
      gainNode.gain.value = amplitude * 0.1; // Scale down to prevent clipping

      oscillator.connect(gainNode);
      gainNode.connect(this.noiseGain!);
      oscillator.start();

      this.oscillators.push(oscillator);
    });

    this.isPlaying = true;
  }

  /**
   * Stop playing noise
   */
  stopNoise(): void {
    if (this.noiseGain) {
      this.noiseGain.gain.setValueAtTime(this.noiseGain.gain.value, this.audioContext.currentTime);
      this.noiseGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.05);
      setTimeout(() => {
        this.oscillators.forEach(osc => {
          try {
            osc.stop();
          } catch (e) {
            // Already stopped
          }
        });
        this.oscillators = [];
        this.noiseGain = null;
      }, 50);
    }
    this.isPlaying = false;
  }

  /**
   * Adjust noise level without stopping
   */
  setNoiseLevel(dbLevel: number): void {
    if (this.noiseGain) {
      const gain = this.dbToGain(dbLevel);
      this.noiseGain.gain.setValueAtTime(this.noiseGain.gain.value, this.audioContext.currentTime);
      this.noiseGain.gain.linearRampToValueAtTime(gain, this.audioContext.currentTime + 0.1);
    }
  }

  /**
   * Convert dB level to linear gain (0-1)
   * Reference: 0dB = 0.3 (moderate level)
   */
  private dbToGain(db: number): number {
    return Math.pow(10, (db - 50) / 20);
  }

  /**
   * Get noise characteristics for display
   */
  getNoiseInfo(noiseType: NoiseType): NoiseCharacteristics {
    return NOISE_PRESETS[noiseType];
  }

  /**
   * Calculate speech-intelligibility index (rough approximation)
   * Lower values mean noise makes speech harder to understand
   */
  calculateSpeechIntelligibility(speechDbLevel: number, noiseDbLevel: number): number {
    const snr = speechDbLevel - noiseDbLevel; // Signal-to-Noise Ratio

    if (snr > 10) return 100; // Very easy
    if (snr > 5) return 85;   // Easy
    if (snr > 0) return 70;   // Moderate
    if (snr > -5) return 50;  // Hard
    if (snr > -10) return 30; // Very hard
    return 10; // Nearly impossible
  }

  /**
   * Get training recommendation based on noise and performance
   */
  getTrainingRecommendation(
    noiseType: NoiseType,
    accuracy: number
  ): { message: string; suggestedNextStep: 'increase' | 'maintain' | 'decrease' } {
    const difficulty = NOISE_PRESETS[noiseType].difficulty;

    if (accuracy >= 90) {
      return {
        message: 'Excellent performance in this noise environment!',
        suggestedNextStep: difficulty < 5 ? 'increase' : 'maintain'
      };
    }

    if (accuracy >= 75) {
      return {
        message: 'Good performance. You\'re adapting well to this noise level.',
        suggestedNextStep: 'maintain'
      };
    }

    if (accuracy >= 60) {
      return {
        message: 'This noise level is challenging. Focus on careful listening.',
        suggestedNextStep: 'maintain'
      };
    }

    return {
      message: 'This is very challenging. Consider practicing at a lower noise level first.',
      suggestedNextStep: difficulty > 0 ? 'decrease' : 'maintain'
    };
  }

  /**
   * Check if is currently playing
   */
  isNoisePlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopNoise();
  }
}
