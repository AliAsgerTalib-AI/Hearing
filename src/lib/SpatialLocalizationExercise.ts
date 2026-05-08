/**
 * Spatial Localization Exercise: 3D audio positioning training
 *
 * Users identify where sound sources are positioned in 3D space.
 * Trains spatial hearing and superior colliculus processing.
 */

import { SpatialAudioEngine, Vector3 } from './SpatialAudioEngine';
import { AudioEngine } from './AudioEngine';

export interface SpatialPosition {
  azimuth: number; // 0-360°, 0=front, 90=right, 180=back, 270=left
  elevation: number; // -90 to +90°, 0=ear level
  distance: number; // meters, typically 1-5
}

export interface SpatialTrial {
  id: string;
  position: SpatialPosition;
  targetFrequency: number;
  duration: number;
}

export const DIFFICULTY_CONFIGS = {
  1: {
    positions: ['front', 'back', 'left', 'right'], // 4 positions
    elevationRange: 0, // No vertical component
    distance: 2,
    description: 'Basic: front, back, left, right'
  },
  2: {
    positions: ['front', 'back', 'left', 'right', 'frontLeft', 'frontRight', 'backLeft', 'backRight'],
    elevationRange: 0,
    distance: 2,
    description: 'Intermediate: 8 directions (no elevation)'
  },
  3: {
    positions: ['front', 'back', 'left', 'right', 'frontLeft', 'frontRight', 'backLeft', 'backRight'],
    elevationRange: 45,
    distance: 2,
    description: 'Advanced: 8 directions + elevation'
  },
  4: {
    positions: ['front', 'back', 'left', 'right', 'frontLeft', 'frontRight', 'backLeft', 'backRight'],
    elevationRange: 90,
    distance: 2,
    description: 'Expert: 8 directions + full vertical range'
  },
  5: {
    positions: ['front', 'back', 'left', 'right', 'frontLeft', 'frontRight', 'backLeft', 'backRight'],
    elevationRange: 90,
    distance: 1, // Closer source = harder localization
    description: 'Master: Expert with variable distance'
  }
};

const POSITION_MAP: Record<string, [number, number]> = {
  front: [0, 0],
  frontRight: [45, 0],
  right: [90, 0],
  backRight: [135, 0],
  back: [180, 0],
  backLeft: [225, 0],
  left: [270, 0],
  frontLeft: [315, 0],
  above: [0, 45],
  below: [0, -45]
};

export interface SpatialLocalizationState {
  level: number;
  accuracy: number; // 0-100
  totalTrials: number;
  correctTrials: number;
  currentTrial: number;
  currentPosition: SpatialPosition | null;
  isPlaying: boolean;
}

export class SpatialLocalizationExercise {
  private spatialEngine: SpatialAudioEngine;
  private audioEngine: AudioEngine;
  private state: SpatialLocalizationState;
  private currentOscillator: OscillatorNode | null = null;
  private trialFrequencies = [800, 1200, 2000, 3000]; // Varied frequencies

  constructor(audioEngine: AudioEngine, spatialEngine: SpatialAudioEngine) {
    this.audioEngine = audioEngine;
    this.spatialEngine = spatialEngine;
    this.state = {
      level: 1,
      accuracy: 0,
      totalTrials: 0,
      correctTrials: 0,
      currentTrial: 0,
      currentPosition: null,
      isPlaying: false
    };
  }

  /**
   * Generate trial with sound at random spatial position
   */
  generateTrial(): SpatialTrial {
    const config = DIFFICULTY_CONFIGS[this.state.level as keyof typeof DIFFICULTY_CONFIGS];
    const positions = config.positions as string[];

    // Pick random position from available set
    const positionName = positions[Math.floor(Math.random() * positions.length)];
    const [baseAzimuth, baseElevation] = POSITION_MAP[positionName];

    // Add slight randomization to elevation if enabled
    let elevation = baseElevation;
    if (config.elevationRange > 0) {
      elevation = baseElevation + (Math.random() - 0.5) * config.elevationRange;
    }

    // Variable distance on level 5
    let distance = config.distance;
    if (this.state.level === 5) {
      distance = 1 + Math.random() * 2; // 1-3 meters
    }

    const position: SpatialPosition = {
      azimuth: baseAzimuth,
      elevation,
      distance
    };

    // Pick random frequency for variety
    const frequency = this.trialFrequencies[
      Math.floor(Math.random() * this.trialFrequencies.length)
    ];

    this.state.currentPosition = position;

    return {
      id: `trial-${Date.now()}`,
      position,
      targetFrequency: frequency,
      duration: 1.5 // 1.5 second tone
    };
  }

