import { SpatialAudioEngine, Vector3 } from '../SpatialAudioEngine';
import { NoiseSimulator } from '../NoiseSimulator';

const MENU_ITEMS = [
  'grilled salmon',
  'beef steak',
  'chicken pasta',
  'vegetable curry',
  'fish tacos',
  'lamb chops',
  'shrimp risotto',
  'duck confit',
  'caesar salad',
  'mushroom soup',
];

export interface OrderTrial {
  id: string;
  waiterPosition: Vector3;
  targetOrder: string;
  distractors: string[];
  options: string[];
  babbleLevel: number;
}

export class RestaurantOrderScenario {
  private audioContext: AudioContext;
  private spatialEngine: SpatialAudioEngine;
  private noiseSimulator: NoiseSimulator;
  private trialsCompleted: number = 0;
  private correct: number = 0;

  constructor(audioContext: AudioContext, spatialEngine: SpatialAudioEngine, noiseSimulator: NoiseSimulator) {
    this.audioContext = audioContext;
    this.spatialEngine = spatialEngine;
    this.noiseSimulator = noiseSimulator;
  }

  generateTrial(difficulty: number): OrderTrial {
    const index = Math.floor(Math.random() * MENU_ITEMS.length);
    const targetOrder = MENU_ITEMS[index];

    // Get 3 distractors
    const allItems = MENU_ITEMS.filter(i => i !== targetOrder);
    const distractors: string[] = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(Math.random() * allItems.length);
      distractors.push(allItems[idx]);
      allItems.splice(idx, 1);
    }

    const options = [targetOrder, ...distractors].sort(() => Math.random() - 0.5);

    // Waiter position: front-right (azimuth 45°, elevation 0°, 1.5m distance)
    const waiterPosition = this.spatialEngine.getCartesianPosition(45, 0, 1.5);

    // Difficulty affects babble noise level
    // Difficulty 1: 60dB (easy), Difficulty 5: 75dB (hard)
    const babbleLevel = 60 + (difficulty - 1) * 3.75;

    return {
      id: `restaurant-${Date.now()}`,
      waiterPosition,
      targetOrder,
      distractors,
      options,
      babbleLevel,
    };
  }

  async playTrial(trial: OrderTrial): Promise<void> {
    // Start cocktail babble noise
    this.noiseSimulator.startNoise('cocktail', trial.babbleLevel);

    // Create waiter voice: 3 sequential frequency bursts (500Hz → 1500Hz → 800Hz)
    const now = this.audioContext.currentTime;
    const frequencies = [500, 1500, 800];
    const burstDuration = 0.5;
    const silenceBetween = 0.1;

    for (let i = 0; i < frequencies.length; i++) {
      const freq = frequencies[i];
      const startTime = now + i * (burstDuration + silenceBetween);

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.frequency.value = freq;
      osc.type = 'sine';

      // Envelope: attack 30ms, hold, release 30ms
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.03);
      gain.gain.setValueAtTime(0.4, startTime + burstDuration - 0.03);
      gain.gain.linearRampToValueAtTime(0, startTime + burstDuration);

      osc.connect(gain);
      this.spatialEngine.connectSource(`waiter-${i}`, gain, trial.waiterPosition);

      osc.start(startTime);
      osc.stop(startTime + burstDuration);
    }

    return new Promise(resolve => {
      const totalTime = 3 * (burstDuration + silenceBetween) + 0.5;
      setTimeout(() => {
        this.noiseSimulator.stopNoise();
        for (let i = 0; i < 3; i++) {
          this.spatialEngine.disconnectSource(`waiter-${i}`);
        }
        resolve();
      }, totalTime * 1000);
    });
  }

  checkAnswer(trial: OrderTrial, selectedOrder: string): boolean {
    const correct = selectedOrder === trial.targetOrder;

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
    this.noiseSimulator.stopNoise();
    for (let i = 0; i < 3; i++) {
      this.spatialEngine.disconnectSource(`waiter-${i}`);
    }
  }
}
