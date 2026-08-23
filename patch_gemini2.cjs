const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const extraSettingsContext = `
  const extraSettings = Object.keys(settings)
    .filter(k => !['visualStyle', 'colorPalette', 'mood', 'lighting', 'cameraStyle', 'cameraMovement', 'artKeywords', 'characters', 'isConsistencyEnabled', 'useEstablishingHook', 'protagonistLock', 'customInstructions'].includes(k))
    .reduce((obj, key) => {
      obj[key] = settings[key];
      return obj;
    }, {} as any);
  
  const extraSettingsText = Object.keys(extraSettings).length > 0 
    ? \`\\n==================================\\nADDITIONAL VISUAL CONSISTENCY JSON GUIDELINES\\n==================================\\n\${JSON.stringify(extraSettings, null, 2)}\\n\\nCRITICAL INSTRUCTION: You MUST strictly adhere to the guidelines and rules provided in the JSON above for every prompt. Ensure complete consistency with these instructions.\`
    : "";
`;

code = code.replace(/const charactersContext = settings\.characters\.length > 0/g, extraSettingsContext + "\n  const charactersContext = settings.characters.length > 0");

code = code.replace(/GLOBAL STYLE & DIRECTION:\\n- Visual Style: \$\{settings\.visualStyle\}\\n- Lighting: \$\{settings\.lighting\}\\n- Mood: \$\{settings\.mood\}\\n- Default Camera Style: \$\{settings\.cameraStyle\}\\n- Default Camera Movement: \$\{settings\.cameraMovement\}\\n- Color Palette: Primary \$\{settings\.colorPalette\?\.primary \|\| 'none'\}, Secondary \$\{settings\.colorPalette\?\.secondary \|\| 'none'\}, Accent \$\{settings\.colorPalette\?\.accent \|\| 'none'\}\\n- Extra Keywords: \$\{settings\.artKeywords \|\| 'None'\}\\n\$\{charactersContext\}/g, "GLOBAL STYLE & DIRECTION:\\n- Visual Style: ${settings.visualStyle}\\n- Lighting: ${settings.lighting}\\n- Mood: ${settings.mood}\\n- Default Camera Style: ${settings.cameraStyle}\\n- Default Camera Movement: ${settings.cameraMovement}\\n- Color Palette: Primary ${settings.colorPalette?.primary || 'none'}, Secondary ${settings.colorPalette?.secondary || 'none'}, Accent ${settings.colorPalette?.accent || 'none'}\\n- Extra Keywords: ${settings.artKeywords || 'None'}\\n${charactersContext}\\n${extraSettingsText}");

fs.writeFileSync('services/geminiService.ts', code);
