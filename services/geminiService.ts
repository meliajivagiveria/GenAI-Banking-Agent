import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { BANKING_SYSTEM_INSTRUCTION } from '../constants';

const getClient = () => {
    // Ensure API Key is available
    if (!process.env.API_KEY) {
        throw new Error("API Key not found in environment variables.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const streamBankingResponse = async (
    userMessage: string, 
    history: { role: 'user' | 'model'; parts: { text: string }[] }[]
) => {
    const ai = getClient();
    
    // Using gemini-2.5-flash for speed and instruction following capabilities
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: BANKING_SYSTEM_INSTRUCTION,
            temperature: 0.3, // Low temperature for consistent banking outputs
        },
        history: history
    });

    try {
        const resultStream = await chat.sendMessageStream({ message: userMessage });
        return resultStream;
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};
