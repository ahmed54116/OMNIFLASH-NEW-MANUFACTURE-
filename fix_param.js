const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf8');
code = code.replace(
  "clipNumber: number,\n  chunkText: string,",
  "chunkText: string,\n  clipNumber: number,"
);
fs.writeFileSync('services/geminiService.ts', code);
