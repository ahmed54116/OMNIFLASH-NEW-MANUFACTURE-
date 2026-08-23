const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const updatedFormula = `REQUIRED PROMPT STRUCTURE (Follow exactly):
1. VISUAL HOOK: The first sentence should instantly establish the frame (location, subject, mood).
2. PRIMARY SUBJECT & CHARACTER INJECTION: Only introduce what matters. IF a character is present, YOU MUST INJECT THEIR FULL DETAILED PHYSICAL DESCRIPTION here. Do not just say their name. Ensure the creature description from the character json is explicitly described in every single prompt so it remains consistent.
3. SUPPORTING SUBJECT: (If applicable).
4. ENVIRONMENT: Describe only what affects the shot. It must feel alive.
5. STARTING STATE: Where does the shot begin explicitly.
6. ONE CLEAR ACTION: One action only. Not five actions.
7. REALISTIC BEHAVIOR: Behavior > Appearance. (e.g. adjusts primary feathers, keeps head low).
8. ENVIRONMENTAL INTERACTION: Everything interacts. (e.g. paws compress the powder, wind moves feathers).
9. VISUAL PROGRESSION: The shot should evolve. Something changes. Beginning -> Middle -> End.
10. VIEWER PERSPECTIVE: Tell Omni what the shot should feel like (e.g. "The viewer quietly observes from high above"). Not just "Slow push".
11. ENDING STATE: A natural destination for the frame.
12. DOCUMENTARY STYLE: Very short at the end. YOU MUST INCLUDE THIS TEXT EXACTLY: "filmed on ARRI Alexa 65, visually indistinguishable from genuine wildlife documentary footage, no artificial CGI appearance".
13. NEGATIVE CONSTRAINTS: Always last. (e.g. "No text, no subtitles, no humans, no logos, no exaggerated expressions, no cartoon appearance").`;

code = code.replace(/REQUIRED PROMPT STRUCTURE \(Follow exactly\):[\s\S]*?13\. NEGATIVE CONSTRAINTS: Always last.*?\"\)\./g, updatedFormula);

const updatedBatchFormula = `REQUIRED PROMPT STRUCTURE FOR visual_prompt (Follow EXACTLY in order):
1. VISUAL HOOK: The first sentence should instantly establish the frame.
2. PRIMARY SUBJECT & CHARACTER INJECTION: Only introduce what matters. IF a character is present, YOU MUST INJECT THEIR FULL DETAILED PHYSICAL DESCRIPTION here. Do not just say their name. Ensure the creature description from the character json is explicitly described in every single prompt so it remains consistent.
3. SUPPORTING SUBJECT: (If applicable).
4. ENVIRONMENT: Describe only what affects the shot. It must feel alive.
5. STARTING STATE: Where does the shot begin explicitly.
6. ONE CLEAR ACTION: One action only. Not five actions.
7. REALISTIC BEHAVIOR: Behavior > Appearance.
8. ENVIRONMENTAL INTERACTION: Everything interacts.
9. VISUAL PROGRESSION: The shot should evolve. Something changes.
10. VIEWER PERSPECTIVE: Tell Omni what the shot should feel like.
11. ENDING STATE: A natural destination for the frame.
12. DOCUMENTARY STYLE: Very short at the end. YOU MUST INCLUDE THIS TEXT EXACTLY: "filmed on ARRI Alexa 65, visually indistinguishable from genuine wildlife documentary footage, no artificial CGI appearance".
13. NEGATIVE CONSTRAINTS: Always last.\`;`;

code = code.replace(/REQUIRED PROMPT STRUCTURE FOR visual_prompt \(Follow EXACTLY in order\):[\s\S]*?13\. NEGATIVE CONSTRAINTS: Always last\.\`;/, updatedBatchFormula);

fs.writeFileSync('services/geminiService.ts', code);
console.log("Updated formulas 3");
