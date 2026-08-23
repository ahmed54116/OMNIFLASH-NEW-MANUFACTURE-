const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

// Fix visual_prompt escaping
code = code.replace(/In the `visual_prompt` field/g, 'In the \\`visual_prompt\\` field');

fs.writeFileSync('services/geminiService.ts', code);
console.log("Fixed visual_prompt backticks");
