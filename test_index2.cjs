const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const startStr = "const systemInstruction = `You are the Prompt Director inside a wildlife documentary production system.";
const startIndex = code.indexOf(startStr);

const chunk = code.substring(startIndex, startIndex + 10000);
console.log(chunk.substring(chunk.length - 200));

const testStr = "${continuityContext}";
console.log("IndexOf testStr:", chunk.indexOf(testStr));
console.log("Chars after testStr:", JSON.stringify(chunk.substring(chunk.indexOf(testStr), chunk.indexOf(testStr) + 25)));
