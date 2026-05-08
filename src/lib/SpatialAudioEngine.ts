/**
 * Spatial Audio Engine: 3D binaural audio processing with HRTF simulation
 *
 * Implements Head-Related Transfer Functions (HRTF) and 3D panning using
 * Web Audio API's Panner node with optional HRTF filtering for enhanced realism.
 */

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface SpatialAudioConfig {
  useHRTFFiltering: boolean; // Enhanced binaural realism
  refDistance: number; // Distance at which volume = 100%
  rolloffFactor: number; // How quickly volume decreases with distance
  maxDistance: number; // Distance at which volume becomes 0
}

export const DEFAULT_SPATIAL_CONFIG: SpatialAudioConfig = {
  useHRTFFiltering: true,
  refDistance: 1,
  rolloffFactor: 1,
  maxDistance: 50
};

/**
 * Simplified HRTF Filter Approximation
 *
 * Approximates Head-Related Transfer Function using frequency-dependent
 * filtering based on azimuth and elevation. This simulates how the human
 * head and ear shape modify sound arriving from different directions.
 */
export class HRTFFilter {
  private audioContext: AudioContext;
  private filterNode: BiquadFilterNode;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.filterNode = audioContext.createBiquadFilter();
  }

  /**
   * Apply HRTF based on source position
   * Simulates pinna filtering and head shadowing effects
   */
  updateForPosition(azimuth: number, elevation: number): BiquadFilterNode {
    // Normalize angles to 0-360 and -90 to 90
    const normalizedAzimuth = ((azimuth % 360) + 360) % 360;
    const clampedElevation = Math.max(-90, Math.min(90, elevation));

    // Simplified HRTF: frequency response varies with position
    // Front (0°): neutral response (no filtering)
    // Side (90°): boost high frequencies (pinna effect)
    // Back (180°): attenuate low frequencies (head shadowing)
    // Top (90° elevation): boost very high frequencies

    let frequency = 8000; // Default center frequency
    let gain = 0; // Default: no boost/cut
    let Q = 1; // Bandwidth

    if (normalizedAzimuth < 90) {
      // Front-right quadrant
      frequency = 8000 + (normalizedAzimuth / 90) * 2000;
      gain = (normalizedAzimuth / 90) * 3;
    } else if (normalizedAzimuth < 180) {
      // Right-back quadrant
      frequency = 10000 - ((normalizedAzimuth - 90) / 90) * 4000;
      gain = 3 - ((normalizedAzimuth - 90) / 90) * 6;
    } else if (normalizedAzimuth < 270) {
      // Back-left quadrant
      frequency = 6000 - ((normalizedAzimuth - 180) / 90) * 2000;
      gain = -3 - ((normalizedAzimuth - 180) / 90) * 3;
    } else {
      // Left-front quadrant
      frequency = 4000 + ((normalizedAzimuth - 270) / 90) * 4000;
      gain = -6 + ((normalizedAzimuth - 270) / 90) * 6;
    }

    // Elevation modifies high-frequency content
    if (clampedElevation > 0) {
      frequency += (clampedElevation / 90) * 4000;
      gain += (clampedElevation / 90) * 2;
    } else {
      frequency -= (Math.abs(clampedElevation) / 90) * 2000;
      gain -= (Math.abs(clampedElevation) / 90) * 3;
    }

    this.filterNode.type = 'peaking';
    this.filterNode.frequency.value = frequency;
    this.filterNode.gain.value = gain;
    this.filterNode.Q.value = Q;

    return this.filterNode;
  }

  getFilterNode(): BiquadFilterNode {
    return this.filterNode;
  }

  dispose(): void {
    // Filter will be garbage collected when disconnected
  }
}

/**
 * Main Spatial Audio Engine
 *
 * Manages 3D audio positioning with optional HRTF enhancement.
 * Each audio source is assigned a Panner node for spatial positioning.
 */
export class SpatialAudioEngine {
  private audioContext: AudioContext;
  private panners: Map<string, PannerNode> = new Map();
  private hrtfFilters: Map<string, HRTFFilter> = new Map();
  private sources: Map<string, AudioNode> = new Map();
  private config: SpatialAudioConfig;

  constructor(audioContext: AudioContext, config: Partial<SpatialAudioConfig> = {}) {
    this.audioContext = audioContext;
    this.config = { ...DEFAULT_SPATIAL_CONFIG, ...config };

    // Set up listener position (user's head at origin, facing forward)
    this.audioContext.listener.positionX.value = 0;
    this.audioContext.listener.positionY.value = 0;
    this.audioContext.listener.positionZ.value = 0;

    // Forward vector (facing positive Z direction)
    this.audioContext.listener.forwardX.value = 0;
    this.audioContext.listener.forwardY.value = 0;
    this.audioContext.listener.forwardZ.value = 1;

    // Up vector
    this.audioContext.listener.upX.value = 0;
    this.audioContext.listener.upY.value = 1;
    this.audioContext.listener.upZ.value = 0;
  }

  /**
   * Create spatial audio source and position it in 3D space
   */
  createSpatialSource(
    sourceId: string,
    position: Vector3
  ): { panner: PannerNode; filter?: BiquadFilterNode } {
    // Create panner for 3D positioning
    const panner = this.audioContext.createPanner();
    panner.positionX.value = position.x;
    panner.positionY.value = position.y;
    panner.positionZ.value = position.z;

    // Set panning model and distance parameters
    panner.panningModel = 'HRTF'; // Use HRTF panning model
    panner.distanceModel = 'exponential';
    panner.refDistance = this.config.refDistance;
    panner.rolloffFactor = this.config.rolloffFactor;
    panner.maxDistance = this.config.maxDistance;

    this.panners.set(sourceId, panner);

    let filter: BiquadFilterNode | undefined;

    // Create optional HRTF filter for enhanced realism
    if (this.config.useHRTFFiltering) {
      const hrtf = new HRTFFilter(this.audioContext);
      const azimuth = this.getAzimuth(position);
      const elevation = this.getElevation(position);
      filter = hrtf.updateForPosition(azimuth, elevation);
      this.hrtfFilters.set(sourceId, hrtf);
    }

    return { panner, filter };
  }

