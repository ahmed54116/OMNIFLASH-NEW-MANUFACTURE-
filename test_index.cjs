const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const startStr = "const systemInstruction = `You are the Prompt Director inside a wildlife documentary production system.";
const endStr = "${continuityContext}`;";

console.log("Start:", code.indexOf(startStr));
console.log("End:", code.indexOf(endStr, code.indexOf(startStr)));
