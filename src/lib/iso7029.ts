import { Demographics } from '../types/index';

// ISO 7029:2017 Median Hearing Threshold Levels (H50) by Age, Sex, and Frequency
// Values represent dB shift above 0 dB HL baseline (young adult reference)
// Frequencies: 250, 500, 1000, 2000, 4000, 6000, 8000 Hz
// Ages: 20-80 years (5-year intervals)

type Sex = 'male' | 'female' | 'other';
type Frequency = 250 | 500 | 1000 | 2000 | 4000 | 6000 | 8000;

const MALE_H50: Record<number, Record<Frequency, number>> = {
  20: { 250: 0, 500: 0, 1000: 0, 2000: 0, 4000: 0, 6000: 0, 8000: 0 },
  25: { 250: 0, 500: 0, 1000: 0, 2000: 1, 4000: 2, 6000: 3, 8000: 4 },
  30: { 250: 1, 500: 1, 1000: 1, 2000: 2, 4000: 5, 6000: 7, 8000: 8 },
  35: { 250: 1, 500: 1, 1000: 2, 2000: 3, 4000: 7, 6000: 10, 8000: 12 },
  40: { 250: 2, 500: 2, 1000: 3, 2000: 5, 4000: 10, 6000: 14, 8000: 16 },
  45: { 250: 3, 500: 3, 1000: 4, 2000: 7, 4000: 13, 6000: 18, 8000: 21 },
  50: { 250: 4, 500: 4, 1000: 5, 2000: 9, 4000: 17, 6000: 22, 8000: 26 },
  55: { 250: 5, 500: 5, 1000: 7, 2000: 11, 4000: 21, 6000: 27, 8000: 31 },
  60: { 250: 6, 500: 6, 1000: 8, 2000: 14, 4000: 28, 6000: 35, 8000: 40 },
  65: { 250: 7, 500: 8, 1000: 11, 2000: 17, 4000: 34, 6000: 43, 8000: 48 },
  70: { 250: 9, 500: 10, 1000: 13, 2000: 21, 4000: 40, 6000: 52, 8000: 58 },
  75: { 250: 11, 500: 13, 1000: 17, 2000: 26, 4000: 48, 6000: 62, 8000: 67 },
  80: { 250: 14, 500: 16, 1000: 20, 2000: 31, 4000: 56, 6000: 71, 8000: 76 },
};

const FEMALE_H50: Record<number, Record<Frequency, number>> = {
  20: { 250: 0, 500: 0, 1000: 0, 2000: 0, 4000: 0, 6000: 0, 8000: 0 },
  25: { 250: 0, 500: 0, 1000: 0, 2000: 1, 4000: 1, 6000: 2, 8000: 3 },
  30: { 250: 1, 500: 1, 1000: 1, 2000: 1, 4000: 3, 6000: 5, 8000: 6 },
  35: { 250: 1, 500: 1, 1000: 2, 2000: 2, 4000: 5, 6000: 8, 8000: 9 },
  40: { 250: 2, 500: 2, 1000: 2, 2000: 3, 4000: 7, 6000: 11, 8000: 13 },
  45: { 250: 2, 500: 2, 1000: 3, 2000: 4, 4000: 9, 6000: 15, 8000: 17 },
  50: { 250: 3, 500: 3, 1000: 4, 2000: 6, 4000: 13, 6000: 19, 8000: 23 },
  55: { 250: 4, 500: 4, 1000: 6, 2000: 8, 4000: 17, 6000: 25, 8000: 29 },
  60: { 250: 5, 500: 5, 1000: 6, 2000: 10, 4000: 22, 6000: 31, 8000: 36 },
  65: { 250: 6, 500: 6, 1000: 8, 2000: 13, 4000: 28, 6000: 39, 8000: 43 },
  70: { 250: 7, 500: 8, 1000: 10, 2000: 16, 4000: 33, 6000: 47, 8000: 52 },
  75: { 250: 9, 500: 10, 1000: 13, 2000: 20, 4000: 41, 6000: 57, 8000: 61 },
  80: { 250: 11, 500: 13, 1000: 16, 2000: 25, 4000: 49, 6000: 66, 8000: 72 },
};

function interpolateValue(
  age: number,
  ages: number[],
  values: number[]
): number {
  const clampedAge = Math.max(20, Math.min(80, age));

  if (clampedAge <= ages[0]) return values[0];
  if (clampedAge >= ages[ages.length - 1]) return values[values.length - 1];

  for (let i = 0; i < ages.length - 1; i++) {
    if (clampedAge >= ages[i] && clampedAge <= ages[i + 1]) {
      const ratio = (clampedAge - ages[i]) / (ages[i + 1] - ages[i]);
      return values[i] + ratio * (values[i + 1] - values[i]);
    }
  }
  return values[values.length - 1];
}

