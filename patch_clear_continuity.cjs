const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

code = code.replace(/setSettings\(\{\n\s*visualStyle: '',/m, "setSettings({\n      visualStyle: '',\n      continuityJson: '',");

fs.writeFileSync('App.tsx', code);
console.log("Patched clear project continuity");
