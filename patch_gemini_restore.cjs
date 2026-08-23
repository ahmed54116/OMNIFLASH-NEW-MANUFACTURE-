const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

// remove DOCUMENTARY VISUALIZATION DIRECTOR entirely
code = code.replace(/==================================\nDOCUMENTARY VISUALIZATION DIRECTOR[\s\S]*?(?=OUTPUT RULES:|PROMPT LENGTH LIMIT:)/g, "");

fs.writeFileSync('services/geminiService.ts', code);
console.log("Cleaned visualization director");
