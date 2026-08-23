const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

// Update viewTab type
code = code.replace(/const \[viewTab, setViewTab\] = useState<'script' \| 'characters'>\('script'\);/, 
  "const [viewTab, setViewTab] = useState<'script' | 'characters' | 'continuity'>('script');");

// Update imports
if (!code.includes("import { ContinuityEngine }")) {
  code = code.replace(/import \{ CharacterEngine \} from '\.\/components\/CharacterEngine';/, 
    "import { CharacterEngine } from './components/CharacterEngine';\nimport { ContinuityEngine } from './components/ContinuityEngine';");
  // If it didn't work (which means regex didn't match), try adding near top
  if (!code.includes("import { ContinuityEngine }")) {
      code = code.replace(/import React/, "import { ContinuityEngine } from './components/ContinuityEngine';\nimport React");
  }
}
if (!code.includes("Database")) {
    code = code.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, "import { $1, Database } from 'lucide-react';");
}

// Add the tab button
const continuityTabBtn = `
                    <button
                      onClick={() => setViewTab('continuity')}
                      className={\`px-6 py-3 font-bold text-sm flex items-center gap-2 transition-all \${
                        viewTab === 'continuity' ? 'border-b-2 border-teal-500 text-teal-400' : 'text-gray-400 hover:text-gray-200'
                      }\`}
                    >
                      <Database size={16} /> CONTINUITY
                    </button>
`;
code = code.replace(/<Users size=\{16\} \/> CHARACTER CONSISTENCY\s*<\/button>/, 
  `<Users size={16} /> CHARACTER CONSISTENCY\n                    </button>` + continuityTabBtn);

// Add the tab content
const continuityTabContent = `
                  {viewTab === 'continuity' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <ContinuityEngine settings={settings} setSettings={setSettings} disabled={status !== GenerationStatus.IDLE} script={script} />
                    </div>
                  )}
`;
code = code.replace(/<CharacterEngine[^>]+ \/>\s*<\/div>\s*\)\}/, 
  `$&` + "\n" + continuityTabContent);

fs.writeFileSync('App.tsx', code);
console.log("App.tsx patched");
