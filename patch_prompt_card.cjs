const fs = require('fs');
let code = fs.readFileSync('components/PromptCard.tsx', 'utf-8');

code = code.replace(/            \{\/\* Animation Prompt \(if exists\) \*\/\}\n[\s\S]*?            \)}\n/g, '');

fs.writeFileSync('components/PromptCard.tsx', code);
