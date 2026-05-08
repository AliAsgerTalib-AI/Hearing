/**
 * Soundscape Simulator: Multi-source 3D audio environments
 *
 * Creates immersive acoustic environments with multiple speakers,
 * reverb, and realistic spatial distributions.
 */

import { SpatialAudioEngine, Vector3 } from './SpatialAudioEngine';

export interface SoundSource {
  id: string;
  type: 'speech' | 'noise' | 'ambient';
  frequency?: number;
  position: Vector3;
  movementPath?: Vector3[]; // For moving sources
  currentPathIndex?: number;
}

export type EnvironmentType =
  | 'times_square'
  | 'concert_hall'
  | 'restaurant'
  | 'train'
  | 'office'
  | 'bathroom'
  | 'subway'
  | 'airport';

export interface EnvironmentCharacteristics {
  name: string;
  description: string;
  reverbTime: number; // RT60 in seconds
  reverbMix: number; // 0-1, how much reverb
  noiseFloor: number; // dB
  dimensions: { width: number; height: number; depth: number };
  typicalSources: number; // Expected number of speakers
  difficulty: number; // 1-5
}

export const ENVIRONMENTS: Record<EnvironmentType, EnvironmentCharacteristics> = {
  times_square: {
    name: 'Times Square',
    description: 'Busy urban street with heavy traffic and crowds',
    reverbTime: 0.8,
    reverbMix: 0.2,
    noiseFloor: 75,
    dimensions: { width: 40, height: 30, depth: 40 },
    typicalSources: 8,
    difficulty: 5
  },
  concert_hall: {
    name: 'Concert Hall',
    description: 'Large venue with long reverberation',
    reverbTime: 3.0,
    reverbMix: 0.6,
    noiseFloor: 35,
    dimensions: { width: 60, height: 40, depth: 80 },
    typicalSources: 4,
    difficulty: 4
  },
  restaurant: {
    name: 'Busy Restaurant',
    description: 'Multiple conversations with background noise',
    reverbTime: 0.6,
    reverbMix: 0.3,
    noiseFloor: 70,
    dimensions: { width: 30, height: 10, depth: 20 },
    typicalSources: 6,
    difficulty: 4
  },
  train: {
    name: 'Train Car',
    description: 'Confined space with mechanical noise',
    reverbTime: 0.4,
    reverbMix: 0.25,
    noiseFloor: 80,
    dimensions: { width: 8, height: 7, depth: 30 },
    typicalSources: 5,
    difficulty: 3
  },
  office: {
    name: 'Open Office',
    description: 'Light ambient noise with scattered conversations',
    reverbTime: 0.5,
    reverbMix: 0.15,
    noiseFloor: 55,
    dimensions: { width: 25, height: 12, depth: 35 },
    typicalSources: 4,
    difficulty: 2
  },
  bathroom: {
    name: 'Bathroom',
    description: 'Highly reflective small space',
    reverbTime: 1.2,
    reverbMix: 0.7,
    noiseFloor: 40,
    dimensions: { width: 4, height: 3, depth: 6 },
    typicalSources: 2,
    difficulty: 3
  },
  subway: {
    name: 'Subway Station',
    description: 'Underground train with mechanical rumble and announcement echoes',
    reverbTime: 1.8,
    reverbMix: 0.5,
    noiseFloor: 78,
    dimensions: { width: 10, height: 8, depth: 60 },
    typicalSources: 6,
    difficulty: 3
  },
  airport: {
    name: 'Airport Terminal',
    description: 'Large open atrium with PA announcements and crowd noise',
    reverbTime: 1.4,
    reverbMix: 0.35,
    noiseFloor: 68,
    dimensions: { width: 50, height: 25, depth: 80 },
    typicalSources: 7,
    difficulty: 2
  }
};

export class SoundscapeSimulator {
  private spatialEngine: SpatialAudioEngine;
  private audioContext: AudioContext;
  private environment: EnvironmentType;
  private sources: Map<string, SoundSource> = new Map();
  private convolver: ConvolverNode | null = null;
  private reverbGain: GainNode;
  private dryGain: GainNode;
  private animationFrameId: number | null = null;

  constructor(audioContext: AudioContext, spatialEngine: SpatialAudioEngine) {
    this.audioContext = audioContext;
    this.spatialEngine = spatialEngine;
    this.environment = 'restaurant';

    // Create reverb processing chain
    this.reverbGain = audioContext.createGain();
    this.dryGain = audioContext.createGain();

    this.setupEnvironment('restaurant');
  }

  /**
   * Set current environment and its characteristics
   */
  setupEnvironment(envType: EnvironmentType): void {
    this.environment = envType;
    const env = ENVIRONMENTS[envType];

    // Adjust reverb mix
    this.reverbGain.gain.value = env.reverbMix;
    this.dryGain.gain.value = 1 - env.reverbMix;

    // Would create proper impulse response in production
    // For now, using simple reverb approximation via gain and delay
  }

  /**
   * Add sound source to soundscape
   */
  addSource(source: SoundSource): void {
    this.sources.set(source.id, source);
  }

  /**
   * Remove sound source
   */
  removeSource(sourceId: string): void {
    this.sources.delete(sourceId);
    this.spatialEngine.disconnectSource(sourceId);
  }

