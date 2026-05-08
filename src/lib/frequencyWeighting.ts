/**
 * ISO 226:2003 Equal-Loudness Frequency Weighting
 *
 * Pure-tone thresholds depend on frequency due to human auditory perception.
 * This module provides frequency-dependent compensation to normalize hearing
 * levels across the frequency spectrum.
 *
 * At 1000 Hz (reference): 0 dB adjustment
 * Below 500 Hz: Requires +dB increase (users less sensitive to low frequencies)
 * Above 2000 Hz peaks around 4000 Hz (most sensitive): -dB adjustment
 */

/**
 * ISO 226:2003 Equal-Loudness Adjustment Factors
 * Values represent dB adjustment to account for frequency-dependent hearing sensitivity
 * Positive values: need to compensate (less sensitive at this frequency)
 * Negative values: over-sensitive (more sensitive at this frequency)
 *
 * Based on 40 phon loudness level (comfortable conversation level)
 */
export const FREQUENCY_COMPENSATION: Record<number, number> = {
  125: 15,    // Very low: users much less sensitive
  250: 5,     // Low: moderately less sensitive
  500: 2,     // Low-mid: slightly less sensitive
  1000: 0,    // Reference frequency (0 adjustment)
  2000: -2,   // Mid: slightly more sensitive
  3000: -4,   // Mid-high: more sensitive (speech formant)
  4000: -6,   // HIGH: most sensitive (peaks here)
  6000: -5,   // High: very sensitive
  8000: -4,   // High: sensitive
  12000: -2,  // Very high: less sensitive
  16000: 0    // Ultra-high: sensitivity varies
};

/**
 * Get frequency compensation factor for a given frequency
 * If exact frequency not in table, interpolates between nearest frequencies
 *
 * @param frequency - Frequency in Hz
 * @returns Compensation in dB (positive = apply more dB, negative = apply less dB)
 */
export function getFrequencyCompensation(frequency: number): number {
  // Exact match
  if (FREQUENCY_COMPENSATION[frequency] !== undefined) {
    return FREQUENCY_COMPENSATION[frequency];
  }

  // Find surrounding frequencies for interpolation
  const frequencies = Object.keys(FREQUENCY_COMPENSATION)
    .map(Number)
    .sort((a, b) => a - b);

  if (frequency < frequencies[0]) {
    return FREQUENCY_COMPENSATION[frequencies[0]];
  }
  if (frequency > frequencies[frequencies.length - 1]) {
    return FREQUENCY_COMPENSATION[frequencies[frequencies.length - 1]];
  }

  // Linear interpolation between two nearest frequencies
  let lower = frequencies[0];
  let upper = frequencies[1];

  for (let i = 0; i < frequencies.length - 1; i++) {
    if (frequency >= frequencies[i] && frequency <= frequencies[i + 1]) {
      lower = frequencies[i];
      upper = frequencies[i + 1];
      break;
    }
  }

  const lowerComp = FREQUENCY_COMPENSATION[lower];
  const upperComp = FREQUENCY_COMPENSATION[upper];
  const ratio = (frequency - lower) / (upper - lower);

  return lowerComp + (upperComp - lowerComp) * ratio;
}

/**
 * Apply frequency weighting to a hearing threshold
 * Adjusts the measured dB value to account for frequency-dependent perception
 *
 * @param frequency - Frequency in Hz
 * @param measuredDb - Measured threshold in dB
 * @returns Frequency-compensated threshold
 */
export function applyFrequencyCompensation(frequency: number, measuredDb: number): number {
  const compensation = getFrequencyCompensation(frequency);
  return measuredDb - compensation;
}

/**
 * Get A-weighting factor (simpler acoustic weighting used in noise measurements)
 * Used primarily for environmental noise assessment
 * Less precise than ISO 226 but faster to compute
 */
export function getAWeighting(frequency: number): number {
  // Simplified A-weighting curve (ISO 61672-1)
  const aWeights: Record<number, number> = {
    125: -16.1,
    250: -8.6,
    500: -3.2,
    1000: 0,
    2000: 1.2,
    4000: 1.0,
    8000: -1.1,
    16000: -6.6
  };

  if (aWeights[frequency]) {
    return aWeights[frequency];
  }

  // Interpolate for intermediate frequencies
  const freqs = Object.keys(aWeights).map(Number).sort((a, b) => a - b);
  if (frequency < freqs[0]) return aWeights[freqs[0]];
  if (frequency > freqs[freqs.length - 1]) return aWeights[freqs[freqs.length - 1]];

  let lower = freqs[0];
  let upper = freqs[1];
  for (let i = 0; i < freqs.length - 1; i++) {
    if (frequency >= freqs[i] && frequency <= freqs[i + 1]) {
      lower = freqs[i];
      upper = freqs[i + 1];
      break;
    }
  }

  const ratio = (frequency - lower) / (upper - lower);
  return aWeights[lower] + (aWeights[upper] - aWeights[lower]) * ratio;
}

