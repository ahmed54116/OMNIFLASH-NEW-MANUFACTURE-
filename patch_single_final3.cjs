const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const startStr = "const systemInstruction = `You are the Prompt Director inside a wildlife documentary production system.";
const startIndex = code.indexOf(startStr);

// Find the first backtick and semicolon after continuityContext
const testStr = "${continuityContext}";
const testIndex = code.indexOf(testStr, startIndex);
const endIndex = code.indexOf("\`;", testIndex) + 2;

if (startIndex !== -1 && endIndex !== -1 && testIndex !== -1) {
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
` + code.substring(startIndex, endIndex) + `
  }
`;

    code = code.substring(0, startIndex) + manufacturingInstruction + code.substring(endIndex);
    fs.writeFileSync('services/geminiService.ts', code);
    console.log("Patched generateSingleClip");
} else {
    console.log("Could not find start or end index");
}
