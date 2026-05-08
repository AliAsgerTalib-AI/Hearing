# Personalized Neuro-Regimen: AI-Powered Auditory Training Planning

## Overview

The **Personalized Neuro-Regimen** system generates customized auditory training plans based on each user's individual hearing assessment results. It combines:

1. **Local Hearing Profile Analysis** — Clinical characterization of hearing loss type and severity
2. **Intelligent Exercise Recommendation Engine** — Evidence-based exercise prioritization
3. **Optional AI Enhancement** — Google Gemini API for personalized clinical insights (if API key available)

The system ensures every user gets a training plan tailored to their specific hearing profile, maximizing training effectiveness and real-world benefit.

---

## System Architecture

```
User Hearing Test Results (Audiogram)
           ↓
    ┌──────────────────┐
    │  HearingProfile  │
    │    Analyzer      │
    └──────────────────┘
           ↓
    (Classify loss type, severity, asymmetry)
           ↓
    ┌──────────────────────────┐
    │ ExerciseRecommendation   │
    │      Engine              │
    └──────────────────────────┘
           ↓
    (Recommend exercises with priorities)
           ↓
    ┌─────────────────────────────────┐
    │ Optional AI Enhancement         │
    │ (Gemini API if available)       │
    └─────────────────────────────────┘
           ↓
    PersonalizedNeuroRegimen Generated
           ↓
    Display in UI with insights & warnings
```

---

## Component 1: Hearing Profile Analyzer

### Purpose
Analyzes audiometric test results to characterize the user's hearing loss and identify clinically relevant patterns.

### Key Analyses Performed

#### A. Loss Pattern Classification
Identifies the shape of the audiogram:

```
HIGH-FREQUENCY LOSS (Most Common - Presbycusis)
├─ High frequencies worse than low/mid
├─ Typical of age-related hearing loss
├─ Affects consonant perception (p, t, k, s)
└─ Most common pattern in users 40+

SLOPING LOSS
├─ Gradual decline across frequencies
├─ Indicates progressive presbycusis
├─ Worsens from low → high frequencies
└─ Suggests ongoing degeneration

FLAT LOSS
├─ Equal loss across all frequencies
├─ Suggests noise-induced or genetic cause
├─ May indicate conductive component
└─ Affects speech uniformly across range

LOW-FREQUENCY LOSS
├─ Low frequencies worse than high
├─ May indicate conductive hearing loss
├─ Could suggest Ménière's disease or inner ear issue
└─ May affect balance; needs medical evaluation

REVERSE-SLOPE LOSS
├─ High frequencies better than low
├─ Suggests conductive or mixed loss
├─ Unusual pattern; warrants medical investigation
└─ May have fixation or ossicular involvement

NOTCH PATTERN
├─ Dip at specific frequency(ies)
├─ Often indicates noise-induced loss at 4kHz or 6kHz
├─ May suggest medication ototoxicity
└─ Focus on protecting remaining hearing
```

#### B. Severity Classification

```
NORMAL:      0-20 dB     (No significant loss)
MILD:        20-40 dB    (Slight difficulty in noise)
MODERATE:    40-60 dB    (Speech clarity issues)
SEVERE:      60-80 dB    (Major communication difficulty)
PROFOUND:    80+ dB      (Near-total hearing loss)
```

#### C. Frequency Band Analysis

Three frequency bands analyzed separately:

```
LOW FREQUENCIES (125-500 Hz)
├─ Vowel fundamentals
├─ Environmental sounds & speech prosody
├─ Preserved in most age-related hearing loss
└─ If lost: suggests conductive or specific inner ear pathology

MID FREQUENCIES (1000-2000 Hz)
├─ Critical for speech intelligibility
├─ Vowel formants (F1) center here
├─ First to be affected in some types of loss
└─ Strong predictor of speech understanding ability

HIGH FREQUENCIES (4000-16000 Hz)
├─ Consonants (s, sh, t, ch, k, g)
├─ First affected by age-related presbycusis
├─ Most affected by noise exposure
└─ Loss here = significant word recognition difficulty
```

