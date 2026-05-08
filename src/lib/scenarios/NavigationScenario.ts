import { SpatialAudioEngine, Vector3 } from '../SpatialAudioEngine';

export type Direction = 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';

const DIRECTION_AZIMUTHS: Record<Direction, number> = {
  north: 0,
  northeast: 45,
  east: 90,
  southeast: 135,
  south: 180,
  southwest: 225,
  west: 270,
  northwest: 315,
};

export interface MapZone {
  id: string;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
}

export interface NavigationTrial {
  id: string;
  steps: Direction[];
  destination: { x: number; y: number };
  mapZones: MapZone[];
  correctZoneId: string;
}

export class NavigationScenario {
  private audioContext: AudioContext;
  private spatialEngine: SpatialAudioEngine;
  private trialsCompleted: number = 0;
  private correct: number = 0;

  constructor(audioContext: AudioContext, spatialEngine: SpatialAudioEngine) {
    this.audioContext = audioContext;
    this.spatialEngine = spatialEngine;
  }

  generateTrial(difficulty: number): NavigationTrial {
    // Difficulty 1: 2 steps, Difficulty 5: 5 steps
    const stepCount = Math.min(2 + difficulty - 1, 5);
    const steps: Direction[] = [];
    const directions = Object.keys(DIRECTION_AZIMUTHS) as Direction[];

    for (let i = 0; i < stepCount; i++) {
      const randomIdx = Math.floor(Math.random() * directions.length);
      steps.push(directions[randomIdx]);
    }

    // Simulate a subway station map with 5 zones
    const mapZones: MapZone[] = [
      { id: 'platform-north', name: 'North Platform', bounds: { x: 50, y: 20, width: 100, height: 50 } },
      { id: 'platform-south', name: 'South Platform', bounds: { x: 50, y: 210, width: 100, height: 50 } },
      { id: 'turnstiles', name: 'Turnstiles', bounds: { x: 170, y: 100, width: 80, height: 80 } },
      { id: 'exit', name: 'Exit', bounds: { x: 280, y: 80, width: 60, height: 120 } },
      { id: 'waiting-area', name: 'Waiting Area', bounds: { x: 20, y: 100, width: 50, height: 80 } },
    ];

    // Calculate destination based on steps
    // Start at center (200, 140) and move in direction steps
    let currentX = 200;
    let currentY = 140;
    const stepSize = 30;

    steps.forEach(step => {
      const azimuth = DIRECTION_AZIMUTHS[step];
      const rad = (azimuth * Math.PI) / 180;
      currentX += Math.cos(rad) * stepSize;
      currentY += Math.sin(rad) * stepSize;
    });

    // Find the closest zone to the destination
    let closestZone = mapZones[0];
    let minDistance = Infinity;

    mapZones.forEach(zone => {
      const zoneX = zone.bounds.x + zone.bounds.width / 2;
      const zoneY = zone.bounds.y + zone.bounds.height / 2;
      const distance = Math.hypot(currentX - zoneX, currentY - zoneY);

      if (distance < minDistance) {
        minDistance = distance;
        closestZone = zone;
      }
    });

    return {
      id: `navigation-${Date.now()}`,
      steps,
      destination: { x: currentX, y: currentY },
      mapZones,
      correctZoneId: closestZone.id,
    };
  }

  async playNavigationAudio(steps: Direction[]): Promise<void> {
    const toneDuration = 0.6; // 600ms per direction
    const silenceBetween = 0.15; // 150ms pause
    const toneFrequency = 1200;

    const now = this.audioContext.currentTime;
    let currentTime = now;

    for (const direction of steps) {
      const azimuth = DIRECTION_AZIMUTHS[direction];
      const position = this.spatialEngine.getCartesianPosition(azimuth, 0, 1.5);

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.frequency.value = toneFrequency;
      osc.type = 'sine';

      // Envelope: 20ms attack, hold, 20ms release
      gain.gain.setValueAtTime(0, currentTime);
      gain.gain.linearRampToValueAtTime(0.3, currentTime + 0.02);
      gain.gain.setValueAtTime(0.3, currentTime + toneDuration - 0.02);
      gain.gain.linearRampToValueAtTime(0, currentTime + toneDuration);

      osc.connect(gain);
      this.spatialEngine.connectSource(`nav-tone-${direction}`, gain, position);

      osc.start(currentTime);
      osc.stop(currentTime + toneDuration);

      currentTime += toneDuration + silenceBetween;
    }

    // End with 2-tone chime
    const chimeStart = currentTime;
    const chimeTone1 = 1600;
    const chimeTone2 = 2000;
    const chimeDuration = 0.2;

    for (const freq of [chimeTone1, chimeTone2]) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.frequency.value = freq;
      osc.type = 'sine';

      gain.gain.setValueAtTime(0, chimeStart);
      gain.gain.linearRampToValueAtTime(0.2, chimeStart + 0.01);
      gain.gain.setValueAtTime(0.2, chimeStart + chimeDuration - 0.01);
      gain.gain.linearRampToValueAtTime(0, chimeStart + chimeDuration);

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.start(chimeStart);
      osc.stop(chimeStart + chimeDuration);
    }

    return new Promise(resolve => {
      const totalTime = currentTime - now + chimeDuration + 0.2;
      setTimeout(() => {
        steps.forEach(step => {
          this.spatialEngine.disconnectSource(`nav-tone-${step}`);
        });
        resolve();
      }, totalTime * 1000);
    });
  }

  checkAnswer(trial: NavigationTrial, selectedZoneId: string): boolean {
    const correct = selectedZoneId === trial.correctZoneId;

    this.trialsCompleted++;
    if (correct) {
      this.correct++;
    }

    return correct;
  }

  getAccuracy(): number {
    return this.trialsCompleted > 0 ? (this.correct / this.trialsCompleted) * 100 : 0;
  }

  dispose(): void {
    // Cleanup is handled in playNavigationAudio disconnect calls
  }
}
