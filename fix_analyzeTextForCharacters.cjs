const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const updatedInstruction = `  const systemInstruction = \`You are an elite Character Consistency parser. The user will provide a text which could be a raw script, lore, or a raw JSON array of character definitions. Extract all characters into a strict JSON array matching the schema. If the input is already a JSON of characters, map them directly into this schema accurately and efficiently.\`;`;

code = code.replace(/const systemInstruction = `Analyze the script and extract the main characters\. Provide a JSON array of character objects\.`;/, updatedInstruction);

fs.writeFileSync('services/geminiService.ts', code);
console.log("Updated analyzeTextForCharacters prompt");
