import { describe, it, expect } from 'vitest';
import {
  getISO7029H50,
  buildReferenceChartData,
  interpretAgainstISO7029,
} from './iso7029';

describe('getISO7029H50', () => {
  it('returns 0 for age 20 at any frequency', () => {
    expect(getISO7029H50(20, 'male', 1000)).toBe(0);
    expect(getISO7029H50(20, 'female', 1000)).toBe(0);
    expect(getISO7029H50(20, 'other', 1000)).toBe(0);
  });

  it('returns known table value for male age 60 at 4000 Hz', () => {
    expect(getISO7029H50(60, 'male', 4000)).toBe(28);
  });

  it('returns known table value for female age 50 at 2000 Hz', () => {
    expect(getISO7029H50(50, 'female', 2000)).toBe(6);
  });

  it('interpolates between age 40 and 50 at midpoint (age 45)', () => {
    const val = getISO7029H50(45, 'male', 4000);
    const expected = (10 + 17) / 2; // average of 40 (10) and 50 (17)
    // Rounding to 1 decimal may result in 13 or 14
    expect(val).toBeGreaterThanOrEqual(13);
    expect(val).toBeLessThanOrEqual(14);
  });

  it('averages male and female for sex other', () => {
    const male = getISO7029H50(50, 'male', 2000);
    const female = getISO7029H50(50, 'female', 2000);
    const other = getISO7029H50(50, 'other', 2000);
    expect(other).toBeCloseTo((male + female) / 2, 0);
  });

  it('clamps age below 20 to 20 (returns 0)', () => {
    expect(getISO7029H50(10, 'male', 1000)).toBe(0);
    expect(getISO7029H50(-5, 'male', 1000)).toBe(0);
  });

  it('clamps age above 80 to 80 values', () => {
    const age90 = getISO7029H50(90, 'male', 4000);
    const age80 = getISO7029H50(80, 'male', 4000);
    expect(age90).toBe(age80);
  });

  it('extrapolates 125 Hz from 250 Hz', () => {
    const h50_250 = getISO7029H50(60, 'male', 250);
    const h50_125 = getISO7029H50(60, 'male', 125);
    expect(h50_125).toBeCloseTo(h50_250 * 0.65, 0);
  });

  it('returns higher value for 12000 Hz than 8000 Hz at same age', () => {
    const h50_8000 = getISO7029H50(70, 'male', 8000);
    const h50_12000 = getISO7029H50(70, 'male', 12000);
    expect(h50_12000).toBeGreaterThan(h50_8000);
  });

  it('handles unknown frequencies via nearest neighbor estimation', () => {
    const h50_5000 = getISO7029H50(50, 'male', 5000);
    expect(h50_5000).toBeGreaterThan(0);
    expect(h50_5000).toBeLessThanOrEqual(80);
  });
});

describe('buildReferenceChartData', () => {
  it('returns array sorted by frequency', () => {
    const data = buildReferenceChartData(50, 'male', [8000, 1000, 4000]);
    expect(data[0].freq).toBe(1000);
    expect(data[1].freq).toBe(4000);
    expect(data[2].freq).toBe(8000);
  });

  it('generates human-readable frequency labels', () => {
    const data = buildReferenceChartData(50, 'male', [250, 1000, 8000]);
    expect(data[0].freqLabel).toBe('250');
    expect(data[1].freqLabel).toBe('1k');
    expect(data[2].freqLabel).toBe('8k');
  });

  it('returns empty array for empty frequencies', () => {
    const data = buildReferenceChartData(50, 'male', []);
    expect(data).toEqual([]);
  });
});

describe('interpretAgainstISO7029', () => {
  it('returns better-than-median when measured is well below reference', () => {
    const result = interpretAgainstISO7029(5, 50, 'male', 4000);
    expect(result.interpretation).toBe('better-than-median');
    expect(result.deltaFromMedian).toBeLessThan(-5);
  });

  it('returns at-median when within ±5 dB of reference', () => {
    const reference = getISO7029H50(50, 'male', 4000);
    const result = interpretAgainstISO7029(reference + 2, 50, 'male', 4000);
    expect(result.interpretation).toBe('at-median');
  });

  it('returns worse-than-median when significantly above reference', () => {
    const reference = getISO7029H50(50, 'male', 4000);
    const result = interpretAgainstISO7029(reference + 15, 50, 'male', 4000);
    expect(result.interpretation).toBe('worse-than-median');
    expect(result.deltaFromMedian).toBeGreaterThan(5);
  });

  it('computes correct deltaFromMedian', () => {
    const result = interpretAgainstISO7029(35, 50, 'male', 4000);
    const reference = getISO7029H50(50, 'male', 4000);
    expect(result.deltaFromMedian).toBeCloseTo(35 - reference, 1);
  });
});
