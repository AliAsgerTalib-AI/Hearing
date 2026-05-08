# Test Setup Guide

This document provides guidance for setting up and running tests in the hearing assessment application.

## Overview

No test suite is currently configured in the project. This guide explains how to add tests using Vitest (recommended for Vite projects) or Jest.

## Recommended Testing Stack

- **Test Framework:** Vitest (lighter weight than Jest, optimized for Vite)
- **React Testing:** React Testing Library (for component tests)
- **Mocking:** Vitest's built-in mocking utilities
- **Coverage:** Vitest coverage reporter

## Installation

### For Vitest (Recommended):

```bash
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom happy-dom
```

### For Jest (Alternative):

```bash
npm install -D jest @testing-library/react @testing-library/user-event @testing-library/jest-dom @types/jest ts-jest
```

## Configuration

### Vitest Configuration (vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.ts',
        '**/*.test.tsx'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### Jest Configuration (jest.config.js)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/contexts/StorageContext.tsx'
  ]
};
```

### Test Setup File (src/test/setup.ts)

```typescript
import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest'; // or 'jest'
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock localStorage for tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock Web Audio API
class MockAudioContext {
  createOscillator = vi.fn().mockReturnValue({
    type: 'sine',
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  });
  createGain = vi.fn().mockReturnValue({
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn()
  });
  createStereoPanner = vi.fn().mockReturnValue({
    pan: { setValueAtTime: vi.fn() },
    connect: vi.fn()
  });
  createAnalyser = vi.fn().mockReturnValue({
    fftSize: 2048,
    frequencyBinCount: 1024,
    getFloatFrequencyData: vi.fn()
  });
  createMediaStreamSource = vi.fn().mockReturnValue({
    connect: vi.fn()
  });
  currentTime = 0;
  sampleRate = 44100;
  close = vi.fn();
  resume = vi.fn();
  state = 'running';
}

global.AudioContext = MockAudioContext as any;
global.webkitAudioContext = MockAudioContext as any;
```

### Update package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage"
  }
}
```

## Test File Organization

```
src/
├── __tests__/
│   ├── hooks/
│   │   ├── useAdaptiveStaircase.test.ts
│   │   ├── useDebounce.test.ts
│   │   └── useCanvasResize.test.ts
│   ├── components/
│   │   ├── TestingPhase.test.tsx
│   │   ├── DemographicsScreen.test.tsx
│   │   └── AudiogramChart.test.tsx
│   └── services/
│       └── geminiService.test.ts
├── test/
│   └── setup.ts (Test configuration and global mocks)
└── components/
    ├── useAdaptiveStaircase.test.ts (Co-located test example)
```

## Testing Recommendations by Category

### 1. Unit Tests: useAdaptiveStaircase Hook ✅

**Location:** `src/hooks/useAdaptiveStaircase.test.ts`

