const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const newInstruction = `========================
STEP 3: Prompt Generation
========================
You are now entering the final production stage.
The Director Review has already been approved.
Use all approved creative decisions from the director_brain to generate production-ready Omni Flash prompts.

Every prompt must be immediately usable.
Do not explain your reasoning.
Do not expose internal planning.

In the \`visual_prompt\` field, you MUST follow this EXACT formula and order for every single prompt. Do NOT use markdown or bullet points in the final prompt, just natural connected sentences that follow this flow.

PROMPT LENGTH LIMIT: The app NEVER writes a prompt that's more than 80-150 words. If it is inevitable and absolutely necessary, it can go up to 200 words. Keep it concise, punchy, and dense.

REQUIRED PROMPT STRUCTURE (Follow exactly):
1. VISUAL HOOK: The first sentence should instantly establish the frame (location, subject, mood).
2. PRIMARY SUBJECT: Only introduce what matters. (e.g. "The mature Common Raven maintains a steady glide...")
3. SUPPORTING SUBJECT: (If applicable).
4. ENVIRONMENT: Describe only what affects the shot. It must feel alive.
5. STARTING STATE: Where does the shot begin explicitly.
6. ONE CLEAR ACTION: One action only. Not five actions.
7. REALISTIC BEHAVIOR: Behavior > Appearance. (e.g. adjusts primary feathers, keeps head low).
8. ENVIRONMENTAL INTERACTION: Everything interacts. (e.g. paws compress the powder, wind moves feathers).
9. VISUAL PROGRESSION: The shot should evolve. Something changes. Beginning -> Middle -> End.
10. VIEWER PERSPECTIVE: Tell Omni what the shot should feel like (e.g. "The viewer quietly observes from high above"). Not just "Slow push".
11. ENDING STATE: A natural destination for the frame.
12. DOCUMENTARY STYLE: Very short at the end (e.g. "BBC Planet Earth documentary realism, natural winter lighting, physically accurate wildlife behavior, photorealistic").
13. NEGATIVE CONSTRAINTS: Always last. (e.g. "No text, no subtitles, no humans, no logos, no exaggerated expressions, no cartoon appearance").

DIRECTOR BRAIN FORMULA:
Before writing each prompt, silently answer these questions in your head (do NOT output the answers):
- Why does this shot exist? (Storytelling)
- What is the visual event? (Main action)
- What changes? (Beginning -> Ending)
- What should the viewer notice first? (Focus)
- What should they notice last? (Ending)
- What behavior sells realism? (Animal authenticity)
- How does the environment react? (Cinematic realism)
- What emotion should the viewer feel? (Mood)
- Why is this perspective the best? (Camera intent)
Then discard those answers and write the final visual_prompt following the 13-step formula above.`;

const regex = /========================\nSTEP 3: Prompt Generation[\s\S]*?(?=OUTPUT RULES:)/g;

code = code.replace(regex, newInstruction + '\n\n');

fs.writeFileSync('services/geminiService.ts', code);
console.log("Updated prompt structure");
