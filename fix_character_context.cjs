const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const updatedCharactersContext = `
  const charactersContext = settings.characters.length > 0
    ? \\\`\\n==================================\\nCAST & CONSISTENCY (CRITICAL)\\n==================================\\n\${settings.characters.map(c => \\\`- [\${c.shortDescription}]: \${c.description} | Style: \${c.visualStyle} | Palette: \${c.colorPalette?.primary || 'none'}, \${c.colorPalette?.secondary || 'none'}, \${c.colorPalette?.accent || 'none'}\\\`).join('\\n')}\\n\\nCRITICAL INSTRUCTION FOR CHARACTERS: \\n1. Whenever a character appears in a clip, you MUST explicitly inject their FULL physical description (the text provided above) into the visual prompt. \\n2. Do NOT just refer to them by name or alias (e.g., do not just say "The Protagonist" or "John"). Video generators do not know who "John" is. They only know what you describe.\\n3. Replace the character's name with their detailed physical description seamlessly inside the prompt's sentences.\\\`
    : "";
`;

code = code.replace(
  /const charactersContext = settings\.characters\.length > 0\s*\? `\\n==================================\\nCAST & CONSISTENCY\\n==================================\\n\$\{settings\.characters\.map.*?`\s*: "";/s, 
  updatedCharactersContext.trim()
);

// Do the same for the batch prompt charactersContext

code = code.replace(
  /const charactersContext = settings\.characters\.length > 0\s*\? `CAST & CONSISTENCY:\n\$\{settings\.characters\.map.*?`\s*: "";/s,
  updatedCharactersContext.trim()
);


fs.writeFileSync('services/geminiService.ts', code);
console.log("Updated charactersContext");
