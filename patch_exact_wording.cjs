const fs = require('fs');
let code = fs.readFileSync('serverGeminiService.ts', 'utf-8');

const targetStr = `4. WEAVE THESE EXACT DETAILS explicitly into your generated visual prompt. MANDATE COMPLETE DESCRIPTIONS: If the JSON describes a ship, place, equipment, or structure, you are STRICTLY FORCED to put that exact descriptive structure and its components directly into the prompt. NEVER just rely on its name. (e.g., Do NOT just say "The HMS Endeavour", say "The HMS Endeavour, a wooden-hulled sailing ship with three square-rigged masts and a reinforced bow..."). This is an absolute requirement.`;

const newStr = `4. WEAVE THESE EXACT DETAILS explicitly into your generated visual prompt. MANDATE COMPLETE DESCRIPTIONS: If the JSON describes a machine, ship, place, equipment, or structure, you are STRICTLY FORCED to put that exact descriptive structure and its components directly into the prompt. 

*** ABSOLUTE MACHINE DESCRIPTION RULE ***
NEVER EVER put a machine name without describing how it looks from the manufacturing JSON. You MUST take the EXACT WORDING from the manufacturing JSON and put it with the name AS MANY TIMES AS IT APPEARS STRICTLY. Do not summarize the physical appearance. COPY AND PASTE the full physical description of the machine/equipment from the JSON into the prompt every single time the machine is mentioned. Use your large word count capacity to ensure these descriptions are massive, robust, and exactly parse the JSON's appearance descriptions.`;

if(code.includes(targetStr)) {
  code = code.split(targetStr).join(newStr);
  fs.writeFileSync('serverGeminiService.ts', code);
  console.log("Patched exact wording rule!");
} else {
  console.log("Target string not found.");
}
