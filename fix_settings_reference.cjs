const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

code = code.replace(/\$\{settings\.continuityJson\}/g, "${typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : ''}");

fs.writeFileSync('services/geminiService.ts', code);
console.log("Fixed settings reference");
