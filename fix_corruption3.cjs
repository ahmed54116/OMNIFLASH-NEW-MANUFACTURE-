const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const corruptionMarker = " Type } from \"@google/genai\";";
const firstIndex = code.indexOf(corruptionMarker);
const splitIndex = code.indexOf(corruptionMarker, firstIndex + 1);

if (splitIndex !== -1) {
    const restOfFile = code.substring(splitIndex);
    const restoredPrePatch3 = "import { GoogleGenAI," + restOfFile;
    fs.writeFileSync('services/geminiService.ts', restoredPrePatch3);
    console.log("Restored properly!");
} else {
    console.log("Could not find second corruption marker");
}
