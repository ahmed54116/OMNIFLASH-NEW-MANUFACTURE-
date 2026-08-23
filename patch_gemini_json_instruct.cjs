const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const newInstruction = `You are an elite cinematic director and AI video prompt engineer.
Your task is to generate visual prompts for a video clip.
MANUFACTURING JSON DETECTED. IGNORE DEFAULT GLOBAL STYLE.
==================================
MANUFACTURING JSON (STRICT OVERRIDE)
==================================
\${settings.manufacturingJson}

CRITICAL INSTRUCTION: You MUST strictly adhere to the guidelines and rules provided in the Manufacturing JSON above for EVERY prompt. All other style, character, and continuity guidelines are IGNORED in favor of this JSON.

*** ACTIVE JSON PARSING REQUIREMENT ***
When generating the prompt for the provided script chunk, you MUST:
1. Identify which "visual_beats" in the JSON's "visual_story_plan" align with the script chunk.
2. Extract the "must_show", "must_not_show", "environment_ids", and "semantic_alignment_terms" for that specific beat.
3. Cross-reference the "environments" and "facility_modules" in the JSON to find the EXACT technical specifications (e.g., "14.57m TBM", "8.5 bar", "191 MPa rock").
4. WEAVE THESE EXACT DETAILS explicitly into your generated visual prompt. Do NOT use generic terms if the JSON provides exact measurements, names, or structural conditions.

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
11. STRONG POSITIVE SPECIFICATION: Tell the model exactly what SHOULD be there instead of just relying on negative prompts. Include the exact data from the JSON (dimensions, terms).
12. SHOT-LEVEL SEMANTICS: For every generated shot, define its Narrative Purpose, Primary Subject, Action, Environment, Technical Facts, Human Presence, Visual State, Cinematography, and Continuity.

OUTPUT RULES:
1. JSON STRUCTURE: Output valid JSON exactly matching the schema.
2. SCRIPT SYNC: Use the provided script line exactly. DO NOT INVENT NEXT ACTIONS.`;

// Replace in generateSingleClip
let startIdx1 = code.indexOf('You are an elite cinematic director and AI video prompt engineer.');
let endIdx1 = code.indexOf('2. SCRIPT SYNC: Use the provided script line exactly. DO NOT INVENT NEXT ACTIONS.', startIdx1);
if (startIdx1 !== -1 && endIdx1 !== -1) {
    code = code.substring(0, startIdx1) + newInstruction + code.substring(endIdx1 + '2. SCRIPT SYNC: Use the provided script line exactly. DO NOT INVENT NEXT ACTIONS.'.length);
}

// Replace in generateClipBatch
let startIdx2 = code.indexOf('You are an elite cinematic director and AI video prompt engineer.', startIdx1 + 100);
let endIdx2 = code.indexOf('For each clip, return its details matching the required schema.', startIdx2);

const newInstructionBatch = `You are an elite cinematic director and AI video prompt engineer.
Your task is to generate visual prompts for a sequence of \${chunks.length} video clips (\${clipDuration} seconds each).

MANUFACTURING JSON DETECTED. IGNORE DEFAULT GLOBAL STYLE.
==================================
MANUFACTURING JSON (STRICT OVERRIDE)
==================================
\${settings.manufacturingJson}

CRITICAL INSTRUCTION: You MUST strictly adhere to the guidelines and rules provided in the Manufacturing JSON above for EVERY prompt. All other style, character, and continuity guidelines are IGNORED in favor of this JSON.

*** ACTIVE JSON PARSING REQUIREMENT ***
For EVERY clip, when analyzing its script chunk, you MUST:
1. Identify which "visual_beats" in the JSON's "visual_story_plan" align with the script chunk.
2. Extract the "must_show", "must_not_show", "environment_ids", and "semantic_alignment_terms" for that specific beat.
3. Cross-reference the "environments" and "facility_modules" in the JSON to find the EXACT technical specifications (e.g., "14.57m TBM", "8.5 bar", "191 MPa rock").
4. WEAVE THESE EXACT DETAILS explicitly into your generated visual prompt. Do NOT use generic terms if the JSON provides exact measurements, names, or structural conditions.

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
11. STRONG POSITIVE SPECIFICATION: Tell the model exactly what SHOULD be there instead of just relying on negative prompts. Include the exact data from the JSON (dimensions, terms).
12. SHOT-LEVEL SEMANTICS: For every generated shot, define its Narrative Purpose, Primary Subject, Action, Environment, Technical Facts, Human Presence, Visual State, Cinematography, and Continuity.

\${!settings.generateImageAndAnimationPrompts ? "IMPORTANT: Generate a single, comprehensive visual_prompt for each clip. This prompt MUST describe both the visual scene AND the animation/movement/behavior within a single cohesive text block. DO NOT split them." : "IMPORTANT: Generate a visual prompt and a separate animation prompt for each clip."}

INPUT SCRIPT CHUNKS:
\${inputData}

`;

if (startIdx2 !== -1 && endIdx2 !== -1) {
    code = code.substring(0, startIdx2) + newInstructionBatch + code.substring(endIdx2);
}

fs.writeFileSync('services/geminiService.ts', code);
console.log("Patched instructions");
