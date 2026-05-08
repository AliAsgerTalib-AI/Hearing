# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a hearing health assessment and auditory training web application built with React. It provides:
- **Hearing Assessment**: Adaptive frequency-based hearing tests to detect hearing loss patterns
- **Auditory Training**: AI-powered personalized training regimens using Google Gemini API
- **Environmental Analysis**: Real-time audio environment monitoring
- **Clinical Results**: Audiogram visualization and historical tracking

The app is designed as a mobile-first single-page application (max-width: md) with tab-based navigation.

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (runs on http://localhost:3000 with HMR)
npm run dev

# Type check without emitting files
npm lint

# Build for production
npm run build

# Preview production build
npm preview

# Clean build artifacts
npm run clean
```

## Project Structure

```
src/
├── App.tsx                 # Main app shell with tab-based navigation
├── main.tsx                # React root entry point
├── components/
│   ├── HearingTest.tsx     # Core hearing assessment flow (multi-step wizard)
│   ├── AuditoryTraining.tsx # Training exercises and Gemini-powered plan generation
│   ├── EnvironmentalAnalyzer.tsx # Real-time audio input analysis
│   ├── HomeView.tsx        # Welcome/home screen with history
│   ├── AudiogramChart.tsx  # Recharts-based results visualization
│   ├── SafetyScreen.tsx    # Medical disclaimer and contraindication checks
│   ├── DemographicsScreen.tsx # Age/sex collection for personalization
│   ├── DeviceCalibration.tsx # Device type and volume calibration
│   ├── NoiseCheck.tsx      # Background noise verification
│   └── ui/                 # Radix UI component wrappers
│       ├── basic.tsx       # Card, Button components
│       ├── progress.tsx    # Progress bar component
│       └── slider.tsx      # Audio level slider
├── lib/
│   ├── AudioEngine.ts      # Web Audio API abstraction for tone generation/playback
│   └── utils.ts            # Tailwind cn() utility and helpers
└── services/
    └── geminiService.ts    # Google Gemini API integration for training plan generation
```

## Key Architecture Patterns

### HearingTest Multi-Step Flow
The hearing test proceeds through these steps:
1. **intro**: Initial instructions
2. **safety**: Medical disclaimer + contraindication check
3. **demographics**: Age/sex collection for personalization
4. **noise**: Ambient noise verification
5. **calibration**: Device volume calibration with reference tones
6. **side-prep**: Prepare for left/right/both ear testing
7. **testing**: Adaptive threshold finding using ascending/descending protocol
8. **results**: Display audiogram and generate AI training plan

Frequency testing order: `[1000, 4000, 500, 8000, 2000, 250, 12000, 125, 16000]` (ML-inspired: anchor → detail → extremes)

### Audio Processing
- **AudioEngine**: Singleton instance manages Web Audio context, tone generation, and playback
- Tones are generated at specific frequencies (125Hz–16000Hz) at varying dB levels (0–80dB)
- Audio output is left/right/both channel configurable

### AI Integration
- **geminiService**: Integrates Google Gemini API to generate personalized auditory training plans
- Input: Hearing test results (frequency/dB/ear) + demographics
- Output: Structured training regimen targeting weak frequencies and asymmetries
- Model: `gemini-3-flash-preview`

### Styling
- **Tailwind CSS** with custom color variables (primary, accent-teal, accent-gold, accent-sage)
- Mobile-first design (max-width: md container)
- Framer Motion for transitions and animations
- Radix UI for accessible interactive components

## Configuration & Environment

- **GEMINI_API_KEY**: Required in `.env.local` for AI training plan generation
- **Port**: Dev server runs on `3000` with `--host=0.0.0.0` for network access
- **TypeScript paths**: `@/*` resolves to project root
- **Vite HMR**: Disabled in AI Studio via `DISABLE_HMR` env var (respects file watching)

## Testing Considerations

- No test suite currently configured. When adding tests, use Vitest (lighter than Jest for Vite) or Jest with proper config
- UI testing requires browser environment due to Web Audio API and DOM interactions
- Audio component testing is challenging; consider mocking AudioContext for unit tests
- Integration tests should verify Gemini API integration with mocked responses

## Common Development Tasks

**Adding a new screen/feature:**
1. Create component in `src/components/`
2. Add state for the tab/step in `App.tsx` or parent component
3. Use Motion components from `motion/react` for consistency
4. Follow the mobile-first container pattern (max-w-md)

**Modifying audio test flow:**
- Edit FREQUENCIES array and SIDES in HearingTest.tsx
- Update step enum if adding new wizard steps
- Verify AudioEngine supports frequency range

**Updating training plan logic:**
- Modify prompt in geminiService.ts
- Adjust AuditoryPlan interface if response structure changes
- Test with diverse demographic inputs

## Important Notes

- The app includes a medical disclaimer footer (required for health applications)
- Hearing loss thresholds: normal (0–20dB), mild (20–40dB), moderate (40–60dB), severe (60–80dB)
- 8000Hz is critical for detecting high-frequency hearing loss; monitor this frequency carefully
- Audio playback requires user interaction (Safari/iOS restrictions)
- The app is currently at v1.0.4-beta and deployed via AI Studio
