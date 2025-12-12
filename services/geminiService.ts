import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Safely initialize the client only if the key is present. 
// In a real app, we'd handle the missing key more gracefully in the UI.
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const generatePostEnhancement = async (draft: string, type: string): Promise<string> => {
  if (!ai) {
    console.warn("Gemini API Key is missing.");
    return "API Key missing. Please configure your environment.";
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are an AI assistant for a community app called CommUnityLink.
      The user is drafting a post of type: "${type}".
      Here is their rough draft: "${draft}".
      
      Please rewrite this draft to be more engaging, polite, and clear for a neighborhood community.
      Keep it concise (under 100 words). Do not add hashtags.
      Return ONLY the refined text.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text?.trim() || draft;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return draft; // Fallback to original
  }
};

export const generateCommunityImage = async (prompt: string): Promise<string | null> => {
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: prompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        }
      }
    });

    // Extract image from response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
};

export const analyzeCommunityTrends = async (posts: string[]): Promise<string> => {
    if (!ai) return "AI services unavailable.";
    
    // Simulating usage for admin analytics insight
    try {
        const prompt = `
            Analyze these community post snippets and summarize the top 3 trends or concerns in one short paragraph:
            ${posts.join('\n')}
        `;
        const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: prompt
        });
        return response.text?.trim() || "No insights available.";
    } catch (e) {
        return "Could not analyze trends.";
    }
}

export const searchMapPlaces = async (query: string, userLocation?: { lat: number, lng: number }): Promise<{ text: string, chunks: any[] }> => {
  if (!ai) return { text: "AI service unavailable. Please check API Key.", chunks: [] };

  try {
    // Default to a generic location (e.g., San Francisco) if user location isn't provided
    // In a real scenario, this helps ground the query significantly.
    const lat = userLocation?.lat || 37.7749;
    const lng = userLocation?.lng || -122.4194;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find places or events matching "${query}" near me. Provide a helpful summary.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });

    return {
      text: response.text || "No results found.",
      // Return the grounding chunks which contain the specific map data/links
      chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Map Search Error:", error);
    return { text: "Could not perform search at this time.", chunks: [] };
  }
};