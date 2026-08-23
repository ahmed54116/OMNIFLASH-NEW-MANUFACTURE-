const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

code = code.replace(/const tab = storage\.getItem\('veo_main_'standard'_deprecated'\) \|\| 'standard';/g, "");

code = code.replace(/const saved = storage\.getItem\(`veo_\$\{tab\}_clipDuration`\) \|\| \(tab === 'standard' \? storage\.getItem\('veo_clipDuration'\) : null\);/g, 
"const saved = storage.getItem('veo_main_clipDuration') || storage.getItem('veo_clipDuration');");

code = code.replace(/const saved = storage\.getItem\(`veo_\$\{tab\}_outputFormat`\) \|\| \(tab === 'standard' \? storage\.getItem\('veo_outputFormat'\) : null\);/g, 
"const saved = storage.getItem('veo_main_outputFormat') || storage.getItem('veo_outputFormat');");

code = code.replace(/const saved = storage\.getItem\(`veo_\$\{tab\}_hasAnalyzedCast`\) \|\| \(tab === 'standard' \? storage\.getItem\('veo_hasAnalyzedCast'\) : null\);/g, 
"const saved = storage.getItem('veo_main_hasAnalyzedCast') || storage.getItem('veo_hasAnalyzedCast');");

code = code.replace(/const saved = storage\.getItem\(`veo_\$\{tab\}_clips`\) \|\| \(tab === 'standard' \? storage\.getItem\('veo_clips'\) : null\);/g, 
"const saved = storage.getItem('veo_main_clips') || storage.getItem('veo_clips');");

code = code.replace(/const data = \{ script, settings, clips, clipDuration, outputFormat, 'standard' \};/g, 
"const data = { script, settings, clips, clipDuration, outputFormat };");

code = code.replace(/if \(data\.'standard'\) set'standard'\(data\.'standard'\);/g, "");

fs.writeFileSync('App.tsx', code);
