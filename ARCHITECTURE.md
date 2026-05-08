# Hearing Test Component Architecture

## Component Hierarchy

### Before Refactoring
```
HearingTest (590 lines, 10 useState, complex logic)
├── [Inline] intro step UI
├── [Inline] safety step UI
├── [Inline] demographics step UI
├── [Inline] noise step UI
├── [Inline] calibration step UI
├── [Inline] side-prep step UI
├── [Inline] TESTING STEP (150 lines)
│   ├── [Inline] Progress display
│   ├── [Inline] Frequency display + pulsing animation
│   ├── [Inline] Test history visualization
│   ├── [Inline] Play/Hear/Can't Hear buttons
│   └── [Inline] Staircase algorithm (180 lines)
│       ├── Complex state tracking
│       ├── Response handling
│       └── Threshold confirmation
└── [Inline] results step UI (150 lines)
    ├── Audiogram chart
    ├── Threshold averages
    ├── Clinical interpretation
    └── Contraindication report
```

### After Refactoring
```
HearingTest (220 lines, 6 useState, orchestration only)
├── SafetyScreen
├── DemographicsScreen
├── NoiseCheck
├── DeviceCalibration
├── TestingPhase (95 lines)
│   ├── Progress display
│   ├── TonePulsing (50 lines)
│   │   ├── Frequency display
│   │   ├── Pulsing animation
│   │   ├── Play button
│   │   └── Response buttons
│   ├── Test history visualization
│   └── Early finish button
├── ResultsDisplay (125 lines)
│   ├── AudiogramChart
│   ├── Threshold averages
│   ├── Clinical interpretation
│   └── ContraindicationReport
└── useAdaptiveStaircase hook (90 lines)
    ├── Staircase state machine
    ├── Response handling logic
    └── Threshold confirmation algorithm
```

---

## Data Flow Diagram

### Testing Phase Flow

```
HearingTest (orchestrator)
    │
    ├─► TestingPhase (test UI controller)
    │   │
    │   ├─► TonePulsing (tone UI)
    │   │   └─► audioEngine.playPulsedTone()
    │   │
    │   └─► onResponse callback
    │       │
    │       └─► HearingTest.handleTestResponse()
    │           │
    │           └─► useAdaptiveStaircase.handleResponse()
    │               │
    │               ├─ calculateNextDb (internal)
    │               ├─ checkThreshold (internal)
    │               └─ updateState (internal)
    │
    └─ moveToNextFrequency()
        │
        ├─ predictStartingDb()
        ├─ saveSession()
        └─ setStep('results')
```

---

## State Management Patterns

### HearingTest Component State
```typescript
// Navigation state
const [step, setStep] = useState<Step>(...)

// User input (collected once)
const [demographics, setDemographics] = useState<Demographics | null>(...)
const [selectedDevice, setSelectedDevice] = useState<DeviceType | null>(...)

// Test progress
const [currentFreqIdx, setCurrentFreqIdx] = useState<number>(0)
const [currentSideIdx, setCurrentSideIdx] = useState<number>(0)

// Test results (accumulated)
const [results, setResults] = useState<TestResult[]>([])

// Staircase algorithm (delegated to hook)
const staircaseHook = useAdaptiveStaircase({
  maxDb: 80,
  minDb: 0,
  startDb: 25
})
```

### useAdaptiveStaircase Hook State
```typescript
interface StaircaseState {
  currentDb: number;              // Current volume level being tested
  lastResponse: boolean | null;   // Did user hear last tone? (null = no response yet)
  confirmedThreshold: number | null;  // Threshold found? (null = still seeking)
  history: { db: number; heard: boolean }[];  // Full response history
}
```

---

## Component Props Documentation

### TonePulsing Props
```typescript
interface TonePulsingProps {
  frequency: number;                    // Hz to display (e.g., 1000)
  currentDb: number;                    // Current volume level (0-80)
  maxDb: number;                        // Safety ceiling for "No Response"
  isTonePlaying: boolean;               // Disable buttons during playback
  onPlayTone: () => void;               // Play tone button handler
  onHeard: () => void;                  // "I Hear It" button handler
  onNotHeard: () => void;               // "Can't Hear It" button handler
  testHistory: { db: number; heard: boolean }[];  // Last 5 responses for visual
}
```

### TestingPhase Props
```typescript
interface TestingPhaseProps {
  frequencies: number[];                // Frequencies to test (125-16000 Hz)
  sides: ('left' | 'right' | 'both')[]; // Ears to test
  currentFreqIdx: number;               // Index in frequencies array
  currentSideIdx: number;               // Index in sides array
  currentDb: number;                    // Current volume from staircase hook
  testHistory: { db: number; heard: boolean }[];  // Response history
  maxDb: number;                        // Safety ceiling
  minDb: number;                        // Floor
  onResponse: (heard: boolean, ceiling?: boolean) => void;  // Handle user response
  onFinishEarly: () => void;            // Finish button handler
  onThresholdFound: (result: TestResult) => void;  // When threshold confirmed
}
```

