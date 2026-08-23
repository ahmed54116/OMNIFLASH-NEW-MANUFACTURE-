const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

code = code.replace(/const systemInstruction = \`Regenerate the clip's prompt using the custom user instruction: \$\{instruction\}\. Follow the exact same schema and Director Score guidelines\.\`;/,
`const systemInstruction = \`Regenerate the clip's prompt using the custom user instruction: \${instruction}. Follow the exact same schema and Director Score guidelines. \${(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) ? "\\n\\n==================================\\nMANUFACTURING JSON (STRICT OVERRIDE)\\n==================================\\n" + settings.manufacturingJson + "\\n\\nCRITICAL INSTRUCTION: You MUST strictly adhere to the guidelines and rules provided in the Manufacturing JSON above." : ""}\`;`);

fs.writeFileSync('services/geminiService.ts', code);
console.log("Patched regenerateClip");
