const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

code = code.replace("Back to Director Review", "Back to Analyze Script");
code = code.replace(/<button\s+onClick=\{\(\) => setCurrentStep\(2\)\}/g, "<button\n                onClick={() => setCurrentStep(1)}");
code = code.replace("Go back to Step 2 to generate Director Cards.", "Go back to Step 1 to Analyze your script.");
code = code.replace("Return to Director Review", "Return to Analyze Script");

// I need to insert the progress bar into Step 2 if it's missing.
const progressBar = `
            <div className={\`border rounded-xl p-6 shadow-lg transition-all duration-300 \${status === GenerationStatus.ERROR ? 'bg-red-900/10 border-red-800' : 'bg-[#1e293b] border-gray-700'}\`}>
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {status === GenerationStatus.GENERATING && <Loader2 className="animate-spin text-blue-400" size={16} />}
                        {status === GenerationStatus.ERROR && <AlertCircle className="text-red-500" size={16} />}
                        <span className={\`text-sm font-bold \${status === GenerationStatus.ERROR ? 'text-red-400' : 'text-blue-300'}\`}>
                          {status === GenerationStatus.ERROR ? "Generation Interrupted" : (progress.currentStep || (clips.length > 0 ? "Reviewing Prompts" : "Ready to generate"))}
                        </span>
                      </div>
                      {status === GenerationStatus.GENERATING && (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                           <Clock size={12} />
                           <span>Est. Remaining: <span className="text-white font-mono">{estTimeRemaining}</span></span>
                        </div>
                      )}
                    </div>
                    {clips.length > 0 && (
                      <span className="text-xs text-gray-500 font-mono">
                        {Math.round((clips.length / (progress.total || 1)) * 100)}% ({clips.length}/{progress.total || metrics.estimatedClipCount})
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-700">
                    <div 
                      className={\`h-full rounded-full transition-all duration-500 relative overflow-hidden \${
                        status === GenerationStatus.ERROR ? 'bg-red-500' : 
                        status === GenerationStatus.PAUSED ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }\`}
                      style={{ width: \`\${Math.max(2, (clips.length / (progress.total || Math.max(1, metrics.estimatedClipCount))) * 100)}%\` }}
                    >
                      {status === GenerationStatus.GENERATING && (
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] -skew-x-12" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="mt-4 p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm flex items-start gap-3">
                  <AlertCircle className="shrink-0 mt-0.5 text-red-500" size={16} />
                  <p>{errorMsg}</p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <div className="w-full md:w-1/2 lg:w-1/3">
                  {/* We need the renderGenerationControls() here. It requires calling it if we can. Wait, it's a function. */}
                  {renderGenerationControls()}
                </div>
              </div>
            </div>

            {status === GenerationStatus.WAITING_APPROVAL && (
              <div className="sticky bottom-6 z-20">
                <div className="bg-[#1e293b] border border-blue-500/50 p-4 rounded-xl shadow-2xl shadow-black/50 flex flex-col items-center gap-3 backdrop-blur-sm">
                  <div className="text-center">
                    <h3 className="text-white font-bold text-lg">Test Batch Prompts Ready</h3>
                    <p className="text-gray-400 text-sm">Review the first 10 prompts. If satisfied, continue generating the rest.</p>
                  </div>
                  <button 
                    onClick={handleApproveAndContinue}
                    className="w-full md:w-auto px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg shadow-green-900/50 flex items-center justify-center gap-2 transition-all transform hover:scale-105"
                  >
                    <CheckCircle size={20} /> GENERATE REMAINING {scriptChunks.length > 0 ? scriptChunks.length - 10 : '?'} CARDS
                  </button>
                </div>
              </div>
            )}
`;

code = code.replace("<ExportActions clips={clips} settings={settings} />", progressBar + "\n\n            <ExportActions clips={clips} settings={settings} />");

fs.writeFileSync('App.tsx', code);
console.log("Updated step 2 UI");
