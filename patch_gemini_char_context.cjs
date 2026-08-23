const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const newCharContext = "const charactersContext = settings.characters.length > 0\n" +
"    ? `\\n==================================\\nCAST & CONSISTENCY (CRITICAL)\\n==================================\\n${settings.characters.map(c => `- [${c.shortDescription}]: ${c.description} | Style: ${c.visualStyle} | Palette: ${c.colorPalette?.primary || 'none'}, ${c.colorPalette?.secondary || 'none'}, ${c.colorPalette?.accent || 'none'}`).join('\\n')}\\n\\nCRITICAL INSTRUCTION FOR CHARACTERS: \\n1. Whenever a character appears in a clip, you MUST explicitly describe them EXACTLY the same way using their FULL physical description, visual style, and color palette provided above. This is mandatory to maintain character consistency across all clips.\\n2. Do NOT just refer to them by name or alias (e.g., do not just say \\\"The Protagonist\\\" or \\\"John\\\"). Video generators do not know who \\\"John\\\" is.\\n3. Replace the character's name with their detailed physical description seamlessly inside the prompt's sentences.\\n4. Follow character consistency data and visual style data VERY STRICTLY.`\n" +
"    : \"\";";

code = code.replace(/const charactersContext = settings\.characters\.length > 0[\s\S]*?: "";/g, newCharContext);

fs.writeFileSync('services/geminiService.ts', code);
console.log("Updated char context");
