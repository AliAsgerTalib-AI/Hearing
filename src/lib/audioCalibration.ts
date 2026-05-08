/**
 * Acoustic Calibration System
 *
 * Framework for converting arbitrary Web Audio API gain levels to calibrated dB SPL
 * (Sound Pressure Level relative to 20 microPascals = clinical standard)
 *
 * The Web Audio API provides linear amplitude values (0.0 to 1.0).
 * This module establishes the relationship between amplitude and acoustic pressure.
 *
 * CRITICAL: Without calibration, all dB values are arbitrary and non-comparable.
 * With calibration, this app can provide clinically meaningful results.
 */

/**
 * Calibration data for a specific device/browser combination
 * Captures the transfer function between Web Audio gain and actual SPL
 */
export interface CalibrationData {
  /** Unique device identifier (hardware + browser combination) */
  deviceId: string;

  /** User-friendly device name (e.g., "iPhone 14 Pro") */
  deviceName?: string;

  /** Reference frequency used for calibration (typically 1000 Hz) */
  referenceFrequency: number;

  /** Expected output at reference frequency (dB SPL, 94 dB = standard calibration tone) */
  expectedReferenceDb: number;

  /** Actual measured output at reference frequency */
  measuredReferenceDb: number;

  /** Timestamp when calibration was performed */
  calibrationDate: number;

  /** Transfer function: frequency -> (gain -> dB SPL conversion factor) */
  transferFunction: Record<number, { gain: number; dbSpl: number }[]>;

  /** Optional: microphone calibration factor */
  microphoneSensitivity?: number;

  /** Optional: notes about calibration conditions */
  notes?: string;
}

/**
 * In-progress calibration state
 */
export interface CalibrationSession {
  status: 'idle' | 'measuring-reference' | 'measuring-frequencies' | 'complete';
  referenceFrequency: number;
  expectedReferenceDb: number;
  measuredReferenceDb?: number;
  measurements: Array<{
    frequency: number;
    gainLevel: number;
    measuredDb?: number;
  }>;
}

/**
 * Generate unique device ID based on browser/hardware info
 */
export function generateDeviceId(): string {
  // Use navigator API to create somewhat-unique device fingerprint
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const hardwareConcurrency = navigator.hardwareConcurrency || 1;
  const deviceMemory = (navigator as any).deviceMemory || 'unknown';

  const fingerprint = `${platform}-${deviceMemory}-${hardwareConcurrency}-${userAgent.substring(0, 50)}`;

  // Simple hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `device-${Math.abs(hash).toString(36)}`;
}

/**
 * Store calibration data in localStorage
 */
export function saveCalibration(calibration: CalibrationData): void {
  try {
    const existing = getStoredCalibrations();
    const index = existing.findIndex(c => c.deviceId === calibration.deviceId);

    if (index >= 0) {
      existing[index] = calibration;
    } else {
      existing.push(calibration);
    }

    // Keep only last 10 calibrations to avoid bloating localStorage
    const recent = existing.sort((a, b) => b.calibrationDate - a.calibrationDate).slice(0, 10);

    localStorage.setItem('audioCalibrations', JSON.stringify(recent));
  } catch (err) {
    console.error('Failed to save calibration:', err);
  }
}

/**
 * Retrieve stored calibrations
 */
export function getStoredCalibrations(): CalibrationData[] {
  try {
    const stored = localStorage.getItem('audioCalibrations');
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      c =>
        c.deviceId &&
        typeof c.referenceFrequency === 'number' &&
        c.transferFunction &&
        typeof c.transferFunction === 'object'
    );
  } catch (err) {
    console.error('Failed to retrieve calibrations:', err);
    return [];
  }
}

/**
 * Get calibration for current device
 */
export function getCalibrationForDevice(deviceId: string): CalibrationData | null {
  const calibrations = getStoredCalibrations();
  return calibrations.find(c => c.deviceId === deviceId) || null;
}

/**
 * CRITICAL FUNCTION: Convert Web Audio gain to dB SPL
 *
 * Without calibration: Returns arbitrary value
 * With calibration: Returns clinically meaningful dB SPL
 */
export function gainToDbSpl(
  frequency: number,
  gainLevel: number,
  calibration: CalibrationData | null
): number {
  if (!calibration || !calibration.transferFunction[frequency]) {
    // Fallback: uncalibrated conversion (NON-CLINICAL)
    const dbFallback = 20 * Math.log10(Math.max(gainLevel, 1e-5)) + 94; // Rough estimate
    console.warn(
      `[AUDIO CALIBRATION] No calibration for frequency ${frequency} Hz. Using non-standard conversion: ${dbFallback.toFixed(1)} dB (NOT calibrated to SPL)`
    );
    return dbFallback;
  }

  // Use calibration data to convert gain to dB SPL
  const tfData = calibration.transferFunction[frequency];
  if (tfData.length === 0) return 0;

  // Find closest measured gain point
  let closest = tfData[0];
  for (const point of tfData) {
    if (Math.abs(point.gain - gainLevel) < Math.abs(closest.gain - gainLevel)) {
      closest = point;
    }
  }

  return closest.dbSpl;
}

