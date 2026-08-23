const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

// Update viewTab type
code = code.replace(/useState\<'script' \| 'characters' \| 'continuity'\>\('script'\)/, 
"useState<'script' | 'characters' | 'continuity' | 'manufacturing'>('script')");

// Add initial value in setSettings in App.tsx
code = code.replace(/continuityJson: '',/g, "continuityJson: '',\n      manufacturingJson: '',");

const newTabBtn = `                    <button
                      onClick={() => setViewTab('manufacturing')}
                      className={\`pb-2 px-1 text-sm font-medium transition-colors \${
                        viewTab === 'manufacturing' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-gray-400 hover:text-gray-200'
                      }\`}
                    >
                      Manufacturing JSON
                    </button>
`;

code = code.replace(/(<button[\s\S]*?setViewTab\('continuity'\)[\s\S]*?<\/button>)/, "$1\n" + newTabBtn);

const newTabContent = `                  
                  {viewTab === 'manufacturing' && (
                    <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                          <FileJson size={16} className="text-orange-400" /> Manufacturing JSON (Overrides everything else)
                        </label>
                      </div>
                      <textarea
                        value={settings.manufacturingJson || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, manufacturingJson: e.target.value }))}
                        placeholder="Paste your Manufacturing JSON here..."
                        className="w-full h-[500px] bg-[#0f172a] border border-gray-700 rounded-lg p-4 text-gray-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none font-mono text-sm leading-relaxed"
                      />
                    </div>
                  )}
`;

code = code.replace(/({\s*viewTab === 'continuity' && \([\s\S]*?<\/div>\s*\)\s*})/, "$1\n" + newTabContent);

fs.writeFileSync('App.tsx', code);
console.log("Patched manufacturing tab in App.tsx");
