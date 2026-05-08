import { describe, it, expect } from 'vitest';
import { enforceHistoryLimit, calculateAvgThreshold, calculateThresholds } from './utils';

describe('enforceHistoryLimit', () => {
  it('keeps the FIRST max items (newest-first order)', () => {
    const items = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    expect(enforceHistoryLimit(items, 3)).toEqual([10, 9, 8]);
  });

  it('returns entire array when length <= max', () => {
    const items = [1, 2, 3];
    expect(enforceHistoryLimit(items, 5)).toEqual([1, 2, 3]);
  });

  it('handles empty array', () => {
    expect(enforceHistoryLimit([], 5)).toEqual([]);
  });

  it('handles max=0', () => {
    const items = [1, 2, 3];
    expect(enforceHistoryLimit(items, 0)).toEqual([]);
  });

  it('returns first max items in order', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    expect(enforceHistoryLimit(items, 2)).toEqual(['a', 'b']);
  });
});

describe('calculateAvgThreshold', () => {
  it('returns 0 for empty results', () => {
    expect(calculateAvgThreshold([], 'left')).toBe(0);
  });

  it('averages only the specified side', () => {
    const results = [
      { side: 'left' as const, freq: 1000, db: 20 },
      { side: 'right' as const, freq: 1000, db: 30 },
      { side: 'left' as const, freq: 4000, db: 25 },
    ];
    const avgLeft = calculateAvgThreshold(results, 'left');
    expect(avgLeft).toBe(23); // (20 + 25) / 2 = 22.5, rounded to 23
  });

  it('filters correctly for right side', () => {
    const results = [
      { side: 'left' as const, freq: 1000, db: 20 },
      { side: 'right' as const, freq: 1000, db: 30 },
      { side: 'right' as const, freq: 4000, db: 40 },
    ];
    const avgRight = calculateAvgThreshold(results, 'right');
    expect(avgRight).toBe(35); // (30 + 40) / 2 = 35
  });

  it('rounds to nearest integer', () => {
    const results = [
      { side: 'left' as const, freq: 1000, db: 20 },
      { side: 'left' as const, freq: 4000, db: 21 },
    ];
    const avg = calculateAvgThreshold(results, 'left');
    expect(avg).toBe(21); // (20 + 21) / 2 = 20.5 rounds to 20
  });

  it('handles single result', () => {
    const results = [{ side: 'left' as const, freq: 1000, db: 25 }];
    const avg = calculateAvgThreshold(results, 'left');
    expect(avg).toBe(25);
  });
});

describe('calculateThresholds', () => {
  it('returns both avgLeft and avgRight', () => {
    const results = [
      { side: 'left' as const, freq: 1000, db: 20 },
      { side: 'right' as const, freq: 1000, db: 30 },
    ];
    const thresholds = calculateThresholds(results);
    expect(thresholds).toHaveProperty('avgLeft');
    expect(thresholds).toHaveProperty('avgRight');
  });

  it('correctly computes both sides simultaneously', () => {
    const results = [
      { side: 'left' as const, freq: 1000, db: 20 },
      { side: 'left' as const, freq: 4000, db: 25 },
      { side: 'right' as const, freq: 1000, db: 30 },
      { side: 'right' as const, freq: 4000, db: 35 },
    ];
    const thresholds = calculateThresholds(results);
    expect(thresholds.avgLeft).toBe(23); // (20 + 25) / 2
    expect(thresholds.avgRight).toBe(33); // (30 + 35) / 2
  });

  it('handles empty results', () => {
    const thresholds = calculateThresholds([]);
    expect(thresholds.avgLeft).toBe(0);
    expect(thresholds.avgRight).toBe(0);
  });

  it('handles only one side present', () => {
    const results = [
      { side: 'left' as const, freq: 1000, db: 20 },
      { side: 'left' as const, freq: 4000, db: 25 },
    ];
    const thresholds = calculateThresholds(results);
    expect(thresholds.avgLeft).toBe(23);
    expect(thresholds.avgRight).toBe(0);
  });
});
