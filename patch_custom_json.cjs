const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

// 1. Add state variable for customSplitJson
const customSplitJsonState = `
  const [customSplitJson, setCustomSplitJson] = useState(() => {
    return storage.getItem(\`veo_main_customSplitJson\`) || '';
  });
`;

code = code.replace(/const \[script, setScript\] = useState\(\(\) => \{/, customSplitJsonState + "\n  const [script, setScript] = useState(() => {");

// 2. Add useEffect for customSplitJson
code = code.replace(/useEffect\(\(\) => \{ storage\.setItem\(\`veo_main_script\`, script\); \}, \[script, 'standard'\]\);/, "useEffect(() => { storage.setItem(`veo_main_script`, script); }, [script, 'standard']);\n  useEffect(() => { storage.setItem(`veo_main_customSplitJson`, customSplitJson); }, [customSplitJson, 'standard']);");

// 3. Update handleAnalyzeScript logic
const targetHandleAnalyzeScript = `  const handleAnalyzeScript = async () => {
    if (!script.trim()) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      // Step 1: Split chunks
      const chunks = await geminiService.splitScriptToChunks(script, clipDuration, 'standard');
      setScriptChunks(chunks);
      
      // Step 2: Analyze characters
      if (!hasAnalyzedCast) {
        const chars = await geminiService.analyzeTextForCharacters(script, 'standard');`;

const newHandleAnalyzeScript = `  const handleAnalyzeScript = async () => {
    if (!script.trim() && !customSplitJson.trim()) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      // Step 1: Split chunks
      let chunks = [];
      if (customSplitJson.trim()) {
        try {
          const parsed = JSON.parse(customSplitJson);
          if (!Array.isArray(parsed)) throw new Error("Custom JSON must be an array of objects.");
          chunks = parsed.map(item => {
            const text = item.text || item.script || item.chunk || item.line || item.content;
            if (!text) return JSON.stringify(item);
            const timestamp = item.timestamp || item.start || item.time;
            return timestamp ? \`[\${timestamp}] \${text}\` : text;
          });
          if (chunks.length === 0) throw new Error("Custom JSON array is empty.");
        } catch (e) {
          throw new Error("Invalid Custom Split JSON: " + e.message);
        }
      } else {
        chunks = await geminiService.splitScriptToChunks(script, clipDuration, 'standard');
      }
      setScriptChunks(chunks);
      
      const scriptToAnalyze = script.trim() || chunks.join('\\n');

      // Step 2: Analyze characters
      if (!hasAnalyzedCast) {
        const chars = await geminiService.analyzeTextForCharacters(scriptToAnalyze, 'standard');`;

code = code.replace(targetHandleAnalyzeScript, newHandleAnalyzeScript);

// 4. Update the "disabled" conditions and UI logic where `!script.trim()` is checked.
code = code.replace(/disabled=\{\(!script\.trim\(\) \|\| isAnalyzing\)\}/g, "disabled={(!script.trim() && !customSplitJson.trim()) || isAnalyzing}");
code = code.replace(/script\.trim\(\)\.length > 0/g, "(script.trim().length > 0 || customSplitJson.trim().length > 0)");

// 5. Add the textarea for custom JSON
const targetTextarea = `                      <textarea
                        value={script}
                        onChange={(e) => setScript(e.target.value)}
                        placeholder="Paste your video script or voiceover here..."
                        className="w-full h-96 bg-[#0f172a] border border-gray-700 rounded-lg p-4 text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
                      />
                    </div>
                  )}
`;

const newTextarea = targetTextarea + `                  
                  {viewTab === 'script' && (
                    <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                          <FileJson size={16} className="text-purple-400" /> Pre-split JSON (Overrides Automatic Splitting)
                        </label>
                      </div>
                      <textarea
                        value={customSplitJson}
                        onChange={(e) => setCustomSplitJson(e.target.value)}
                        placeholder="[{ \\\"timestamp\\\": \\\"00:00\\\", \\\"text\\\": \\\"Script line 1\\\" }, ...]"
                        className="w-full h-32 bg-[#0f172a] border border-gray-700 rounded-lg p-4 text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none font-mono text-sm leading-relaxed"
                      />
                    </div>
                  )}
`;
code = code.replace(targetTextarea, newTextarea);

fs.writeFileSync('App.tsx', code);
console.log("Patched customSplitJson in App.tsx");
