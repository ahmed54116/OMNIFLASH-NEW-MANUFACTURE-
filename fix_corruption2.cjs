const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const corruptionMarker = " Type } from \"@google/genai\";";
const splitIndex = code.indexOf(corruptionMarker);

if (splitIndex !== -1) {
    const restOfFile = code.substring(splitIndex);
    const restoredPrePatch3 = "import { GoogleGenAI," + restOfFile;
    fs.writeFileSync('services/geminiService_restored.ts', restoredPrePatch3);
    console.log("Restored pre-patch3 file to geminiService_restored.ts");
} else {
    console.log("Could not find corruption marker");
}
