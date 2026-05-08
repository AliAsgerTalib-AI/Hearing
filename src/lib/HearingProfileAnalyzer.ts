import { TestResult } from '../services/geminiService';

export interface FrequencyLossPattern {
  type: 'flat' | 'sloping' | 'high-frequency' | 'low-frequency' | 'notch' | 'reverse-slope';
  severity: 'normal' | 'mild' | 'moderate' | 'severe' | 'profound';
  description: string;
}

export interface EarAsymmetry {
  hasAsymmetry: boolean;
  difference: number; // dB difference
  worseEar: 'left' | 'right' | 'equal';
  criticalFrequencies: number[]; // Frequencies with >15dB difference
}

export interface HearingProfile {
  // Loss characterization
  pattern: FrequencyLossPattern;
  asymmetry: EarAsymmetry;

  // Frequency-specific analysis
  lowFreqThreshold: number;      // 125-500Hz average
  midFreqThreshold: number;      // 1000-2000Hz average
  highFreqThreshold: number;     // 4000-16000Hz average

  // Critical findings
  wordRecognitionRisk: boolean;   // Loss pattern suggests speech clarity issues
  tinnitusPredisposition: boolean; // High-frequency loss may correlate with tinnitus
  balancePredisposition: boolean;  // Low-frequency loss may affect balance
  cognitiveLoadRisk: boolean;     // Effort required to understand speech

  // Age-adjusted assessment
  isProgressivePattern: boolean;  // Pattern suggests ongoing degeneration
  complianceWithAgeExpectation: boolean; // Matches age-related presbycusis

  // Clinical classifications
  audiogramShape: string;
  estimatedCommunicationDifficulty: 'minimal' | 'mild' | 'moderate' | 'significant' | 'severe';
  recommendedAidingStrategy: string;
}

/**
 * Hearing Profile Analyzer
 * Analyzes audiometric results to characterize type and severity of hearing loss
 * Identifies patterns that guide personalized training recommendations
 */
export class HearingProfileAnalyzer {
  /**
   * Analyze test results and generate detailed hearing profile
   */
  static analyzeProfile(
    results: TestResult[],
    age: number = 40,
    sex: 'male' | 'female' | 'other' = 'other'
  ): HearingProfile {
    // Consolidate to single "both" ear for analysis
    const consolidatedResults = this.consolidateResults(results);

    // Calculate frequency band averages
    const lowFreqThreshold = this.getFrequencyBandAverage(consolidatedResults, [125, 250, 500]);
    const midFreqThreshold = this.getFrequencyBandAverage(consolidatedResults, [1000, 2000]);
    const highFreqThreshold = this.getFrequencyBandAverage(consolidatedResults, [4000, 8000, 12000, 16000]);

    // Determine loss pattern
    const pattern = this.identifyLossPattern(lowFreqThreshold, midFreqThreshold, highFreqThreshold);

    // Analyze ear asymmetry
    const asymmetry = this.analyzeAsymmetry(results);

    // Risk factors
    const wordRecognitionRisk = highFreqThreshold > 40 || (midFreqThreshold > 35 && highFreqThreshold > 35);
    const tinnitusPredisposition = highFreqThreshold > 50;
    const balancePredisposition = lowFreqThreshold > 45;
    const cognitiveLoadRisk = midFreqThreshold > 40;

    // Age-adjusted analysis
    const ageAdjustedExpectation = this.getAgeAdjustedExpectation(age, sex);
    const isProgressivePattern = this.isProgressivePattern(pattern, highFreqThreshold);
    const complianceWithAgeExpectation = this.checkAgeCompliance(highFreqThreshold, ageAdjustedExpectation);

    // Communication difficulty
    const communicationDifficulty = this.estimateCommunicationDifficulty(
      pattern,
      midFreqThreshold,
      wordRecognitionRisk
    );

    // Audiogram shape description
    const audiogramShape = this.describeAudiogramShape(pattern, lowFreqThreshold, highFreqThreshold);

    // Aiding strategy
    const aidingStrategy = this.recommendAidingStrategy(pattern, asymmetry, age);

    return {
      pattern,
      asymmetry,
      lowFreqThreshold,
      midFreqThreshold,
      highFreqThreshold,
      wordRecognitionRisk,
      tinnitusPredisposition,
      balancePredisposition,
      cognitiveLoadRisk,
      isProgressivePattern,
      complianceWithAgeExpectation,
      audiogramShape,
      estimatedCommunicationDifficulty: communicationDifficulty,
      recommendedAidingStrategy: aidingStrategy,
    };
  }

