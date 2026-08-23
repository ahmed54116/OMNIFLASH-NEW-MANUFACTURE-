const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const oldUI = `                  {!isAnalysisComplete ? (
                    <button
                      onClick={handleAnalyzeScript}
                      disabled={!script.trim() || isAnalyzing}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                      {isAnalyzing ? <><Loader2 size={18} className="animate-spin" /> Analyzing...</> : "Analyze Script"}
                    </button>
                  ) : (`;

const newUI = `                  {!isAnalysisComplete ? (
                    (settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) ? (
                      <button
                        onClick={async () => {
                          await handleAnalyzeScript();
                          setCurrentStep(2);
                        }}
                        disabled={(!script.trim() && !customSplitJson.trim()) || isAnalyzing}
                        className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/30"
                      >
                        {isAnalyzing ? <><Loader2 size={18} className="animate-spin" /> Preparing...</> : "Parse JSON & Move to Step 2"}
                      </button>
                    ) : (
                      <button
                        onClick={handleAnalyzeScript}
                        disabled={(!script.trim() && !customSplitJson.trim()) || isAnalyzing}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        {isAnalyzing ? <><Loader2 size={18} className="animate-spin" /> Analyzing...</> : "Analyze Script"}
                      </button>
                    )
                  ) : (`;

if (code.includes(oldUI)) {
    code = code.replace(oldUI, newUI);
    fs.writeFileSync('App.tsx', code);
    console.log("Patched UI");
} else {
    console.log("Could not find old UI block");
}