  /**
   * Connect audio source through spatial processing
   */
  connectSource(
    sourceId: string,
    sourceNode: AudioNode,
    position: Vector3
  ): void {
    const { panner, filter } = this.createSpatialSource(sourceId, position);

    this.sources.set(sourceId, sourceNode);

    // Route: source → optional HRTF filter → panner → destination
    if (filter) {
      sourceNode.connect(filter);
      filter.connect(panner);
    } else {
      sourceNode.connect(panner);
    }

    panner.connect(this.audioContext.destination);
  }

  /**
   * Update position of spatial source in real-time
   */
  setSpatialPosition(sourceId: string, position: Vector3): void {
    const panner = this.panners.get(sourceId);
    if (!panner) return;

    panner.positionX.setValueAtTime(position.x, this.audioContext.currentTime);
    panner.positionY.setValueAtTime(position.y, this.audioContext.currentTime);
    panner.positionZ.setValueAtTime(position.z, this.audioContext.currentTime);

    // Update HRTF filter if used
    const hrtf = this.hrtfFilters.get(sourceId);
    if (hrtf) {
      const azimuth = this.getAzimuth(position);
      const elevation = this.getElevation(position);
      hrtf.updateForPosition(azimuth, elevation);
    }
  }

  /**
   * Smoothly move source from one position to another
   */
  transitionPosition(
    sourceId: string,
    fromPosition: Vector3,
    toPosition: Vector3,
    durationSeconds: number = 2
  ): void {
    const panner = this.panners.get(sourceId);
    if (!panner) return;

    const startTime = this.audioContext.currentTime;
    const endTime = startTime + durationSeconds;

    // Ramp positions over time
    panner.positionX.linearRampToValueAtTime(toPosition.x, endTime);
    panner.positionY.linearRampToValueAtTime(toPosition.y, endTime);
    panner.positionZ.linearRampToValueAtTime(toPosition.z, endTime);

    // Update HRTF at intermediate points
    if (this.hrtfFilters.has(sourceId)) {
      const updateInterval = 100; // Update HRTF every 100ms
      let currentTime = startTime + updateInterval / 1000;

      const updateHRTF = () => {
        if (currentTime >= endTime) return;

        const progress = (currentTime - startTime) / durationSeconds;
        const interpPosition = {
          x: fromPosition.x + (toPosition.x - fromPosition.x) * progress,
          y: fromPosition.y + (toPosition.y - fromPosition.y) * progress,
          z: fromPosition.z + (toPosition.z - fromPosition.z) * progress
        };

        const azimuth = this.getAzimuth(interpPosition);
        const elevation = this.getElevation(interpPosition);
        this.hrtfFilters.get(sourceId)?.updateForPosition(azimuth, elevation);

        currentTime += updateInterval / 1000;
        setTimeout(updateHRTF, updateInterval);
      };

      updateHRTF();
    }
  }

  /**
   * Disconnect and remove spatial source
   */
  disconnectSource(sourceId: string): void {
    const panner = this.panners.get(sourceId);
    if (panner) {
      panner.disconnect();
      this.panners.delete(sourceId);
    }

    const hrtf = this.hrtfFilters.get(sourceId);
    if (hrtf) {
      hrtf.dispose();
      this.hrtfFilters.delete(sourceId);
    }

    this.sources.delete(sourceId);
  }

  /**
   * Calculate azimuth angle (horizontal plane, 0-360°)
   * 0° = front, 90° = right, 180° = back, 270° = left
   */
  private getAzimuth(position: Vector3): number {
    return (Math.atan2(position.x, position.z) * 180) / Math.PI;
  }

  /**
   * Calculate elevation angle (-90 to +90°)
   * 0° = horizontal plane, 90° = directly above, -90° = directly below
   */
  private getElevation(position: Vector3): number {
    const distance = Math.sqrt(position.x ** 2 + position.z ** 2);
    return (Math.atan2(position.y, distance) * 180) / Math.PI;
  }

  /**
   * Convert Cartesian position to spherical coordinates (azimuth, elevation, distance)
   */
  getSphericalPosition(position: Vector3): { azimuth: number; elevation: number; distance: number } {
    const azimuth = this.getAzimuth(position);
    const elevation = this.getElevation(position);
    const distance = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);

    return { azimuth, elevation, distance };
  }

  /**
   * Convert spherical coordinates to Cartesian position
   */
  getCartesianPosition(azimuth: number, elevation: number, distance: number): Vector3 {
    const azRad = (azimuth * Math.PI) / 180;
    const elRad = (elevation * Math.PI) / 180;

    return {
      x: distance * Math.sin(azRad) * Math.cos(elRad),
      y: distance * Math.sin(elRad),
      z: distance * Math.cos(azRad) * Math.cos(elRad)
    };
  }

  /**
   * Get random position at specified distance (for exercises)
   */
  getRandomPosition(distance: number = 2, elevationRange: number = 45): Vector3 {
    const azimuth = Math.random() * 360;
    const elevation = (Math.random() - 0.5) * 2 * elevationRange;
    return this.getCartesianPosition(azimuth, elevation, distance);
  }

  /**
   * Clean up spatial audio engine
   */
  dispose(): void {
    Array.from(this.panners.keys()).forEach(id => this.disconnectSource(id));
    this.panners.clear();
    this.hrtfFilters.clear();
    this.sources.clear();
  }
}
