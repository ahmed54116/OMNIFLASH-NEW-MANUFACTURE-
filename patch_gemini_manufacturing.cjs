const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

// A helper function to replace the context generation in geminiService
function injectManufacturingLogic(funcBody) {
  // We need to inject manufacturing context logic just before charactersContext
  const injection = `
  const hasManufacturingJson = typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0;
  const manufacturingContext = hasManufacturingJson 
    ? \`\\n==================================\\nMANUFACTURING JSON (STRICT OVERRIDE)\\n==================================\\n\${settings.manufacturingJson}\\n\\nCRITICAL INSTRUCTION: You MUST strictly adhere to the guidelines and rules provided in the Manufacturing JSON above for EVERY prompt. All other style, character, and continuity guidelines are IGNORED in favor of this JSON. Put the stuff in prompts exactly like it instructs.\`
    : "";
`;
  return funcBody.replace(/(const charactersContext = )/, injection + "\n  $1");
}

code = code.replace(/const extraSettingsText =([\s\S]*?);/, "const extraSettingsText = (typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) ? '' : $1;");

code = code.replace(/const charactersContext = settings\.characters\.length > 0/g, "const charactersContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && settings.characters.length > 0)");
code = code.replace(/const continuityContext = \(typeof settings !== 'undefined' && settings\.continuityJson \? settings\.continuityJson : null\)/g, "const continuityContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : null)");

const globalStyleTarget = `GLOBAL STYLE & DIRECTION:\\n- Visual Style: \${settings.visualStyle}\\n- Lighting: \${settings.lighting}\\n- Mood: \${settings.mood}\\n- Default Camera Style: \${settings.cameraStyle}\\n- Default Camera Movement: \${settings.cameraMovement}\\n- Color Palette: Primary \${settings.colorPalette?.primary || 'none'}, Secondary \${settings.colorPalette?.secondary || 'none'}, Accent \${settings.colorPalette?.accent || 'none'}\\n- Extra Keywords: \${settings.artKeywords || 'None'}\\n\${charactersContext}\\n\${extraSettingsText}\\n\${continuityContext}`;

const globalStyleReplacement = `\${(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) ? \`MANUFACTURING JSON DETECTED. IGNORE DEFAULT GLOBAL STYLE.\\n\\n==================================\\nMANUFACTURING JSON (STRICT OVERRIDE)\\n==================================\\n\${settings.manufacturingJson}\\n\\nCRITICAL INSTRUCTION: You MUST strictly adhere to the guidelines and rules provided in the Manufacturing JSON above for EVERY prompt. All other style, character, and continuity guidelines are IGNORED in favor of this JSON. Put the stuff in prompts exactly like it instructs.\\n\` : \`GLOBAL STYLE & DIRECTION:\\n- Visual Style: \${settings.visualStyle}\\n- Lighting: \${settings.lighting}\\n- Mood: \${settings.mood}\\n- Default Camera Style: \${settings.cameraStyle}\\n- Default Camera Movement: \${settings.cameraMovement}\\n- Color Palette: Primary \${settings.colorPalette?.primary || 'none'}, Secondary \${settings.colorPalette?.secondary || 'none'}, Accent \${settings.colorPalette?.accent || 'none'}\\n- Extra Keywords: \${settings.artKeywords || 'None'}\\n\${charactersContext}\\n\${extraSettingsText}\\n\${continuityContext}\`}`;

code = code.replace(new RegExp(globalStyleTarget.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), "g"), globalStyleReplacement);

fs.writeFileSync('services/geminiService.ts', code);
console.log("Patched geminiService.ts");
