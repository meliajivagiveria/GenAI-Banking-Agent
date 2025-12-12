import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { BANKING_SYSTEM_INSTRUCTION } from '../constants';

const getClient = () => {
    let apiKey = '';

    // 1. Try standard process.env (Node.js/Webpack/CRA)
    // The polyfill in index.html ensures process.env exists, preventing crashes
    try {
        if (typeof process !== 'undefined' && process.env) {
            apiKey = process.env.API_KEY || process.env.REACT_APP_API_KEY;
        }
    } catch (e) {
        // Ignore errors accessing process
    }

    // 2. Try import.meta.env (Vite/Modern Netlify builds)
    // This is crucial for Netlify + Vite deployments where process.env is not replaced
    try {
        // @ts-ignore - Check if we are in a module environment supporting import.meta
        if (!apiKey && typeof import.meta !== 'undefined' && import.meta.env) {
             // @ts-ignore
             apiKey = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;
        }
    } catch (e) {
        // Ignore errors accessing import.meta
    }

    if (!apiKey) {
        throw new Error("API Key is missing. Please set 'VITE_API_KEY' or 'API_KEY' in your Netlify Environment Variables.");
    }

    return new GoogleGenAI({ apiKey });
};

export const streamBankingResponse = async (
    userMessage: string, 
    history: { role: 'user' | 'model'; parts: { text: string }[] }[]
) => {
    const ai = getClient();
    
    // Using gemini-2.5-flash for speed
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: BANKING_SYSTEM_INSTRUCTION,
            temperature: 0.1, // Lower temperature for highly deterministic banking routing
            // Relax safety filters to allow financial simulation terms (like "transfer", "money")
            safetySettings: [
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
            ]
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