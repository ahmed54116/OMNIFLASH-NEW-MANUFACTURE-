const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');
const corruptionMarker = " Type } from \"@google/genai\";";
const splitIndex = code.indexOf(corruptionMarker);
console.log(splitIndex);
