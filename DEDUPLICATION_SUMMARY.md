# Threshold Calculation Deduplication ✅

## Problem Identified

The average threshold calculation logic was duplicated across multiple components:

### Before Deduplication

**Location 1: HearingTest.tsx (saveSession function)**
```typescript
const avgLeft = Math.round(
  currentResults.filter(r => r.side === 'left').reduce((acc, curr) => acc + curr.db, 0) /
  (currentResults.filter(r => r.side === 'left').length || 1)
);
const avgRight = Math.round(
  currentResults.filter(r => r.side === 'right').reduce((acc, curr) => acc + curr.db, 0) /
  (currentResults.filter(r => r.side === 'right').length || 1)
);
```

**Location 2: ResultsDisplay.tsx**
```typescript
const avgLeft = Math.round(
  results.filter(r => r.side === 'left').reduce((acc, curr) => acc + curr.db, 0) /
  (results.filter(r => r.side === 'left').length || 1)
);
const avgRight = Math.round(
  results.filter(r => r.side === 'right').reduce((acc, curr) => acc + curr.db, 0) /
  (results.filter(r => r.side === 'right').length || 1)
);
```

### Issues with Duplication
- ❌ **Maintenance burden:** Changes must be made in multiple places
- ❌ **Inconsistency risk:** Different implementations could drift
- ❌ **Code smell:** Violates DRY (Don't Repeat Yourself) principle
- ❌ **Testing challenge:** Logic must be tested in multiple components
- ❌ **Readability:** Complex formula obscures intent

---

## Solution Implemented

### New Utility Functions in `src/lib/utils.ts`

```typescript
interface ThresholdResult {
  side: 'left' | 'right' | 'both';
  freq: number;
  db: number;
}

/**
 * Calculate average threshold for a specific ear.
 * @param results - Array of test results
 * @param side - 'left' or 'right'
 * @returns Rounded average threshold in dB
 */
export function calculateAvgThreshold(
  results: ThresholdResult[],
  side: 'left' | 'right'
): number {
  const sideResults = results.filter(r => r.side === side);
  if (sideResults.length === 0) return 0;
  const sum = sideResults.reduce((acc, curr) => acc + curr.db, 0);
  return Math.round(sum / sideResults.length);
}

/**
 * Calculate both left and right average thresholds.
 * @param results - Array of test results
 * @returns Object with avgLeft and avgRight
 */
export function calculateThresholds(
  results: ThresholdResult[]
): { avgLeft: number; avgRight: number } {
  return {
    avgLeft: calculateAvgThreshold(results, 'left'),
    avgRight: calculateAvgThreshold(results, 'right')
  };
}
```

### Key Design Decisions

1. **Two-level API:**
   - `calculateAvgThreshold()` - Single ear calculation (reusable)
   - `calculateThresholds()` - Both ears at once (convenient)

2. **Type Safety:**
   - Defined `ThresholdResult` interface for clarity
   - Return type is explicit `{ avgLeft: number; avgRight: number }`

3. **Edge Case Handling:**
   - Returns 0 if no results for that side (safe default)
   - Handles division by zero (empty array case)

4. **Immutability:**
   - Pure function (no side effects)
   - Doesn't modify input array

---

## Changes Made

### File 1: `src/lib/utils.ts`
- ✅ Added `ThresholdResult` interface
- ✅ Added `calculateAvgThreshold()` function
- ✅ Added `calculateThresholds()` function

### File 2: `src/components/HearingTest.tsx`
- ✅ Imported `calculateThresholds` from utils
- ✅ Replaced 5 lines with 1 line in `saveSession()`

**Before:**
```typescript
const avgLeft = Math.round(currentResults.filter(r => r.side === 'left').reduce((acc, curr) => acc + curr.db, 0) / (currentResults.filter(r => r.side === 'left').length || 1));
const avgRight = Math.round(currentResults.filter(r => r.side === 'right').reduce((acc, curr) => acc + curr.db, 0) / (currentResults.filter(r => r.side === 'right').length || 1));
```

**After:**
```typescript
const { avgLeft, avgRight } = calculateThresholds(currentResults);
```

### File 3: `src/components/ResultsDisplay.tsx`
- ✅ Imported `calculateThresholds` from utils
- ✅ Replaced 8 lines with 1 line

**Before:**
```typescript
const avgLeft = Math.round(
  results.filter(r => r.side === 'left').reduce((acc, curr) => acc + curr.db, 0) /
  (results.filter(r => r.side === 'left').length || 1)
);
const avgRight = Math.round(
  results.filter(r => r.side === 'right').reduce((acc, curr) => acc + curr.db, 0) /
  (results.filter(r => r.side === 'right').length || 1)
);
```

**After:**
```typescript
const { avgLeft, avgRight } = calculateThresholds(results);
```

---

## Benefits Achieved

| Benefit | Impact |
|---------|--------|
| **DRY Principle** | Logic defined once, used everywhere |
| **Maintainability** | Changes in one place only |
| **Testability** | Pure function, easy to unit test |
| **Readability** | Intent is clear: "calculate thresholds" |
| **Consistency** | Guaranteed same behavior everywhere |
| **Reusability** | Two-level API for flexibility |
| **Lines Reduced** | 13 lines → 2 lines (85% reduction) |

---

## Code Quality Metrics

### Before
- **Duplicated lines:** 13 (2 locations)
- **Maintenance points:** 2
- **Lines per calculation:** 6-8 lines (hard to read)
- **Testability:** Component-level only

### After
- **Duplicated lines:** 0
- **Maintenance points:** 1
- **Lines per calculation:** 1 line (self-documenting)
- **Testability:** Pure function + component-level

---

## Testing Examples

### Unit Test: calculateAvgThreshold
```typescript
import { calculateAvgThreshold, calculateThresholds } from '../lib/utils';

describe('calculateAvgThreshold', () => {
  it('calculates average for left ear', () => {
    const results = [
      { side: 'left', freq: 1000, db: 20 },
      { side: 'left', freq: 4000, db: 30 },
      { side: 'right', freq: 1000, db: 25 }
    ];

    const avgLeft = calculateAvgThreshold(results, 'left');
    expect(avgLeft).toBe(25); // (20 + 30) / 2 = 25
  });

  it('returns 0 for missing side', () => {
    const results = [
      { side: 'left', freq: 1000, db: 20 }
    ];

    const avgRight = calculateAvgThreshold(results, 'right');
    expect(avgRight).toBe(0);
  });

  it('handles single result', () => {
    const results = [
      { side: 'left', freq: 1000, db: 15 }
    ];

    const avgLeft = calculateAvgThreshold(results, 'left');
    expect(avgLeft).toBe(15);
  });
});

describe('calculateThresholds', () => {
  it('calculates both thresholds', () => {
    const results = [
      { side: 'left', freq: 1000, db: 20 },
      { side: 'left', freq: 4000, db: 30 },
      { side: 'right', freq: 1000, db: 25 },
      { side: 'right', freq: 4000, db: 35 }
    ];

    const { avgLeft, avgRight } = calculateThresholds(results);
    expect(avgLeft).toBe(25);  // (20 + 30) / 2
    expect(avgRight).toBe(30); // (25 + 35) / 2
  });
});
```

---

## Verification

- ✅ TypeScript compilation passes
- ✅ Production build succeeds
- ✅ All imports resolved correctly
- ✅ No runtime errors
- ✅ Code quality improved

---

## Future Enhancements

### Potential Additional Utilities
If similar patterns appear elsewhere, consider extracting:
- `calculateMedianThreshold()` - For median instead of average
- `calculateThresholdsByFrequency()` - Grouped by frequency
- `filterThresholdsByType()` - Filter results before calculation

### Documentation
- [ ] Add to `COMPONENT_GUIDE.md` under "Common Tasks"
- [ ] Document calculation formula in JSDoc
- [ ] Add edge case examples to documentation

---

## Summary

**Problem:** Threshold calculation duplicated in 2 locations (13 lines total)

**Solution:** Extracted to pure utility functions in `lib/utils.ts`

**Result:**
- ✅ DRY principle enforced
- ✅ Code reduction: 13 → 2 lines in each component
- ✅ Single source of truth
- ✅ Pure function (easily testable)
- ✅ Zero breaking changes

**Status:** ✅ Complete and Verified

