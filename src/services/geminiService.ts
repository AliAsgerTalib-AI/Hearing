import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface AuditoryPlan {
  dailyFocus: string;
  exercises: {
    title: string;
    description: string;
    science: string;
    durationMinutes: number;
    frequencyHz?: number;
  }[];
  insight: string;
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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

    return JSON.parse(response.text || '{}') as AuditoryPlan;
  } catch (error) {
    console.error("Gemini AI integration error:", error);
    return null;
  }
}
