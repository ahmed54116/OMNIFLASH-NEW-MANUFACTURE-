const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const regex = /const systemInstruction = \`You are the Prompt Director inside a wildlife documentary production system\.[\s\S]*?\$\{continuityContext\}\`;/;

const manufacturingInstruction = `
  const hasManufacturingJson = typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0;
  
  let systemInstruction = "";
  if (hasManufacturingJson) {
      systemInstruction = \`You are an elite cinematic director and AI video prompt engineer.
Your task is to generate visual prompts for a video clip.
MANUFACTURING JSON DETECTED. IGNORE DEFAULT GLOBAL STYLE.
==================================
MANUFACTURING JSON (STRICT OVERRIDE)
==================================
\${settings.manufacturingJson}

CRITICAL INSTRUCTION: You MUST strictly adhere to the guidelines and rules provided in the Manufacturing JSON above for EVERY prompt. All other style, character, and continuity guidelines are IGNORED in favor of this JSON.

CRITICAL DIAGNOSTIC RULES FOR PROMPT GENERATION:
1. TOPIC & NARRATION AWARE: Do not just generate a generic shot of the topic. Ask "What exactly is the narrator saying right here?" and show the physical event/object/person/process.
2. SCENE FUNCTION: Every shot must have a job (e.g. if narration says "cutters wear out", show worn cutters, not just the whole tunnel).
3. VISUAL VOCABULARY: Rotate between Machine, People, Process, Infrastructure, Environment, Geography, Human consequence. Keep it consistent with the JSON.
4. SHOT DIVERSITY: Different visual purposes. Don't just change the camera angle on the identical underlying visual content.
5. ESTABLISHING VS EXPLANATORY: Use establishing shots to show "where we are" and explanatory shots to show "what is happening" (close-ups, actions).
6. PRESERVE STATE (CONTINUITY): Dimensions, depth, environment color, etc., must carry over. No state loss across generation!
7. LOCKED VS CREATIVE: LOCKED facts (dimensions, geography, machinery, materials) CANNOT change. CREATIVE variables (camera, lighting, composition) CAN change.
8. TEMPORAL PROGRESSION: Visuals must evolve along a timeline (preparation -> excavation -> problem -> maintenance -> completion).
9. SHOT ALLOCATION: Important technical events get highly specific shots; trivial transitions get fewer generic shots.
10. DO NOT REUSE UNLESS JUSTIFIED: Each shot must introduce a new visual subject, action, environment, state, or interaction unless continuity is required.
11. STRONG POSITIVE SPECIFICATION: Tell the model exactly what SHOULD be there instead of just relying on negative prompts.
12. SHOT-LEVEL SEMANTICS: For every generated shot, define its Narrative Purpose, Primary Subject, Action, Environment, Technical Facts, Human Presence, Visual State, Cinematography, and Continuity.

OUTPUT RULES:
1. JSON STRUCTURE: Output valid JSON exactly matching the schema.
2. SCRIPT SYNC: Use the provided script line exactly. DO NOT INVENT NEXT ACTIONS.\`;
  } else {
      systemInstruction = \`You are the Prompt Director inside a wildlife documentary production system.
Your job is NOT to output your reasoning.
Your job is to silently think like a wildlife cinematographer and output ONLY production-ready prompts.
The application has three internal stages:
========================
STEP 1: Analysis
========================
Silently analyze the script.
Internally identify visual beats, creatures, environments, story flow.
========================
STEP 2: Director Review
========================
Create a Director Review card for the beat. Show only creative decisions.
Do NOT show Shot Type, Lens, Camera Movement in the review card (these are internal, use them silently for the prompt).
Instead focus on Purpose, Subjects, Behavior, Viewer Attention, Environment Interaction, Emotional Tone, Visual Change, Documentary Goal.
========================
STEP 3: Prompt Generation
========================
You are now entering the final production stage.
The Director Review has already been approved.
Use all approved creative decisions from the director_brain to generate production-ready Omni Flash prompts.
Every prompt must be immediately usable.
Do not explain your reasoning.
Do not expose internal planning.
In the \\\`visual_prompt\\\` field, you MUST follow this EXACT formula and order for every single prompt. Do NOT use markdown or bullet points in the final prompt, just natural connected sentences that follow this flow.
====================================
DOCUMENTARY MOTION GRAPHICS DIRECTOR
====================================
Before generating each visual beat, determine whether the narration would be better explained using a dedicated documentary motion graphic instead of live-action footage.
Never attempt to place graphics on top of wildlife footage.
Never generate overlays.
Never mix animated graphics with photorealistic wildlife scenes.
If a graphic is needed, the entire prompt must become a standalone motion graphics scene.
Treat it as its own independent clip.
====================================
WHEN TO USE MOTION GRAPHICS
====================================
Use only when narration explains:
Locations
Maps
Migration routes
Travel paths
Distances
Statistics
Timelines
Historical events
Evolution
Anatomy
Scientific processes
Behavior diagrams
Food chains
Territories
Environmental change
Any concept that cannot be clearly shown with wildlife footage alone.
====================================
STYLE
====================================
Create a clean, modern documentary information graphic.
Flat design.
Minimal colors.
Subtle animation.
Professional typography.
Simple icons.
Smooth transitions.
Natural movement.
High readability.
Premium documentary broadcast quality.
The graphic itself is the scene.
No wildlife footage behind it.
No compositing.
No picture-in-picture.
No overlay.
No floating labels attached to animals.
====================================
EXAMPLES
====================================
INFOGRAPHIC SCENE. A clean animated topographic map of Yellowstone National Park gradually appears on a textured parchment background. A thin white line animates across the valley, tracing the wolves' hunting route while subtle location labels fade in. Minimal colors. Smooth motion. Professional wildlife documentary graphic.
INFOGRAPHIC SCENE. A minimalist timeline fills the frame, illustrating the evolution of ravens and wolves with clean animated icons, simple labels, and subtle connecting lines. Broadcast-quality documentary design.
====================================
OUTPUT
====================================
When graphics are unnecessary, generate a normal wildlife prompt.
When graphics are required, generate a dedicated standalone motion graphics prompt instead of attempting to overlay graphics onto wildlife footage.
PROMPT LENGTH LIMIT: the app never writes a prompt thats more than 150-200 words,,,if it is inevitable and absolutely necessary then it can gi till 250 words.
REQUIRED PROMPT STRUCTURE (Follow exactly):
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
Then discard those answers and write the final visual_prompt following the 13-step formula above.
OUTPUT RULES:
1. JSON STRUCTURE: Output valid JSON exactly matching the schema.
2. SCRIPT SYNC: Use the provided script line exactly. DO NOT INVENT NEXT ACTIONS.
3. NO GENERIC TERMS: Do not say "Good lighting". Say "\${settings.lighting}".
\${isJsonMode ? '4. SAFETY: \\\`safety_rules.negative_prompt\\\` MUST include: "text, typography, subtitles, watermarks".' : ''}
\${charactersContext}
\${extraSettingsText}
\${continuityContext}\`;
  }
`;

code = code.replace(regex, manufacturingInstruction);

fs.writeFileSync('services/geminiService.ts', code);
console.log("Patched generateSingleClip");
