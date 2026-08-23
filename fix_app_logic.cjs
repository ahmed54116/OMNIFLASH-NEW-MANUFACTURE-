const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

// Add isAnalysisComplete state
if (!code.includes("const [isAnalysisComplete")) {
  code = code.replace(
    "const [isAnalyzingCast, setIsAnalyzingCast] = useState(false);",
    "const [isAnalyzingCast, setIsAnalyzingCast] = useState(false);\n  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);\n  const [isAnalyzing, setIsAnalyzing] = useState(false);"
  );
}

const handleAnalyzeScriptCode = `
  const handleAnalyzeScript = async () => {
    if (!script.trim()) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      // Step 1: Split chunks
      const chunks = await geminiService.splitScriptToChunks(script, clipDuration, 'standard');
      setScriptChunks(chunks);
      
      // Step 2: Analyze characters
      if (!hasAnalyzedCast) {
        const chars = await geminiService.analyzeTextForCharacters(script, 'standard');
        if (chars.length > 0) {
          setSettings(prev => ({ ...prev, characters: [...prev.characters, ...chars] }));
          setHasAnalyzedCast(true);
        }
      }
      
      setIsAnalysisComplete(true);
    } catch (e: any) {
      setErrorMsg(e.message || "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };
`;

if (!code.includes("handleAnalyzeScript =")) {
  code = code.replace(/const handleInitialGenerate = async \(\) => \{/, handleAnalyzeScriptCode + "\n  const handleInitialGenerate = async () => {");
}

// Replace step 1 bottom button area
const step1BottomOld = `<button
                    onClick={() => {
                      setCurrentStep(2);
                      if (clips.length === 0 && status === GenerationStatus.IDLE) {
                        handleInitialGenerate();
                      }
                    }}
                    disabled={!script.trim()}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                  >
                    Proceed to Director Review <ArrowRight size={18} />
                  </button>`;

const step1BottomNew = `{!isAnalysisComplete ? (
                    <button
                      onClick={handleAnalyzeScript}
                      disabled={!script.trim() || isAnalyzing}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                      {isAnalyzing ? <><Loader2 size={18} className="animate-spin" /> Analyzing...</> : "Analyze Script"}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-2">
                        <div className="flex items-center gap-2 text-green-400 font-medium text-sm"><CheckCircle size={16}/> Script Loaded</div>
                        {settings.worldBuildingJson && <div className="flex items-center gap-2 text-green-400 font-medium text-sm"><CheckCircle size={16}/> World JSON Loaded</div>}
                        <div className="flex items-center gap-2 text-green-400 font-medium text-sm"><CheckCircle size={16}/> Estimated Duration: ~{metrics.estimatedDuration}s</div>
                        <div className="flex items-center gap-2 text-green-400 font-medium text-sm"><CheckCircle size={16}/> Estimated Clips: ~{metrics.estimatedClipCount}</div>
                        {settings.characters.length > 0 && <div className="flex items-center gap-2 text-green-400 font-medium text-sm"><CheckCircle size={16}/> {settings.characters.length} Creatures Detected</div>}
                        <div className="flex items-center gap-2 text-green-400 font-medium text-sm"><CheckCircle size={16}/> Director Planning Complete</div>
                      </div>
                      <button
                        onClick={() => {
                          setCurrentStep(2);
                          if (clips.length === 0 && status === GenerationStatus.IDLE) {
                            handleInitialGenerate();
                          }
                        }}
                        className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/30"
                      >
                        Generate Production Prompts <ArrowRight size={18} />
                      </button>
                    </div>
                  )}`;

// Let's use regex to replace step1BottomOld.
// Using a simpler replace.
code = code.replace(/<button[^>]*onClick=\{\(\) => \{\s*setCurrentStep\(2\);\s*if \(clips\.length === 0 && status === GenerationStatus\.IDLE\) \{\s*handleInitialGenerate\(\);\s*\}\s*\}\}[^>]*>[\s\S]*?<\/button>/, step1BottomNew);

fs.writeFileSync('App.tsx', code);
console.log("Updated App.tsx logic and step 1 button");
