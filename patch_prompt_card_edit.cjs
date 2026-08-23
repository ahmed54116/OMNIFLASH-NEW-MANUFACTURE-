const fs = require('fs');
let code = fs.readFileSync('components/PromptCard.tsx', 'utf8');

code = code.replace('{!isEditing && (', '{mode !== "prompt" && !isEditing && (');

fs.writeFileSync('components/PromptCard.tsx', code);
