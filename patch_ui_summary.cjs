const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

code = code.replace(/<CheckCircle className=\{script\.trim\(\) \? "text-green-500" : "text-gray-600"\} size=\{16\} \/>/g,
'<CheckCircle className={(script.trim() || customSplitJson.trim()) ? "text-green-500" : "text-gray-600"} size={16} />');

code = code.replace(/<span className=\{script\.trim\(\) \? "text-gray-200" : "text-gray-500"\}>Script Loaded \(\{wordCount\} words\)<\/span>/g,
'<span className={(script.trim() || customSplitJson.trim()) ? "text-gray-200" : "text-gray-500"}>Script/JSON Loaded ({wordCount} words)</span>');

fs.writeFileSync('App.tsx', code);
console.log("Patched UI Summary");
