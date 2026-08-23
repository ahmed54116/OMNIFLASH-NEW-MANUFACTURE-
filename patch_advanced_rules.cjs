const fs = require('fs');
let code = fs.readFileSync('serverGeminiService.ts', 'utf-8');

const advancedRules = `
13. VIEWER-VISIBLE EVIDENCE REQUIREMENT: Diagnostic rule compliance must be based on viewer-visible evidence, not technical detail. "8.5 bar pressure against the machine" is invalid because it is not observable. "Slurry visibly compressed into the shield-to-rock interface" is valid. The revision phase must reduce technical description that does not change what the viewer sees. More technical words do not equal greater shot diversity.
14. SAME SUBJECT DIFFERENTIATION: When consecutive shots use the same primary location or machinery, the engine must require a meaningful change in visual evidence (e.g. FULL MACHINE SCALE -> CUTTER CONTACT DETAIL -> CUTTER WEAR). A repeated subject is allowed only when the new shot proves a different fact through a different visible mechanism.
15. INFRASTRUCTURE DUPLICATE DETECTION: If two prompts primarily show the same infrastructure (e.g., airlock, doors, gauges), they must be treated as potential duplicates even when different components are named, unless the visible action changes (e.g., PRESSURE_BOUNDARY vs LIFE_SUPPORT_SYSTEM vs CONTROL_OPERATION).
16. PROCESS SEQUENCE ENFORCEMENT: When two shots contain the same people performing related work, explicitly assign a process stage (PREPARATION -> POSITIONING -> TOOL ENGAGEMENT -> COMPONENT REMOVAL). Each stage must show a different visible action.
17. ATMOSPHERIC DESCRIPTION LIMIT: Do not repeatedly use environmental adjectives (darkness, mud, murky water) as the primary content of multiple consecutive shots. They must remain secondary unless the specific shot's unique evidence is directly about those conditions.
18. TECHNICAL CLAIM TRANSLATION: Before finalizing a shot, ask: "Can the viewer actually see this claim?" Priority is visible proof over descriptive technical narration (e.g., translate "MACHINE SCALE" to "human-to-machine comparison").
19. CONSECUTIVE SHOT REPLACEMENT TEST: For every pair of neighboring shots, ask: "If Shot B were removed, would Shot A already communicate essentially the same thing to the viewer?" If yes, Shot B must be substantially revised in primary visual evidence, process stage, dominant visual vocabulary, narrative purpose, physical interaction, or temporal state. Changing only camera framing or wording is not substantial revision.
20. NARRATION TO VISUAL CAUSALITY RULE (NO NOUN MATCHING): Before generating or revising, determine the exact claim being made by the narration. The visual must communicate the meaning, consequence, process, contrast, problem, solution, or event expressed by the narration. DO NOT generate a visual merely because it contains the same subject mentioned in the narration. Prioritize verbs, causality, and consequences over nouns. A shot should visually answer: "What is happening?" or "Why does what the narrator just said matter?"
`;

const target1 = '12. FINAL VALIDATION GATE: Before outputting, ask: "Could the viewer replace this shot with the previous shot without losing any unique visual information?" and "Is the only difference the wording or camera angle?" If yes, the shot MUST be revised or removed.';

if (code.includes(target1)) {
    code = code.split(target1).join(target1 + advancedRules);
    fs.writeFileSync('serverGeminiService.ts', code);
    console.log("Patched serverGeminiService.ts with advanced causality and evidence rules");
} else {
    console.log("Could not find validation gate");
}
