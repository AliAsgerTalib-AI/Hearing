import { describe, it, expect } from 'vitest';
import {
  linearRegressionSlope,
  analyzeProgression,
  buildTrendChartData,
} from './temporalProgression';
import { HearingHistoryEntry } from '../types/index';

describe('linearRegressionSlope', () => {
  it('returns null for empty array', () => {
    expect(linearRegressionSlope([])).toBeNull();
  });

  it('returns null for single point', () => {
    expect(linearRegressionSlope([{ x: 0, y: 20 }])).toBeNull();
  });

  it('computes positive slope for worsening trend', () => {
    const points = [
      { x: 0, y: 20 },
      { x: 10, y: 25 },
      { x: 20, y: 30 },
    ];
    const slope = linearRegressionSlope(points);
    expect(slope).toBeCloseTo(0.5, 1);
  });

  it('computes negative slope for improving trend', () => {
    const points = [
      { x: 0, y: 50 },
      { x: 10, y: 40 },
      { x: 20, y: 30 },
    ];
    const slope = linearRegressionSlope(points);
    expect(slope).toBeCloseTo(-1, 1);
  });

  it('returns ~0 for flat data', () => {
    const points = [
      { x: 0, y: 25 },
      { x: 10, y: 25 },
      { x: 20, y: 25 },
    ];
    const slope = linearRegressionSlope(points);
    expect(slope).toBeCloseTo(0, 1);
  });
});

describe('analyzeProgression', () => {
  const makeEntry = (
    timestamp: number,
    avgLeft: number,
    avgRight: number,
    results: any[]
  ): HearingHistoryEntry => ({
    id: timestamp.toString(),
    timestamp,
    date: new Date(timestamp).toLocaleString(),
    demographics: null,
    device: null,
    results,
    avgLeft,
    avgRight,
  });

  it('returns sessionCount = 0 for empty history', () => {
    const result = analyzeProgression([]);
    expect(result.sessionCount).toBe(0);
    expect(result.trendSlopeLeft).toBeNull();
    expect(result.trendSlopeRight).toBeNull();
  });

  it('returns null slopes for single session', () => {
    const history = [
      makeEntry(
        Date.now(),
        25,
        30,
        [
          { side: 'left', freq: 1000, db: 25 },
          { side: 'right', freq: 1000, db: 30 },
        ]
      ),
    ];
    const result = analyzeProgression(history);
    expect(result.sessionCount).toBe(1);
    expect(result.trendSlopeLeft).toBeNull();
    expect(result.trendSlopeRight).toBeNull();
  });

  it('detects significant delta when threshold shifts ≥10 dB', () => {
    const now = Date.now();
    const history = [
      makeEntry(now, 20, 25, [
        { side: 'left', freq: 4000, db: 20 },
        { side: 'right', freq: 4000, db: 25 },
      ]),
      makeEntry(now + 86400000, 32, 25, [
        { side: 'left', freq: 4000, db: 32 },
        { side: 'right', freq: 4000, db: 25 },
      ]),
    ];
    const result = analyzeProgression(history);
    expect(result.significantDeltas.length).toBeGreaterThan(0);
    const leftDelta = result.significantDeltas.find((d) => d.side === 'left');
    expect(leftDelta?.delta).toBe(12);
  });

  it('identifies worst frequency per ear correctly', () => {
    const now = Date.now();
    const ms24h = 24 * 60 * 60 * 1000;
    const history = [
      makeEntry(now, 20, 25, [
        { side: 'left', freq: 1000, db: 20 },
        { side: 'right', freq: 1000, db: 25 },
      ]),
      makeEntry(now + ms24h, 25, 30, [
        { side: 'left', freq: 1000, db: 20 },
        { side: 'left', freq: 4000, db: 25 },
        { side: 'right', freq: 1000, db: 30 },
        { side: 'right', freq: 4000, db: 28 },
      ]),
    ];
    const result = analyzeProgression(history);
    expect(result.worstFreqLeft?.freq).toBe(4000);
    expect(result.worstFreqLeft?.db).toBe(25);
    expect(result.worstFreqRight?.freq).toBe(1000);
    expect(result.worstFreqRight?.db).toBe(30);
  });

  it('sorts sessions by timestamp ascending before computing deltas', () => {
    const now = Date.now();
    const late = makeEntry(now + 86400000, 32, 25, [
      { side: 'left', freq: 1000, db: 32 },
    ]);
    const early = makeEntry(now, 20, 25, [
      { side: 'left', freq: 1000, db: 20 },
    ]);
    const history = [late, early]; // Out of order
    const result = analyzeProgression(history);
    expect(result.allDeltas[0]?.delta).toBe(12); // late - early
  });

  it('computes trend slope correctly for 2 sessions', () => {
    const now = Date.now();
    const ms24h = 24 * 60 * 60 * 1000;
    const history = [
      makeEntry(now, 20, 20, [{ side: 'left', freq: 1000, db: 20 }]),
      makeEntry(now + ms24h, 25, 20, [{ side: 'left', freq: 1000, db: 25 }]),
    ];
    const result = analyzeProgression(history);
    // 5 dB over 1 day = 5 dB/day
    expect(result.trendSlopeLeft).toBeCloseTo(5, 0);
  });

  it('handles legacy entries without timestamp field', () => {
    const now = Date.now();
    const legacyEntry: any = {
      id: '1',
      date: new Date(now).toLocaleString(),
      demographics: null,
      device: null,
      results: [{ side: 'left', freq: 1000, db: 20 }],
      avgLeft: 20,
      avgRight: 25,
      // no timestamp field
    };
    const newEntry = makeEntry(now + 86400000, 25, 25, [
      { side: 'left', freq: 1000, db: 25 },
    ]);
    const result = analyzeProgression([legacyEntry, newEntry]);
    expect(result.sessionCount).toBe(2);
    expect(result.trendSlopeLeft).not.toBeNull();
  });
});

describe('buildTrendChartData', () => {
  it('returns empty array for empty history', () => {
    const data = buildTrendChartData([]);
    expect(data).toEqual([]);
  });

  it('sorts output by timestamp ascending', () => {
    const now = Date.now();
    const ms24h = 24 * 60 * 60 * 1000;
    const history = [
      {
        id: '2',
        timestamp: now + ms24h,
        date: new Date(now + ms24h).toLocaleString(),
        demographics: null,
        device: null,
        results: [],
        avgLeft: 25,
        avgRight: 30,
      },
      {
        id: '1',
        timestamp: now,
        date: new Date(now).toLocaleString(),
        demographics: null,
        device: null,
        results: [],
        avgLeft: 20,
        avgRight: 25,
      },
    ] as HearingHistoryEntry[];

    const data = buildTrendChartData(history);
    expect(data[0].avgLeft).toBe(20);
    expect(data[1].avgLeft).toBe(25);
  });

  it('generates human-readable dateLabel', () => {
    const now = Date.now();
    const history = [
      {
        id: '1',
        timestamp: now,
        date: new Date(now).toLocaleString(),
        demographics: null,
        device: null,
        results: [],
        avgLeft: 20,
        avgRight: 25,
      },
    ] as HearingHistoryEntry[];

    const data = buildTrendChartData(history);
    expect(data[0].dateLabel).toMatch(/\w+ \d+/); // e.g., "May 8"
  });
});
