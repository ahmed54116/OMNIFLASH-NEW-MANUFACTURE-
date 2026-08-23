const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const batchStructure = `
PROMPT LENGTH LIMIT: The app NEVER writes a prompt that's more than 80-150 words. If it is inevitable and absolutely necessary, it can go up to 200 words. Keep it concise, punchy, and dense.

REQUIRED PROMPT STRUCTURE FOR visual_prompt (Follow EXACTLY in order):
1. VISUAL HOOK: The first sentence should instantly establish the frame.
2. PRIMARY SUBJECT: Only introduce what matters.
3. SUPPORTING SUBJECT: (If applicable).
4. ENVIRONMENT: Describe only what affects the shot. It must feel alive.
5. STARTING STATE: Where does the shot begin explicitly.
6. ONE CLEAR ACTION: One action only. Not five actions.
7. REALISTIC BEHAVIOR: Behavior > Appearance.
8. ENVIRONMENTAL INTERACTION: Everything interacts.
9. VISUAL PROGRESSION: The shot should evolve. Something changes.
10. VIEWER PERSPECTIVE: Tell Omni what the shot should feel like.
11. ENDING STATE: A natural destination for the frame.
12. DOCUMENTARY STYLE: Very short at the end.
13. NEGATIVE CONSTRAINTS: Always last.`;

code = code.replace(
  /For each clip, return its details matching the required schema. Ensure the array length is exactly \$\{chunks.length\}\./,
  `For each clip, return its details matching the required schema. Ensure the array length is exactly \$\{chunks.length\}.\n${batchStructure}`
);

fs.writeFileSync('services/geminiService.ts', code);
console.log("Updated batch prompt structure");
