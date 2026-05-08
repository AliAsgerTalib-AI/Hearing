import { GoogleGenAI, Type } from "@google/genai";
import { HearingProfileAnalyzer } from "../lib/HearingProfileAnalyzer";
import { ExerciseRecommendationEngine } from "../lib/ExerciseRecommendationEngine";

const getApiKey = (): string => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    console.warn("VITE_GEMINI_API_KEY not configured. AI training plan generation will use local recommendation engine.");
    return '';
  }
  return key;
};

const getModelName = (): string => {
  return import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview";
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export interface Exercise {
  title: string;
  description: string;
  science: string;
  durationMinutes: number;
  frequencyHz?: number;
}

export interface AuditoryPlan {
  dailyFocus: string;
  exercises: Exercise[];
  insight: string;
}

function isValidExercise(item: unknown): item is Exercise {
  if (!item || typeof item !== 'object') return false;
  const ex = item as Record<string, unknown>;
  return (
    typeof ex.title === 'string' &&
    typeof ex.description === 'string' &&
    typeof ex.science === 'string' &&
    typeof ex.durationMinutes === 'number' &&
    (ex.frequencyHz === undefined || typeof ex.frequencyHz === 'number')
  );
}

function isValidAuditoryPlan(data: unknown): data is AuditoryPlan {
  if (!data || typeof data !== 'object') return false;
  const plan = data as Record<string, unknown>;
  return (
    typeof plan.dailyFocus === 'string' &&
    Array.isArray(plan.exercises) &&
    plan.exercises.every(isValidExercise) &&
    typeof plan.insight === 'string'
  );
}

export interface TestResult {
  side: 'left' | 'right' | 'both';
  freq: number;
  db: number;
}

export interface Demographics {
  age: number;
  sex: 'male' | 'female' | 'other';
}

export async function generateAuditoryPlan(results: TestResult[], demographics?: Demographics): Promise<AuditoryPlan | null> {
  try {
    const apiKey = getApiKey();

    // First, analyze hearing profile locally
    const hearingProfile = HearingProfileAnalyzer.analyzeProfile(
      results,
      demographics?.age || 40,
      demographics?.sex || 'other'
    );

    // Generate local recommendations
    const localRegimen = ExerciseRecommendationEngine.generateRegimen(
      hearingProfile,
      demographics?.age || 40
    );

    // Try to enhance with AI if API key is available
    if (apiKey) {
      try {
        const enhancedPlan = await generateAIEnhancedPlan(results, hearingProfile, localRegimen, demographics);
        if (enhancedPlan) {
          return enhancedPlan;
        }
      } catch (aiError) {
        console.warn("AI enhancement failed, using local recommendations:", aiError);
      }
    }

    // Fall back to local recommendations converted to AuditoryPlan format
    return convertRegimenToAuditoryPlan(localRegimen, hearingProfile);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Auditory plan generation error:", message);
    return null;
  }
}

/**
 * Generate AI-enhanced plan using Gemini API
 */
async function generateAIEnhancedPlan(
  results: TestResult[],
  hearingProfile: ReturnType<typeof HearingProfileAnalyzer.analyzeProfile>,
  localRegimen: ReturnType<typeof ExerciseRecommendationEngine.generateRegimen>,
  demographics?: Demographics
): Promise<AuditoryPlan | null> {
  const prompt = `
You are a world-class Audiologist and Neuroscientist specializing in Auditory Training and Neuroplasticity.

A patient has completed a hearing assessment. Based on the clinical data below, provide an enhanced,
personalized "Auditory Synapse Neuro-Regimen" that goes beyond standard recommendations.

CLINICAL DATA:
Demographics: Age ${demographics?.age || 'Unknown'}, Sex ${demographics?.sex || 'Unknown'}

Audiogram Results:
${results.map(r => `- [${r.side}] ${r.freq}Hz: ${r.db}dB`).join('\n')}

HEARING PROFILE ANALYSIS (Computer Generated):
- Loss Pattern: ${hearingProfile.pattern.type} (${hearingProfile.pattern.severity})
- Low Freq Threshold: ${hearingProfile.lowFreqThreshold}dB
- Mid Freq Threshold: ${hearingProfile.midFreqThreshold}dB
- High Freq Threshold: ${hearingProfile.highFreqThreshold}dB
- Ear Asymmetry: ${hearingProfile.asymmetry.hasAsymmetry ? `Yes (${hearingProfile.asymmetry.difference}dB difference)` : 'No'}
- Word Recognition Risk: ${hearingProfile.wordRecognitionRisk ? 'YES' : 'No'}
- Communication Difficulty: ${hearingProfile.estimatedCommunicationDifficulty}

LOCAL RECOMMENDATIONS:
${localRegimen.recommendations.map(r => `- ${r.name} (${r.priority} priority): ${r.rationale}`).join('\n')}

KEY INSIGHTS:
${localRegimen.keyInsights.join('\n')}

YOUR TASK:
1. Validate/enhance the recommended exercises with nuanced insights
2. Provide science-backed rationale for each exercise priority
3. Explain the neuroplasticity mechanisms expected to improve hearing
4. Personalize the insight to this specific patient's hearing loss pattern
5. Focus on exercises most likely to improve this patient's real-world communication

CRITICAL CONSTRAINT:
The patient can only do Vowel Discrimination, Consonant Contrast, and High Frequency Pulse exercises.
These are the ONLY available exercises. Build the plan around these three.
  `;

  const response = await ai.models.generateContent({
    model: getModelName(),
    contents: prompt,
    config: {
      systemInstruction: "You are a world-class Audiologist and Neuroscientist. Provide evidence-based, personalized auditory training recommendations. Always focus on neuroplasticity and real-world communication improvement.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dailyFocus: { type: Type.STRING },
          insight: { type: Type.STRING },
          exercises: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                science: { type: Type.STRING },
                durationMinutes: { type: Type.NUMBER },
                frequencyHz: { type: Type.NUMBER }
              },
              required: ["title", "description", "science", "durationMinutes"]
            }
          }
        },
        required: ["dailyFocus", "exercises", "insight"]
      }
    }
  });

  const responseText = response.text || '{}';
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch (parseErr) {
    throw new Error("Invalid JSON response from Gemini API");
  }

  if (!isValidAuditoryPlan(parsed)) {
    throw new Error("Response from Gemini API does not match expected structure");
  }

  return parsed as AuditoryPlan;
}

