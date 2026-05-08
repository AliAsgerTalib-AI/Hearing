import { audioEngine } from './AudioEngine';

export interface VowelTrial {
  vowel: string;
  formants: {
    F1: number; // First formant (vowel height)
    F2: number; // Second formant (front/back)
    F3: number; // Third formant (vowel refinement)
  };
  noiseLevel: number; // 0-100 scale
  duration: number; // in seconds
}

export interface VowelDiscriminationState {
  level: number;
  accuracy: number;
  totalTrials: number;
  correctTrials: number;
  noiseLevel: number; // dB
  currentVowel: string;
  correctAnswer: string;
}

/**
 * Vowel Discrimination Exercise Algorithm
 * Trains recognition of vowel sounds (a, e, i, o, u) with progressive difficulty.
 * Focuses on formant frequencies and spectral characteristics of vowels.
 */
export class VowelDiscriminationExercise {
  // Vowel formant frequencies (adult male, based on Peterson & Barney 1952)
  private readonly VOWELS = [
    { char: 'a', name: 'Ah', F1: 700, F2: 1220, F3: 2600, example: 'cat' },
    { char: 'e', name: 'Eh', F1: 550, F2: 1770, F3: 2500, example: 'bet' },
    { char: 'i', name: 'Ee', F1: 270, F2: 2290, F3: 3010, example: 'bit' },
    { char: 'o', name: 'Oh', F1: 570, F2: 840, F3: 2250, example: 'got' },
    { char: 'u', name: 'Oo', F1: 440, F2: 1020, F3: 2250, example: 'put' },
  ];

  // Extended vowel set (near-minimal pairs for higher difficulty)
  private readonly VOWELS_EXTENDED = [
    { char: 'ɑ', name: 'Ah(open)', F1: 750, F2: 940, F3: 2500, example: 'father' },
    { char: 'ɛ', name: 'Eh(open)', F1: 610, F2: 1900, F3: 2550, example: 'dress' },
    { char: 'ɪ', name: 'Ih', F1: 400, F2: 1920, F3: 2560, example: 'kit' },
    { char: 'ɔ', name: 'Aw', F1: 630, F2: 1090, F3: 2360, example: 'cloth' },
    { char: 'ʊ', name: 'Uh', F1: 520, F2: 1190, F3: 2390, example: 'book' },
  ];

  // Exercise progression levels
  private readonly LEVEL_CONFIGS = [
    {
      vowelSet: ['a', 'i'],
      noiseLevel: 5,
      description: 'Very distinct vowels, no noise',
      similarity: 'extreme',
    },
    {
      vowelSet: ['a', 'e', 'i', 'o', 'u'],
      noiseLevel: 10,
      description: 'All basic vowels, light noise',
      similarity: 'high',
    },
    {
      vowelSet: ['a', 'e', 'i', 'o', 'u'],
      noiseLevel: 20,
      description: 'All basic vowels, moderate noise',
      similarity: 'high',
    },
    {
      vowelSet: ['ɑ', 'ɛ', 'ɪ', 'ɔ', 'ʊ'],
      noiseLevel: 30,
      description: 'Extended vowels, significant noise',
      similarity: 'medium',
    },
    {
      vowelSet: ['ɑ', 'ɛ', 'ɪ', 'ɔ', 'ʊ'],
      noiseLevel: 40,
      description: 'Extended vowels, heavy noise',
      similarity: 'medium',
    },
  ];

  private state: VowelDiscriminationState = {
    level: 1,
    accuracy: 100,
    totalTrials: 0,
    correctTrials: 0,
    noiseLevel: 5,
    currentVowel: 'Ah',
    correctAnswer: 'a',
  };

  private isPlaying = false;

  constructor() {
    this.resetState();
  }

  /**
   * Generates a vowel trial with target vowel and noise
   */
  generateTrial(): VowelTrial {
    const levelConfig = this.LEVEL_CONFIGS[Math.min(this.state.level - 1, this.LEVEL_CONFIGS.length - 1)];
    const vowelSet = levelConfig.vowelSet;

    // Get all vowel data (basic + extended)
    const allVowels = [...this.VOWELS, ...this.VOWELS_EXTENDED];

    // Pick random vowel from current level set
    const targetVowelChar = vowelSet[Math.floor(Math.random() * vowelSet.length)];
    const vowelData = allVowels.find(v => v.char === targetVowelChar)!;

    this.state.currentVowel = vowelData.name;
    this.state.correctAnswer = targetVowelChar;
    this.state.noiseLevel = levelConfig.noiseLevel;

    return {
      vowel: targetVowelChar,
      formants: {
        F1: vowelData.F1,
        F2: vowelData.F2,
        F3: vowelData.F3,
      },
      noiseLevel: levelConfig.noiseLevel,
      duration: 0.8, // Vowel duration
    };
  }

