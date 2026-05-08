# Component Development Guide

## Quick Reference

### New Files Created
1. `src/hooks/useAdaptiveStaircase.ts` - Staircase algorithm logic
2. `src/components/TonePulsing.tsx` - Tone playback UI
3. `src/components/TestingPhase.tsx` - Test orchestration
4. `src/components/ResultsDisplay.tsx` - Results visualization

---

## Using `useAdaptiveStaircase` Hook

### Basic Usage
```typescript
import { useAdaptiveStaircase } from '../hooks/useAdaptiveStaircase';

function MyComponent() {
  const staircase = useAdaptiveStaircase({
    maxDb: 80,
    minDb: 0,
    startDb: 25
  });

  // Check current dB level
  console.log(staircase.state.currentDb); // 25

  // Get response history for visualization
  const recentResponses = staircase.state.history.slice(-5);

  // Handle user response
  const threshold = staircase.handleResponse(true); // or false

  // If threshold is returned (not null), we found it!
  if (threshold !== null) {
    console.log(`Threshold: ${threshold}dB`);
  }

  // Reset for new frequency
  staircase.reset(30);
}
```

### Return Value
```typescript
interface UseAdaptiveStaircaseReturn {
  state: {
    currentDb: number;                          // Next dB to test
    lastResponse: boolean | null;               // Previous response
    confirmedThreshold: number | null;          // Found threshold (if confirmed)
    history: { db: number; heard: boolean }[]; // Full response log
  };
  handleResponse: (heard: boolean, ceilingReached?: boolean) => number | null;
  reset: (startDb: number) => void;
}
```

---

## Using `TonePulsing` Component

### Basic Usage
```typescript
import { TonePulsing } from './TonePulsing';

<TonePulsing
  frequency={1000}
  currentDb={30}
  maxDb={80}
  isTonePlaying={false}
  onPlayTone={handlePlay}
  onHeard={handleHeard}
  onNotHeard={handleNotHeard}
  testHistory={[
    { db: 25, heard: false },
    { db: 30, heard: true }
  ]}
/>
```

