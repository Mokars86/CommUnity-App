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
