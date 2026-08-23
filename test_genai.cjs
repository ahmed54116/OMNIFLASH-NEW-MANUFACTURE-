const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'fake' });
console.log(ai.models.generateContent);
