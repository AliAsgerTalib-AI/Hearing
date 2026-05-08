import { SpatialAudioEngine, Vector3 } from '../SpatialAudioEngine';
import { NoiseSimulator } from '../NoiseSimulator';

const CALLER_NAMES = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Emma', 'Frank', 'Grace', 'Henry',
  'Iris', 'Jack', 'Karen', 'Leo', 'Mona', 'Nathan', 'Olivia', 'Peter',
  'Quinn', 'Rachel', 'Samuel', 'Tina',
];

const CALLER_INTENTS = ['appointment', 'billing', 'prescription', 'general'] as const;

export interface ReceptionistTrial {
  id: string;
  callerName: string;
  callerIntent: typeof CALLER_INTENTS[number];
  snrLevel: number;
  options: string[];
}

export interface ReceptionistState {
  trialsCompleted: number;
  correct: number;
  currentSNR: number;
}

export class ReceptionistScenario {
  private audioContext: AudioContext;
  private spatialEngine: SpatialAudioEngine;
  private noiseSimulator: NoiseSimulator;
  private state: ReceptionistState = {
    trialsCompleted: 0,
    correct: 0,
    currentSNR: 5,
  };
  private currentTrial: ReceptionistTrial | null = null;

  constructor(audioContext: AudioContext, spatialEngine: SpatialAudioEngine, noiseSimulator: NoiseSimulator) {
    this.audioContext = audioContext;
    this.spatialEngine = spatialEngine;
    this.noiseSimulator = noiseSimulator;
  }

  generateTrial(difficulty: number): ReceptionistTrial {
    const index = Math.floor(Math.random() * CALLER_NAMES.length);
    const callerName = CALLER_NAMES[index];
    const callerIntent = CALLER_INTENTS[Math.floor(Math.random() * CALLER_INTENTS.length)];

    // Adapt SNR based on difficulty (1-5)
    // Difficulty 1: SNR 10dB (easy), Difficulty 5: SNR -5dB (hard)
    const baseSNR = 10 - (difficulty - 1) * 3.75;
    this.state.currentSNR = baseSNR;

    // Generate 3 distractor names
    const allNames = CALLER_NAMES.filter(n => n !== callerName);
    const distractors: string[] = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(Math.random() * allNames.length);
      distractors.push(allNames[idx]);
      allNames.splice(idx, 1);
    }

    const options = [callerName, ...distractors].sort(() => Math.random() - 0.5);

    const trial: ReceptionistTrial = {
      id: `receptionist-${Date.now()}`,
      callerName,
      callerIntent,
      snrLevel: baseSNR,
      options,
    };

    this.currentTrial = trial;
    return trial;
  }

  async playTrial(trial: ReceptionistTrial): Promise<void> {
    // Phone position: azimuth ~330° (slightly left of center), elevation 10° (ear level)
    const phonePosition = this.spatialEngine.getCartesianPosition(330, 10, 0.5);

    // Create caller voice: 1kHz carrier + 500Hz formant + 2.5kHz consonant indicator
    const now = this.audioContext.currentTime;
    const duration = 2.0;
    const voiceFrequencies = [1000, 500, 2500];
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    // Start babble noise at base level - SNR
    const baseNoiseDb = 65; // typical office/reception noise floor
    this.noiseSimulator.startNoise('babble', baseNoiseDb - trial.snrLevel);

    for (const freq of voiceFrequencies) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.frequency.value = freq;
      osc.type = 'sine';

      // Attack/hold/release envelope (50ms / 1.5s / 50ms)
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.setValueAtTime(0.3, now + duration - 0.05);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      // Add 4Hz amplitude modulation (speech-like)
      const lfo = this.audioContext.createOscillator();
      const lfoGain = this.audioContext.createGain();
      lfo.frequency.value = 4;
      lfoGain.gain.value = 0.3;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      osc.connect(gain);

      oscillators.push(osc);
      gains.push(gain);

      osc.start(now);
      lfo.start(now);

      setTimeout(() => {
        osc.stop();
        lfo.stop();
      }, duration * 1000);
    }

    // Connect all voice signals through spatial engine
    const voiceGain = this.audioContext.createGain();
    for (const gain of gains) {
      gain.connect(voiceGain);
    }

    this.spatialEngine.connectSource('receptionist-voice', voiceGain, phonePosition);

    return new Promise(resolve => {
      setTimeout(() => {
        this.noiseSimulator.stopNoise();
        resolve();
      }, (duration + 0.5) * 1000);
    });
  }

  checkAnswer(trial: ReceptionistTrial, selectedName: string): boolean {
    const correct = selectedName === trial.callerName;

    this.state.trialsCompleted++;
    if (correct) {
      this.state.correct++;
    }

    this.adaptDifficulty();
    return correct;
  }

  private adaptDifficulty(): void {
    const accuracy = this.state.correct / this.state.trialsCompleted;

    if (accuracy > 0.75 && this.state.currentSNR > -5) {
      // User is doing well, lower SNR (harder)
      this.state.currentSNR -= 2;
    } else if (accuracy < 0.5 && this.state.currentSNR < 10) {
      // User is struggling, raise SNR (easier)
      this.state.currentSNR += 2;
    }
  }

  getState(): ReceptionistState {
    return { ...this.state };
  }

  dispose(): void {
    this.noiseSimulator.stopNoise();
    this.spatialEngine.disconnectSource('receptionist-voice');
  }
}
