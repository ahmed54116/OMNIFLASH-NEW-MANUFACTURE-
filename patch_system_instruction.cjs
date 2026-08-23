const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

code = code.replace(/\$\{charactersContext\}\n\`;\n\n  try \{\n    const response/g, `\${charactersContext}\n\${extraSettingsText}\n\`;\n\n  try {\n    const response`);

fs.writeFileSync('services/geminiService.ts', code);
