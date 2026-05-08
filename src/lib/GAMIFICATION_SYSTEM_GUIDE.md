# Gamification System Guide

**Hearing Health Auditory Training - Phase 2 Feature**

A comprehensive engagement system that incentivizes consistent training through streaks, badges, and achievement tracking.

---

## 🎯 System Overview

The gamification system automatically tracks user exercise sessions and awards achievements based on consistency, performance, and milestone completion. The system is non-intrusive, storing all data locally without external dependencies.

### Key Features

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Daily Streaks** | Consecutive days of exercise completion | Visual habit reinforcement |
| **Weekly Goals** | Target of 7 sessions per week | Structure for consistent training |
| **10 Unique Badges** | Achievements from "First Step" to "Legend Status" | Milestone recognition |
| **Exercise Stats** | Per-exercise tracking (sessions, accuracy, level) | Performance visibility |
| **Motivation Messages** | Dynamic contextual messages | Engagement encouragement |

---

## 🏗️ Architecture

### Core Components

#### 1. **GamificationEngine** (`src/lib/GamificationEngine.ts`)
- **Responsibility:** Core logic for session tracking, streak calculation, and badge management
- **Key Methods:**
  - `recordSession()` - Record completed exercise with metrics
  - `calculateProgress()` - Compute all gamification metrics
  - `calculateStreaks()` - Determine current and longest streaks
  - `checkBadges()` - Evaluate and award eligible badges
  - `getMotivationMessage()` - Generate contextual encouragement

#### 2. **GamificationContext** (`src/contexts/GamificationContext.tsx`)
- **Responsibility:** React context provider for app-wide access
- **Provides:**
  - `progress` - Current gamification state
  - `recordSession()` - Function to record exercise completion
  - `getSessions()` - Retrieve all recorded sessions
  - `getMotivationMessage()` - Get current motivation text

#### 3. **GamificationPanel** (`src/components/GamificationPanel.tsx`)
- **Responsibility:** Full-page statistics and achievements display
- **Displays:**
  - Current streak with color coding
  - Record streak (personal best)
  - Weekly goal progress bar
  - Total sessions and training hours
  - Per-exercise statistics (sessions, accuracy, best level)
  - Earned badges with rarity indicators

#### 4. **StreakWidget** (`src/components/StreakWidget.tsx`)
- **Responsibility:** Compact streak indicator for header/training page
- **Shows:**
  - Current fire streak (flame emoji indicator)
  - Weekly progress (goal achievement)

### Data Flow

```
Exercise Session Completion
           ↓
recordSession() called with:
  - exerciseId (1=Vowel, 2=Consonant, 3=Frequency)
  - exerciseTitle
  - duration (seconds)
  - accuracy (0-100)
  - level (current exercise level)
           ↓
GamificationEngine creates ExerciseSession record
           ↓
calculateProgress() updates:
  - Current/longest streaks
  - Weekly progress
  - Exercise-specific stats
  - Eligible badges
           ↓
GamificationContext triggers re-render
           ↓
UI components (GamificationPanel, StreakWidget) update
```

---

## 📊 Streak System

### Streak Calculation Logic

**Current Streak:**
- Counts consecutive days with at least 1 exercise completed
- Resets to 0 if no session today or yesterday
- Preserved across app sessions via localStorage

**Longest Streak:**
- Personal record for consecutive day completion
- Never resets (represents best achievement)
- Used for "Month Master" and "Consistency King" badges

### Streak Colors
- **No Streak:** Gray (0 days)
- **Early Stage:** Blue-Cyan (1-6 days)
- **Active:** Orange-Red (7-29 days)
- **Milestone:** Purple-Pink (30-59 days)
- **Legend:** Purple-Gold (60+ days)

---

## 🏆 Badge System

### Badge Definitions

