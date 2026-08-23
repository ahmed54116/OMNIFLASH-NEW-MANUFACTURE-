const fs = require('fs');
let code = fs.readFileSync('components/CharacterEngine.tsx', 'utf-8');

code = code.replace(
  "id: crypto.randomUUID()",
  "id: crypto.randomUUID(), colorPalette: { primary: '', secondary: '', accent: '' }"
);

fs.writeFileSync('components/CharacterEngine.tsx', code);
console.log("Import characters fixed.");
