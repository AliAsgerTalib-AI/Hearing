export type ExerciseType = 'vowel' | 'consonant';

export interface PhonemeMatchResult {
  matched: string | null;
  confidence: 'exact' | 'fuzzy' | 'none';
  normalizedInput: string;
}

const VOWEL_SPEECH_MAP: Record<string, string> = {
  ah: 'a',
  aa: 'a',
  aah: 'a',
  eh: 'e',
  ay: 'e',
  hey: 'e',
  ee: 'i',
  ea: 'i',
  eeee: 'i',
  oh: 'o',
  ow: 'o',
  ooh: 'o',
  awe: 'o',
  oo: 'u',
  ooo: 'u',
  who: 'u',
  wu: 'u',
  cat: 'a',
  hat: 'a',
  bat: 'a',
  bed: 'e',
  red: 'e',
  bet: 'e',
  bit: 'i',
  sit: 'i',
  hit: 'i',
  got: 'o',
  hot: 'o',
  not: 'o',
  put: 'u',
  book: 'u',
  foot: 'u',
  open: 'ɑ',
  father: 'ɑ',
  dress: 'ɛ',
  head: 'ɛ',
  kit: 'ɪ',
  ship: 'ɪ',
  cloth: 'ɔ',
  thought: 'ɔ',
  uh: 'ʊ',
};

const CONSONANT_SPEECH_MAP: Record<string, string> = {
  pee: 'p',
  p: 'p',
  pa: 'p',
  pie: 'p',
  bee: 'b',
  b: 'b',
  ba: 'b',
  be: 'b',
  tee: 't',
  t: 't',
  ta: 't',
  tea: 't',
  dee: 'd',
  d: 'd',
  da: 'd',
  kay: 'k',
  k: 'k',
  ka: 'k',
  key: 'k',
  gee: 'g',
  g: 'g',
  ga: 'g',
  jay: 'g',
};

function levenshtein(a: string, b: string): number {
  const len1 = a.length;
  const len2 = b.length;
  const dp: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[len1][len2];
}

function getMapForExerciseType(exerciseType: ExerciseType): Record<string, string> {
  return exerciseType === 'vowel' ? VOWEL_SPEECH_MAP : CONSONANT_SPEECH_MAP;
}

export function matchPhoneme(
  transcript: string,
  exerciseType: ExerciseType,
  validAnswers: string[]
): PhonemeMatchResult {
  const normalizedInput = transcript.toLowerCase().trim().replace(/[^a-z\s]/g, '');
  const map = getMapForExerciseType(exerciseType);
  const validAnswersSet = new Set(validAnswers);

  if (!normalizedInput) {
    return { matched: null, confidence: 'none', normalizedInput };
  }

  const words = normalizedInput.split(/\s+/).filter(w => w.length > 0);

  for (const word of words) {
    if (map[word]) {
      const candidate = map[word];
      if (validAnswersSet.has(candidate)) {
        return { matched: candidate, confidence: 'exact', normalizedInput };
      }
    }
  }

  for (const word of words) {
    for (const [key, value] of Object.entries(map)) {
      const distance = levenshtein(word, key);
      if (distance <= 1 && validAnswersSet.has(value)) {
        return { matched: value, confidence: 'fuzzy', normalizedInput };
      }
    }
  }

  return { matched: null, confidence: 'none', normalizedInput };
}