  /**
   * Consolidate left/right results into single dataset
   */
  private static consolidateResults(results: TestResult[]): Array<{ freq: number; db: number }> {
    const frequencyMap = new Map<number, number[]>();

    results.forEach(result => {
      if (!frequencyMap.has(result.freq)) {
        frequencyMap.set(result.freq, []);
      }
      frequencyMap.get(result.freq)!.push(result.db);
    });

    return Array.from(frequencyMap.entries()).map(([freq, values]) => ({
      freq,
      db: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    }));
  }

  /**
   * Get average threshold for frequency band
   */
  private static getFrequencyBandAverage(
    results: Array<{ freq: number; db: number }>,
    frequencies: number[]
  ): number {
    const bandResults = results.filter(r => frequencies.includes(r.freq));
    if (bandResults.length === 0) return 0;
    return Math.round(bandResults.reduce((sum, r) => sum + r.db, 0) / bandResults.length);
  }

  /**
   * Identify the pattern of hearing loss
   */
  private static identifyLossPattern(
    lowFreq: number,
    midFreq: number,
    highFreq: number
  ): FrequencyLossPattern {
    // High-frequency hearing loss (most common - presbycusis)
    if (highFreq > midFreq + 15 && highFreq > lowFreq + 15) {
      return {
        type: 'high-frequency',
        severity: this.getSeverity(highFreq),
        description: 'High-frequency hearing loss typical of age-related presbycusis',
      };
    }

    // Sloping loss (gradual decline across frequencies)
    if (highFreq > lowFreq + 20) {
      return {
        type: 'sloping',
        severity: this.getSeverity((lowFreq + midFreq + highFreq) / 3),
        description: 'Sloping audiogram with declining thresholds at higher frequencies',
      };
    }

    // Flat loss (equal across frequencies)
    if (Math.abs(highFreq - lowFreq) <= 15) {
      return {
        type: 'flat',
        severity: this.getSeverity((lowFreq + highFreq) / 2),
        description: 'Flat audiogram with similar loss across frequency range',
      };
    }

    // Low-frequency loss (conductive or Ménière's)
    if (lowFreq > midFreq + 15) {
      return {
        type: 'low-frequency',
        severity: this.getSeverity(lowFreq),
        description: 'Low-frequency hearing loss (possible conductive or inner ear component)',
      };
    }

    // Reverse slope (high frequencies better than low)
    if (lowFreq > highFreq + 15) {
      return {
        type: 'reverse-slope',
        severity: this.getSeverity(lowFreq),
        description: 'Reverse-slope audiogram (conductive or mixed loss pattern)',
      };
    }

    // Notch pattern (specific frequency dip)
    return {
      type: 'notch',
      severity: this.getSeverity(midFreq),
      description: 'Notched audiogram with specific frequency vulnerability',
    };
  }

  /**
   * Classify severity based on thresholds
   */
  private static getSeverity(avgDb: number): 'normal' | 'mild' | 'moderate' | 'severe' | 'profound' {
    if (avgDb <= 20) return 'normal';
    if (avgDb <= 40) return 'mild';
    if (avgDb <= 60) return 'moderate';
    if (avgDb <= 80) return 'severe';
    return 'profound';
  }

  /**
   * Analyze ear-to-ear asymmetry
   */
  private static analyzeAsymmetry(results: TestResult[]): EarAsymmetry {
    const leftResults = results.filter(r => r.side === 'left');
    const rightResults = results.filter(r => r.side === 'right');

    if (leftResults.length === 0 || rightResults.length === 0) {
      return {
        hasAsymmetry: false,
        difference: 0,
        worseEar: 'equal',
        criticalFrequencies: [],
      };
    }

    // Compare frequencies present in both ears
    const commonFreqs = new Set<number>();
    const frequencyMap = new Map<number, { left: number; right: number }>();

    leftResults.forEach(r => {
      if (!frequencyMap.has(r.freq)) frequencyMap.set(r.freq, { left: r.db, right: 0 });
      else frequencyMap.get(r.freq)!.left = r.db;
    });

    rightResults.forEach(r => {
      if (!frequencyMap.has(r.freq)) frequencyMap.set(r.freq, { left: 0, right: r.db });
      else frequencyMap.get(r.freq)!.right = r.db;
    });

    // Calculate differences
    const differences: number[] = [];
    const criticalFrequencies: number[] = [];
    let worseEar: 'left' | 'right' | 'equal' = 'equal';
    let leftTotal = 0,
      rightTotal = 0;

    frequencyMap.forEach(({ left, right }, freq) => {
      if (left > 0 && right > 0) {
        const diff = Math.abs(left - right);
        differences.push(diff);
        if (diff > 15) criticalFrequencies.push(freq);
        leftTotal += left;
        rightTotal += right;
      }
    });

    if (differences.length > 0) {
      if (leftTotal > rightTotal) worseEar = 'left';
      else if (rightTotal > leftTotal) worseEar = 'right';
    }

    const avgDifference = Math.round(differences.reduce((a, b) => a + b, 0) / (differences.length || 1));

    return {
      hasAsymmetry: avgDifference > 5,
      difference: avgDifference,
      worseEar,
      criticalFrequencies,
    };
  }