### When to Use
- ✅ Audio playback UI with user feedback
- ✅ Frequency display with animation
- ✅ Response buttons (I Hear It / Can't Hear It)
- ❌ NOT for non-audio testing scenarios

### Customization
All styling uses Tailwind CSS. To change colors:
1. Edit the frequency display: `<span className="text-4xl font-serif text-primary">`
2. Edit button colors: `variant="primary"` / `variant="secondary"`
3. Edit animations: `animate={isTonePlaying ? {...} : {}}`

---

## Using `TestingPhase` Component

### Basic Usage
```typescript
import { TestingPhase } from './TestingPhase';

<TestingPhase
  frequencies={[1000, 4000, 8000]}
  sides={['left', 'right', 'both']}
  currentFreqIdx={0}
  currentSideIdx={0}
  currentDb={30}
  testHistory={[]}
  maxDb={80}
  minDb={0}
  onResponse={(heard, ceiling) => {
    const threshold = staircase.handleResponse(heard, ceiling);
    // Handle threshold if returned
  }}
  onFinishEarly={() => console.log('Finished early')}
  onThresholdFound={(result) => {
    console.log(`Found: ${result.freq}Hz at ${result.db}dB (${result.side})`);
  }}
/>
```

### Props Explained
- `frequencies` - Array of frequencies to test (e.g., [125, 250, 500, 1000, ...])
- `sides` - Which ears to test (left, right, or both)
- `currentFreqIdx` - Index into frequencies array (0 = first frequency)
- `currentSideIdx` - Index into sides array (0 = first side)
- `currentDb` - Current level from staircase (from hook's `state.currentDb`)
- `testHistory` - Response history for visualization (from hook's `state.history`)
- `onResponse` - Called when user clicks Play, I Hear It, or Can't Hear It
- `onFinishEarly` - Called when user clicks Finish button
- `onThresholdFound` - Called when a threshold is confirmed (optional, for logging)

### When to Use
- ✅ Single-frequency, single-side testing flow
- ✅ Adaptive threshold testing
- ✅ With staircase algorithm
- ❌ NOT for fixed-level testing
- ❌ NOT for non-adaptive protocols

---

## Using `ResultsDisplay` Component

### Basic Usage
```typescript
import { ResultsDisplay } from './ResultsDisplay';

<ResultsDisplay
  results={[
    { side: 'left', freq: 1000, db: 25 },
    { side: 'right', freq: 1000, db: 30 },
    { side: 'both', freq: 4000, db: 45 }
  ]}
  demographics={{
    age: 35,
    sex: 'male'
  }}
  device="headphones"
  onReturnHome={() => navigate('/')}
/>
```

### What It Displays
1. **Audiogram Chart** - Interactive frequency vs threshold plot
2. **Threshold Averages** - Left/Right ear average dB levels
3. **Clinical Interpretation** - Narrative based on results
4. **Technical Details** - Spectral purity, SNR, calibration info
5. **Contraindication Report** - Safety warnings

### Customization
To change clinical interpretation threshold:
```typescript
// In ResultsDisplay.tsx, find:
const hasHighFrequencyLoss = results.some(r => r.freq >= 8000 && r.db >= 60);
// Change 60 to your threshold
```

---

## Integration with HearingTest

### Test Flow
```
1. User starts test
   └─► SafetyScreen (medical disclaimer)
2. User provides demographics
   └─► DemographicsScreen (age/sex)
3. Environment checked
   └─► NoiseCheck (ambient noise)
4. Device configured
   └─► DeviceCalibration (headphones, IEM, etc.)
5. Test begins for each ear
   └─► TestingPhase (with TonePulsing)
       └─► useAdaptiveStaircase (threshold finding)
6. Results displayed
   └─► ResultsDisplay (audiogram + interpretation)
```

### Data Flow
```
HearingTest Component
├─ Manages: step, demographics, results, device
├─ Calls: predictStartingDb() for each frequency
└─ Uses: useAdaptiveStaircase() for threshold logic

TestingPhase Component
├─ Receives: frequencies, sides, current indices
├─ Manages: user responses via onResponse callback
└─ Renders: TonePulsing + Progress

TonePulsing Component
├─ Receives: frequency, currentDb, playback state
├─ Calls: onPlayTone, onHeard, onNotHeard
└─ Renders: UI only (no state management)

useAdaptiveStaircase Hook
├─ Manages: staircase algorithm state
├─ Returns: currentDb, threshold, history
└─ Pure logic (no side effects)
```

---

## Common Tasks

### Add a New Testing Frequency
**File:** `src/components/HearingTest.tsx`
```typescript
const FREQUENCIES = [
  1000, 4000, 500, 8000, 2000, 250, 12000, 125, 16000,
  20000  // ← Add new frequency here
];
```

### Change Staircase Parameters
**File:** `src/components/HearingTest.tsx`
```typescript
// Initial dB level
staircaseHook.reset(25);  // Change 25

// Max/min dB
const MAX_DB = 80;  // Change threshold
const MIN_DB = 0;   // Change floor

// In useAdaptiveStaircase.ts, change:
const nextDb = Math.max(minDb, currentDb - 10);  // Change 10 to other value
const nextDb = Math.min(maxDb, currentDb + 5);   // Change 5 to other value
```

### Customize Results Display
**File:** `src/components/ResultsDisplay.tsx`
```typescript
// Change high-frequency loss warning
const hasHighFrequencyLoss = results.some(r => r.freq >= 8000 && r.db >= 60);
// Adjust frequency (8000) and dB threshold (60) as needed

// Change clinical interpretation text
{hasHighFrequencyLoss ? (
  <p>Your custom warning here...</p>
) : (
  <p>Your custom message here...</p>
)}
```

---

## Debugging Tips

### Debug Staircase Algorithm
```typescript
// In HearingTest.tsx
const handleTestResponse = (heard: boolean, ceilingReached = false) => {
  const threshold = staircaseHook.handleResponse(heard, ceilingReached);
  
  // Debug output
  console.log('Response:', heard);
  console.log('Current dB:', staircaseHook.state.currentDb);
  console.log('Threshold:', threshold);
  console.log('History:', staircaseHook.state.history);
  
  // ... rest of function
};
```

### Debug Component Rendering
```typescript
// In TonePulsing.tsx, add at top of component:
console.log('TonePulsing rendered with:', {
  frequency,
  currentDb,
  isTonePlaying
});
```

### Monitor Test Results
```typescript
// In HearingTest.tsx
useEffect(() => {
  console.log('Current test results:', results);
}, [results]);
```

---

## Performance Optimization

### Memoize Components
```typescript
import { memo } from 'react';

export const TonePulsing = memo(function TonePulsing(props) {
  // Component renders only when props change
  return (...);
});
```

### Reduce Re-renders
```typescript
// ❌ Bad: New function created every render
<TestingPhase onResponse={() => handleTestResponse(...)} />

// ✅ Good: Function defined outside JSX
const handleResponse = useCallback((heard, ceiling) => {
  handleTestResponse(heard, ceiling);
}, []);
<TestingPhase onResponse={handleResponse} />
```

---

## Testing Examples

### Unit Test: Staircase Algorithm
```typescript
import { renderHook, act } from '@testing-library/react';
import { useAdaptiveStaircase } from './useAdaptiveStaircase';

test('finds threshold at 30dB', () => {
  const { result } = renderHook(() =>
    useAdaptiveStaircase({ maxDb: 80, minDb: 0, startDb: 25 })
  );

  act(() => {
    // Ascending phase
    let threshold = result.current.handleResponse(false);
    expect(threshold).toBeNull(); // Still seeking

    threshold = result.current.handleResponse(false);
    expect(threshold).toBeNull();

    // Descending phase
    threshold = result.current.handleResponse(true);
    expect(threshold).toBeNull(); // Continue descending

    // Confirm
    threshold = result.current.handleResponse(true);
    expect(threshold).toBeDefined(); // Threshold found!
  });
});
```

### Component Test: TonePulsing
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TonePulsing } from './TonePulsing';

test('renders frequency', () => {
  render(
    <TonePulsing
      frequency={1000}
      currentDb={30}
      maxDb={80}
      isTonePlaying={false}
      onPlayTone={jest.fn()}
      onHeard={jest.fn()}
      onNotHeard={jest.fn()}
      testHistory={[]}
    />
  );

  expect(screen.getByText('1000')).toBeInTheDocument();
});

test('calls onHeard when button clicked', async () => {
  const handleHeard = jest.fn();
  render(
    <TonePulsing
      frequency={1000}
      currentDb={30}
      maxDb={80}
      isTonePlaying={false}
      onPlayTone={jest.fn()}
      onHeard={handleHeard}
      onNotHeard={jest.fn()}
      testHistory={[]}
    />
  );

  const button = screen.getByRole('button', { name: /I Hear It/i });
  await userEvent.click(button);

  expect(handleHeard).toHaveBeenCalled();
});
```

---

## Troubleshooting

### "Cannot find module" Error
- Check import paths are relative (e.g., `./TonePulsing`, not `TonePulsing`)
- Check files exist in correct directories
- Run `npm run lint` to catch all errors

### Tone Not Playing
- Check `audioEngine` is imported correctly
- Verify browser allows audio playback (Safari requires user interaction)
- Check browser console for Web Audio API errors

### Incorrect Threshold Values
- Check staircase initial dB: `startDb: 25`
- Verify MAX_DB/MIN_DB constants match your needs
- Review `predictStartingDb()` logic for your demographics

### Component Not Re-rendering
- Check props are passed correctly to child components
- Verify state updates aren't being skipped
- Use React DevTools Profiler to check render frequency

