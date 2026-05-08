import { HearingHistoryEntry, TestResult } from '../types/index';

export interface FrequencyDelta {
  freq: number;
  side: 'left' | 'right' | 'both';
  prevDb: number;
  currDb: number;
  delta: number;
  sessionCount: number;
}

export interface ProgressionSummary {
  sessionCount: number;
  firstSessionDate: number;
  lastSessionDate: number;
  trendSlopeLeft: number | null;
  trendSlopeRight: number | null;
  significantDeltas: FrequencyDelta[];
  allDeltas: FrequencyDelta[];
  worstFreqLeft: { freq: number; db: number } | null;
  worstFreqRight: { freq: number; db: number } | null;
  overallInterpretation: string;
}

export interface TrendChartDataPoint {
  timestamp: number;
  dateLabel: string;
  avgLeft: number;
  avgRight: number;
}

function getSessionTimestamp(entry: HearingHistoryEntry): number {
  if (entry.timestamp) {
    return entry.timestamp;
  }
  try {
    return new Date(entry.date).getTime();
  } catch {
    return 0;
  }
}

export function linearRegressionSlope(
  points: Array<{ x: number; y: number }>
): number | null {
  if (points.length < 2) return null;

  const n = points.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;

  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumX2 += point.x * point.x;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = n * sumX2 - sumX * sumX;

  if (denominator === 0) return null;
  return numerator / denominator;
}

export function analyzeProgression(
  history: HearingHistoryEntry[]
): ProgressionSummary {
  const sessionCount = history.length;
  const summary: ProgressionSummary = {
    sessionCount,
    firstSessionDate: 0,
    lastSessionDate: 0,
    trendSlopeLeft: null,
    trendSlopeRight: null,
    significantDeltas: [],
    allDeltas: [],
    worstFreqLeft: null,
    worstFreqRight: null,
    overallInterpretation: '',
  };

  if (sessionCount === 0) {
    summary.overallInterpretation =
      'No test history available. Complete your first assessment to begin tracking trends.';
    return summary;
  }

  const sortedHistory = [...history].sort(
    (a, b) => getSessionTimestamp(a) - getSessionTimestamp(b)
  );

  const firstTime = getSessionTimestamp(sortedHistory[0]);
  const lastTime = getSessionTimestamp(sortedHistory[sessionCount - 1]);

  summary.firstSessionDate = firstTime;
  summary.lastSessionDate = lastTime;

  if (sessionCount === 1) {
    summary.overallInterpretation =
      'Complete your second assessment to see trends and temporal changes in your hearing profile.';
    return summary;
  }

  // Build frequency delta map for consecutive sessions
  const frequencyDeltas: Map<string, FrequencyDelta> = new Map();

  for (let i = 1; i < sortedHistory.length; i++) {
    const prevEntry = sortedHistory[i - 1];
    const currEntry = sortedHistory[i];

    const prevResults = prevEntry.results;
    const currResults = currEntry.results;

    for (const currResult of currResults) {
      const key = `${currResult.freq}-${currResult.side}`;
      const prevResult = prevResults.find(
        (r) => r.freq === currResult.freq && r.side === currResult.side
      );

      if (prevResult) {
        const delta = currResult.db - prevResult.db;
        frequencyDeltas.set(key, {
          freq: currResult.freq,
          side: currResult.side,
          prevDb: prevResult.db,
          currDb: currResult.db,
          delta,
          sessionCount: i + 1,
        });
      }
    }
  }

  summary.allDeltas = Array.from(frequencyDeltas.values());
  summary.significantDeltas = summary.allDeltas.filter((d) => Math.abs(d.delta) >= 10);

  // Calculate trend slopes using days since first test
  const firstTimeMs = getSessionTimestamp(sortedHistory[0]);
  const trendPointsLeft: Array<{ x: number; y: number }> = [];
  const trendPointsRight: Array<{ x: number; y: number }> = [];

  for (const entry of sortedHistory) {
    const daysSinceFirst = (getSessionTimestamp(entry) - firstTimeMs) / (1000 * 60 * 60 * 24);
    trendPointsLeft.push({ x: daysSinceFirst, y: entry.avgLeft });
    trendPointsRight.push({ x: daysSinceFirst, y: entry.avgRight });
  }

  summary.trendSlopeLeft = linearRegressionSlope(trendPointsLeft);
  summary.trendSlopeRight = linearRegressionSlope(trendPointsRight);

  // Find worst frequency per ear
  const leftResults = sortedHistory[sortedHistory.length - 1].results.filter(
    (r) => r.side === 'left'
  );
  const rightResults = sortedHistory[sortedHistory.length - 1].results.filter(
    (r) => r.side === 'right'
  );

  if (leftResults.length > 0) {
    const worst = leftResults.reduce((prev, curr) =>
      curr.db > prev.db ? curr : prev
    );
    summary.worstFreqLeft = { freq: worst.freq, db: worst.db };
  }

  if (rightResults.length > 0) {
    const worst = rightResults.reduce((prev, curr) =>
      curr.db > prev.db ? curr : prev
    );
    summary.worstFreqRight = { freq: worst.freq, db: worst.db };
  }

  // Build interpretation text
  const interpretationParts: string[] = [];

  if (summary.trendSlopeLeft !== null) {
    if (summary.trendSlopeLeft > 0.1) {
      interpretationParts.push(
        `Left ear: worsening trend (+${summary.trendSlopeLeft.toFixed(2)} dB/day)`
      );
    } else if (summary.trendSlopeLeft < -0.1) {
      interpretationParts.push(
        `Left ear: improving trend (${summary.trendSlopeLeft.toFixed(2)} dB/day)`
      );
    } else {
      interpretationParts.push(`Left ear: stable trend`);
    }
  }

  if (summary.trendSlopeRight !== null) {
    if (summary.trendSlopeRight > 0.1) {
      interpretationParts.push(
        `Right ear: worsening trend (+${summary.trendSlopeRight.toFixed(2)} dB/day)`
      );
    } else if (summary.trendSlopeRight < -0.1) {
      interpretationParts.push(
        `Right ear: improving trend (${summary.trendSlopeRight.toFixed(2)} dB/day)`
      );
    } else {
      interpretationParts.push(`Right ear: stable trend`);
    }
  }

  if (summary.significantDeltas.length > 0) {
    const worstDelta = summary.significantDeltas.reduce((prev, curr) =>
      Math.abs(curr.delta) > Math.abs(prev.delta) ? curr : prev
    );
    interpretationParts.push(
      `Notable change at ${worstDelta.freq} Hz ${worstDelta.side}: ${worstDelta.delta > 0 ? '+' : ''}${worstDelta.delta} dB`
    );
  }

  summary.overallInterpretation =
    interpretationParts.length > 0
      ? interpretationParts.join('. ')
      : 'Hearing thresholds appear stable across test sessions.';

  return summary;
}

export function buildTrendChartData(history: HearingHistoryEntry[]): TrendChartDataPoint[] {
  if (history.length === 0) return [];

  const sorted = [...history].sort(
    (a, b) => getSessionTimestamp(a) - getSessionTimestamp(b)
  );

  return sorted.map((entry) => {
    const dateObj = new Date(entry.timestamp ? entry.timestamp : entry.date);
    const dateLabel = dateObj.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

    return {
      timestamp: getSessionTimestamp(entry),
      dateLabel,
      avgLeft: entry.avgLeft,
      avgRight: entry.avgRight,
    };
  });
}

export function getRecentSessions(
  history: HearingHistoryEntry[],
  n: number
): HearingHistoryEntry[] {
  return history.slice(0, n);
}