### ResultsDisplay Props
```typescript
interface ResultsDisplayProps {
  results: TestResult[];                // All frequency/dB/side data
  demographics: Demographics | null;    // Age/sex for interpretation
  device: string | null;                // Device type used (for context)
  onReturnHome: () => void;             // Home button handler
}
```

---

## Event Flow Diagram

### User Clicks "I Hear It"

```
User clicks button
    │
    └─► TonePulsing.onHeard()
        │
        └─► TestingPhase.handleUserHeard()
            │
            └─► HearingTest.handleTestResponse(heard=true)
                │
                └─► useAdaptiveStaircase.handleResponse(true)
                    │
                    ├─ Check if confirmation criteria met
                    ├─ Update internal state
                    │
                    └─ Return: threshold OR null (continue seeking)
                        │
                        ├─ If threshold returned
                        │   └─► Save result + move to next frequency
                        │
                        └─ If null
                            └─► Update currentDb for next attempt
```

---

## Staircase Algorithm State Machine

```
                    ┌──────────────────┐
                    │   SEEKING START  │
                    └────────┬─────────┘
                             │
                    Play tone → Get response
                             │
                    ┌────────▼─────────┐
                    │ USER DESCENDING? │
                    │ (heard=true)     │
                    └────────┬─────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
                 ▼                       ▼
          ┌─────────────┐         ┌──────────────┐
          │ DROP 10 dB  │         │ RISE 5 dB    │
          └─────┬───────┘         └──────┬───────┘
                │                        │
                │ (heard=false)          │ (heard=true,
                │                        │  ceiling)
                └────────┬───────────────┘
                         │
          Confirmation logic:
          - Was ascending before?
          - Heard at this level twice?
                         │
                ┌────────▼────────┐
                │  CONFIRMED?     │
                └────────┬────────┘
                         │
            ┌───────────┴──────────┐
            │ YES              NO  │
            │                      │
            ▼                      ▼
    ┌─────────────────┐    ┌─────────────┐
    │ RETURN THRESHOLD│    │ CONTINUE... │
    └─────────────────┘    └─────────────┘
```

---

## Dependency Graph

```
src/
├── components/
│   ├── HearingTest.tsx
│   │   ├─ imports: ./TestingPhase
│   │   ├─ imports: ./ResultsDisplay
│   │   ├─ imports: ./SafetyScreen
│   │   ├─ imports: ./DemographicsScreen
│   │   ├─ imports: ./DeviceCalibration
│   │   ├─ imports: ./NoiseCheck
│   │   ├─ imports: ../hooks/useAdaptiveStaircase
│   │   └─ imports: ../lib/AudioEngine
│   │
│   ├── TestingPhase.tsx
│   │   ├─ imports: ./TonePulsing
│   │   ├─ imports: ./ui/progress
│   │   ├─ imports: ./ui/basic
│   │   └─ imports: ../lib/AudioEngine
│   │
│   ├── TonePulsing.tsx
│   │   ├─ imports: ./ui/basic
│   │   └─ imports: ../lib/AudioEngine
│   │
│   └── ResultsDisplay.tsx
│       ├─ imports: ./AudiogramChart
│       ├─ imports: ./ContraindicationReport
│       └─ imports: ./ui/basic
│
└── hooks/
    └── useAdaptiveStaircase.ts
        └─ Pure logic, no external dependencies
```

---

## Code Metrics Comparison

### Cyclomatic Complexity
- **HearingTest before:** 14 (high)
- **HearingTest after:** 7 (medium)
- **useAdaptiveStaircase:** 4 (low)

### Lines of Code
- **HearingTest before:** 590
- **HearingTest after:** 220 (63% reduction)
- **TonePulsing:** 50
- **TestingPhase:** 95
- **ResultsDisplay:** 125
- **useAdaptiveStaircase:** 90

### Function Depth
- **Before:** Max nesting level 5
- **After:** Max nesting level 2

---

## Testing Strategy

### Unit Test: useAdaptiveStaircase
```
✓ Initialize with startDb
✓ Descending phase (when user hears)
✓ Ascending phase (when user doesn't hear)
✓ Confirmation logic (2x at same level)
✓ Ceiling reached (80dB no response)
✓ Reset for new frequency
```

### Integration Test: TestingPhase
```
✓ Renders current frequency
✓ Shows progress bar
✓ Plays tone when button clicked
✓ Calls onResponse with heard=true
✓ Calls onResponse with heard=false
✓ Disables buttons during playback
```

### Integration Test: ResultsDisplay
```
✓ Renders audiogram chart
✓ Calculates left/right averages
✓ Shows high-frequency loss warning
✓ Displays clinical interpretation
```

---

## Performance Characteristics

### Rendering Performance
- **Before:** Entire HearingTest re-renders on any state change (10+ useState)
- **After:** Only changed components re-render via props
- **Optimization:** All components eligible for `React.memo()` wrapping

### Memory Usage
- **Before:** All staircase state in component memory
- **After:** Staircase state isolated in hook (better GC)

### Event Handling
- **Before:** Complex callback chains with multiple closures
- **After:** Clear callback hierarchy (TonePulsing → TestingPhase → HearingTest → hook)