**What to Test:**
- Initialization with correct starting dB
- Descending phase (when user hears)
- Ascending phase (when user doesn't hear)
- Threshold confirmation logic
- History tracking
- Reset functionality

**Example:**
```typescript
describe('useAdaptiveStaircase', () => {
  it('should confirm threshold when ascending reverses to descending', () => {
    const { result } = renderHook(() => useAdaptiveStaircase({
      maxDb: 80,
      minDb: 0,
      startDb: 25
    }));

    act(() => {
      result.current.handleResponse(false); // Ascending
      result.current.handleResponse(true);  // Reverse to descending
    });

    expect(result.current.state.confirmedThreshold).not.toBeNull();
  });
});
```

**Benefits:**
- Pure logic (no React dependencies)
- Fast execution
- High confidence in core algorithm

### 2. Integration Tests: TestingPhase Component

**Location:** `src/components/__tests__/TestingPhase.test.tsx`

**What to Test:**
- Renders with correct frequency and dB
- Progress bar updates correctly
- Play button triggers audio
- Response buttons call handlers
- Buttons disabled during playback

**Mocking Strategy:**
```typescript
import { vi } from 'vitest';

const mockAudioEngine = {
  resume: vi.fn(),
  playPulsedTone: vi.fn(),
  dispose: vi.fn(),
  dbToGain: vi.fn().mockReturnValue(0.5)
};

vi.mock('../lib/AudioEngine', () => ({
  audioEngine: mockAudioEngine,
  AudioEngine: { dbToGain: vi.fn().mockReturnValue(0.5) }
}));
```

**Example:**
```typescript
describe('TestingPhase', () => {
  it('should disable buttons while tone is playing', async () => {
    const { getByRole } = render(
      <TestingPhase
        frequencies={[1000]}
        sides={['both']}
        currentFreqIdx={0}
        currentSideIdx={0}
        currentDb={25}
        testHistory={[]}
        maxDb={80}
        minDb={0}
        onResponse={vi.fn()}
        onFinishEarly={vi.fn()}
        onThresholdFound={vi.fn()}
      />
    );

    const playButton = getByRole('button', { name: /play/i });
    fireEvent.click(playButton);
    expect(playButton).toBeDisabled();

    // Wait for tone to finish
    await waitFor(() => expect(playButton).not.toBeDisabled());
  });
});
```

### 3. Component Tests: DemographicsScreen

**Location:** `src/components/__tests__/DemographicsScreen.test.tsx`

**What to Test:**
- Age input validation
- Sex selection state
- Form submission
- Error display

**Example:**
```typescript
describe('DemographicsScreen', () => {
  it('should validate age input', async () => {
    const { getByLabelText, getByText } = render(
      <DemographicsScreen onComplete={vi.fn()} />
    );

    const ageInput = getByLabelText(/biological age/i);
    fireEvent.change(ageInput, { target: { value: '150' } });

    expect(getByText(/age cannot exceed/i)).toBeInTheDocument();
  });
});
```

### 4. Service Tests: geminiService

**Location:** `src/services/__tests__/geminiService.test.ts`

**What to Test:**
- API key validation
- Response parsing
- Error handling
- Type validation

**Mocking Strategy:**
```typescript
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        text: JSON.stringify({
          dailyFocus: 'Test focus',
          exercises: [],
          insight: 'Test insight'
        })
      })
    }
  }))
}));
```

### 5. localStorage Mocking for All Components

**Setup in test/setup.ts:**
```typescript
const localStorageMock = {
  getItem: vi.fn((key: string) => {
    const store: Record<string, string> = {};
    return store[key] || null;
  }),
  setItem: vi.fn((key: string, value: string) => {
    const store: Record<string, string> = {};
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    const store: Record<string, string> = {};
    delete store[key];
  }),
  clear: vi.fn(() => {
    // Clear all
  })
};

global.localStorage = localStorageMock as any;
```

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- useAdaptiveStaircase

# Run tests matching pattern
npm test -- --grep "threshold"
```

## Coverage Goals

Aim for the following coverage targets:

- **Statements:** 80%
- **Branches:** 75%
- **Functions:** 80%
- **Lines:** 80%

Priority areas for testing:

1. **Critical:** Staircase algorithm, API integration, data validation
2. **High:** Component interactions, state management, navigation
3. **Medium:** UI rendering, event handling, error displays
4. **Low:** CSS styling, animation details

## CI/CD Integration

Add to your CI pipeline (GitHub Actions example):

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## Common Testing Patterns

### Testing Async Operations

```typescript
it('should load test results on mount', async () => {
  const { getByText } = render(<EnvironmentalAnalyzer />);
  
  await waitFor(() => {
    expect(getByText(/results loaded/i)).toBeInTheDocument();
  });
});
```

### Testing Context Consumption

```typescript
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <StorageProvider>{children}</StorageProvider>
);

render(<MyComponent />, { wrapper: Wrapper });
```

### Testing User Interactions

```typescript
import { userEvent } from '@testing-library/user-event';

it('should handle form submission', async () => {
  const user = userEvent.setup();
  const { getByRole } = render(<DemographicsScreen onComplete={vi.fn()} />);
  
  await user.type(getByRole('spinbutton', { name: /age/i }), '25');
  await user.click(getByRole('button', { name: /continue/i }));
});
```

## Troubleshooting

**Issue:** "Cannot find module '@testing-library/react'"
- Solution: `npm install -D @testing-library/react`

**Issue:** "localStorage is not defined"
- Solution: Ensure `test/setup.ts` is properly configured in vitest/jest config

**Issue:** "AudioContext is not defined"
- Solution: Add AudioContext mock to `test/setup.ts`

**Issue:** Tests timeout on API calls
- Solution: Mock Gemini API calls in `test/setup.ts`

## Next Steps

1. Install testing dependencies
2. Create `vitest.config.ts` or `jest.config.js`
3. Create `src/test/setup.ts` with global mocks
4. Start with hook tests (`useAdaptiveStaircase`)
5. Add component tests for critical paths
6. Integrate tests into CI/CD pipeline

---

For more information:
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about)
