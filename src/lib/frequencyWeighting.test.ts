import { describe, it, expect } from 'vitest';
import {
  getFrequencyCompensation,
  applyFrequencyCompensation,
  normalizeThresholds,
  calculateFrequencyWeightedAverage,
  analyzeFrequencyPattern,
  interpretFrequencyPattern,
} from './frequencyWeighting';

describe('getFrequencyCompensation', () => {
  it('returns 0 for reference frequency 1000 Hz', () => {
    expect(getFrequencyCompensation(1000)).toBe(0);
  });

  it('returns -6 for most sensitive frequency 4000 Hz', () => {
    expect(getFrequencyCompensation(4000)).toBe(-6);
  });

  it('interpolates between table frequencies', () => {
    const val3000 = getFrequencyCompensation(3000);
    expect(val3000).toBeGreaterThan(-6);
    expect(val3000).toBeLessThan(-2);
  });

  it('clamps below minimum table frequency (125 Hz)', () => {
    const val = getFrequencyCompensation(100);
    const val125 = getFrequencyCompensation(125);
    expect(val).toBeLessThanOrEqual(val125);
  });

  it('clamps above maximum table frequency (16000 Hz)', () => {
    const val = getFrequencyCompensation(20000);
    const val16000 = getFrequencyCompensation(16000);
    expect(val).toBe(val16000);
  });
});

describe('applyFrequencyCompensation', () => {
  it('subtracts compensation from measured dB', () => {
    const measured = 20;
    const freq = 1000;
    const compensation = getFrequencyCompensation(freq);
    const result = applyFrequencyCompensation(freq, measured);
    expect(result).toBe(measured - compensation);
  });

  it('decreases compensated value at low frequencies (less sensitive ear)', () => {
    const measured = 20;
    const lowFreq = 125;
    const highFreq = 4000;

    const lowCompensated = applyFrequencyCompensation(lowFreq, measured);
    const highCompensated = applyFrequencyCompensation(highFreq, measured);

    // Low frequencies have high positive compensation, so subtracting makes value smaller
    expect(lowCompensated).toBeLessThan(measured);
    // High frequencies (4000) have negative compensation (-6), so subtracting makes value larger
    expect(highCompensated).toBeGreaterThan(measured);
  });
});

describe('normalizeThresholds', () => {
  it('returns array with frequency, db, and compensated fields', () => {
    const thresholds = [
      { frequency: 1000, db: 20 },
      { frequency: 4000, db: 25 },
    ];
    const normalized = normalizeThresholds(thresholds);
    expect(normalized[0]).toHaveProperty('frequency');
    expect(normalized[0]).toHaveProperty('db');
    expect(normalized[0]).toHaveProperty('compensated');
  });

  it('computes compensated value correctly', () => {
    const thresholds = [{ frequency: 1000, db: 20 }];
    const normalized = normalizeThresholds(thresholds);
    const expected = applyFrequencyCompensation(1000, 20);
    expect(normalized[0].compensated).toBeCloseTo(expected, 1);
  });
});

describe('analyzeFrequencyPattern', () => {
  it('detects high-freq-loss pattern', () => {
    const thresholds = [
      { frequency: 500, db: 15 },
      { frequency: 2000, db: 20 },
      { frequency: 8000, db: 65 },
    ];
    const result = analyzeFrequencyPattern(thresholds);
    expect(result.pattern).toBe('high-freq-loss');
  });

  it('detects flat pattern for uniform thresholds', () => {
    const thresholds = [
      { frequency: 500, db: 20 },
      { frequency: 2000, db: 20 },
      { frequency: 8000, db: 20 },
    ];
    const result = analyzeFrequencyPattern(thresholds);
    expect(result.pattern).toBe('flat');
  });

  it('detects low-freq-loss pattern', () => {
    const thresholds = [
      { frequency: 250, db: 50 },
      { frequency: 500, db: 45 },
      { frequency: 8000, db: 15 },
    ];
    const result = analyzeFrequencyPattern(thresholds);
    expect(result.pattern).toBe('low-freq-loss');
  });

  it('handles empty array', () => {
    const result = analyzeFrequencyPattern([]);
    expect(result.pattern).toBe('flat');
  });

  it('handles single threshold', () => {
    const result = analyzeFrequencyPattern([{ frequency: 1000, db: 20 }]);
    expect(result.pattern).toBeTruthy();
  });
});

describe('interpretFrequencyPattern', () => {
  it('returns clinical interpretation for high-freq-loss', () => {
    const interpretation = interpretFrequencyPattern('high-freq-loss');
    expect(interpretation.toLowerCase()).toContain('high');
  });

  it('returns clinical interpretation for low-freq-loss', () => {
    const interpretation = interpretFrequencyPattern('low-freq-loss');
    expect(interpretation.toLowerCase()).toContain('low');
  });

  it('returns clinical interpretation for flat', () => {
    const interpretation = interpretFrequencyPattern('flat');
    expect(interpretation).toBeTruthy();
  });

  it('returns clinical interpretation for mid-freq-loss', () => {
    const interpretation = interpretFrequencyPattern('mid-freq-loss');
    expect(interpretation).toBeTruthy();
  });

  it('returns clinical interpretation for mixed', () => {
    const interpretation = interpretFrequencyPattern('mixed');
    expect(interpretation).toBeTruthy();
  });
});

describe('calculateFrequencyWeightedAverage', () => {
  it('returns 0 for empty array', () => {
    const result = calculateFrequencyWeightedAverage([]);
    expect(result).toBe(0);
  });

  it('applies frequency weighting before averaging', () => {
    const thresholds = [
      { frequency: 1000, db: 20 },
      { frequency: 4000, db: 25 },
    ];
    const weighted = calculateFrequencyWeightedAverage(thresholds);
    const unweighted = (20 + 25) / 2;
    // They should differ because of compensation
    expect(weighted).not.toBe(unweighted);
  });

  it('handles single threshold', () => {
    const thresholds = [{ frequency: 1000, db: 20 }];
    const result = calculateFrequencyWeightedAverage(thresholds);
    expect(result).toBeCloseTo(20, 1);
  });
});
