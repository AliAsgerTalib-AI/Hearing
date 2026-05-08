import { audioEngine } from './AudioEngine';

export interface ConsonantTrial {
  consonant: string;
  syllable: string;
  targetFrequencies: number[];
  noiseLevel: number; // 0-100 scale
  duration: number; // in seconds
}

export interface ConsonantContrastState {
  level: number;
  accuracy: number;
  totalTrials: number;
  correctTrials: number;
  noiseLevel: number; // dB
  currentConsonant: string;
  correctAnswer: string;
}

/**
 * Consonant Contrast Exercise Algorithm
 * Trains discrimination between similar consonants (p, b, t, d, k, g) in noisy backgrounds.
 * Focuses on acoustic cues: voice onset time, burst characteristics, formant transitions.
 */
export class ConsonantContrastExercise {
  // Target consonants with characteristic frequencies
  private readonly CONSONANTS = [
    { char: 'p', name: 'Pee', freq: 1500, duration: 0.08, voicing: false },
    { char: 'b', name: 'Bee', freq: 800, duration: 0.12, voicing: true },
    { char: 't', name: 'Tee', freq: 2000, duration: 0.06, voicing: false },
    { char: 'd', name: 'Dee', freq: 1200, duration: 0.1, voicing: true },
    { char: 'k', name: 'Kay', freq: 2500, duration: 0.07, voicing: false },
    { char: 'g', name: 'Gee', freq: 1000, duration: 0.11, voicing: true },
  ];

  // Vowel formant frequencies (F1, F2, F3) for following vowel /a/
  private readonly VOWEL_FORMANTS = {
    F1: 700,  // Low frequency (vowel quality)
    F2: 1220, // Mid frequency
    F3: 2600, // High frequency
  };

  // Exercise progression levels
  private readonly LEVEL_CONFIGS = [
    { pairsPerTrial: 2, noiseLevel: 10, targetConsSet: ['p', 'b'] },
    { pairsPerTrial: 2, noiseLevel: 20, targetConsSet: ['p', 'b', 't'] },
    { pairsPerTrial: 3, noiseLevel: 30, targetConsSet: ['p', 'b', 't', 'd'] },
    { pairsPerTrial: 3, noiseLevel: 40, targetConsSet: ['k', 'g', 'p', 'b', 't', 'd'] },
    { pairsPerTrial: 4, noiseLevel: 50, targetConsSet: ['p', 'b', 't', 'd', 'k', 'g'] },
  ];

  private state: ConsonantContrastState = {
    level: 1,
    accuracy: 100,
    totalTrials: 0,
    correctTrials: 0,
    noiseLevel: 10,
    currentConsonant: 'p',
    correctAnswer: 'p',
  };

  private isPlaying = false;
  private noiseContext: OfflineAudioContext | null = null;

  constructor() {
    this.resetState();
    this.initializeNoiseGenerator();
  }

  /**
   * Initialize offline audio context for noise generation
   */
  private initializeNoiseGenerator() {
    if (typeof OfflineAudioContext !== 'undefined') {
      this.noiseContext = new OfflineAudioContext(1, 44100 * 2, 44100);
    }
  }

  /**
   * Generates a consonant trial with target consonant and noise
   */
  generateTrial(): ConsonantTrial {
    const levelConfig = this.LEVEL_CONFIGS[Math.min(this.state.level - 1, this.LEVEL_CONFIGS.length - 1)];
    const targetConsSet = levelConfig.targetConsSet;

    // Pick a random consonant from the target set
    const randomIndex = Math.floor(Math.random() * targetConsSet.length);
    const targetCons = targetConsSet[randomIndex];
    const consonantData = this.CONSONANTS.find(c => c.char === targetCons)!;

    this.state.currentConsonant = consonantData.name;
    this.state.correctAnswer = targetCons;
    this.state.noiseLevel = levelConfig.noiseLevel;

    return {
      consonant: targetCons,
      syllable: `${targetCons}a`,
      targetFrequencies: [consonantData.freq, this.VOWEL_FORMANTS.F1, this.VOWEL_FORMANTS.F2],
      noiseLevel: levelConfig.noiseLevel,
      duration: consonantData.duration + 0.3, // consonant + vowel
    };
  }