#### D. Ear Asymmetry Analysis

```
No Asymmetry (≤5dB difference)
├─ Both ears affected equally
├─ Typical of presbycusis (age-related)
└─ Standard symmetrical training recommended

Mild Asymmetry (5-15dB difference)
├─ One ear slightly worse than other
├─ Focus additional attention on worse ear
└─ May indicate unilateral noise exposure

Significant Asymmetry (>15dB difference)
├─ One ear substantially worse
├─ Warrants medical investigation
├─ May indicate retrocochlear pathology
└─ Consider focused training on worse ear
```

#### E. Risk Factor Assessment

```
Word Recognition Risk
├─ Presence: Indicates high-frequency loss + mid-frequency loss
├─ Impact: Consonant confusion, poor speech clarity
└─ Implication: Consonant Contrast exercise CRITICAL

Tinnitus Predisposition
├─ Indicator: High-frequency loss (>50dB @ 8kHz+)
├─ Mechanism: Abnormal neural activity in deafened regions
└─ Implication: High Frequency Pulse may help tolerance

Balance Predisposition
├─ Indicator: Low-frequency loss (>45dB @ 125-500Hz)
├─ Mechanism: Vestibular system shares inner ear
└─ Implication: Recommend vestibular evaluation

Cognitive Load Risk
├─ Indicator: Mid-frequency loss (>40dB @ 1000-2000Hz)
├─ Mechanism: Requires increased listening effort
└─ Implication: Shorter training sessions, more breaks needed
```

#### F. Age-Adjusted Presbycusis Model

Estimates expected hearing loss for user's age and sex:

```
Presbycusis Formula:
Expected Loss (dB) = (Age - 20) × Decline Rate × Sex Adjustment

Decline Rates by Frequency:
├─ Low freq (125Hz):    ~0.5 dB/year
├─ Mid freq (1000Hz):   ~0.8 dB/year
├─ High freq (8000Hz):  ~1.2 dB/year
└─ Sex Adjustment:      Males 1.2x (faster decline), Females 1.0x

Example:
├─ 60-year-old male
├─ Expected @ 8kHz = (60-20) × 1.2 × 1.2 = 57.6dB
├─ Actual measured = 50dB
├─ Interpretation: Better than age-expected (early presbycusis or protected)
```

### Output Structure

```typescript
interface HearingProfile {
  pattern: FrequencyLossPattern        // High-freq, sloping, flat, etc.
  asymmetry: EarAsymmetry             // Ear-to-ear comparison
  lowFreqThreshold: number             // Average 125-500Hz
  midFreqThreshold: number             // Average 1000-2000Hz
  highFreqThreshold: number            // Average 4000-16000Hz
  wordRecognitionRisk: boolean         // True if speech clarity threatened
  tinnitusPredisposition: boolean      // True if high-freq loss >50dB
  balancePredisposition: boolean       // True if low-freq loss >45dB
  cognitiveLoadRisk: boolean           // True if mid-freq loss >40dB
  isProgressivePattern: boolean        // True if sloping/high-freq type
  complianceWithAgeExpectation: boolean // True if matches age norms
  audiogramShape: string               // Clinical description
  estimatedCommunicationDifficulty: string // minimal/mild/moderate/significant/severe
  recommendedAidingStrategy: string    // Clinical strategy suggestions
}
```

---

## Component 2: Exercise Recommendation Engine

### Purpose
Uses hearing profile to intelligently recommend which exercises are most beneficial and in what order.

### Recommendation Logic

#### Exercise 1: Vowel Discrimination
**Always Recommended** — Foundational for all users

