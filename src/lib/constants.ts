/**
 * Audio and Hearing Test Constants
 *
 * This file centralizes all magic numbers used in hearing tests and audio processing.
 * Each constant has a semantic name and includes documentation of its purpose.
 */

// ============================================================================
// FREQUENCY-SPECIFIC HEARING DECLINE RATES
// ============================================================================
// These values represent estimated dB decline per decade of age for different
// frequency ranges. Based on presbycusis (age-related hearing loss) models.
// Reference: Pitch-specific age-related hearing decline research

export const FREQUENCY_DECLINE_RATES = {
  /** Low frequencies (< 1kHz): ~0.5 dB/decade decline */
  LOW: 0.5,

  /** Mid-low frequencies (1kHz-2kHz): ~0.8 dB/decade decline */
  MID_LOW: 0.8,

  /** Mid-high frequencies (2kHz-4kHz): ~1.2 dB/decade decline */
  MID_HIGH: 1.2,

  /** High frequencies (4kHz-8kHz): ~1.8 dB/decade decline */
  HIGH: 1.8,

  /** Very high frequencies (≥8kHz): ~2.5 dB/decade decline (most affected) */
  VERY_HIGH: 2.5
} as const;

// Frequency thresholds for decline rate selection
export const FREQUENCY_THRESHOLDS = {
  MID_LOW_CUTOFF: 1000,     // Hz
  MID_HIGH_CUTOFF: 2000,    // Hz
  HIGH_CUTOFF: 4000,        // Hz
  VERY_HIGH_CUTOFF: 8000    // Hz
} as const;

// ============================================================================
// GENDER-BASED ADJUSTMENT FACTORS
// ============================================================================
// Sex-based differences in hearing decline patterns, particularly at higher
// frequencies where males show faster decline due to noise exposure patterns.

export const GENDER_ADJUSTMENTS = {
  /** Female baseline (no adjustment) */
  FEMALE: 1.0,

  /** Male adjustment for high-frequency decline: 1.2x faster decline */
  MALE_HIGH_FREQ_MULTIPLIER: 1.2,

  /** Threshold above which male adjustment applies */
  MALE_ADJUSTMENT_FREQ_CUTOFF: 2000 // Hz
} as const;

// ============================================================================
// PRESBYCUSIS MODEL PARAMETERS
// ============================================================================
// Base thresholds and age-related calculation parameters

export const PRESBYCUSIS = {
  /** Age at which hearing decline begins to accelerate */
  DECLINE_START_AGE: 20,

  /** Baseline threshold for normal hearing (young adults) */
  BASELINE_THRESHOLD_DB: 10,

  /** Age factor calculation: declineRate * (age - DECLINE_START_AGE) */
  AGE_FACTOR_BASE: 0 // calculated as: max(0, age - DECLINE_START_AGE)
} as const;

// ============================================================================
// PREDICTIVE STARTING dB CALCULATION WEIGHTS
// ============================================================================
// When estimating starting dB for a frequency based on neighboring results,
// we blend demographic norms with individual performance history.

export const PREDICTION_WEIGHTS = {
  /** Weight for neighboring frequency performance (individual data) */
  NEIGHBOR_WEIGHT: 0.6,

  /** Weight for demographic norm (population data) */
  DEMOGRAPHIC_WEIGHT: 0.4,

  /** Additional dB buffer above predicted threshold (to ensure audibility) */
  SAFETY_BUFFER_DB: 10,

  /** Minimum starting dB to avoid excessive silence */
  MIN_START_DB: 5,

  /** Safety margin below max dB to prevent ceiling effects */
  MAX_DB_SAFETY_MARGIN: 10
} as const;

// ============================================================================
// DEVICE CALIBRATION FACTORS
// ============================================================================
// Device-specific calibration multipliers adjust for differences in acoustic
// coupling efficiency and SPL output across different headphone/speaker types.
//
// Factor = (measured SPL @ 1kHz) / (reference SPL for headphones @ 1kHz)
// Used to normalize results across device types.

export const DEVICE_CALIBRATION_FACTORS = {
  /** Baseline reference: full-size over-ear headphones */
  HEADPHONES: 1.0,

  /** IEM (In-Ear Monitor): professional seal, highly efficient acoustic coupling */
  IEM: 0.6,

  /** Earbuds: direct coupled, standard seal, slightly less efficient than reference */
  EARBUDS: 0.75,

  /** Speakers: open field, requires higher SPL to achieve same perceived level */
  SPEAKERS: 2.5
} as const;

// ============================================================================
// NOISE CANCELLATION ADJUSTMENT
// ============================================================================
// Active noise cancellation lowers the perceived noise floor, which can
// artificially improve threshold measurements. This adjustment accounts for
// that effect.

export const NOISE_CANCELLATION = {
  /** Multiplier when noise cancellation is active: 0.9x (10% reduction) */
  ACTIVE_FACTOR: 0.9,

  /** Baseline when no noise cancellation: 1.0x (no adjustment) */
  INACTIVE_FACTOR: 1.0
} as const;

// ============================================================================
// AUDIO PLAYBACK PARAMETERS
// ============================================================================
// Web Audio API gain and envelope control parameters

export const AUDIO_PLAYBACK = {
  /** Safety ceiling for digital gain to prevent clipping */
  GAIN_SAFETY_CEILING: 0.95,

  /** Minimum gain value for exponential ramping (avoids log(0) errors) */
  MIN_EXPONENTIAL_GAIN: 0.0001,

  /** Attack/release envelope duration (seconds) */
  ENVELOPE_RAMP_DURATION: 0.06,

  /** Pulse tone duration (seconds) */
  PULSE_DURATION: 0.4,

  /** Time between pulse bursts in pulsed tone (seconds) */
  PULSE_INTERVAL: 0.6
} as const;

