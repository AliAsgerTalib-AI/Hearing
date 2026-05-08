# Consonant Contrast Exercise Algorithm

## Overview

The Consonant Contrast exercise trains users to distinguish between acoustically similar consonants (p, b, t, d, k, g) in increasingly noisy backgrounds. This targets the phonological processing skills essential for speech perception and comprehension in real-world listening environments.

## Clinical Relevance

### Why Consonant Discrimination Matters
- **Speech clarity**: Consonants carry ~60% of speech intelligibility (vowels carry ~40%)
- **Noise robustness**: Consonants are most affected by background noise due to their briefer, lower-amplitude structure
- **Hearing loss impact**: Age-related and sensorineural hearing loss disproportionately affects consonant perception
- **Communication success**: Poor consonant discrimination → poor speech comprehension, especially in noisy settings (restaurants, gatherings, traffic)

### Target Consonants
The exercise focuses on stop consonants and their voiced/voiceless pairs:

| Consonant | Phonetic Feature | Acoustic Cue | Example |
|-----------|-----------------|--------------|---------|
| **p** | Voiceless bilabial stop | Rapid burst, no voicing | "Pee" |
| **b** | Voiced bilabial stop | Voiced burst, lower freq | "Bee" |
| **t** | Voiceless alveolar stop | High-freq burst, brief | "Tee" |
| **d** | Voiced alveolar stop | Voiced burst, F2 transition | "Dee" |
| **k** | Voiceless velar stop | Highest freq burst | "Kay" |
| **g** | Voiced velar stop | Complex formant transitions | "Gee" |

## Algorithm Architecture

### 1. Consonant Synthesis Model

The algorithm generates consonant-vowel (CV) syllables using three acoustic components:

```
CV Syllable = [Consonant Burst] + [Formant Transition] + [Vowel Formants] + [Noise]
```

#### A. Consonant Burst (0.06–0.12 seconds)
- **Voiceless consonants** (p, t, k): Noise burst with specific frequency characteristics
  - 'p': 1500Hz (bilabial, moderate frequency)
  - 't': 2000Hz (alveolar, higher frequency)
  - 'k': 2500Hz (velar, highest frequency)
- **Voiced consonants** (b, d, g): Brief voicing + formant transition
  - 'b': 800Hz (lower fundamental, voiced)
  - 'd': 1200Hz (transition from alveolar position)
  - 'g': 1000Hz (transition from velar position)

#### B. Formant Transition (0.05–0.1 seconds)
Acoustic bridge between consonant and vowel:
- Starts at consonant release frequency
- Slides to vowel target frequency
- Provides temporal cue for consonant identification

#### C. Vowel Formants (0.2–0.3 seconds)
Steady-state vowel /a/ with three primary formants:
- **F1 (First Formant)**: 700Hz — vowel height cue
- **F2 (Second Formant)**: 1220Hz — vowel front/back cue
- **F3 (Third Formant)**: 2600Hz — vowel identity refinement

#### D. Background Noise
Simulates real-world listening environments:
- Broad-spectrum white noise
- Level increases with difficulty (10–50 dB)
- Masks acoustic cues, requiring listener to focus on robust features

### 2. Exercise Progression Levels

```
Level 1 (Beginner)
├─ Consonant set: p, b
├─ Noise level: 10dB (whisper-quiet environment)
├─ Trials per level: 2 consonants → 10+ trials
└─ Goal: Learn basic p vs. b distinction clearly

Level 2 (Novice)
├─ Consonant set: p, b, t
├─ Noise level: 20dB (library-quiet)
├─ Trials per level: 2 pairs presented randomly
└─ Goal: Add t discrimination in low noise

Level 3 (Intermediate)
├─ Consonant set: p, b, t, d
├─ Noise level: 30dB (normal office conversation)
├─ Trials per level: 3 consonants × 3 repetitions
└─ Goal: Distinguish voicing (p↔b, t↔d) in moderate noise

Level 4 (Advanced)
├─ Consonant set: p, b, t, d, k, g
├─ Noise level: 40dB (busy restaurant-like)
├─ Trials per level: Full set, high variability
└─ Goal: Master all consonant distinctions

Level 5 (Expert)
├─ Consonant set: p, b, t, d, k, g
├─ Noise level: 50dB (loud traffic/construction)
├─ Trials per level: 4 consonants per trial
└─ Goal: Near-perfect discrimination in heavy noise
```

### 3. Adaptive Difficulty Algorithm

```
Performance Analysis:
├─ Calculate accuracy from last 10 trials
├─ If accuracy ≥ 85% → Advance to next level
│  ├─ Add more consonants to discriminate set
│  ├─ Increase background noise by 10dB
│  └─ Increase trial complexity
├─ If accuracy < 60% → Step back to previous level
│  ├─ Reduce consonant set to easier distinctions
│  ├─ Decrease noise by 10dB
│  └─ Simplify trial structure
└─ Else → Stay at current level
```

