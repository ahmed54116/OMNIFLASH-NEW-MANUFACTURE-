const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

// Remove activeTab and replace with viewTab for UI only.
// First, find and replace the state definition:
code = code.replace(
  "const [activeTab, setActiveTab] = useState<'standard' | 'creature'>(() => {",
  "const [viewTab, setViewTab] = useState<'script' | 'characters'>('script');\n  const [activeTab, setActiveTab] = useState<'standard' | 'creature'>(() => {"
);

// We actually want to remove activeTab completely to prevent bugs, but let's just force activeTab to be 'standard' and remove its usage from local storage keys.
code = code.replace(/veo_\$\{activeTab\}_/g, 'veo_main_');
code = code.replace(/veo_activeTab/g, 'veo_main_activeTab_deprecated');

// Remove handleTabChange
const handleTabChangeOld = `const handleTabChange = (tab: 'standard' | 'creature') => {
    setActiveTab(tab);
    setScript(storage.getItem(\`veo_main_script\`) || '');
    const savedSettings = storage.getItem(\`veo_main_settings\`);
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    const savedClips = storage.getItem(\`veo_main_clips\`);
    if (savedClips) setClips(JSON.parse(savedClips));
    setClipDuration(Number(storage.getItem(\`veo_main_clipDuration\`)) || 5);
    setOutputFormat((storage.getItem(\`veo_main_outputFormat\`) as OutputFormat) || 'standard');
    setHasAnalyzedCast(JSON.parse(storage.getItem(\`veo_main_hasAnalyzedCast\`) || 'false'));
  };`;

code = code.replace(/const handleTabChange = [\s\S]*?};\n/, '');

// Fix the tabs UI in Step 1
const oldTabsUI = `<div className="bg-[#1e293b] rounded-xl p-1 shadow-lg border border-gray-800 inline-flex">
              <button
                onClick={() => handleTabChange('standard')}
                className={\`px-8 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-2 \${
                  activeTab === 'standard' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
                }\`}
              >
                <Video size={16} /> STANDARD VIDEO
              </button>
              <button
                onClick={() => handleTabChange('creature')}
                className={\`px-8 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-2 \${
                  activeTab === 'creature' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
                }\`}
              >
                <Users size={16} /> CHARACTER CONSISTENCY
              </button>
            </div>`;

const newTabsUI = ``; // We remove the top tabs and put them inside the script box

code = code.replace(oldTabsUI, newTabsUI);

// Update the left column (Script + Characters)
const oldLeftCol = `<div className="lg:col-span-2 space-y-6">
                <div className="bg-[#1e293b] rounded-xl p-6 shadow-xl border border-gray-800">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <FileText className="text-blue-400" />
                      {activeTab === 'standard' ? 'Video Script' : 'Character Script'}
                    </h2>
                    <span className="text-xs font-medium px-2 py-1 bg-gray-800 rounded text-gray-400">
                      {wordCount} words
                    </span>
                  </div>
                  <textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder="Paste your video script or voiceover here..."
                    className="w-full h-64 bg-[#0f172a] border border-gray-700 rounded-lg p-4 text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                  
                  {activeTab === 'creature' && (
                    <div className="mt-4 flex justify-between items-center bg-[#0f172a] p-4 rounded-lg border border-purple-900/30">
                      <div>
                        <h3 className="font-bold text-purple-400 flex items-center gap-2">
                          <UserCheck size={18} /> Cast Analysis
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">Extract characters to maintain consistency.</p>
                      </div>
                      <button
                        onClick={handleAnalyzeCast}
                        disabled={isAnalyzingCast || !script.trim() || status !== GenerationStatus.IDLE}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg transition-all flex items-center gap-2"
                      >
                        {isAnalyzingCast ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : <><Search size={16} /> Analyze Cast</>}
                      </button>
                    </div>
                  )}
                </div>
                <StyleEngine settings={settings} setSettings={setSettings} />
              </div>`;

const newLeftCol = `<div className="lg:col-span-2 space-y-6">
                <div className="bg-[#1e293b] rounded-xl p-6 shadow-xl border border-gray-800">
                  <div className="flex border-b border-gray-700 mb-6">
                    <button
                      onClick={() => setViewTab('script')}
                      className={\`px-6 py-3 font-bold text-sm flex items-center gap-2 transition-all \${
                        viewTab === 'script' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-gray-200'
                      }\`}
                    >
                      <Video size={16} /> VIDEO SCRIPT
                    </button>
                    <button
                      onClick={() => setViewTab('characters')}
                      className={\`px-6 py-3 font-bold text-sm flex items-center gap-2 transition-all \${
                        viewTab === 'characters' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-gray-200'
                      }\`}
                    >
                      <Users size={16} /> CHARACTER CONSISTENCY
                    </button>
                  </div>
                  
                  {viewTab === 'script' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium px-2 py-1 bg-gray-800 rounded text-gray-400">
                          {wordCount} words
                        </span>
                      </div>
                      <textarea
                        value={script}
                        onChange={(e) => setScript(e.target.value)}
                        placeholder="Paste your video script or voiceover here..."
                        className="w-full h-96 bg-[#0f172a] border border-gray-700 rounded-lg p-4 text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
                      />
                    </div>
                  )}

                  {viewTab === 'characters' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="flex justify-between items-center bg-[#0f172a] p-4 rounded-lg border border-purple-900/30">
                        <div>
                          <h3 className="font-bold text-purple-400 flex items-center gap-2">
                            <UserCheck size={18} /> Cast Analysis
                          </h3>
                          <p className="text-sm text-gray-400 mt-1">Automatically extract characters from your video script to maintain consistency.</p>
                        </div>
                        <button
                          onClick={handleAnalyzeCast}
                          disabled={isAnalyzingCast || !script.trim() || status !== GenerationStatus.IDLE}
                          className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg transition-all flex items-center gap-2"
                        >
                          {isAnalyzingCast ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : <><Search size={16} /> Extract Cast</>}
                        </button>
                      </div>
                      <CharacterEngine settings={settings} setSettings={setSettings} disabled={status !== GenerationStatus.IDLE} script={script} mode="standard" />
                    </div>
                  )}
                </div>
                <StyleEngine settings={settings} setSettings={setSettings} disabled={status !== GenerationStatus.IDLE} />
              </div>`;

if (code.includes('lg:col-span-2 space-y-6')) {
  code = code.substring(0, code.indexOf('<div className="lg:col-span-2 space-y-6">')) + newLeftCol + code.substring(code.indexOf('</div>', code.indexOf('<StyleEngine')) + 6);
}

// Remove the old CharacterEngine render in the right column
const oldCharEngineRender = `{activeTab === 'creature' && (
                  <CharacterEngine settings={settings} setSettings={setSettings} />
                )}`;
code = code.replace(oldCharEngineRender, '');

// Clean up references to activeTab
code = code.replace(/activeTab === 'standard'/g, "true");
code = code.replace(/activeTab === 'creature'/g, "false");
code = code.replace(/activeTab/g, "'standard'");

fs.writeFileSync('App.tsx', code);