```
Rationale:
├─ Vowels form syllabic nucleus of speech
├─ Relatively preserved in hearing loss
├─ Lowest cognitive load
├─ Foundation for other exercises
├─ Suitable for all severity levels

Priority Assignment:
├─ All users: HIGH priority
├─ Frequency: Daily recommended
├─ Duration: 5 minutes

Expected Benefits:
├─ Improved vowel recognition
├─ Foundational speech clarity
├─ Activation of tonotopic auditory cortex
└─ Baseline for progression to consonants
```

#### Exercise 2: Consonant Contrast
**Conditional Priority** — Depends on hearing profile

```
CRITICAL PRIORITY when:
├─ High-frequency loss present
├─ Word recognition at risk
├─ Moderate-severe hearing loss
├─ Pattern: Sloping or high-frequency

Rationale:
├─ Consonants carry 60% of speech information
├─ High-frequency loss directly threatens consonant perception
├─ "s", "sh", "t", "ch", "p" disproportionately affected
├─ Real-world speech clarity depends on consonant discrimination

HIGH PRIORITY when:
├─ Mild hearing loss
├─ Moderate cognitive load risk
└─ Consonants slightly affected

MEDIUM PRIORITY when:
├─ Flat or low-frequency loss pattern
├─ Normal communication currently
├─ Consonants relatively preserved

Frequency Assignment:
├─ Critical: 6-7 days/week (daily)
├─ High: 4-5 days/week
├─ Medium: 3-4 days/week

Duration: 8 minutes
```

#### Exercise 3: High Frequency Pulse
**Variable Priority** — Depends on frequency-specific loss

```
CRITICAL PRIORITY when:
├─ High-frequency loss >50dB @ 8kHz+
├─ Presbycusis detected (progressive pattern)
├─ Tinnitus likely present
├─ Age 55+ with high-frequency loss

Rationale:
├─ Direct auditory nerve stimulation at 8-16kHz
├─ Activates tonotopic high-frequency regions
├─ May improve tinnitus tolerance
├─ Combats presbycusis progression
├─ Neuroplastic benefits in "deafened" regions

HIGH PRIORITY when:
├─ High-frequency loss >30dB @ 4kHz+
├─ Moderate presbycusis pattern
├─ Age-related decline evident
├─ Seeks to preserve remaining hearing

LOW PRIORITY when:
├─ Flat loss pattern
├─ Low-frequency focus
├─ Normal/mild high-frequency thresholds
├─ Used for preventive maintenance only

Frequency Assignment:
├─ Critical: 6-7 days/week (daily)
├─ High: 4-5 days/week
├─ Low: 2-3 days/week

Duration: 3 minutes
```

### Priority Output

```typescript
interface ExerciseRecommendation {
  exerciseId: number                   // 1, 2, or 3
  name: string                         // Exercise name
  priority: 'critical' | 'high' | 'medium' | 'low'
  rationale: string                    // Why this exercise
  suggestedDuration: number            // Minutes per session
  frequency: string                    // Daily, 4x/week, etc.
  expectedOutcome: string              // What user should expect
  focusArea: string                    // Speech Clarity, etc.
}
```

### Regimen Generation

From recommendations, generates overall regimen:

```typescript
interface PersonalizedRegimen {
  dailyFocus: string                   // Main training target (e.g., "Speech Clarity & Noise Robustness")
  recommendations: ExerciseRecommendation[]  // Ranked exercises
  trainingDurationWeeks: number        // 4-12 weeks recommended
  keyInsights: string[]                // Clinical findings
  warnings: string[]                   // Medical cautions
  expectedImprovement: string          // Prognosis
}
```

### Training Duration Estimation

```
Base Duration: 4 weeks

Severity Multiplier:
├─ Normal:     0.5x  (2 weeks)
├─ Mild:       1.0x  (4 weeks)
├─ Moderate:   1.5x  (6 weeks)
├─ Severe:     2.0x  (8 weeks)
└─ Profound:   2.5x  (10 weeks)

Progressive Pattern Bonus: 1.2x
(If sloping or high-frequency loss)

Final: Clamped to 4-12 weeks
```

