const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const injection = `\n\n\${!settings.generateImageAndAnimationPrompts ? "IMPORTANT: Generate a single, comprehensive visual_prompt. This prompt MUST describe both the visual scene AND the animation/movement/behavior within a single cohesive text block. DO NOT split them into separate prompts." : "IMPORTANT: Generate a visual prompt and a separate animation prompt."}`;

code = code.replace(/3\. NO GENERIC TERMS: Do not say "Good lighting"\. Say "\$\{settings\.lighting\}"\./, '3. NO GENERIC TERMS: Do not say "Good lighting". Say "${settings.lighting}".' + injection);

fs.writeFileSync('services/geminiService.ts', code);
console.log("Updated system instruction 2");