  /**
   * Generate random speaker distribution for environment
   */
  generateSpeakerDistribution(count: number = 3): Vector3[] {
    const env = ENVIRONMENTS[this.environment];
    const positions: Vector3[] = [];

    // Place speakers around listener in realistic pattern
    const angles = this.getRealisticAngles(count);

    angles.forEach((angle) => {
      // Vary distance based on environment size
      const distance = 1.5 + Math.random() * 2;
      const elevation = (Math.random() - 0.5) * 30; // ±30° elevation

      const cartesian = this.spatialEngine.getCartesianPosition(
        angle,
        elevation,
        distance
      );

      positions.push(cartesian);
    });

    return positions;
  }

  /**
   * Get realistic speaker angles for environment
   */
  private getRealisticAngles(count: number): number[] {
    const env = ENVIRONMENTS[this.environment];
    const angles: number[] = [];

    if (env === ENVIRONMENTS.times_square) {
      // Random scattered speakers (typical street chaos)
      for (let i = 0; i < count; i++) {
        angles.push(Math.random() * 360);
      }
    } else if (env === ENVIRONMENTS.concert_hall) {
      // Clustered around stage front
      const baseAngle = 0;
      angles.push(baseAngle);
      for (let i = 1; i < count; i++) {
        angles.push(baseAngle + (Math.random() - 0.5) * 60);
      }
    } else if (env === ENVIRONMENTS.restaurant) {
      // Scattered in all directions (tables everywhere)
      for (let i = 0; i < count; i++) {
        angles.push((i / count) * 360 + (Math.random() - 0.5) * 45);
      }
    } else if (env === ENVIRONMENTS.subway) {
      // Clustered along tunnel axis (announcements from front/back)
      const axisAngles = [0, 90, 180, 270];
      for (let i = 0; i < count; i++) {
        const baseAngle = axisAngles[i % axisAngles.length];
        angles.push(baseAngle + (Math.random() - 0.5) * 30);
      }
    } else if (env === ENVIRONMENTS.airport) {
      // Omnidirectional with slight forward cluster (PA system overhead/front)
      for (let i = 0; i < count; i++) {
        let angle = Math.random() * 360;
        // Bias toward front (0°) for PA announcements
        if (Math.random() < 0.6) {
          angle = (Math.random() - 0.5) * 90;
        }
        angles.push(angle);
      }
    } else {
      // Default: even distribution
      for (let i = 0; i < count; i++) {
        angles.push((i / count) * 360);
      }
    }

    return angles;
  }

  /**
   * Create moving source (e.g., car passing by)
   */
  createMovingSource(sourceId: string, startPos: Vector3, endPos: Vector3, durationMs: number): void {
    const steps = Math.ceil(durationMs / 50); // Update every 50ms
    const path: Vector3[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      path.push({
        x: startPos.x + (endPos.x - startPos.x) * t,
        y: startPos.y + (endPos.y - startPos.y) * t,
        z: startPos.z + (endPos.z - startPos.z) * t
      });
    }

    this.addSource({
      id: sourceId,
      type: 'speech',
      position: startPos,
      movementPath: path,
      currentPathIndex: 0
    });
  }

  /**
   * Start animating moving sources
   */
  startAnimation(): void {
    if (this.animationFrameId) return;

    const animate = () => {
      this.sources.forEach((source) => {
        if (source.movementPath && source.currentPathIndex !== undefined) {
          if (source.currentPathIndex < source.movementPath.length - 1) {
            source.currentPathIndex++;
            const newPos = source.movementPath[source.currentPathIndex];
            this.spatialEngine.setSpatialPosition(source.id, newPos);
          }
        }
      });

      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Stop animation
   */
  stopAnimation(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Get current environment
   */
  getEnvironment(): EnvironmentType {
    return this.environment;
  }

  /**
   * Get environment characteristics
   */
  getEnvironmentInfo(): EnvironmentCharacteristics {
    return ENVIRONMENTS[this.environment];
  }

  /**
   * Calculate speech intelligibility in current soundscape
   */
  estimateSpeechIntelligibility(): number {
    const env = ENVIRONMENTS[this.environment];

    // Estimate based on environment difficulty
    // This is a rough approximation
    const baseIntelligibility = 100;
    const difficultyPenalty = env.difficulty * 15;

    return Math.max(10, baseIntelligibility - difficultyPenalty);
  }

  /**
   * Get training recommendation for environment
   */
  getTrainingRecommendation(): {
    message: string;
    suggestedNext: EnvironmentType | null;
  } {
    const env = ENVIRONMENTS[this.environment];

    if (env.difficulty <= 2) {
      return {
        message: 'This environment is good for building fundamentals. Ready to try something more challenging?',
        suggestedNext: 'office'
      };
    }

    if (env.difficulty <= 3) {
      return {
        message: 'Moderate difficulty. Focus on attending to target speakers.',
        suggestedNext: 'restaurant'
      };
    }

    if (env.difficulty <= 4) {
      return {
        message: 'This is challenging! Expert-level training. Keep practicing.',
        suggestedNext: 'times_square'
      };
    }

    return {
      message: 'Master level difficulty. This represents real-world conditions.',
      suggestedNext: null
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopAnimation();
    this.sources.forEach((source) => {
      this.removeSource(source.id);
    });
    this.sources.clear();
  }
}
