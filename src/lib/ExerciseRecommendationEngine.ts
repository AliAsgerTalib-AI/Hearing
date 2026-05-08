import { HearingProfile } from './HearingProfileAnalyzer';

export interface ExerciseRecommendation {
  exerciseId: number;
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  rationale: string;
  suggestedDuration: number; // minutes
  frequency: string; // e.g., "Daily", "3x per week"
  expectedOutcome: string;
  focusArea: string;
}

export interface PersonalizedRegimen {
  dailyFocus: string;
  recommendations: ExerciseRecommendation[];
  trainingDurationWeeks: number;
  keyInsights: string[];
  warnings: string[];
  expectedImprovement: string;
}

/**
 * Exercise Recommendation Engine
 * Intelligently recommends exercises based on hearing profile
 * Uses evidence-based auditory training principles
 */
export class ExerciseRecommendationEngine {
  /**
   * Generate personalized training regimen based on hearing profile
   */
  static generateRegimen(profile: HearingProfile, age: number = 40): PersonalizedRegimen {
    const recommendations = this.recommendExercises(profile, age);
    const keyInsights = this.generateInsights(profile);
    const warnings = this.generateWarnings(profile);
    const expectedImprovement = this.estimateImprovement(profile);
    const trainingDuration = this.estimateTrainingDuration(profile);
    const dailyFocus = this.generateDailyFocus(profile);

    return {
      dailyFocus,
      recommendations,
      trainingDurationWeeks: trainingDuration,
      keyInsights,
      warnings,
      expectedImprovement,
    };
  }

