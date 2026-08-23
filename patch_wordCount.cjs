const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

code = code.replace(/const wordCount = script\.trim\(\) \? script\.trim\(\)\.split\(\/\\\\s\+\/\)\.length : 0;/, 
"const wordCount = script.trim() ? script.trim().split(/\\s+/).length : (customSplitJson.trim() ? customSplitJson.split(/\\s+/).length : 0);");

fs.writeFileSync('App.tsx', code);
console.log("Patched wordCount");