/**
 * CRITICAL FUNCTION: Convert target dB SPL to Web Audio gain
 *
 * For testing: determines what gain level produces the target dB SPL
 */
export function dbSplToGain(
  frequency: number,
  targetDbSpl: number,
  calibration: CalibrationData | null
): number {
  if (!calibration || !calibration.transferFunction[frequency]) {
    // Fallback conversion (NON-CLINICAL)
    const gainFallback = Math.pow(10, (targetDbSpl - 94) / 20);
    console.warn(
      `[AUDIO CALIBRATION] No calibration for frequency ${frequency} Hz. Using non-standard conversion: gain ${gainFallback.toFixed(3)} (NOT calibrated)`
    );
    return Math.max(0, Math.min(1, gainFallback)); // Clamp 0-1
  }

  // Find closest dB SPL match in transfer function
  const tfData = calibration.transferFunction[frequency];
  let closest = tfData[0];
  for (const point of tfData) {
    if (Math.abs(point.dbSpl - targetDbSpl) < Math.abs(closest.dbSpl - targetDbSpl)) {
      closest = point;
    }
  }

  return Math.max(0, Math.min(1, closest.gain)); // Clamp 0-1
}

/**
 * Create a new calibration session
 */
export function createCalibrationSession(
  referenceFrequency: number = 1000,
  expectedReferenceDb: number = 94
): CalibrationSession {
  return {
    status: 'idle',
    referenceFrequency,
    expectedReferenceDb,
    measurements: []
  };
}

/**
 * Complete a calibration session and create CalibrationData
 */
export function completeCalibration(
  session: CalibrationSession,
  deviceId: string,
  deviceName?: string
): CalibrationData | null {
  if (!session.measuredReferenceDb) {
    console.error('Calibration incomplete: missing reference measurement');
    return null;
  }

  // Build transfer function from measurements
  const transferFunction: Record<number, { gain: number; dbSpl: number }[]> = {};

  for (const measurement of session.measurements) {
    if (measurement.measuredDb === undefined) continue;

    if (!transferFunction[measurement.frequency]) {
      transferFunction[measurement.frequency] = [];
    }

    transferFunction[measurement.frequency].push({
      gain: measurement.gainLevel,
      dbSpl: measurement.measuredDb
    });
  }

  return {
    deviceId,
    deviceName,
    referenceFrequency: session.referenceFrequency,
    expectedReferenceDb: session.expectedReferenceDb,
    measuredReferenceDb: session.measuredReferenceDb,
    calibrationDate: Date.now(),
    transferFunction,
    notes: 'Calibration completed from session measurements'
  };
}

/**
 * Get calibration status message
 */
export function getCalibrationStatus(calibration: CalibrationData | null): string {
  if (!calibration) {
    return '❌ UNCALIBRATED - Results are non-standard. No comparison to other devices/apps possible.';
  }

  const daysSinceCalibration = (Date.now() - calibration.calibrationDate) / (1000 * 60 * 60 * 24);
  if (daysSinceCalibration > 180) {
    return `⚠️ OUTDATED CALIBRATION (${Math.floor(daysSinceCalibration)} days). Results may have drifted. Recalibration recommended.`;
  }

  return `✅ CALIBRATED (${Math.floor(daysSinceCalibration)} days ago) - Results are clinically comparable.`;
}

/**
 * Check if calibration is still valid (less than 6 months old)
 */
export function isCalibrationValid(calibration: CalibrationData): boolean {
  const sixMonthsMs = 180 * 24 * 60 * 60 * 1000;
  return Date.now() - calibration.calibrationDate < sixMonthsMs;
}

/**
 * Calculate calibration accuracy
 * Returns difference between measured and expected reference levels
 */
export function getCalibrationAccuracy(calibration: CalibrationData): number {
  return Math.abs(calibration.measuredReferenceDb - calibration.expectedReferenceDb);
}

/**
 * Check if calibration is accurate enough for clinical use
 * Clinical standard: within ±3 dB of expected reference
 */
export function isCalibrationAccurate(calibration: CalibrationData): boolean {
  return getCalibrationAccuracy(calibration) <= 3;
}
