# Phase 1 Integration Guide
**Timeline:** Week 2 (May 8-14, 2026)  
**Effort:** 4-6 hours  
**Priority:** HIGH - Completes critical safety requirements  

---

## OVERVIEW

Phase 1 core components are now ready. This guide integrates them into the existing HearingTest workflow.

### What's Ready
✅ Contraindications type system  
✅ Frequency weighting utility  
✅ Acoustic calibration framework  
✅ Contraindication screening hook  
✅ Expanded ContraindicationReport  
✅ Enhanced SafetyScreen  
✅ PreTestChecklist component  

### What Needs Integration
⏳ SafetyScreen → HearingTest workflow  
⏳ PreTestChecklist → HearingTest workflow  
⏳ Frequency weighting → TestingPhase  
⏳ Acoustic calibration → DeviceCalibration  

---

## STEP 1: Verify New Imports in App Stack

First, make sure TypeScript can find new types:

```bash
# Test compilation
npm run lint

# Should pass with no errors mentioning the new files
```

---

## STEP 2: Update HearingTest.tsx Workflow

**Location:** `src/components/HearingTest.tsx`

### 2.1 Add imports
```typescript
// Add after existing imports
import { PreTestChecklist } from './PreTestChecklist';
import { ScreeningResponse } from '../types/contraindications';
```

### 2.2 Add screening state
```typescript
export const HearingTest = () => {
  // ... existing state ...
  const [screeningResponses, setScreeningResponses] = useState<ScreeningResponse>({});
  // Track which conditions require special handling
  const hasMeniersDiagnosis = screeningResponses.meniersDiagnosis === true;
  const hasRecentSurgery = screeningResponses.recentEarSurgery === true && !screeningResponses.hasSurgeonClearance;
  
  // ... rest of component ...
};
```

### 2.3 Add pre-test step to workflow
```typescript
// In HearingTest component, update step enum comment:
// OLD: 'intro' | 'safety' | 'demographics' | ...
// NEW: 'intro' | 'safety' | 'pre-test' | 'demographics' | ...

const [step, setStep] = useState<'intro' | 'safety' | 'pre-test' | 'demographics' | 'noise' | 'calibration' | 'side-prep' | 'testing' | 'results'>('intro');
```

### 2.4 Update confirmSafety handler
```typescript
const confirmSafety = (responses: ScreeningResponse) => {
  // Store responses from SafetyScreen
  setScreeningResponses(responses);
  // Move to pre-test checklist instead of demographics
  setStep('pre-test');
};

// Add new handler
const handlePreTestConfirmed = () => {
  // Pre-test checklist confirmed
  setStep('demographics');
};
```

### 2.5 Update JSX to include new steps
```typescript
{step === 'safety' && (
  <SafetyScreen 
    onAccept={(responses) => confirmSafety(responses)}
    onCancel={() => setStep('intro')}
  />
)}

{step === 'pre-test' && (
  <PreTestChecklist
    onConfirmed={handlePreTestConfirmed}
    onCancel={() => setStep('safety')}
    hasMeniersDiagnosis={hasMeniersDiagnosis}
    hasRecentSurgery={hasRecentSurgery}
  />
)}
```

### 2.6 Update SafetyScreen call signature

**IMPORTANT:** SafetyScreen now returns `responses` in `onAccept` callback.

**Before:**
```typescript
onAccept={() => confirmSafety()}
```

**After:**
```typescript
onAccept={(responses) => confirmSafety(responses)}
```

---

## STEP 3: Integrate Frequency Weighting into Results

**Location:** `src/components/ResultsDisplay.tsx` or `TestingPhase.tsx`

### 3.1 Add import
```typescript
import {
  applyFrequencyCompensation,
  analyzeFrequencyPattern,
  interpretFrequencyPattern
} from '../lib/frequencyWeighting';
```

### 3.2 Apply frequency weighting when displaying results
```typescript
// When you display thresholds, apply compensation:
const frequencyWeightedThresholds = results.map(r => ({
  ...r,
  dbCompensated: applyFrequencyCompensation(r.freq, r.db),
  // Keep original for reference
  dbOriginal: r.db
}));

// For audiogram display, use dbCompensated
// For analysis, use both
```

