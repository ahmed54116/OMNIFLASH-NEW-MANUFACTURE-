const fs = require('fs');
let code = fs.readFileSync('components/PromptCard.tsx', 'utf8');

// We'll replace the entire return block of PromptCard to respect `mode`.
// Actually, it's easier to use a regex or string replacement.

code = code.replace('{/* Storyboard / Director Brain View */}', '{mode !== "prompt" && (<>\n{/* Storyboard / Director Brain View */}');
code = code.replace('{/* The Final Prompt */}', '</>)}\n{mode !== "director" && (<>\n{/* The Final Prompt */}');
code = code.replace('</>\n        )}', '</>)}\n</>\n        )}');

fs.writeFileSync('components/PromptCard.tsx', code);