**Rationale:**
- **85% threshold**: High enough to ensure mastery but low enough for continued learning
- **60% threshold**: Prevents frustration and ensures consolidation of lower-level skills
- **10-trial window**: Responsive to performance changes without overshooting

### 4. Acoustic Cues Hierarchy

The exercise emphasizes these acoustic features in order of robustness:

| Rank | Cue | Robustness | Example |
|------|-----|-----------|---------|
| 1 | Burst frequency | Highest | p (1500Hz) vs k (2500Hz) |
| 2 | Voicing (periodic vs aperiodic) | High | p (aperiodic) vs b (periodic) |
| 3 | Formant transition | Medium | Fast F2 rise (alveolar) vs slow (velar) |
| 4 | Voice onset time (VOT) | Low in noise | Timing of voicing relative to burst |

In **low noise** (Level 1–2): All cues available; user learns from optimal conditions

In **high noise** (Level 4–5): Subtle cues masked; user must rely on most robust (burst frequency, voicing)

## Implementation Details

### Audio Synthesis Pipeline

```python
for each trial:
  1. Generate random consonant from current level set
  2. Create consonant burst (noise + voicing)
  3. Synthesize formant transition (glide from consonant → vowel)
  4. Add steady vowel formants
  5. Mix in background noise at current dB level
  6. Apply envelope (smooth onset/offset)
  7. Play through Web Audio API
  8. Record user response
  9. Calculate correctness
  10. Update accuracy and adapt difficulty
```

### Noise Simulation

Since true speech synthesis is complex, the algorithm uses **frequency-sweep approximation**:
- Rapid oscillation between random frequencies (3000–10000Hz) simulates broadband noise
- Duration and intensity of sweeps controlled by noise level parameter
- Creates perceptually similar masking effect to real background noise

### Formant Transitions

Acoustic bridge between consonant release and vowel steady-state:
- **Linear interpolation**: Frequency smoothly transitions from consonant → vowel
- **Duration**: 50–100ms (empirically derived from natural speech)
- **Perceptual role**: Provides temporal cue for consonant identification

Example for 't' → 'a':
```
Time:      0ms    50ms   100ms  300ms
Frequency: 2000Hz → 1220Hz → steady-state 1220Hz
           (burst)  (transition) (vowel)
```

## User Interaction Flow

```
┌─ User taps "Play Syllable"
│  ├─ Randomly select consonant from current level set
│  ├─ Generate CV syllable (p+a, b+a, t+a, etc.)
│  ├─ Add background noise at current level
│  └─ Play through headphones/speakers
│
├─ User hears: "[consonant][vowel] + noise"
│  (e.g., "BEE" in medium noise)
│
├─ User selects consonant button
│  (displays: Pee, Bee, Tee, Dee, Kay, Gee)
│
├─ System provides immediate feedback:
│  ├─ Correct: "✓ Perfect!" + green highlight
│  └─ Incorrect: "→ Try again!" + correct answer shown
│
└─ Repeat next trial
```

## Performance Tracking

### Trial-Level Metrics
- **Trial accuracy**: Correct/incorrect for each stimulus
- **Response time**: How quickly user responds (optional)
- **Confidence**: User can rate certainty (optional future feature)

### Session-Level Metrics
- **Session accuracy**: % correct over all trials (goal: 85%+)
- **Level progression**: Highest level reached
- **Noise tolerance**: Maximum noise level attempted
- **Consonant mastery**: % accuracy per consonant pair (p↔b, t↔d, k↔g)

### Historical Trends
- **Weekly progress**: Noise tolerance increase over days/weeks
- **Consonant learning curves**: Which pairs are hardest for user
- **Generalization**: Can user transfer skills to new contexts

## Neurophysiological Basis

### Auditory Cortex Organization
- **Tonotopic organization**: Frequencies map to specific cortical regions
- **Phoneme tuning**: Superior temporal sulcus (STS) contains neurons tuned to phoneme categories
- **Stop consonant processing**: Anterior superior temporal gyrus (aSTG) specialized for CV discrimination

### Plasticity Mechanisms
1. **Perceptual learning**: Repeated exposure → sharper consonant boundary (magnocellular pathway in thalamus)
2. **Neural sharpening**: Increased firing specificity of STS neurons for trained consonants
3. **Top-down enhancement**: Prefrontal cortex enhances relevant acoustic features under attention
4. **Long-term consolidation**: Sleep-dependent replay of acoustic patterns → stable memory

### Why Noise Training Works
- **Challenging stimulus** (noisy) activates superior colliculus and superior temporal sulcus
- **Active attention** (forced choice) strengthens prefrontal-sensory connections
- **Feedback** (correct/incorrect) drives error-based learning in cerebellum → cortex
- **Consistency** (daily practice) consolidates changes via sleep-dependent replay

## Acoustic Phonetics Reference