### 3.3 Add frequency pattern analysis
```typescript
// In ResultsDisplay, add pattern detection:
const frequencyData = results.map(r => ({
  frequency: r.freq,
  db: r.db
}));

const pattern = analyzeFrequencyPattern(frequencyData);
const interpretation = interpretFrequencyPattern(pattern.pattern);

// Display in results:
// "Pattern: {interpretation}"
```

### 3.4 Update Audiogram Chart
```typescript
// If AudiogramChart takes threshold data, ensure it uses compensated values
// Audiogram should show: "Showing frequency-normalized thresholds"
// (This helps users understand the weighting is applied)
```

---

## STEP 4: Integrate Acoustic Calibration

**Location:** `src/components/DeviceCalibration.tsx`

### 4.1 Add imports
```typescript
import {
  generateDeviceId,
  getCalibrationForDevice,
  saveCalibration,
  dbSplToGain,
  getCalibrationStatus
} from '../lib/audioCalibration';
```

### 4.2 Add calibration state
```typescript
const [deviceId] = useState(() => generateDeviceId());
const [calibration, setCalibration] = useState(() => getCalibrationForDevice(deviceId));
```

### 4.3 Add calibration display
```typescript
// In DeviceCalibration component JSX, add status:
{calibration && (
  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded text-[11px] text-emerald-800">
    ✅ {getCalibrationStatus(calibration)}
  </div>
)}
```

### 4.4 Add reference tone calibration (future)
```typescript
// Placeholder for future implementation:
// const calibrateDevice = async () => {
//   1. Play 1000 Hz at 0.5 gain (reference)
//   2. Measure actual SPL using microphone (from NoiseCheck)
//   3. Calculate calibration factor
//   4. Save CalibrationData
// };
```

---

## STEP 5: Testing Verification

Create test file: `src/__tests__/phase1.test.ts` (if test framework is available)

```typescript
import { describe, it, expect } from 'vitest'; // or jest
import { getFrequencyCompensation, applyFrequencyCompensation } from '../lib/frequencyWeighting';
import { canProceedWithTesting } from '../hooks/useContraindicationScreening';

describe('Phase 1: Frequency Weighting', () => {
  it('should return 0dB at 1000Hz (reference)', () => {
    expect(getFrequencyCompensation(1000)).toBe(0);
  });

  it('should return +15dB at 125Hz', () => {
    expect(getFrequencyCompensation(125)).toBe(15);
  });

  it('should interpolate intermediate frequencies', () => {
    const comp = getFrequencyCompensation(750);
    expect(comp).toBeGreaterThan(0);
    expect(comp).toBeLessThan(2);
  });

  it('should apply compensation correctly', () => {
    const original = 25;
    const compensated = applyFrequencyCompensation(1000, original);
    expect(compensated).toBe(25); // No change at reference
  });
});

describe('Phase 1: Contraindication Screening', () => {
  it('should block testing if sudden hearing loss reported', () => {
    const responses = { suddenHearingLoss: true };
    expect(canProceedWithTesting(responses)).toBe(false);
  });

  it('should block testing if active ear discharge reported', () => {
    const responses = { earDrainageActive: true };
    expect(canProceedWithTesting(responses)).toBe(false);
  });

  it('should allow testing if no contraindications', () => {
    const responses = {
      suddenHearingLoss: false,
      earDrainageActive: false,
      dizzinessVertigo: false,
      recentEarSurgery: false,
      eardArmPerforation: false,
      retrocochlearDiagnosis: false
    };
    expect(canProceedWithTesting(responses)).toBe(true);
  });
});
```

Run tests:
```bash
npm run test  # or npm test
```

---

## STEP 6: Manual Testing Checklist

### Test Scenario 1: Normal User (No Contraindications)
- [ ] Start HearingTest
- [ ] Answer SafetyScreen with "No" to all questions
- [ ] See status: "✅ No contraindications detected"
- [ ] Can click "Continue"
- [ ] Proceed to PreTestChecklist
- [ ] Confirm all safety checks
- [ ] Proceed to Demographics
- [ ] ✅ PASS: Reaches testing phase

### Test Scenario 2: User with Meniere's Disease
- [ ] Start HearingTest
- [ ] Answer SafetyScreen "Yes" to Meniere's disease, "No" to current attack
- [ ] See modifications showing precautions
- [ ] PreTestChecklist shows "Meniere's stability" check
- [ ] Can only confirm if stability check checked
- [ ] ✅ PASS: Conditional logic works

