const fs = require('fs');
let code = fs.readFileSync('types.ts', 'utf-8');

code = code.replace(/  animationPrompt\?: string;\n/g, '');
code = code.replace(/  generateImageAndAnimationPrompts: boolean;\n/g, '');

fs.writeFileSync('types.ts', code);