/**
 * Convert local regimen to AuditoryPlan format
 */
function convertRegimenToAuditoryPlan(
  regimen: ReturnType<typeof ExerciseRecommendationEngine.generateRegimen>,
  profile: ReturnType<typeof HearingProfileAnalyzer.analyzeProfile>
): AuditoryPlan {
  const exerciseMap: Record<number, { title: string; science: string }> = {
    1: {
      title: "Vowel Discrimination",
      science: "Vowels form the syllabic nucleus of speech and activate primary auditory cortex. Training improves formant frequency discrimination (F1, F2 position encoding).",
    },
    2: {
      title: "Consonant Contrast",
      science: "Consonants carry 60% of speech intelligibility. Speech-in-noise training activates dorsal auditory stream and improves temporal processing in superior temporal sulcus (STS).",
    },
    3: {
      title: "High Frequency Pulse",
      science: "High-frequency stimulation (8-16kHz) activates tonotopic regions of auditory cortex. Drives neuroplastic changes via long-term potentiation and sleep-dependent consolidation.",
    },
  };

  return {
    dailyFocus: regimen.dailyFocus,
    insight: `${profile.audiogramShape}. ${regimen.keyInsights[0] || 'Personalized training plan generated.'} Training duration: ${regimen.trainingDurationWeeks} weeks. ${regimen.warnings.length > 0 ? 'Clinical considerations: ' + regimen.warnings[0] : ''}`,
    exercises: regimen.recommendations.map(rec => ({
      title: exerciseMap[rec.exerciseId]?.title || `Exercise ${rec.exerciseId}`,
      description: rec.rationale,
      science: exerciseMap[rec.exerciseId]?.science || rec.focusArea,
      durationMinutes: rec.suggestedDuration,
      frequencyHz: rec.exerciseId === 3 ? 8000 : undefined,
    })),
  };
}