---

## Component 3: AI Enhancement (Optional)

### Purpose
If Google Gemini API key is available, enhances local recommendations with AI-generated clinical insights.

### How It Works

1. **Local Analysis First** — Hearing profile analyzer runs locally
2. **Optional AI Enhancement** — If API available:
   - Sends hearing profile to Gemini
   - Asks for personalized clinical insights
   - Receives enhanced rationale for recommendations
   - Merges with local regimen
3. **Graceful Fallback** — If API unavailable or fails:
   - Uses local recommendations only
   - No loss of functionality
   - Same quality output guaranteed

### AI Prompt Structure

```
System Instruction:
"You are a world-class Audiologist and Neuroscientist specializing 
in Auditory Training and Neuroplasticity."

User Prompt Includes:
├─ Patient demographics (age, sex)
├─ Hearing test results
├─ Computer-generated hearing profile
├─ Local exercise recommendations
├─ Key clinical findings
└─ Request for validation/enhancement

Expected Output:
├─ Validated exercise priorities
├─ Science-backed rationale
├─ Neuroplasticity mechanisms
├─ Personalized insights
└─ JSON response matching local schema
```

### Fallback Logic

```typescript
// Try AI enhancement
if (apiKey available) {
  try {
    enhanced = await generateAIEnhancedPlan(...)
    return enhanced
  } catch (error) {
    console.warn("AI failed, using local", error)
    // Fall through to local
  }
}

// Use local recommendations
return convertLocalToAuditoryPlan(localRegimen, profile)
```

---

## Clinical Insights Generated

### Automatically Generated Insights

The system generates context-specific insights:

```
SEVERITY-BASED INSIGHTS
├─ "Normal hearing detected. Training recommended for prevention."
├─ "Mild loss. Early intervention can slow progression."
├─ "Moderate loss. Aids + training for optimal outcomes."
└─ "Severe loss. Combination therapy essential."

PATTERN-SPECIFIC INSIGHTS
├─ "High-frequency loss typical of age-related presbycusis."
├─ "Consonants disproportionately affected in your loss pattern."
├─ "Sloping audiogram indicates ongoing progression."
└─ "Asymmetrical hearing—focused training on worse ear recommended."

RISK-SPECIFIC INSIGHTS
├─ "Your loss pattern affects speech clarity in noise—critical focus area."
├─ "May be associated with tinnitus. High-frequency training may help."
├─ "Low-frequency loss may affect balance—consult doctor if dizzy."
└─ "Listening effort will be high—take breaks during training."

PROGRESSION INSIGHTS
├─ "Early presbycusis detected—consistent training helps maintenance."
├─ "Progressive pattern—long-term training (8+ weeks) recommended."
└─ "Stable pattern—4-week training regimen appropriate."
```

### Clinical Warnings

Warnings are generated when clinical red flags detected:

```
SEVERITY WARNINGS
├─ "Severe loss—ensure hearing aid fitting before training."
├─ "Profound loss—medical evaluation strongly recommended."

ASYMMETRY WARNINGS
├─ "Significant asymmetry may indicate underlying pathology."
├─ "Consult ENT if asymmetry >15dB at critical frequencies."

PATTERN WARNINGS
├─ "Reverse-slope pattern unusual—medical evaluation recommended."
├─ "Notched audiogram suggests noise-induced or medication-related loss."

SYSTEM-SPECIFIC WARNINGS
├─ "Low-frequency loss may affect balance—evaluation recommended."
├─ "Vestibular involvement possible—discuss with physician."
```

---

## User Experience Flow

### Step 1: Complete Hearing Assessment
User takes hearing test (HearingTest.tsx component)
- Results collected: frequency, dB, side (left/right/both)
- Demographics collected: age, sex
- Results stored in state

