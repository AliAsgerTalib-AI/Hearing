# High Frequency Pulse Exercise Algorithm

## Overview

The High Frequency Pulse exercise is an auditory training system designed to stimulate the auditory nerve using targeted high-frequency tones. It employs an adaptive algorithm that adjusts difficulty based on user performance, promoting neuroplasticity through consistent, progressive stimulation.

## Core Concepts

### Target Frequency Range
The exercise focuses on high frequencies (8000Hz–16000Hz) because:
- **Age-related hearing loss** (presbycusis) affects high frequencies first
- **Speech clarity** depends heavily on high-frequency detection (consonants, fricatives)
- **Auditory cortex plasticity** responds well to high-frequency stimulation challenges
- **Clinical relevance**: High-frequency loss is the most common hearing deficit in aging populations

### Neuroplasticity Basis
- **Repeated exposure** to high-frequency pulses strengthens synaptic connections in the auditory cortex
- **Progressive challenge** (increasing complexity) drives continued neural adaptation
- **Active engagement** (detecting/responding to stimuli) enhances learning vs. passive listening
- **Consistent practice** (recommended daily) consolidates neural rewiring

## Algorithm Architecture

### 1. Pulse Sequence Generation

```typescript
interface PulseSequence {
  frequencies: number[];    // Individual pulse frequencies
  intensities: number[];    // Loudness per pulse (0-100 scale)
  durations: number[];      // How long each pulse plays
  intervals: number[];      // Gaps between pulses
}
```

The algorithm generates sequences with these parameters:

| Level | Pulses | Duration | Intensity | Gap   | Description |
|-------|--------|----------|-----------|-------|-------------|
| 1     | 2      | 100ms    | 50dB      | 150ms | Novice - Simple pairs |
| 2     | 3      | 120ms    | 45dB      | 120ms | Intermediate - Triplets |
| 3     | 4      | 150ms    | 40dB      | 100ms | Advanced - Quads |
| 4     | 5      | 100ms    | 35dB      | 80ms  | Expert - Complex |
| 5     | 6      | 120ms    | 30dB      | 60ms  | Master - Rapid-fire |

### 2. Frequency Rotation

The algorithm randomly selects from the high-frequency band:
- **8000Hz** (8kHz) - Critical for speech detection
- **10000Hz** (10kHz) - Mid-high frequency
- **12000Hz** (12kHz) - Extended range
- **14000Hz** (14kHz) - Ultra-high
- **16000Hz** (16kHz) - Extreme high (near hearing limit)

This randomization prevents habituation to a single frequency and trains across the entire high-frequency spectrum.

### 3. Intensity Variation

Each pulse includes slight randomization (±5%) to:
- Make patterns less predictable (requires active listening)
- Simulate natural variation in auditory environments
- Prevent the brain from filtering out repetitive stimuli

```typescript
variationFactor = 1 + (Math.random() - 0.5) * 0.1
actualIntensity = baseIntensity × variationFactor
```

### 4. Adaptive Difficulty Algorithm

```
Performance Analysis:
├─ Calculate accuracy from last 10 trials
├─ If accuracy ≥ 90% → Advance to next level
├─ If accuracy < 60% → Step back to previous level
└─ Else → Hold current level
```

This ensures the user stays in the "zone of proximal development" (Vygotsky) where challenges are achievable but require focus.

## Implementation Details

### AudioEngine Integration

The `playSequence()` method uses the Web Audio API to generate tones:

```typescript
async playSequence(sequence: PulseSequence): Promise<void> {
  for (let i = 0; i < sequence.frequencies.length; i++) {
    // 1. Resume audio context (browser security requirement)
    await audioEngine.resume();
    
    // 2. Create oscillator for this frequency
    const frequency = sequence.frequencies[i];
    const gain = sequence.intensities[i] / 100;
    
    // 3. Play tone with envelope (smooth onset/offset)
    audioEngine.playTone(frequency, gain);
    
    // 4. Wait for pulse duration + inter-pulse gap
    await delay((duration + interval) * 1000);
    
    // 5. Stop and clean up
    audioEngine.stopTone();
  }
}
```

**Key Features:**
- **Exponential envelope ramping** prevents audio artifacts (clicks/pops)
- **Stereo panning** optional for future localization exercises
- **Calibration factors** account for device differences (earbuds, headphones, speakers)
- **Safety ceiling** prevents digital clipping

### Performance Tracking

The exercise tracks:
- **totalTrials**: Number of stimulus presentations
- **correctTrials**: Accurate responses
- **accuracy**: Real-time percentage (rolling 10-trial window)
- **level**: Current difficulty (1-5)
- **frequency**: Most recently played frequency
- **intensity**: Current dB level

