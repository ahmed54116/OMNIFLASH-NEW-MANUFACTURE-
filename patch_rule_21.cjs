const fs = require('fs');
let code = fs.readFileSync('serverGeminiService.ts', 'utf-8');

const target = 'A shot should visually answer: "What is happening?" or "Why does what the narrator just said matter?"';

const newRules = `
21. ABSTRACT CLAIM TRANSLATION RULE: When narration contains an abstract claim (blindness, danger, entrapment, impossibility, limitation, isolation, etc.), you MUST translate that claim into VISIBLE PHYSICAL EVIDENCE. 
- Example 1: "the cutter head is blind" -> show opaque slurry completely blocking visibility. 
- Example 2: "the rules of civil engineering break down" -> show a condition where normal engineering assumptions fail, like rapidly changing geology.
- Example 3: "the pressure will crush their physiology" -> show human vulnerability and extreme pressure differential, not just pressure against machinery.
- Example 4: "the machine cannot reverse" -> show the TBM physically trapped beneath the seabed with no visible escape path.
DO NOT repeat the nearest physical object mentioned in the narration unless that object visually proves the claim. ABSTRACT NARRATION MUST PRODUCE VISIBLE EVIDENCE.
22. FULL DICTIONARY REPLACEMENT (NO BARE NOUNS): You are currently failing to describe how machines look. If the JSON contains a description for a machine, equipment, or environment, you are STRICTLY FORBIDDEN from using just its name (e.g., "TBM"). You MUST replace the bare noun with its full physical description extracted from the JSON every single time (e.g., "a 14.57m Tunnel Boring Machine with a massive rotating steel cutterhead equipped with 19-inch steel disc cutters"). Use your 300-word limit to pack the prompt with these exact physical and mechanical details pulled directly from the Manufacturing JSON.`;

if (code.includes(target)) {
    code = code.split(target).join(target + newRules);
    fs.writeFileSync('serverGeminiService.ts', code);
    console.log("Patched serverGeminiService.ts with Rule 21 and 22.");
} else {
    console.log("Target not found!");
}