### Step 2: View Training Hub
User navigates to Train tab → Daily Exercises
- Sees exercise cards (Vowel, Consonant, High Freq, Stereo)
- Sees "Auditory Synapse AI" box
- Box shows "Analyze your last clinical assessment..."

### Step 3: Generate AI Regimen
User taps "Generate AI Regimen" button
- System shows loading state: "Processing Neural Patterns..."
- Backend:
  1. Analyzes hearing profile
  2. Generates recommendations
  3. Optionally enhances with AI
  4. Returns structured plan
- UI shows summary in expandable card

### Step 4: View Regimen
User sees personalized regimen with:
- Daily focus statement
- Recommended exercises in priority order
- Exercise rationales
- Expected outcomes
- Training duration
- Key clinical insights
- Warnings/cautions

### Step 5: Start Exercises
From regimen display, user can:
- Click "Start Exercise" to launch session
- View detailed explanations
- Understand the neuroplastic basis
- Begin training

---

## Example Regimen: 65-Year-Old with High-Frequency Loss

### Input Data
```
Age: 65, Male
Results: 
├─ 125Hz: 15dB, 250Hz: 18dB, 500Hz: 20dB (Low)
├─ 1000Hz: 30dB, 2000Hz: 35dB (Mid)
└─ 4000Hz: 55dB, 8000Hz: 65dB, 12000Hz: 70dB (High)
```

### Analysis Output
```
HearingProfile:
├─ Pattern: HIGH-FREQUENCY (Severe)
├─ Low Freq: 18dB (Normal)
├─ Mid Freq: 32dB (Mild)
├─ High Freq: 63dB (Severe)
├─ Asymmetry: No (Bilateral equal)
├─ wordRecognitionRisk: YES (HIGH freq loss + consonants affected)
├─ tinnitusPredisposition: YES (8kHz > 50dB)
├─ ageCompliance: YES (matches male presbycusis)
└─ communicationDifficulty: SIGNIFICANT
```

### Recommendations Generated
```
1. Vowel Discrimination
   ├─ Priority: HIGH
   ├─ Frequency: Daily
   ├─ Rationale: Foundational for all users
   └─ Expected: Improved vowel recognition

2. CONSONANT CONTRAST
   ├─ Priority: CRITICAL ⚠️
   ├─ Frequency: Daily (6-7x/week)
   ├─ Rationale: High-frequency loss severely affects consonants
   └─ Expected: 15-25% improvement in speech clarity

3. HIGH FREQUENCY PULSE
   ├─ Priority: CRITICAL ⚠️
   ├─ Frequency: Daily (6-7x/week)
   ├─ Rationale: Direct high-frequency stimulation essential
   └─ Expected: Improved consonant perception, tinnitus tolerance

Regimen:
├─ Daily Commitment: 16 minutes (5 + 8 + 3)
├─ Duration: 8 weeks recommended
└─ Expected Improvement: 15-25% speech clarity, maintain high freq
```

### Key Insights Generated
```
1. "Severe high-frequency sensorineural loss detected. 
    Consonants (s, sh, t, k, p) disproportionately affected."

2. "Age-typical presbycusis pattern. Consistent training essential 
    to slow progression and maintain speech understanding."

3. "Communication difficulty likely significant, especially in noise. 
    Speech-in-noise training (Consonant Contrast) is CRITICAL."

4. "High-frequency loss >50dB @ 8kHz may correlate with tinnitus. 
    High-frequency pulse training may improve tolerance."

5. "Bilateral and symmetrical—standard bilateral training appropriate."
```

### Warnings
```
⚠️  "Severe hearing loss. If hearing aids not already fitted, 
     consider comprehensive evaluation with hearing healthcare provider."

⚠️  "Hearing aids may be essential to achieve meaningful benefit 
     from auditory training."

💡  "Listening effort will be high during training—take breaks 
     as needed. Regular sleep essential for neuroplastic consolidation."
```

