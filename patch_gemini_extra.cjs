const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

code = code.replace(/const extraSettingsText = Object\.keys\(extraSettings\)\.length > 0/g,
"const extraSettingsText = (typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) ? '' : Object.keys(extraSettings).length > 0");

fs.writeFileSync('services/geminiService.ts', code);
console.log("Patched extraSettingsText");