  /**
   * Recommend specific exercises based on hearing profile
   */
  private static recommendExercises(profile: HearingProfile, age: number): ExerciseRecommendation[] {
    const recommendations: ExerciseRecommendation[] = [];

    // 1. VOWEL DISCRIMINATION - Foundation for all users
    recommendations.push({
      exerciseId: 1,
      name: 'Vowel Discrimination',
      priority: 'high',
      rationale: 'Foundational exercise for all hearing loss types. Vowels form speech nucleus and are relatively preserved in hearing loss.',
      suggestedDuration: 5,
      frequency: 'Daily',
      expectedOutcome: 'Improved vowel recognition and foundational speech clarity',
      focusArea: 'Speech Foundation',
    });

    // 2. CONSONANT CONTRAST - Critical for word recognition
    if (profile.wordRecognitionRisk || profile.pattern.type === 'high-frequency') {
      recommendations.push({
        exerciseId: 2,
        name: 'Consonant Contrast',
        priority: 'critical',
        rationale:
          'Consonants carry 60% of speech intelligence. High-frequency loss disproportionately affects consonant perception (p, t, k, s, sh).',
        suggestedDuration: 8,
        frequency: 'Daily',
        expectedOutcome: 'Significant improvement in consonant discrimination, especially in noise. Better word recognition.',
        focusArea: 'Speech Clarity & Noise Robustness',
      });
    } else if (profile.pattern.severity === 'mild') {
      recommendations.push({
        exerciseId: 2,
        name: 'Consonant Contrast',
        priority: 'high',
        rationale: 'Even mild hearing loss can affect consonant discrimination in background noise.',
        suggestedDuration: 8,
        frequency: '4-5x per week',
        expectedOutcome: 'Improved speech understanding in moderately noisy environments',
        focusArea: 'Speech Clarity',
      });
    } else {
      recommendations.push({
        exerciseId: 2,
        name: 'Consonant Contrast',
        priority: 'medium',
        rationale: 'Secondary exercise to consolidate vowel recognition and expand to consonant pairs.',
        suggestedDuration: 8,
        frequency: '3-4x per week',
        expectedOutcome: 'Gradual improvement in speech comprehension',
        focusArea: 'Speech Processing',
      });
    }

    // 3. HIGH FREQUENCY PULSE - Targeted for specific loss patterns
    if (profile.pattern.type === 'high-frequency' || profile.highFreqThreshold > 50) {
      recommendations.push({
        exerciseId: 3,
        name: 'High Frequency Pulse',
        priority: 'critical',
        rationale:
          'Direct auditory nerve stimulation at high frequencies (8-16kHz). Combats presbycusis and may improve tinnitus tolerance.',
        suggestedDuration: 3,
        frequency: 'Daily or 6x per week',
        expectedOutcome:
          'Improved high-frequency audibility, reduced tinnitus annoyance, better consonant perception over weeks',
        focusArea: 'High-Frequency Restoration',
      });
    } else if (profile.highFreqThreshold > 30) {
      recommendations.push({
        exerciseId: 3,
        name: 'High Frequency Pulse',
        priority: 'high',
        rationale: 'Moderate high-frequency loss benefits from targeted stimulation to preserve remaining sensitivity.',
        suggestedDuration: 3,
        frequency: '4-5x per week',
        expectedOutcome: 'Slowed decline of high-frequency hearing, improved speech clarity',
        focusArea: 'High-Frequency Preservation',
      });
    } else {
      recommendations.push({
        exerciseId: 3,
        name: 'High Frequency Pulse',
        priority: 'low',
        rationale: 'Optional exercise for comprehensive auditory training and neuroplastic benefit.',
        suggestedDuration: 3,
        frequency: '2-3x per week',
        expectedOutcome: 'Maintained high-frequency acuity, auditory cortex stimulation',
        focusArea: 'Preventive Maintenance',
      });
    }

    // Sort by priority
    return recommendations.sort(
      (a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
    );
  }

  /**
   * Generate clinical insights from hearing profile
   */
  private static generateInsights(profile: HearingProfile): string[] {
    const insights: string[] = [];

    // Severity insight
    if (profile.pattern.severity === 'normal') {
      insights.push('Normal hearing thresholds detected. Training recommended for prevention and auditory enhancement.');
    } else if (profile.pattern.severity === 'mild') {
      insights.push('Mild hearing loss detected. Early intervention with training can slow progression and maintain speech clarity.');
    } else if (profile.pattern.severity === 'moderate') {
      insights.push('Moderate hearing loss. Consistent training with hearing aids if fitted can significantly improve outcomes.');
    } else {
      insights.push('Significant hearing loss. Combination of amplification and intensive training recommended.');
    }

    // Pattern-specific insights
    if (profile.pattern.type === 'high-frequency') {
      insights.push(
        'High-frequency loss is the most common type of age-related hearing loss. Consonant discrimination is likely affected.'
      );
      insights.push(
        'Focus on speech clarity in noisy environments. High-frequency consonants (s, sh, t, ch) are most vulnerable.'
      );
    }

    if (profile.pattern.type === 'sloping') {
      insights.push('Sloping audiogram indicates progressive hearing loss. Daily training helps maintain speech understanding.');
    }

    if (profile.wordRecognitionRisk) {
      insights.push('Your hearing loss pattern increases risk of poor word recognition. Speech-in-noise exercises are critical.');
    }

    if (profile.asymmetry.hasAsymmetry) {
      insights.push(
        `Asymmetrical hearing detected (${profile.asymmetry.difference}dB difference). ${profile.asymmetry.worseEar} ear may need focused training.`
      );
    }

    if (profile.tinnitusPredisposition) {
      insights.push(
        'High-frequency loss may be associated with tinnitus. High-frequency pulse training may help with tinnitus tolerance.'
      );
    }

    if (profile.cognitiveLoadRisk) {
      insights.push(
        'Your hearing loss may increase cognitive demand for speech understanding. Regular breaks during training recommended.'
      );
    }

    if (profile.isProgressivePattern) {
      insights.push(
        'Your hearing loss pattern suggests ongoing presbycusis. Consistent long-term training (4+ weeks) recommended for maximal benefit.'
      );
    }

    return insights;
  }

  /**
   * Generate clinical warnings/cautions
   */
  private static generateWarnings(profile: HearingProfile): string[] {
    const warnings: string[] = [];

    if (profile.pattern.severity === 'severe' || profile.pattern.severity === 'profound') {
      warnings.push(
        'Severe hearing loss detected. Consider comprehensive evaluation with hearing healthcare provider if not already done.'
      );
      warnings.push('Hearing aids may be essential to achieve meaningful benefit from auditory training.');
    }

    if (profile.asymmetry.criticalFrequencies.length > 0) {
      warnings.push(
        `Significant asymmetry at frequencies: ${profile.asymmetry.criticalFrequencies.join(', ')}Hz. May indicate underlying pathology requiring medical evaluation.`
      );
    }

    if (profile.balancePredisposition) {
      warnings.push(
        'Low-frequency hearing loss may indicate inner ear involvement. Discuss with doctor if experiencing dizziness or balance issues.'
      );
    }

    if (profile.pattern.type === 'reverse-slope') {
      warnings.push(
        'Reverse-slope pattern is unusual and may indicate conductive hearing loss or specific pathology. Medical evaluation recommended.'
      );
    }

    if (profile.pattern.type === 'notch') {
      warnings.push(
        'Notched audiogram may indicate noise-induced or medication-related hearing loss. Protect remaining hearing from loud noise exposure.'
      );
    }

    return warnings;
  }

  /**
   * Estimate expected improvement
   */
  private static estimateImprovement(profile: HearingProfile): string {
    const severity = profile.pattern.severity;

    if (severity === 'normal') {
      return 'Auditory training can enhance hearing acuity and speech perception above normal ranges. Expected improvement: 5-15% in speech-in-noise tasks.';
    }

    if (severity === 'mild') {
      return 'With consistent daily training (3-4 weeks), expected improvement: 15-25% in speech understanding, especially in noise. Benefits consolidate over 8-12 weeks.';
    }

    if (severity === 'moderate') {
      return 'With consistent training + proper amplification, expected improvement: 10-20% in speech clarity. Larger improvements in first 4 weeks, with ongoing gains through 12+ weeks.';
    }

    return 'Significant improvement possible with intensive training. Initial improvement expected 2-4 weeks. Long-term training (8-12 weeks) essential for maximum benefit.';
  }

  /**
   * Estimate training duration needed
   */
  private static estimateTrainingDuration(profile: HearingProfile): number {
    const baseDuration = 4; // weeks

    // Severity increases duration
    const severityMultiplier = {
      normal: 0.5,
      mild: 1.0,
      moderate: 1.5,
      severe: 2.0,
      profound: 2.5,
    };

    // Progressive loss needs longer training
    const progressiveMultiplier = profile.isProgressivePattern ? 1.2 : 1.0;

    const recommendedDuration = Math.round(baseDuration * severityMultiplier[profile.pattern.severity] * progressiveMultiplier);

    return Math.max(4, Math.min(12, recommendedDuration)); // Clamp to 4-12 weeks
  }

  /**
   * Generate daily focus message
   */
  private static generateDailyFocus(profile: HearingProfile): string {
    const focuses: string[] = [];

    if (profile.wordRecognitionRisk) {
      focuses.push('Speech Clarity & Word Recognition');
    } else if (profile.pattern.type === 'high-frequency') {
      focuses.push('Consonant Discrimination & High-Frequency Perception');
    } else if (profile.cognitiveLoadRisk) {
      focuses.push('Reducing Listening Effort & Cognitive Load');
    } else {
      focuses.push('General Auditory Training & Neuroplasticity');
    }

    if (profile.asymmetry.hasAsymmetry) {
      focuses.push(`Asymmetrical Ear Training (${profile.asymmetry.worseEar} ear focus)`);
    }

    return focuses.join(' • ');
  }
}
