
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you might show a persistent error message.
  // For this environment, we'll log it and let the app proceed,
  // the API call will just fail.
  console.error("Gemini API key not found in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generatePerformanceRemark = async (memberName: string, attendanceSummary: string): Promise<string> => {
  if (!API_KEY) {
    return "API Key not configured. Could not generate remark.";
  }

  try {
    const prompt = `As a manager for the 'Vakratunda' group, write a concise and professional performance remark (1-2 sentences) for a member named ${memberName}. Be encouraging but factual based on their attendance. The summary is: "${attendanceSummary}"`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: prompt,
        config: {
          temperature: 0.5,
          topP: 0.95,
          topK: 64,
        }
    });

    return response.text || "";
  } catch (error) {
    console.error("Error generating performance remark:", error);
    return "Could not generate remark due to an API error.";
  }
};