  /**
   * Play trial sound at spatial position
   */
  async playTrial(trial: SpatialTrial): Promise<void> {
    if (this.state.isPlaying) return;

    this.state.isPlaying = true;
    this.state.currentTrial++;

    const context = this.audioEngine.getContext();
    const cartesianPos = this.spatialEngine.getCartesianPosition(
      trial.position.azimuth,
      trial.position.elevation,
      trial.position.distance
    );

    // Create tone at spatial position
    this.currentOscillator = context.createOscillator();
    const gainNode = context.createGain();

    this.currentOscillator.frequency.value = trial.targetFrequency;
    this.currentOscillator.type = 'sine';

    // Ramp up/down for smoothness
    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + trial.duration - 0.1);
    gainNode.gain.linearRampToValueAtTime(0, context.currentTime + trial.duration);

    // Connect through spatial engine
    this.spatialEngine.connectSource('trial', this.currentOscillator, cartesianPos);

    this.currentOscillator.connect(gainNode);
    gainNode.connect(context.destination);

    this.currentOscillator.start(context.currentTime);
    this.currentOscillator.stop(context.currentTime + trial.duration);

    // Wait for trial to finish
    return new Promise(resolve => {
      setTimeout(() => {
        this.state.isPlaying = false;
        this.spatialEngine.disconnectSource('trial');
        this.currentOscillator = null;
        resolve();
      }, trial.duration * 1000);
    });
  }

  /**
   * Record user's spatial response
   */
  recordResponse(userPosition: SpatialPosition, correct: boolean): void {
    this.state.totalTrials++;

    if (correct) {
      this.state.correctTrials++;
    }

    // Update accuracy
    this.state.accuracy = Math.round((this.state.correctTrials / this.state.totalTrials) * 100);

    // Adaptive difficulty
    if (this.state.accuracy >= 90 && this.state.level < 5) {
      this.state.level++;
    } else if (this.state.accuracy < 60 && this.state.level > 1) {
      this.state.level--;
    }
  }

  /**
   * Calculate angle difference between two spatial positions
   * Returns angle in degrees (0-180)
   */
  calculateAngularDistance(pos1: SpatialPosition, pos2: SpatialPosition): number {
    // Convert to radians
    const az1 = (pos1.azimuth * Math.PI) / 180;
    const el1 = (pos1.elevation * Math.PI) / 180;
    const az2 = (pos2.azimuth * Math.PI) / 180;
    const el2 = (pos2.elevation * Math.PI) / 180;

    // Convert to Cartesian
    const x1 = Math.cos(el1) * Math.sin(az1);
    const y1 = Math.sin(el1);
    const z1 = Math.cos(el1) * Math.cos(az1);

    const x2 = Math.cos(el2) * Math.sin(az2);
    const y2 = Math.sin(el2);
    const z2 = Math.cos(el2) * Math.cos(az2);

    // Dot product
    const dot = x1 * x2 + y1 * y2 + z1 * z2;

    // Clamp to avoid numerical errors
    const clamped = Math.max(-1, Math.min(1, dot));

    // Convert back to degrees
    return (Math.acos(clamped) * 180) / Math.PI;
  }

  /**
   * Check if response is within tolerance of correct answer
   */
  isCorrectResponse(userPosition: SpatialPosition, tolerance: number = 30): boolean {
    if (!this.state.currentPosition) return false;

    const distance = this.calculateAngularDistance(userPosition, this.state.currentPosition);
    return distance <= tolerance;
  }

  /**
   * Get response tolerance based on difficulty
   * Easier levels have larger tolerance
   */
  getResponseTolerance(): number {
    const tolerances: Record<number, number> = {
      1: 45, // ±45° for basic level
      2: 30, // ±30° for intermediate
      3: 25, // ±25° for advanced
      4: 20, // ±20° for expert
      5: 15  // ±15° for master
    };
    return tolerances[this.state.level];
  }

  /**
   * Get level configuration
   */
  getLevelConfig() {
    return DIFFICULTY_CONFIGS[this.state.level as keyof typeof DIFFICULTY_CONFIGS];
  }

  /**
   * Get level description
   */
  getLevelDescription(): string {
    return this.getLevelConfig().description;
  }

  /**
   * Get available response positions for current level
   */
  getAvailablePositions(): SpatialPosition[] {
    const config = DIFFICULTY_CONFIGS[this.state.level as keyof typeof DIFFICULTY_CONFIGS];
    const positions = config.positions as string[];

    return positions.map(posName => {
      const [az, el] = POSITION_MAP[posName];
      return {
        azimuth: az,
        elevation: el,
        distance: config.distance
      };
    });
  }

  /**
   * Get current state
   */
  getState(): SpatialLocalizationState {
    return { ...this.state };
  }

  /**
   * Stop any ongoing audio
   */
  stop(): void {
    if (this.currentOscillator) {
      try {
        this.currentOscillator.stop();
      } catch (e) {
        // Already stopped
      }
      this.currentOscillator = null;
    }
    this.state.isPlaying = false;
  }
}