#### Common Badges (Bronze)
| Badge | Requirement | Trigger |
|-------|-------------|---------|
| **First Step** 👣 | 1 session | Immediate first completion |
| **Perfect Performance** ✨ | 100% accuracy | Any single session |

#### Rare Badges (Silver)
| Badge | Requirement | Trigger |
|-------|-------------|---------|
| **Week Warrior** ⚔️ | 7 sessions/week | Weekly completion goal |
| **Vowel Expert** 🎤 | 20 Vowel Discrimination sessions | Exercise milestone |
| **Consonant Pro** 🔊 | 20 Consonant Contrast sessions | Exercise milestone |
| **Frequency Fiend** ⚡ | 20 High Frequency Pulse sessions | Exercise milestone |

#### Epic Badges (Gold)
| Badge | Requirement | Trigger |
|-------|-------------|---------|
| **Month Master** 👑 | 30-day streak | Longest streak = 30 |
| **Centennial** 💯 | 100 total sessions | Cumulative milestone |

#### Legendary Badges (Platinum)
| Badge | Requirement | Trigger |
|-------|-------------|---------|
| **Consistency King** 🏆 | 60-day streak | Longest streak = 60 |
| **Legend Status** 🌟 | 500 total sessions | Ultimate milestone |

### Badge Earning Mechanics

```
Badge awards are evaluated on each session completion:

checkBadges(currentStreak, longestStreak, totalSessions, weeklyProgress, exerciseStats) {
  1. Total Sessions Badges
     - First Step: totalSessions >= 1
     - Centennial: totalSessions >= 100
     - Legend Status: totalSessions >= 500

  2. Streak Badges
     - Month Master: longestStreak >= 30
     - Consistency King: longestStreak >= 60

  3. Weekly Badges
     - Week Warrior: weeklyProgress >= 7

  4. Exercise-Specific Badges
     - Vowel Expert: exerciseStats.vowel.sessions >= 20
     - Consonant Pro: exerciseStats.consonant.sessions >= 20
     - Frequency Fiend: exerciseStats.frequency.sessions >= 20

  5. Performance Badges
     - Perfect Performance: any session with accuracy === 100
}

Awarded badges are stored and persisted in localStorage.
```

---

## 📈 Statistics Tracked

### Session Record
```typescript
ExerciseSession {
  id: string;                    // Unique identifier
  exerciseId: number;            // 1=Vowel, 2=Consonant, 3=Frequency
  exerciseTitle: string;         // "Vowel Discrimination" etc.
  date: string;                  // ISO date string (YYYY-MM-DD)
  timestamp: number;             // Unix timestamp
  duration: number;              // Seconds spent
  accuracy: number;              // 0-100 percentage
  level: number;                 // Current exercise difficulty level
  completed: boolean;            // True if session finished
}
```

### Exercise Statistics
For each of the 3 exercises:
- **sessions** - Total completions
- **accuracy** - Average accuracy percentage
- **bestLevel** - Highest difficulty level reached

### Overall Statistics
- **currentStreak** - Active day streak count
- **longestStreak** - Best streak achieved
- **totalSessionsCompleted** - Cumulative sessions
- **totalMinutesSpent** - Sum of all durations
- **weeklyProgress** - Sessions this week (Sunday-Saturday)
- **weeklyGoal** - Target sessions per week (default: 7)
- **badges** - Earned achievement array
- **lastExerciseDate** - Last session date

---

## 🔌 Integration Points

### Recording Sessions

Each exercise component calls `recordSession()` when a session ends:

```typescript
// In VowelDiscriminationSession.tsx
const { recordSession } = useGamification();

const handleEndSession = () => {
  exercise.stop();

  if (state.totalTrials > 0) {
    const durationSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
    recordSession(
      1, // exerciseId
      'Vowel Discrimination',
      durationSeconds,
      state.accuracy,
      state.level
    );
  }

  onClose();
};
```

### Displaying Progress