  /**
   * Get age-adjusted presbycusis expectation
   */
  private static getAgeAdjustedExpectation(age: number, sex: 'male' | 'female' | 'other'): number {
    // Rough presbycusis model: ~0.5-1.5 dB/year decline at 8kHz
    const yearsAfter20 = Math.max(0, age - 20);
    const baseDecline = yearsAfter20 * 0.8; // 0.8 dB/year on average
    const sexAdjustment = sex === 'male' ? 1.2 : 1.0; // Males typically decline faster
    return Math.round(baseDecline * sexAdjustment);
  }

  /**
   * Check if results match age expectations
   */
  private static checkAgeCompliance(highFreqThreshold: number, ageExpectation: number): boolean {
    // Within ±15dB of age expectation is "normal"
    return Math.abs(highFreqThreshold - ageExpectation) <= 15;
  }

  /**
   * Detect progressive loss pattern
   */
  private static isProgressivePattern(pattern: FrequencyLossPattern, highFreqThreshold: number): boolean {
    // High-frequency or sloping patterns suggest ongoing presbycusis
    return (pattern.type === 'high-frequency' || pattern.type === 'sloping') && highFreqThreshold > 20;
  }

  /**
   * Estimate communication difficulty
   */
  private static estimateCommunicationDifficulty(
    pattern: FrequencyLossPattern,
    midFreqThreshold: number,
    wordRecognitionRisk: boolean
  ): 'minimal' | 'mild' | 'moderate' | 'significant' | 'severe' {
    if (pattern.severity === 'normal') return 'minimal';
    if (pattern.severity === 'mild') return wordRecognitionRisk ? 'moderate' : 'mild';
    if (pattern.severity === 'moderate') return wordRecognitionRisk ? 'significant' : 'moderate';
    return 'severe';
  }

  /**
   * Describe audiogram shape in clinical terms
   */
  private static describeAudiogramShape(
    pattern: FrequencyLossPattern,
    lowFreq: number,
    highFreq: number
  ): string {
    const shapes = {
      'high-frequency': `High-frequency sensorineural loss (${pattern.severity})`,
      sloping: `Sloping sensorineural loss (${pattern.severity})`,
      flat: `Flat ${pattern.severity} hearing loss`,
      'low-frequency': `Low-frequency loss (${pattern.severity})`,
      'reverse-slope': `Reverse-slope loss (${pattern.severity}) - suggests conductive component`,
      notch: `Notched audiogram (${pattern.severity})`,
    };
    return shapes[pattern.type];
  }

  /**
   * Recommend aiding/training strategy
   */
  private static recommendAidingStrategy(
    pattern: FrequencyLossPattern,
    asymmetry: EarAsymmetry,
    age: number
  ): string {
    const strategies: string[] = [];

    // High-frequency strategy
    if (pattern.type === 'high-frequency' || pattern.type === 'sloping') {
      strategies.push('Focus on high-frequency consonant discrimination training');
      strategies.push('Emphasize speech clarity in noisy environments');
    }

    // Asymmetry management
    if (asymmetry.hasAsymmetry) {
      strategies.push(`Asymmetry detected - focus on ${asymmetry.worseEar} ear rehabilitation`);
    }

    // Age-related strategy
    if (age > 50) {
      strategies.push('Age-related presbycusis - consistent daily training recommended');
      strategies.push('Progressive neuroplasticity training to maintain speech understanding');
    }

    // Low-frequency
    if (pattern.type === 'low-frequency' || pattern.type === 'reverse-slope') {
      strategies.push('Consider vestibular assessment (low-frequency loss may affect balance)');
    }

    return strategies.length > 0 ? strategies.join('; ') : 'Standard audiometric rehabilitation protocol';
  }
}
