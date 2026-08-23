const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

code = code.replace(/\\\`/g, '\`');
code = code.replace(/\`\\n==================================/g, '\`\\n==================================');

fs.writeFileSync('services/geminiService.ts', code);
console.log("Fixed backticks");
