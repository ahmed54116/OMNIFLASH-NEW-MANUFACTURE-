const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

code = code.replace(/In the `visual_prompt` field/g, 'In the \\`visual_prompt\\` field');
code = code.replace(/In the \\`visual_prompt\\` field, you MUST directly incorporate and combine all the details from your \\`director_brain\\`/g, 'In the \\\\`visual_prompt\\\\` field, you MUST directly incorporate and combine all the details from your \\\\`director_brain\\\\`');

fs.writeFileSync('services/geminiService.ts', code);
console.log("Fixed escaping");