// ============================================================================
// ADAPTIVE STAIRCASE TEST PARAMETERS
// ============================================================================
// Modified Hughson-Westlake staircase algorithm parameters

export const STAIRCASE = {
  /** dB step down when user hears tone (descending phase) */
  DESCENDING_STEP_DB: 10,

  /** dB step up when user doesn't hear (ascending phase) */
  ASCENDING_STEP_DB: 5
} as const;

// ============================================================================
// HEARING LOSS SEVERITY CATEGORIES
// ============================================================================
// Standard audiological classification thresholds (HL = Hearing Level in dB)

export const HEARING_LOSS_CATEGORIES = {
  NORMAL: {
    name: 'Normal',
    min: -10,
    max: 20,
    color: '#f0fdfa'
  },
  MILD: {
    name: 'Mild',
    min: 20,
    max: 40,
    color: '#fffbeb'
  },
  MODERATE: {
    name: 'Moderate',
    min: 40,
    max: 60,
    color: '#fff7ed'
  },
  SEVERE: {
    name: 'Severe',
    min: 60,
    max: 80,
    color: '#fef2f2'
  },
  PROFOUND: {
    name: 'Profound',
    min: 80,
    max: 100,
    color: '#45050505'
  }
} as const;

// ============================================================================
// CRITICAL THRESHOLDS FOR CLINICAL ALERTS
// ============================================================================
// Frequency and dB combinations that warrant clinical attention

export const CLINICAL_ALERTS = {
  /** High-frequency loss threshold: significant loss above this frequency */
  HIGH_FREQ_LOSS_FREQ_HZ: 8000,

  /** High-frequency loss threshold: dB level indicating critical loss */
  HIGH_FREQ_LOSS_DB: 60,

  /** Maximum testable dB (hardware safety ceiling) */
  MAX_TESTABLE_DB: 80,

  /** dB level indicating "No Response" (user cannot hear at max level) */
  NO_RESPONSE_DB: 85 // MAX_DB + 5
} as const;

// ============================================================================
// TEST CONFIGURATION
// ============================================================================
// Test parameters like which frequencies to test and in what order

export const TEST_CONFIG = {
  /** Test frequencies in ML-optimized order (anchor → detail → extremes) */
  FREQUENCIES: [1000, 4000, 500, 8000, 2000, 250, 12000, 125, 16000] as const,

  /** Ears to test */
  SIDES: ['left', 'right', 'both'] as const,

  /** Minimum dB for testing */
  MIN_DB: 0,

  /** Maximum dB for testing (safety ceiling) */
  MAX_DB: 80,

  /** Default starting dB for adaptive threshold search */
  DEFAULT_START_DB: 25
} as const;

// ============================================================================
// STORAGE AND HISTORY
// ============================================================================
// Constants for local storage management

export const STORAGE = {
  /** LocalStorage key for hearing test results */
  RESULTS_KEY: 'hearingTestResults',

  /** LocalStorage key for hearing test history */
  HISTORY_KEY: 'hearingTestHistory',

  /** LocalStorage key for user demographics */
  DEMOGRAPHICS_KEY: 'hearingDemographics',

  /** Maximum number of historical tests to keep */
  MAX_HISTORY_ENTRIES: 50
} as const;

// ============================================================================
// UTILITY FUNCTION: Get decline rate for frequency
// ============================================================================

export function getDeclineRateForFrequency(frequencyHz: number): number {
  if (frequencyHz >= FREQUENCY_THRESHOLDS.VERY_HIGH_CUTOFF) {
    return FREQUENCY_DECLINE_RATES.VERY_HIGH;
  } else if (frequencyHz >= FREQUENCY_THRESHOLDS.HIGH_CUTOFF) {
    return FREQUENCY_DECLINE_RATES.HIGH;
  } else if (frequencyHz >= FREQUENCY_THRESHOLDS.MID_HIGH_CUTOFF) {
    return FREQUENCY_DECLINE_RATES.MID_HIGH;
  } else if (frequencyHz >= FREQUENCY_THRESHOLDS.MID_LOW_CUTOFF) {
    return FREQUENCY_DECLINE_RATES.MID_LOW;
  }
  return FREQUENCY_DECLINE_RATES.LOW;
}

// ============================================================================
// UTILITY FUNCTION: Get calibration factor for device
// ============================================================================

export function getCalibrationFactor(
  deviceType: 'earbuds' | 'iem' | 'headphones' | 'speakers'
): number {
  switch (deviceType) {
    case 'earbuds':
      return DEVICE_CALIBRATION_FACTORS.EARBUDS;
    case 'iem':
      return DEVICE_CALIBRATION_FACTORS.IEM;
    case 'headphones':
      return DEVICE_CALIBRATION_FACTORS.HEADPHONES;
    case 'speakers':
      return DEVICE_CALIBRATION_FACTORS.SPEAKERS;
    default:
      return DEVICE_CALIBRATION_FACTORS.HEADPHONES;
  }
}

// ============================================================================
// VOICE RECOGNITION PARAMETERS
// ============================================================================
// Web Speech API and voice interaction configuration

export const VOICE_RECOGNITION = {
  /** Milliseconds to wait for user speech before giving up */
  LISTEN_TIMEOUT_MS: 4000,

  /** Milliseconds of feedback display before auto-advancing */
  VOICE_FEEDBACK_DISPLAY_MS: 2000,

  /** Minimum confidence threshold for fuzzy match to count */
  FUZZY_MATCH_MAX_EDIT_DISTANCE: 1,

  /** Language code for SpeechRecognition - broad accent support */
  DEFAULT_LANG: 'en-US'
} as const;