  /**
   * Plays vowel with background noise
   */
  async playTrial(trial: VowelTrial): Promise<void> {
    if (this.isPlaying) return;
    this.isPlaying = true;

    try {
      await audioEngine.resume();

      // Convert noise level (0-100) to gain (0-0.3)
      const noiseGain = (trial.noiseLevel / 100) * 0.3;

      // Play vowel formants with noise
      await this.playVowelWithNoise(trial, noiseGain);
    } finally {
      this.isPlaying = false;
      audioEngine.stopTone();
    }
  }

  /**
   * Synthesize vowel with harmonic structure and noise
   */
  private async playVowelWithNoise(trial: VowelTrial, noiseGain: number): Promise<void> {
    const F1 = trial.formants.F1;
    const F2 = trial.formants.F2;
    const F3 = trial.formants.F3;
    const duration = trial.duration;
    const stepMs = 50; // Play formants in 50ms blocks for realism

    const totalSteps = Math.floor((duration * 1000) / stepMs);

    for (let i = 0; i < totalSteps; i++) {
      // Play primary formant (F1 - most perceptually important)
      // Formants should be slightly modulated for naturalness
      const F1_modulated = F1 + Math.sin(i * 0.1) * 30;
      audioEngine.playTone(F1_modulated, 0.5);

      await this.delay(stepMs / 3);
      audioEngine.stopTone();

      // Play secondary formant (F2)
      const F2_modulated = F2 + Math.sin(i * 0.1 + 1) * 40;
      audioEngine.playTone(F2_modulated, 0.3);

      await this.delay(stepMs / 3);
      audioEngine.stopTone();

      // Play formant + noise blend
      await this.playFormantWithNoise(F1, F2, noiseGain, stepMs / 3);

      // Add breathing room
      await this.delay(10);
    }

    audioEngine.stopTone();
  }

  /**
   * Play formant with noise overlay for speech realism
   */
  private async playFormantWithNoise(
    formantFreq: number,
    secondaryFreq: number,
    noiseGain: number,
    duration: number
  ): Promise<void> {
    // Simulate noise with rapid random frequency sweeps
    const sweepCount = Math.floor(duration / 10);
    for (let i = 0; i < sweepCount; i++) {
      // Combine formant frequency with noisy component
      const noiseFreq = 2000 + Math.random() * 6000;
      const blendFreq = (formantFreq + noiseFreq) / 2;
      audioEngine.playTone(blendFreq, noiseGain * 0.8);
      await this.delay(10);
    }
    audioEngine.stopTone();
  }

  /**
   * Records user response and adapts exercise difficulty
   */
  recordResponse(userAnswer: string, correct: boolean): void {
    this.state.totalTrials++;
    if (correct) {
      this.state.correctTrials++;
    }

    // Calculate rolling accuracy
    const recentAccuracy = this.getRecentAccuracy();
    this.state.accuracy = recentAccuracy;

    // Adapt difficulty
    if (recentAccuracy >= 88 && this.state.level < this.LEVEL_CONFIGS.length) {
      this.state.level++;
    } else if (recentAccuracy < 70 && this.state.level > 1) {
      this.state.level = Math.max(1, this.state.level - 1);
    }
  }

  /**
   * Gets current exercise state
   */
  getState(): VowelDiscriminationState {
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
      noiseLevel: 5,
      currentVowel: 'Ah',
      correctAnswer: 'a',
    };
  }

  /**
   * Gets recent accuracy based on last 10 trials
   */
  private getRecentAccuracy(): number {
    if (this.state.totalTrials === 0) return 100;
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
    const config = this.getLevelConfig();
    return config.description;
  }

  /**
   * Get list of vowels at current level
   */
  getCurrentVowelSet(): string[] {
    const levelConfig = this.LEVEL_CONFIGS[Math.min(this.state.level - 1, this.LEVEL_CONFIGS.length - 1)];
    const allVowels = [...this.VOWELS, ...this.VOWELS_EXTENDED];
    return levelConfig.vowelSet.map(char => {
      const vowelData = allVowels.find(v => v.char === char);
      return vowelData?.name || char;
    });
  }

  /**
   * Get vowel example words for current level
   */
  getVowelExamples(): Record<string, string> {
    const levelConfig = this.LEVEL_CONFIGS[Math.min(this.state.level - 1, this.LEVEL_CONFIGS.length - 1)];
    const allVowels = [...this.VOWELS, ...this.VOWELS_EXTENDED];
    const examples: Record<string, string> = {};

    levelConfig.vowelSet.forEach(char => {
      const vowelData = allVowels.find(v => v.char === char);
      if (vowelData) {
        examples[vowelData.name] = vowelData.example;
      }
    });

    return examples;
  }

  /**
   * Stops any active playback
   */
  stop(): void {
    audioEngine.stopTone();
    this.isPlaying = false;
  }
}