---

## Integration with Other Systems

### Connection to Exercise Modules

Recommendations link to three available exercises:

```
Vowel Discrimination (Exercise 1)
├─ Targets: F1, F2 formant discrimination
├─ Activates: A1 tonotopic cortex (low-mid frequencies)
└─ Regimen Role: Foundational

Consonant Contrast (Exercise 2)
├─ Targets: Consonant acoustic features
├─ Activates: aSTG (speech processing)
└─ Regimen Role: Critical for high-frequency loss

High Frequency Pulse (Exercise 3)
├─ Targets: High-frequency auditory nerve
├─ Activates: A1 tonotopic (high-frequency regions)
└─ Regimen Role: Remedial for presbycusis
```

### Data Flow

```
HearingTest Results
        ↓
AuditoryTraining Component
        ↓
generateAuditoryPlan(results, demographics)
        ↓
HearingProfileAnalyzer.analyzeProfile()
        ↓
ExerciseRecommendationEngine.generateRegimen()
        ↓
Optional: generateAIEnhancedPlan()
        ↓
AuditoryPlan returned
        ↓
PersonalizedNeuroRegimenDisplay renders
        ↓
User can click "Start Exercise" to launch sessions
```

---

## Performance Metrics & Analytics

### What Gets Tracked

For each regimen generation:
```
├─ Timestamp
├─ User demographics (age, sex)
├─ Hearing profile characteristics
├─ Recommended exercises & priorities
├─ AI enhancement used? (yes/no)
├─ User acceptance (clicked start exercise?)
└─ Session data per exercise
```

### Analytics Possible

```
Aggregate Level:
├─ Most common hearing loss patterns
├─ Most recommended exercise combinations
├─ Training duration by age group
└─ Expected improvement tracking

Individual Level:
├─ Progress through regimen
├─ Adherence to recommendations
├─ Improvements in accuracy scores
└─ Retention of trained skills
```

---

## Future Enhancements

### Phase 2
- [ ] Historical regimen tracking
- [ ] Progress graphs over weeks
- [ ] Real-time regimen adjustment based on performance
- [ ] Comparative audiograms (baseline vs. current)
- [ ] Detailed probability of improvement estimates

### Phase 3
- [ ] Outcome prediction models (ML-based)
- [ ] Genetic/demographic-based optimization
- [ ] Multimodal input (questionnaires, lifestyle data)
- [ ] Integration with real-world communication tracking
- [ ] Hearing aid adaptation recommendations

---

## References & Clinical Basis

### Presbycusis Models
- Schuknecht, H. F. (1974). "Pathology of the Ear"
- Cruickshanks, K. J., et al. (1998). "Prevalence of hearing loss...in middle age"

### Auditory Training Efficacy
- Henshaw, H., & Ferguson, M. A. (2013). "Efficacy of individual computer-based auditory training"
- Sweetow, R., & Palmer, C. V. (2005). "Efficacy of individual auditory training in adults"

### Neuroplasticity
- Merzenich, M. M. (1998). "Cortical plasticity contributing to child development"
- Ahissar, M., & Hochstein, S. (2004). "The reverse hierarchy theory of visual perceptual learning"

### Speech Perception
- Johnson, K. (2003). "Acoustic and Auditory Phonetics" (2nd ed.)
- Strange, W. (1995). "Speech Perception and Linguistic Experience"

---

## Summary

The **Personalized Neuro-Regimen** system delivers **clinical-grade auditory training plans** customized to each user's hearing profile. By combining:

✅ **Evidence-based hearing analysis**
✅ **Intelligent exercise prioritization**
✅ **Optional AI enhancement**
✅ **Clinical insights & warnings**

...it ensures every user gets a training approach most likely to improve their hearing and communication.

**Result:** Personalized, scientifically-grounded, neuroplasticity-based auditory training tailored to real-world hearing challenges.