/**
 * Normalize a set of hearing thresholds using frequency compensation
 * Useful for comparing thresholds across different frequencies
 *
 * @param thresholds - Array of {frequency, db} measurements
 * @returns Array of compensated thresholds
 */
export function normalizeThresholds(
  thresholds: Array<{ frequency: number; db: number }>
): Array<{ frequency: number; db: number; compensated: number }> {
  return thresholds.map(t => ({
    frequency: t.frequency,
    db: t.db,
    compensated: applyFrequencyCompensation(t.frequency, t.db)
  }));
}

/**
 * Calculate "average" hearing threshold across frequencies
 * Uses frequency-compensated values for more accurate average
 *
 * @param thresholds - Array of {frequency, db} measurements
 * @returns Frequency-weighted average in dB
 */
export function calculateFrequencyWeightedAverage(
  thresholds: Array<{ frequency: number; db: number }>
): number {
  if (thresholds.length === 0) return 0;

  const compensated = normalizeThresholds(thresholds);
  const sum = compensated.reduce((acc, t) => acc + t.compensated, 0);
  return sum / compensated.length;
}

/**
 * Detect if a hearing profile shows frequency-specific pattern
 * Useful for clinical interpretation
 *
 * @param thresholds - Array of {frequency, db} measurements
 * @returns Object with pattern analysis
 */
export function analyzeFrequencyPattern(
  thresholds: Array<{ frequency: number; db: number }>
): {
  pattern: 'flat' | 'low-freq-loss' | 'high-freq-loss' | 'mid-freq-loss' | 'mixed';
  lf_avg: number;
  mf_avg: number;
  hf_avg: number;
  variance: number;
} {
  const low = thresholds.filter(t => t.frequency <= 500);
  const mid = thresholds.filter(t => t.frequency > 500 && t.frequency <= 4000);
  const high = thresholds.filter(t => t.frequency > 4000);

  const lf_avg = low.length ? low.reduce((a, t) => a + t.db, 0) / low.length : 0;
  const mf_avg = mid.length ? mid.reduce((a, t) => a + t.db, 0) / mid.length : 0;
  const hf_avg = high.length ? high.reduce((a, t) => a + t.db, 0) / high.length : 0;

  // Calculate variance to determine "flatness"
  const all_avg = (lf_avg + mf_avg + hf_avg) / 3;
  const variance =
    Math.pow(lf_avg - all_avg, 2) +
    Math.pow(mf_avg - all_avg, 2) +
    Math.pow(hf_avg - all_avg, 2);

  let pattern: 'flat' | 'low-freq-loss' | 'high-freq-loss' | 'mid-freq-loss' | 'mixed' = 'flat';

  if (variance > 50) {
    // Significant pattern
    if (hf_avg > mf_avg + 10 && hf_avg > lf_avg + 10) {
      pattern = 'high-freq-loss';
    } else if (lf_avg > mf_avg + 10 && lf_avg > hf_avg + 10) {
      pattern = 'low-freq-loss';
    } else if (mf_avg > lf_avg + 10 && mf_avg > hf_avg + 10) {
      pattern = 'mid-freq-loss';
    } else {
      pattern = 'mixed';
    }
  }

  return { pattern, lf_avg, mf_avg, hf_avg, variance };
}

/**
 * Get clinical interpretation of frequency pattern
 */
export function interpretFrequencyPattern(pattern: string): string {
  const interpretations: Record<string, string> = {
    'flat': 'Relatively uniform hearing across frequencies (normal pattern)',
    'high-freq-loss': 'High-frequency loss (age-related or noise exposure)',
    'low-freq-loss': 'Low-frequency loss (fluid in ear, conductive component)',
    'mid-freq-loss': 'Mid-frequency loss (less common; may indicate specific etiology)',
    'mixed': 'Mixed pattern across frequencies (requires further investigation)'
  };

  return interpretations[pattern] || 'Pattern requires clinical interpretation';
}
