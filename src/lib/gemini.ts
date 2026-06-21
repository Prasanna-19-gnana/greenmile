import { GoogleGenAI } from '@google/genai';
import { RouteOption } from './routing';

// Initialize the Google Gen AI SDK
// It automatically picks up GEMINI_API_KEY from environment variables
const ai = new GoogleGenAI({});

export async function explainRoute(route: RouteOption): Promise<string> {
  // If no API key is set, fallback gracefully
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured.');
  }

  try {
    const prompt = `
You are a helpful transit assistant. Read the following route itinerary and explain it in clear, natural language.
Keep it concise, friendly, and to the point. Mention the total distance, time, and how much CO2 is saved compared to driving.
Do NOT invent any data; only use the data provided.

Route Label: ${route.label}
Total Distance: ${route.totalDistance.toFixed(1)} km
Total Time: ${Math.round(route.totalDuration)} min
Total CO2: ${route.totalCo2.toFixed(2)} kg

Itinerary Steps:
${route.legs.map((leg, index) => 
  `Step ${index + 1}: ${leg.mode.toUpperCase()} from ${leg.from.name} to ${leg.to.name} (${leg.distance.toFixed(1)} km)`
).join('\n')}

Please provide a short, single-paragraph summary of this journey.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || '';
  } catch (error) {
    console.error('Error generating Gemini explanation:', error);
    throw error;
  }
}
