const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

// Replace step definitions
code = code.replace(
  /{\s*num: 1 as const, label: 'Analyze'\s*},\s*{\s*num: 2 as const, label: 'Director Review'\s*},\s*{\s*num: 3 as const, label: 'Prompt Generation'\s*}/g,
  `{ num: 1 as const, label: 'Analyze Script' },
  { num: 2 as const, label: 'Generated Prompts' }`
);

// We need to fix the currentStep type
code = code.replace(/useState<1 \| 2 \| 3>\(1\)/g, "useState<1 | 2>(1)");

fs.writeFileSync('App.tsx', code);
console.log("Replaced steps");
