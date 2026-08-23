const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

code = code.replace(/\\nexport const geminiService = \{\\n  analyzeContinuity,/g, "\nexport const geminiService = {\n  analyzeContinuity,");

fs.writeFileSync('services/geminiService.ts', code);
console.log("Fixed geminiService");