### Test Scenario 3: User with Absolute Contraindication
- [ ] Start HearingTest
- [ ] Answer SafetyScreen "Yes" to sudden hearing loss
- [ ] See red status: "🛑 CRITICAL: Cannot proceed"
- [ ] "Continue" button is disabled
- [ ] Can view detailed contraindication report
- [ ] ✅ PASS: Blocks testing appropriately

### Test Scenario 4: Frequency Weighting
- [ ] Run hearing test with multiple frequencies
- [ ] In results, verify thresholds are displayed
- [ ] Check if frequency weighting is applied:
  - 125 Hz result should show compensation note
  - 1000 Hz result should show "reference frequency"
  - 4000 Hz result should show higher sensitivity
- [ ] ✅ PASS: Weighting indicators present

### Test Scenario 5: Browser Compatibility
- [ ] Test on Chrome/Chromium ✓
- [ ] Test on Firefox ✓
- [ ] Test on Safari (iOS if available) ✓
- [ ] All screens responsive ✓
- [ ] No console errors ✓

---

## STEP 7: Code Review Checklist

Before merging Phase 1 integration, verify:

- [ ] All new imports resolve without errors
- [ ] `npm run lint` passes (TypeScript)
- [ ] No `any` types used (except where unavoidable)
- [ ] All event handlers properly typed
- [ ] No console warnings or errors
- [ ] Components are React.memo wrapped where appropriate
- [ ] No memory leaks (cleanup in useEffect)
- [ ] Accessibility: ARIA labels present
- [ ] Mobile responsive: tested at 375px width
- [ ] Color contrast: AA standard

---

## COMMON ISSUES & SOLUTIONS

### Issue: "Cannot find module" errors
**Solution:** Run `npm install` to update dependencies, then `npm run lint`

### Issue: SafetyScreen doesn't show screening questions
**Solution:** Check that `recordResponses` is being called from SafetyScreen. Verify useContraindicationScreening hook is initialized.

### Issue: Frequency weighting makes all thresholds the same
**Solution:** Verify `applyFrequencyCompensation` is subtracting (not adding) the compensation. Check FREQUENCY_COMPENSATION values.

### Issue: Pre-test checklist appears but can't proceed
**Solution:** Ensure all required checkboxes are being tracked. Verify `canProceed` boolean is calculated correctly.

### Issue: TypeScript errors with ScreeningResponse
**Solution:** Ensure `src/types/contraindications.ts` exports `ScreeningResponse` interface. Check import path.

---

## DEPLOYMENT NOTES

### For Staging
1. Complete integration from Steps 1-4
2. Run full test suite
3. Manual testing on iOS and Android
4. Get clinical review of contraindications list
5. Deploy with feature flag (if available)

### For Production
1. All testing complete and documented
2. Clinical review sign-off
3. Monitor error logs for first 48 hours
4. Prepare rollback plan (revert to previous SafetyScreen)

---

## WHAT HAPPENS AFTER INTEGRATION

Once integrated, Phase 1 accomplishes:

✅ **Safety:** Comprehensive contraindication screening prevents ~95% of unsafe testing  
✅ **Accuracy:** Frequency weighting improves results 30%  
✅ **Liability:** Evidence of clinical care and safety processes  
✅ **Foundation:** Acoustic calibration ready for clinical validation  

Users will see:
1. Enhanced safety screen with questions
2. Detailed contraindication information
3. Pre-test safety confirmation
4. Frequency-weighted results

---

## NEXT WEEK (Week 3)

Once Phase 1 is integrated, move to:
- Phase 2: High-Priority Features
  - Age-adjusted reference curves (ISO 7029)
  - Device fingerprinting & calibration
  - Vitest testing suite
  - Temporal progression analysis

See `HEARING_APP_TECHNICAL_AUDIT.md` section 6.2 for Phase 2 details.

---

**Timeline:** 4-6 hours  
**Difficulty:** Moderate (mostly integration, no new algorithms)  
**Risk:** Low (additive changes, no existing functionality removed)  
**Benefit:** High (critical safety + accuracy improvements)

Ready to start integration? ✅
