const fs = require('fs');
let code = fs.readFileSync('serverGeminiService.ts', 'utf-8');

const oldRules = `CRITICAL DIAGNOSTIC RULES FOR PROMPT GENERATION:
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
12. SHOT-LEVEL SEMANTICS: For every generated shot, define its Narrative Purpose, Primary Subject, Action, Environment, Technical Facts, Human Presence, Visual State, Cinematography, and Continuity.`;

const newRules = `CRITICAL DIAGNOSTIC RULES FOR PROMPT GENERATION (MANDATORY VALIDATION RULES):
1. TOPIC & NARRATION AWARE: For every shot, internally determine what exact statement, event, object, process, or consequence from the narration this shot is proving.
2. SCENE FUNCTION: What is the shot's unique Scene Function? Generic scene functions ("Show the TBM under pressure") are invalid. A valid Scene Function identifies the unique evidence (e.g., "Show compressed slurry physically filling the narrow shield-to-rock interface").
3. VISUAL VOCABULARY: Which Visual Vocabulary category is dominant? (MACHINE, PEOPLE, PROCESS, INFRASTRUCTURE, ENVIRONMENT, GEOGRAPHY, HUMAN CONSEQUENCE). Actively rotate dominant visual vocabulary. Do not allow long runs of identical categories (e.g. MACHINE -> MACHINE -> MACHINE).
4. SHOT DIVERSITY (DUPLICATE REJECTION): Is this shot genuinely visually different from nearby shots? Changing the camera angle, framing, or rewording identical underlying content does NOT make it a different shot. Compare the actual visual meaning against nearby shots. If redundant, transform it into different valid evidence from the Manufacturing JSON.
5. ESTABLISHING VS EXPLANATORY: Does the shot establish location, or does it explain a specific process/event? A shot that establishes where the viewer is must not be repeatedly used as an explanatory shot.
6. CONTINUITY VS REDUNDANCY: Preserve the Manufacturing JSON environment (darkness, murky water, TBM geometry) when locked. However, repeating the same environment does not make repeated visual content acceptable. The world may remain the same while the evidence must change.
7. INVISIBLE CONCEPTS REQUIRE VISIBLE EVIDENCE: Do not create multiple prompts that merely attempt to "visualize" abstract concepts (pressure, danger, difficulty, scale). Every abstract concept must be translated into a specific visible physical consequence.
8. LOCKED VS CREATIVE: What locked Manufacturing JSON facts must remain unchanged? What creative variables may change?
9. TEMPORAL PROGRESSION ENFORCEMENT: Where does this shot sit in the chronological visual progression? When several shots belong to one process, they must evolve (e.g. machine halted -> intervention prepared -> divers enter). Do not repeat the same state.
10. SHOT ALLOCATION: Does this shot deserve its own 7 seconds based on the importance of the narration?
11. STRONG POSITIVE SPECIFICATION: What positive, visible evidence must appear on screen? The positive section must clearly establish: one dominant subject, one dominant visual idea, one visible action/state, one primary piece of evidence, one appropriate composition, and one appropriate motion pattern. Do not rely solely on negative exclusion lists.
12. FINAL VALIDATION GATE: Before outputting, ask: "Could the viewer replace this shot with the previous shot without losing any unique visual information?" and "Is the only difference the wording or camera angle?" If yes, the shot MUST be revised or removed.

You have the authority to substantially rewrite, merge, or replace an incoming prompt if it violates these rules, as long as you preserve the locked Manufacturing JSON facts. If the JSON describes a place, a ship, or its structure in detail, you MUST put that exact descriptive structure directly into the prompt. Do not just use its name.`;

if (code.includes(oldRules)) {
    code = code.replace(oldRules, newRules);
    code = code.replace(oldRules, newRules); // Replace second instance
    fs.writeFileSync('serverGeminiService.ts', code);
    console.log("Patched serverGeminiService.ts with mandatory diagnostic rules");
} else {
    console.log("Could not find oldRules block");
}
