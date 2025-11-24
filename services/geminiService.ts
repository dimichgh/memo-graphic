import { GoogleGenAI } from "@google/genai";

// Helper to ensure we get a fresh instance, especially important if key changes
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const ensureApiKeySelected = async (): Promise<boolean> => {
  if (window.aistudio) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
      return await window.aistudio.hasSelectedApiKey();
    }
    return true;
  }
  return true; // Fallback for environments without the selection UI
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  const ai = getAIClient();
  
  // Use Flash for fast, accurate transcription
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio
          }
        },
        {
          text: "Please transcribe this audio file accurately. Return only the transcript text, no additional commentary."
        }
      ]
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("No transcription generated.");
  }
  return text;
};

export const generateInfographic = async (transcript: string): Promise<string> => {
  // Ensure Key is selected because we are using the Pro Image model
  await ensureApiKeySelected();
  
  const ai = getAIClient();

  // "Nano Banana Pro" maps to gemini-3-pro-image-preview for high quality images
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        {
          text: `Create a professional, high-quality infographic image that visually summarizes the following text. 
          Use a clean layout, clear typography, and relevant icons or illustrations. 
          The style should be modern and suitable for a presentation or social media.
          
          Text to visualize:
          "${transcript}"`
        }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "3:4", // Portrait is better for infographics
        imageSize: "1K" // 2K/4K requires paid, 1K is safer for general usage but Pro supports higher
      }
    }
  });

  // Extract image
  if (response.candidates && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("No image generated from the response.");
};