  /**
   * Plays consonant syllable with background noise
   */
  async playTrial(trial: ConsonantTrial): Promise<void> {
    if (this.isPlaying) return;
    this.isPlaying = true;

    try {
      await audioEngine.resume();

      // Convert noise level (0-100) to gain (0-0.5)
      const noiseGain = (trial.noiseLevel / 100) * 0.5;

      // Play consonant-vowel syllable
      await this.playConsonantVowel(trial, noiseGain);
    } finally {
      this.isPlaying = false;
      audioEngine.stopTone();
    }
  }

  /**
   * Synthesize consonant-vowel pair with background noise
   */
  private async playConsonantVowel(trial: ConsonantTrial, noiseGain: number): Promise<void> {
    const consonantData = this.CONSONANTS.find(c => c.char === trial.consonant)!;

    // Phase 1: Play consonant burst (with optional noise)
    await this.playNoiseGate(noiseGain, consonantData.duration * 0.6);

    // Phase 2: Transition - consonant frequency + noise
    audioEngine.playTone(consonantData.freq, 0.4);
    await this.delay(consonantData.duration * 0.4 * 1000);
    audioEngine.stopTone();

    // Phase 3: Vowel formant transitions
    // Start with formant transition from consonant
    await this.playFormantTransition(consonantData.freq, this.VOWEL_FORMANTS.F2, 0.1);

    // Phase 4: Steady vowel formants
    await this.playVowelFormants(noiseGain, 0.2);

    audioEngine.stopTone();
  }

  /**
   * Play brief noise burst (simulating consonant release)
   */
  private async playNoiseGate(noiseGain: number, duration: number): Promise<void> {
    // Simulate noise with rapid frequency sweeps
    const sweepCount = Math.floor(duration * 1000 / 20);
    for (let i = 0; i < sweepCount; i++) {
      const randomFreq = 3000 + Math.random() * 7000; // Broad spectrum
      audioEngine.playTone(randomFreq, noiseGain);
      await this.delay(20);
    }
    audioEngine.stopTone();
  }

  /**
   * Play formant transition (consonant release to vowel)
   */
  private async playFormantTransition(startFreq: number, endFreq: number, duration: number): Promise<void> {
    const steps = Math.floor(duration * 1000 / 20);
    for (let i = 0; i < steps; i++) {
      const progress = i / steps;
      const currentFreq = startFreq + (endFreq - startFreq) * progress;
      audioEngine.playTone(currentFreq, 0.3);
      await this.delay(20);
    }
    audioEngine.stopTone();
  }

  /**
   * Play vowel formants (primary acoustic cue for vowel identity)
   */
  private async playVowelFormants(noiseGain: number, duration: number): Promise<void> {
    // For simplicity, use the primary formant (F2 position varies by consonant)
    audioEngine.playTone(this.VOWEL_FORMANTS.F2, 0.4);
    await this.delay(duration * 1000);
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
    if (recentAccuracy >= 85 && this.state.level < this.LEVEL_CONFIGS.length) {
      this.state.level++;
    } else if (recentAccuracy < 60 && this.state.level > 1) {
      this.state.level = Math.max(1, this.state.level - 1);
    }
  }

  /**
   * Gets current exercise state
   */
  getState(): ConsonantContrastState {
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
      noiseLevel: 10,
      currentConsonant: 'Pee',
      correctAnswer: 'p',
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
    const descriptions = [
      'Beginner - Clear consonants, low noise',
      'Novice - Three consonants, light noise',
      'Intermediate - Four consonants, moderate noise',
      'Advanced - Full set, significant noise',
      'Expert - All consonants, heavy background noise',
    ];
    return descriptions[Math.min(this.state.level - 1, descriptions.length - 1)];
  }

  /**
   * Get list of consonants at current level
   */
  getCurrentConsonantSet(): string[] {
    const levelConfig = this.LEVEL_CONFIGS[Math.min(this.state.level - 1, this.LEVEL_CONFIGS.length - 1)];
    return levelConfig.targetConsSet;
  }

  /**
   * Stops any active playback
   */
  stop(): void {
    audioEngine.stopTone();
    this.isPlaying = false;
  }
}