export function getISO7029H50(
  age: number,
  sex: Sex,
  frequency: number
): number {
  const ages = Object.keys(MALE_H50).map(Number).sort((a, b) => a - b);

  let h50Value = 0;

  // Handle standard test frequencies
  if ([250, 500, 1000, 2000, 4000, 6000, 8000].includes(frequency)) {
    const freq = frequency as Frequency;
    const maleValues = ages.map(a => MALE_H50[a][freq]);
    const femaleValues = ages.map(a => FEMALE_H50[a][freq]);

    const maleInterp = interpolateValue(age, ages, maleValues);
    const femaleInterp = interpolateValue(age, ages, femaleValues);

    if (sex === 'male') {
      h50Value = maleInterp;
    } else if (sex === 'female') {
      h50Value = femaleInterp;
    } else {
      h50Value = (maleInterp + femaleInterp) / 2;
    }
  } else if (frequency === 125) {
    // 125 Hz: extrapolate from 250 Hz (lower frequencies show less age-related loss)
    const h50at250 = getISO7029H50(age, sex, 250);
    h50Value = h50at250 * 0.65;
  } else if (frequency === 3000) {
    // 3000 Hz: interpolate between 2000 and 4000
    const h50at2000 = getISO7029H50(age, sex, 2000);
    const h50at4000 = getISO7029H50(age, sex, 4000);
    h50Value = (h50at2000 + h50at4000) / 2;
  } else if (frequency === 12000) {
    // 12000 Hz: extrapolate above 8000 Hz (accelerating loss at high frequencies)
    const h50at6000 = getISO7029H50(age, sex, 6000);
    const h50at8000 = getISO7029H50(age, sex, 8000);
    const slope = h50at8000 - h50at6000;
    h50Value = h50at8000 + slope * 2;
  } else if (frequency === 16000) {
    // 16000 Hz: further extrapolation (even steeper)
    const h50at6000 = getISO7029H50(age, sex, 6000);
    const h50at8000 = getISO7029H50(age, sex, 8000);
    const slope = h50at8000 - h50at6000;
    h50Value = h50at8000 + slope * 4;
  } else {
    // Unknown frequency: estimate from nearest known frequency
    const knownFreqs = [125, 250, 500, 1000, 2000, 3000, 4000, 6000, 8000, 12000, 16000];
    const nearest = knownFreqs.reduce((prev, curr) =>
      Math.abs(curr - frequency) < Math.abs(prev - frequency) ? curr : prev
    );
    h50Value = getISO7029H50(age, sex, nearest);
  }

  return Math.min(80, Math.max(0, Math.round(h50Value * 10) / 10));
}

export interface ReferenceChartDataPoint {
  freq: number;
  freqLabel: string;
  isoRef: number;
}

export function buildReferenceChartData(
  age: number,
  sex: 'male' | 'female' | 'other',
  frequencies: number[]
): ReferenceChartDataPoint[] {
  return frequencies
    .map((freq) => ({
      freq,
      freqLabel: freq >= 1000 ? `${freq / 1000}k` : freq.toString(),
      isoRef: getISO7029H50(age, sex, freq),
    }))
    .sort((a, b) => a.freq - b.freq);
}

export interface ISO7029Interpretation {
  deltaFromMedian: number;
  interpretation: 'better-than-median' | 'at-median' | 'worse-than-median';
  clinicalNote: string;
}

export function interpretAgainstISO7029(
  measuredDb: number,
  age: number,
  sex: 'male' | 'female' | 'other',
  frequency: number
): ISO7029Interpretation {
  const referenceDb = getISO7029H50(age, sex, frequency);
  const delta = measuredDb - referenceDb;

  let interpretation: 'better-than-median' | 'at-median' | 'worse-than-median';
  let clinicalNote: string;

  if (delta <= -5) {
    interpretation = 'better-than-median';
    clinicalNote = `Excellent: ${Math.abs(Math.round(delta))} dB better than age/sex median`;
  } else if (delta <= 5) {
    interpretation = 'at-median';
    clinicalNote = `Within normal range for age ${age}`;
  } else {
    interpretation = 'worse-than-median';
    clinicalNote = `${Math.round(delta)} dB above age/sex median – may indicate accelerated loss`;
  }

  return { deltaFromMedian: delta, interpretation, clinicalNote };
}

export function getISO7029InterpretationForAge(
  demographics: Demographics | null,
  frequency: number
): number {
  if (!demographics) return 0;
  return getISO7029H50(demographics.age, demographics.sex, frequency);
}
