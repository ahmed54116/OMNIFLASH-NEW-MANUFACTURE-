const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const continuityInjectionStr = `
  const continuityContext = settings.continuityJson
    ? \`\\n==================================\\nCONTINUITY CONTEXT (CRITICAL)\\n==================================\\n\${settings.continuityJson}\\n\\nCRITICAL INSTRUCTION FOR CONTINUITY: \\n1. You must use the established continuity identifiers and state from this JSON.\\n2. Never contradict this continuity information.\\n3. Maintain environmental and object progression strictly as outlined.\`
    : "";
`;

// Insert it right before `const systemInstruction =`
code = code.replace(/const systemInstruction = /g, continuityInjectionStr + "\n  const systemInstruction = ");

// Now add it to the final prompt.
// Wait, the prompt template is down below. Let's find it.
code = code.replace(/\$\{charactersContext\}\n\$\{extraSettingsText\}/g, "${charactersContext}\n${extraSettingsText}\n${continuityContext}");

fs.writeFileSync('services/geminiService.ts', code);
console.log("Patched gemini context injection");
