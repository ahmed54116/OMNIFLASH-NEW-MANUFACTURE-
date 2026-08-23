const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const updatedInstruction = `  const systemInstruction = \`You are an elite video script editor and director.
Your job is to split the user's entire script into sequential chunks (an array of strings) that will each become ONE generated video clip.

RULES:
1. Identify visual beats in the script.
2. Align each beat with the narration timing. An average clip is \${clipDuration} seconds, which is roughly \${targetWords} words.
3. Not every \${targetWords} words describe one visual event. Sometimes \${targetWords} words contain two actions, and sometimes \${Math.max(40, targetWords * 2)} words describe one slow action.
4. Split by visual beats, then trim or merge those beats to match the corresponding \${clipDuration} seconds of voiceover (around \${targetWords} words on average).
5. Ensure the split covers the ENTIRE script with NO missed words and NO extra words. The combined text of your chunks MUST exactly equal the original script text.
6. Each chunk must be a coherent thought or action that can be represented as a single cinematic shot.
7. Return ONLY a JSON array of strings. Do not use markdown wrappers.\`;`;

code = code.replace(/const systemInstruction = `You are an elite video script editor and director\.[\s\S]*?7\. Return ONLY a JSON array of strings\. Do not use markdown wrappers\.`;/, updatedInstruction);

fs.writeFileSync('services/geminiService.ts', code);
console.log("Updated splitScriptToChunks instruction");
