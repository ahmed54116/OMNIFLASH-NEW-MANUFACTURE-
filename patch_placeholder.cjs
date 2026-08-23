const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

code = code.replace(/placeholder="\[\{ \\"timestamp\\": \\"00:00\\", \\"text\\": \\"Script line 1\\" \}, \.\.\.\]"/g, "placeholder={'[{ \"timestamp\": \"00:00\", \"text\": \"Script line 1\" }, ...]'}");

fs.writeFileSync('App.tsx', code);
console.log("Patched placeholder");
