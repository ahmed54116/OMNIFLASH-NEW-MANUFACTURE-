const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const target = "const wordCount = script.trim() ? script.trim().split(/\\s+/).length : 0;";
const replacement = "const wordCount = script.trim() ? script.trim().split(/\\s+/).length : (customSplitJson.trim() ? customSplitJson.split(/\\s+/).length : 0);";
code = code.replace(target, replacement);

fs.writeFileSync('App.tsx', code);
console.log("Patched wordCount again");
