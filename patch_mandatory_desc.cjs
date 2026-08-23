const fs = require('fs');
let code = fs.readFileSync('serverGeminiService.ts', 'utf-8');

const oldRequirement = `4. WEAVE THESE EXACT DETAILS explicitly into your generated visual prompt. Do NOT use generic terms if the JSON provides exact measurements, names, or structural conditions.`;

const newRequirement = `4. WEAVE THESE EXACT DETAILS explicitly into your generated visual prompt. MANDATE COMPLETE DESCRIPTIONS: If the JSON describes a ship, place, equipment, or structure, you are STRICTLY FORCED to put that exact descriptive structure and its components directly into the prompt. NEVER just rely on its name. (e.g., Do NOT just say "The HMS Endeavour", say "The HMS Endeavour, a wooden-hulled sailing ship with three square-rigged masts and a reinforced bow..."). This is an absolute requirement.`;

if (code.includes(oldRequirement)) {
    code = code.replace(oldRequirement, newRequirement);
    code = code.replace(oldRequirement, newRequirement);
    fs.writeFileSync('serverGeminiService.ts', code);
    console.log("Patched serverGeminiService.ts with MANDATE COMPLETE DESCRIPTIONS");
} else {
    console.log("Could not find oldRequirement");
}