#### In Training Tab
```typescript
// AuditoryTraining.tsx shows compact streak widget
<StreakWidget /> // Shows 🔥 streak and 🏆 weekly progress
```

#### In Stats Tab
```typescript
// Click "Stats" tab to open GamificationPanel
<GamificationPanel /> // Full achievements and statistics
```

### Storage & Persistence

Data is automatically saved to localStorage:
```typescript
// Key: 'hearingGamificationData'
// Format: { sessions: ExerciseSession[] }
// Automatically synchronized on every session recording
```

---

## 💡 Motivation System

Dynamic contextual messages encourage users based on progress:

```
Streak >= 60  days: "🏆 Legend status! Your consistency is inspiring."
Streak >= 30  days: "👑 One month strong! Keep the momentum going."
Streak >= 7   days: "⚔️ A full week! You're a warrior of auditory training."
Weekly Goal Met:     "✨ Weekly goal crushed! Time to celebrate."
Weekly In Progress:  "🔥 Keep going! X more sessions to hit your weekly goal."
No Activity:         "🚀 Ready to start? Your first session awaits!"
```

---

## 🔮 Future Enhancements (Phase 3)

### Possible Additions
- **Daily Streaks Notifications** - Remind users to maintain streaks
- **Seasonal Challenges** - Limited-time badge events
- **Social Features** - Friend leaderboards
- **Level Unlocks** - New exercises based on streak milestones
- **Reward Customization** - User-chosen motivation style
- **Export Achievements** - Share progress with healthcare providers
- **Advanced Analytics** - Trend graphs showing accuracy over time

---

## 🧪 Testing the System

### Manual Testing Workflow

1. **Test Session Recording**
   ```
   1. Navigate to Training tab
   2. Start any exercise
   3. Complete at least 1 trial
   4. Close exercise modal
   5. Check Stats tab → Sessions should be recorded
   ```

2. **Test Streak Calculation**
   ```
   1. Complete 1 session
   2. Close app and reopen
   3. Stats tab should show 1 day streak
   4. Complete another session
   5. Streak should remain at 1 (same day)
   6. Wait until next day, do 1 session
   7. Streak should become 2
   ```

3. **Test Badge Awards**
   ```
   1. Complete 1 session → "First Step" badge earned
   2. Achieve 100% accuracy → "Perfect Performance" badge earned
   3. Complete 20 sessions → Exercise specialist badges earned
   4. Create 30-day streak → "Month Master" badge earned
   ```

4. **Test Motivation Messages**
   ```
   1. No sessions: "Ready to start?"
   2. Early activity: "Keep going! X more sessions..."
   3. 7 day streak: "Week Warrior!" message
   4. 30+ day streak: "One month strong!" message
   ```

---

## 📝 Developer Notes

### Performance Characteristics

| Operation | Time | Scalability |
|-----------|------|-------------|
| Record Session | <5ms | O(1) |
| Calculate Progress | <20ms | O(n) where n=sessions |
| Calculate Streaks | <10ms | O(n) where n=unique dates |
| Check Badges | <5ms | O(1) - fixed badges |
| localStorage Sync | <50ms | Depends on storage size |

### Browser Storage Limits
- localStorage: ~5-10MB per domain
- With avg session = 200 bytes, supports ~25,000 sessions
- At 5 sessions/week = 96 years of data

### Design Decisions

1. **Local Storage Only** - No external dependencies, works offline
2. **Automatic Persistence** - No manual save required
3. **Non-Destructive** - Badge checks only add, never remove
4. **Timezone Naive** - Uses ISO date strings (YYYY-MM-DD) for streak calculation
5. **Weekly Calendar** - Weeks run Sunday-Saturday for consistency

---

## 🚀 Deployment Notes

- No API changes required
- No new external dependencies
- Backward compatible with existing hearing test data
- localStorage is isolated per domain
- Safe to deploy immediately

---

*Last Updated: 2026-05-08*
*Gamification System v1.0.0*
