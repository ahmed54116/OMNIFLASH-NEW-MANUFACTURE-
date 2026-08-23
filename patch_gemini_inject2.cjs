const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

code = code.replace(/\$\{charactersContext\}\\n\$\{extraSettingsText\}/g, "${charactersContext}\\n${extraSettingsText}\\n${continuityContext}");

fs.writeFileSync('services/geminiService.ts', code);
console.log("Patched gemini context injection 2");