## User Interaction Flow

```
1. User taps "Play Pulse Sequence"
   ↓
2. Algorithm generates sequence (random frequency, random intensity variation)
   ↓
3. AudioEngine plays sequence with smooth envelope
   ↓
4. User responds: "Clear" or "Unclear"
   ↓
5. Algorithm records response and calculates new accuracy
   ↓
6. If accuracy ≥90% → Advance level (more pulses, faster, quieter)
   ↓
7. Repeat (typically 10-15 trials per session)
```

## Session Statistics

Post-session metrics include:
- **Final Accuracy**: Overall detection rate
- **Level Achieved**: Highest difficulty reached
- **Trials Completed**: Total stimulus presentations
- **Frequencies Encountered**: Range of high frequencies targeted
- **Session Duration**: Time spent in active training

## Clinical Applications

### For Hearing Loss Management
- **High-frequency loss**: Targeted stimulation to preserve or improve sensitivity
- **Age-related decline**: Slow presbycusis progression through neuroplastic training
- **Speech clarity**: Improved consonant/fricative perception

### For Auditory Processing Disorders
- **Temporal resolution**: Rapid pulse sequences train timing perception
- **Frequency discrimination**: Varied frequencies improve spectral acuity
- **Attentional fatigue**: Engaging, gamified format improves compliance

### For Musicians & Audiophiles
- **Frequency sensitivity**: Extended range perception beyond typical 20kHz hearing
- **Tonal discrimination**: Subtle frequency differences become detectible
- **Auditory expertise**: Consistent practice builds expert listening skills

## Neurophysiology

### Cortical Organization
- **Primary auditory cortex (A1)**: Tonotopically organized by frequency
  - High frequencies → anterior/dorsal regions
  - Repeated high-frequency stimulation → synaptic strengthening in A1
  
- **Superior temporal sulcus (STS)**: Temporal pattern processing
  - Pulse rate training → improved temporal resolution
  - Adaptive difficulty → active engagement of STS

### Synaptic Mechanisms
- **Long-term potentiation (LTP)**: Repeated pairing of stimuli + attention strengthens synapses
- **Spike-timing-dependent plasticity (STDP)**: Consistent activation patterns are reinforced
- **Homeostatic plasticity**: System prevents runaway potentiation by scaling down baseline synaptic strength

## Performance Expectations

### Typical Progress
- **Week 1**: User learns to discriminate pulses; levels 1-2
- **Week 2-3**: Accuracy stabilizes at 75-85%; advances to levels 3-4
- **Week 4+**: Reaches level 5; accuracy improves to 85-95% through continued practice

### Individual Variation
- **Age**: Younger users typically advance faster (less cortical decline)
- **Baseline hearing**: Users with normal hearing advance sooner than those with loss
- **Engagement**: Consistent daily practice → faster progression than sporadic use

## Configuration Parameters

All parameters are defined in `constants.ts`:

```typescript
AUDIO_PLAYBACK = {
  PULSE_DURATION: 0.4,        // How long each tone plays
  PULSE_INTERVAL: 0.6,        // Gap between pulses
  ENVELOPE_RAMP_DURATION: 0.06, // Attack/release curve
  GAIN_SAFETY_CEILING: 0.95,  // Maximum digital gain
}
```

To customize:
1. Modify values in `src/lib/constants.ts`
2. Rebuild with `npm run build`
3. No component changes needed (uses imported constants)

## Future Enhancements

### Planned Features
- **Binaural beats**: Different frequencies in left/right ears for hemispheric stimulation
- **Frequency sweep exercises**: Continuous tones that move across frequency range
- **Adaptive intensity**: Automatically adjust dB based on accuracy
- **Streak tracking**: Gamification with daily streak rewards
- **Historical trending**: Graph accuracy/level over weeks/months
- **Bilateral coordination**: Require coordination between ears
- **Combination exercises**: High-frequency pulses + speech discrimination

### Research Directions
- Compare effectiveness: High-frequency pulse vs. other auditory training modalities
- Optimal session length: 3 minutes vs. 10 minutes vs. 30 minutes
- Retention curves: How long do improvements persist after stopping training?
- Individual factors: Which demographics benefit most?

## References

- Hébert, S., et al. (2013). "Evidence for a Protective Effect of Noise Exposure on Presbycusis in Mice." Neurobiology of Aging
- Merzenich, M. M., et al. (1996). "Cortical Plasticity and Processing in Hearing Impaired Cats and Humans"
- Mahncke, H. W., et al. (2006). "Brain plasticity and functional losses in the elderly." Nature Reviews Neuroscience
- Vygotsky, L. (1978). "Mind in Society: The Development of Higher Psychological Processes"
