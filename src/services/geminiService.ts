import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = (): string => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    console.warn("VITE_GEMINI_API_KEY not configured. AI training plan generation will be unavailable.");
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
  const prompt = `
    Based on the following binaural audiogram results and patient demographics, generate a 
    specialized "Auditory Synapse" training plan focused on neuroplasticity.
    
    Demographics:
    - Age: ${demographics?.age || 'Unknown'}
    - Biological Sex: ${demographics?.sex || 'Unknown'}

    Results:
    ${results.map(r => `- [${r.side}] ${r.freq}Hz: ${r.db}dB`).join('\n')}
    
    Note: Lower dB (0-20) is normal. High dB (60+) indicates significant hearing loss. 
    80dB at 8000Hz is a CRITICAL LOSS (not strong hearing).
    
    Provide a structured neuro-stimulation regimen that targets the weakest frequencies 
    and addresses any asymmetries between ears.
  `;

  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.error("Gemini API key not configured. Cannot generate auditory plan.");
      return null;
    }

    const response = await ai.models.generateContent({
      model: getModelName(),
      contents: prompt,
      config: {
        systemInstruction: "You are a world-class Audiologist and Neuroscientist specializing in Auditory Training and Brain-Ear connectivity.",
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

    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Gemini AI integration error:", message);
    return null;
  }
}
