const fs = require('fs');
let code = fs.readFileSync('types.ts', 'utf-8');

code = code.replace(/  visualPrompt: string;\n/g, "  visualPrompt: string;\n  animationPrompt?: string;\n");
code = code.replace(/  useEstablishingHook: boolean;\n/g, "  useEstablishingHook: boolean;\n  generateImageAndAnimationPrompts: boolean;\n");

fs.writeFileSync('types.ts', code);
console.log("Updated types.ts");
