const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

// For generateSingleClip
const singleClipInject = `
  const charactersContext = settings.characters.length > 0
    ? \`\\n==================================\\nCAST & CONSISTENCY\\n==================================\\n\${settings.characters.map(c => \`- [\${c.shortDescription}]: \${c.description} | Style: \${c.visualStyle} | Palette: \${c.colorPalette?.primary || 'none'}, \${c.colorPalette?.secondary || 'none'}, \${c.colorPalette?.accent || 'none'}\`).join('\\n')}\\nIMPORTANT: You MUST inject the full physical description of the characters into the prompt wherever they appear. Do not just use their name. Explicitly describe their appearance in the prompt so the video generator knows exactly what they look like.\`
    : "";
`;

code = code.replace(
  /const systemInstruction = \`You are the Prompt Director inside a wildlife documentary production system\./,
  singleClipInject.trim() + "\n  const systemInstruction = `You are the Prompt Director inside a wildlife documentary production system."
);

code = code.replace(
  /\$\{isJsonMode \? '4\. SAFETY: `safety_rules\.negative_prompt` MUST include: "text, typography, subtitles, watermarks"\.' : ''\}/,
  "${isJsonMode ? '4. SAFETY: `safety_rules.negative_prompt` MUST include: \"text, typography, subtitles, watermarks\".' : ''}\n${charactersContext}"
);

// For generateClipBatch
code = code.replace(
  /Important: When generating prompts, refer to characters consistently by their descriptions and visual attributes\.`/,
  "IMPORTANT: You MUST inject the full physical description of the characters into the prompt wherever they appear. Do not just use their name. Explicitly describe their appearance in the prompt so the video generator knows exactly what they look like.`"
);

fs.writeFileSync('services/geminiService.ts', code);
console.log("Updated geminiService character contexts");