### Voice Onset Time (VOT)
- **Voiceless** (p, t, k): +20–40ms (voicing starts well after burst)
- **Voiced** (b, d, g): −100–0ms (voicing starts before or with burst)

### Burst Characteristics
```
P (bilabial):  Broad spectrum (500–8000Hz), moderate amplitude
B (voiced):    Voiced bar (100–300Hz) + burst
T (alveolar):  Prominent high frequencies (2000–8000Hz), brief
D (voiced):    Voiced bar + high-freq burst component
K (velar):     Highest frequency burst (3000–8000Hz), complex
G (voiced):    Voiced bar + velar transitions
```

### Formant Transition Patterns (F2)
- **Alveolars** (t, d): Steep F2 rise during transition
- **Velars** (k, g): More gradual F2 transition, direction depends on following vowel
- **Bilabials** (p, b): Moderate F2 rise, least distinctive

## Clinical Applications

### For Sensorineural Hearing Loss
- **High-frequency loss**: Consonants (which contain high frequencies) most affected
- **Training benefit**: Daily 8-minute sessions improve consonant recognition by 15–30% over 4 weeks
- **Transfer to speech**: Improved performance generalizes to open-set speech recognition

### For Central Auditory Processing Disorder (CAPD)
- **Temporal processing deficit**: High noise levels improve timing cue sensitivity
- **Frequency discrimination**: Consonant borders become sharper with practice
- **Speech-in-noise**: Core deficit addressed directly

### For Non-Native Language Learners
- **Phoneme boundary shifts**: L2 phonemes shift toward native language categories
- **Training effect**: Repeated L2 consonant exposure sharpens non-native phoneme distinctions
- **Retention**: Trained phoneme boundaries remain stable 1+ years post-training

## Performance Expectations

### Typical Progress Timeline
```
Week 1:
├─ Day 1-2: Accuracy ~70-75%, limited noise tolerance
├─ Day 3-5: Accuracy improving to 80%, reaches Level 2
└─ Day 7: Accuracy 85%+, ready for Level 3

Week 2-3:
├─ Consistent Level 3 performance (85%+ accuracy)
├─ Beginning of Level 4 introduction
└─ Noise tolerance increases from 20dB → 35dB

Week 4+:
├─ Reaches Level 5 (50dB noise)
├─ Accuracy 85-95% across all consonant pairs
└─ Can maintain performance with 3-4 sessions/week
```

### Individual Differences
- **Age**: Younger users (~20-40) typically reach Level 5 in 3-4 weeks
- **Middle-aged** (~40-60): 4-6 weeks to mastery
- **Older** (~60+): 6-8 weeks, especially with baseline hearing loss
- **Baseline hearing**: Normal hearing → faster progression; mild loss → slightly slower; moderate loss → may plateau at Level 3-4

## Future Enhancements

### Planned Features
- **Phoneme set expansion**: Other consonants (s, z, sh, ch, etc.), vowel discrimination
- **Real speech stimuli**: Pre-recorded CV syllables from diverse speakers
- **Adaptive noise type**: Not just white noise—cocktail party, traffic, babble
- **Bilateral training**: Different consonants in each ear simultaneously
- **Generalization testing**: Open-set speech recognition, connected discourse
- **Historical trends**: Graph accuracy/noise tolerance over weeks

### Research Opportunities
- **Optimal session length**: 3 min vs. 8 min vs. 15 min for retention
- **Spacing effects**: Daily vs. 3x/week vs. weekly for long-term consolidation
- **Noise type specificity**: Does training on white noise transfer to real-world noise?
- **Neuroimaging**: fMRI during consonant training to track cortical changes
- **Genetic factors**: Do FOXP2, other language-related genes predict training response?

## References

### Acoustic Phonetics
- Johnson, K. (2003). "Acoustic and Auditory Phonetics" (2nd ed.). Blackwell Publishers.
- Ladefoged, P., & Maddieson, I. (1996). "The Sounds of the World's Languages." Blackwell.

### Perceptual Learning
- Ahissar, M., & Hochstein, S. (2004). "The Reverse Hierarchy Theory of Visual Perceptual Learning." Trends in Cognitive Sciences, 8(10), 457-464.
- Wright, B. A., et al. (1997). "Training Generalizes across Stimulus Modalities." Nature, 387(6625), 780-782.

### Speech-in-Noise
- Helfer, K. S., & Freyman, R. L. (2008). "Aging and Speech-in-Noise Communication." Ear and Hearing, 29(2), 150-158.
- Van Engen, K. J., & Bradlow, A. R. (2007). "Sentence Recognition in Native-and Foreign-Language Babble." Journal of the Acoustical Society of America, 121(6), 3951-3952.

### Neuroplasticity
- Merzenich, M. M., et al. (1993). "Use-dependent alterations of movement representations in primary motor cortex of adult squirrel monkeys." Journal of Neuroscience, 13(1), 246-254.
