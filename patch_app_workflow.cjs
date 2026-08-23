const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const returnRegex = /return \([\s\S]*?\n\};\n\nexport default App;/;

const newRender = `return (
    <div className="min-h-screen bg-[#0f172a] text-gray-200 pb-20 relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle size={20} /> {showToast}
        </div>
      )}

      {/* Clear Project Confirmation Modal */}
      {isClearDialogOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-2">Clear Project?</h3>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to clear the entire project? This will erase your script, settings, and generated clips.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsClearDialogOpen(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmClearProject}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-red-900/20"
              >
                Clear Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertDialog.isOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-red-400 mb-2">{alertDialog.title}</h3>
            <p className="text-gray-300 text-sm mb-6">{alertDialog.message}</p>
            <div className="flex justify-end">
              <button 
                onClick={() => setAlertDialog({ ...alertDialog, isOpen: false })}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ProjectImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportProject}
      />

      {/* Navbar / Header */}
      <header className="bg-[#0f172a]/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/50">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Video Script to <span className="text-blue-500">Prompt Elite 2.0</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleClearProject}
              disabled={status === GenerationStatus.GENERATING}
              className="flex items-center gap-2 px-3 py-2 bg-red-900/30 hover:bg-red-800/50 text-red-300 text-xs font-bold rounded-lg border border-red-800/50 transition-colors disabled:opacity-50"
            >
              <RotateCcw size={14} /> Clear Project
            </button>
            <button 
              onClick={() => setIsImportModalOpen(true)}
              disabled={status === GenerationStatus.GENERATING}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg border border-gray-700 transition-colors disabled:opacity-50"
            >
              <Upload size={14} /> Import Project
            </button>
            <button 
              onClick={handleExportProject}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg border border-gray-700 transition-colors"
            >
              <Download size={14} /> Export Project
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-10">
        
        {/* Progress Indicator */}
        <div className="bg-[#1e293b] border border-gray-700 rounded-xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg mb-8 relative">
          <div className="flex items-center gap-4 max-w-3xl w-full mx-auto">
            <div className={\`flex flex-col items-center flex-1 \${currentStep >= 1 ? 'text-blue-400' : 'text-gray-500'}\`}>
              <div className={\`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 shadow-lg \${currentStep >= 1 ? 'bg-blue-600 text-white shadow-blue-900/50' : 'bg-gray-800 border border-gray-700'}\`}>
                {currentStep > 1 ? <Check size={20} /> : "1"}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-center">Analyze</span>
            </div>
            
            <div className={\`flex-1 h-1 rounded-full -mt-6 transition-colors duration-500 \${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-800'}\`}></div>
            
            <div className={\`flex flex-col items-center flex-1 \${currentStep >= 2 ? 'text-teal-400' : 'text-gray-500'}\`}>
              <div className={\`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 shadow-lg transition-colors duration-500 \${currentStep >= 2 ? 'bg-teal-600 text-white shadow-teal-900/50' : 'bg-gray-800 border border-gray-700'}\`}>
                {currentStep > 2 ? <Check size={20} /> : "2"}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-center">Director Review</span>
            </div>

            <div className={\`flex-1 h-1 rounded-full -mt-6 transition-colors duration-500 \${currentStep >= 3 ? 'bg-teal-600' : 'bg-gray-800'}\`}></div>
            
            <div className={\`flex flex-col items-center flex-1 \${currentStep >= 3 ? 'text-purple-400' : 'text-gray-500'}\`}>
              <div className={\`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 shadow-lg transition-colors duration-500 \${currentStep >= 3 ? 'bg-purple-600 text-white shadow-purple-900/50' : 'bg-gray-800 border border-gray-700'}\`}>
                3
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-center">Prompt Generation</span>
            </div>
          </div>
        </div>

        {/* STEP 1: ANALYZE */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tabs */}
            <div className="flex bg-[#1e293b] p-1 rounded-xl w-fit mx-auto sm:mx-0 shadow-lg border border-gray-700">
              <button
                onClick={() => handleTabChange('standard')}
                disabled={status === GenerationStatus.GENERATING}
                className={\`px-6 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 \${
                  activeTab === 'standard' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }\`}
              >
                Standard Mode
              </button>
              <button
                onClick={() => handleTabChange('creature')}
                disabled={status === GenerationStatus.GENERATING}
                className={\`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50 \${
                  activeTab === 'creature' 
                  ? 'bg-teal-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }\`}
              >
                🐙 Creature Master Prompts
              </button>
            </div>

            {/* Style Engine Panel */}
            <StyleEngine 
              settings={settings} 
              setSettings={setSettings} 
              disabled={status === GenerationStatus.GENERATING}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Script Input Box */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Input Script</label>
                  <button 
                    onClick={() => {
                      setScript('');
                      setClips([]);
                      setStatus(GenerationStatus.IDLE);
                      setNextClipIndex(0);
                      setEstTimeRemaining('--:--');
                      setHasAnalyzedCast(false);
                      setSettings(prev => ({...prev, characters: []}));
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Clear Script
                  </button>
                </div>
                
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Paste your video script here... (Supports 400+ clips)"
                  className="w-full h-[400px] bg-[#1e293b] border border-gray-700 rounded-xl p-4 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all resize-none font-mono text-sm leading-relaxed shadow-inner"
                  disabled={status === GenerationStatus.GENERATING}
                />
              </div>

              <div className="space-y-6">
                <CharacterEngine 
                  settings={settings}
                  setSettings={setSettings}
                  disabled={status === GenerationStatus.GENERATING}
                  script={script}
                  onAnalysisComplete={handleAnalyzeCast}
                  analysisInProgress={isAnalyzingCast}
                  mode={activeTab}
                />

                <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-6 space-y-4 shadow-lg">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <Settings className="text-blue-400" size={20} /> Generation Settings
                  </h3>
                  {/* Duration */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Seconds per Clip</label>
                    <div className="flex flex-wrap justify-between gap-2">
                      {CLIP_DURATIONS.map(dur => (
                        <button
                          key={dur}
                          onClick={() => setClipDuration(dur as ClipDuration)}
                          disabled={status === GenerationStatus.GENERATING}
                          className={\`flex-1 min-w-[40px] py-1.5 text-xs font-semibold rounded-lg transition-all \${
                            clipDuration === dur 
                              ? 'bg-blue-600 text-white shadow-lg' 
                              : 'bg-[#0f172a] text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500'
                          }\`}
                        >
                          {dur}s
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Output Format */}
                  <div>
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Output Format</label>
                     <div className="flex gap-2">
                       <button
                         onClick={() => setOutputFormat('standard')}
                         disabled={status === GenerationStatus.GENERATING}
                         className={\`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all border \${
                           outputFormat === 'standard' 
                           ? 'bg-blue-900/30 border-blue-500 text-blue-300' 
                           : 'bg-[#0f172a] border-gray-700 text-gray-500 hover:border-gray-500'
                         }\`}
                       >
                         <FileText size={14} /> 📝 Standard
                       </button>
                       <button
                         onClick={() => setOutputFormat('json')}
                         disabled={status === GenerationStatus.GENERATING}
                         className={\`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all border \${
                           outputFormat === 'json' 
                           ? 'bg-purple-900/30 border-purple-500 text-purple-300' 
                           : 'bg-[#0f172a] border-gray-700 text-gray-500 hover:border-gray-500'
                         }\`}
                       >
                         <FileJson size={14} /> 🤖 Detailed JSON
                       </button>
                     </div>
                  </div>
                </div>

                <MetricsDisplay metrics={metrics} />

                {script.trim().length > 0 && (
                  <div className="pt-4">
                    <div className="bg-[#1e293b]/50 border border-gray-700 rounded-xl p-4 mb-4">
                       <h4 className="text-sm font-bold text-green-400 flex items-center gap-2 mb-2"><CheckCircle size={16}/> Analysis Complete</h4>
                       <ul className="text-xs text-gray-300 space-y-1">
                         <li>✓ Script Loaded</li>
                         <li>✓ Visual Beats Estimated: {metrics.estimatedClipCount}</li>
                         <li>✓ Duration Estimated: {metrics.estimatedDurationMinutes.toFixed(2)} min</li>
                         {activeTab === 'creature' && <li>✓ World JSON Integrated</li>}
                         <li>✓ Creatures Detected: {settings.characters.length}</li>
                       </ul>
                    </div>
                    <button 
                      onClick={() => setCurrentStep(2)}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-xl shadow-xl shadow-blue-900/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                    >
                      Proceed to Step 2 <ArrowRight size={20} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: DIRECTOR REVIEW */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <button 
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
              >
                <ArrowLeft size={16} /> Back to Step 1
              </button>
              
              <button 
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-teal-900/30 transition-all transform hover:scale-105"
              >
                Proceed to Step 3 <ArrowRight size={16} />
              </button>
            </div>

            {/* REAL-TIME PROGRESS BAR & ERROR BOX */}
            <div className={\`border rounded-xl p-6 shadow-lg transition-all duration-300 \${status === GenerationStatus.ERROR ? 'bg-red-900/10 border-red-800' : 'bg-[#1e293b] border-gray-700'}\`}>
              
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {status === GenerationStatus.GENERATING && <Loader2 className="animate-spin text-blue-400" size={16} />}
                        {status === GenerationStatus.ERROR && <AlertCircle className="text-red-500" size={16} />}
                        <span className={\`text-sm font-bold \${status === GenerationStatus.ERROR ? 'text-red-400' : 'text-blue-300'}\`}>
                          {status === GenerationStatus.ERROR ? "Generation Interrupted" : (progress.currentStep || (clips.length > 0 ? "Reviewing Director Cards" : "Ready to generate"))}
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

                  {/* Progress Line */}
                  <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={\`h-2.5 rounded-full transition-all duration-300 ease-linear \${
                        status === GenerationStatus.ERROR ? 'bg-red-500' : 'bg-teal-500'
                      }\`}
                      style={{ width: \`\${(clips.length / (progress.total || 1)) * 100}%\` }}
                    ></div>
                  </div>
                </div>

                <div className="w-full md:w-auto">
                   {renderMainButton()}
                </div>
              </div>
              
              {/* ERROR STATE: THE "RED BOX" */}
              {status === GenerationStatus.ERROR && (
                <div className="mt-4 flex flex-col md:flex-row items-center justify-between bg-red-950/40 border border-red-500/30 p-4 rounded-lg gap-4">
                  <div className="text-red-200 text-sm">
                    <p className="font-bold mb-1">❌ Failed at Batch {Math.ceil(nextClipIndex / BATCH_SIZE)}</p>
                    <p className="font-mono text-xs opacity-80">{errorMsg}</p>
                  </div>
                  <button 
                    onClick={handleRetry}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap transition-transform active:scale-95"
                  >
                    <RotateCcw size={16} /> Retry from Clip {nextClipIndex}
                  </button>
                </div>
              )}
            </div>

            {status === GenerationStatus.IDLE && clips.length === 0 && (
              <div className="h-[400px] flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-gray-800 rounded-xl bg-[#1e293b]/50">
                <Video size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium text-gray-400">Ready to begin Director Review.</p>
                <p className="text-sm text-gray-500 mb-6">Start generation to create director cards for each beat.</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              {clips.map((clip) => (
                <PromptCard 
                  key={clip.id} 
                  clip={clip} 
                  onRegenerate={handleRegenerateClip}
                  isRegenerating={regeneratingIds.has(clip.id)}
                  mode="director"
                />
              ))}
              <div ref={bottomRef} className="h-4" />
            </div>

            {status === GenerationStatus.WAITING_APPROVAL && (
              <div className="sticky bottom-6 z-20">
                <div className="bg-[#1e293b] border border-blue-500/50 p-4 rounded-xl shadow-2xl shadow-black/50 flex flex-col items-center gap-3 backdrop-blur-sm">
                  <div className="text-center">
                    <h3 className="text-white font-bold text-lg">Test Batch Complete (1-10)</h3>
                    <p className="text-gray-400 text-sm">Review the first 10 Director Cards above. If satisfied, continue generating.</p>
                  </div>
                  <button 
                    onClick={handleApproveAndContinue}
                    className="w-full md:w-auto px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg shadow-green-900/50 flex items-center justify-center gap-2 transition-all transform hover:scale-105"
                  >
                    <CheckCircle size={20} />
                    APPROVE & GENERATE REMAINING {scriptChunks.length - 10} CLIPS
                  </button>
                </div>
              </div>
            )}
            
            {status === GenerationStatus.GENERATING && (
              <div className="opacity-50 pointer-events-none animate-pulse flex flex-col items-center gap-2">
                <div className="bg-[#1e293b] w-full h-32 rounded-xl border border-gray-700/50 p-6 flex flex-col gap-3">
                   <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                   <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                </div>
                <span className="text-xs text-blue-400 flex items-center gap-1">
                   <ArrowDownCircle size={12} /> Auto-scrolling enabled
                </span>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: PROMPT GENERATION */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <button 
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
              >
                <ArrowLeft size={16} /> Back to Step 2
              </button>
              
              <ExportActions clips={clips} settings={settings} />
            </div>

            {clips.length === 0 ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-gray-800 rounded-xl bg-[#1e293b]/50">
                <p className="text-lg font-medium text-gray-400">No prompts generated yet.</p>
                <p className="text-sm text-gray-500 mb-6">Go back to Step 2 to generate Director Cards.</p>
                <button 
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg"
                >
                  <ArrowLeft size={16} /> Return to Director Review
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {clips.map((clip) => (
                  <PromptCard 
                    key={clip.id} 
                    clip={clip} 
                    onRegenerate={handleRegenerateClip}
                    isRegenerating={regeneratingIds.has(clip.id)}
                    mode="prompt"
                  />
                ))}
              </div>
            )}
            
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
                    <CheckCircle size={20} />
                    GENERATE REMAINING {scriptChunks.length - 10} PROMPTS
                  </button>
                </div>
              </div>
            )}
            
            {(status === GenerationStatus.GENERATING || status === GenerationStatus.PAUSED) && (
              <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-gray-700 mt-8">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-blue-300">Generation in Progress... ({clips.length}/{progress.total})</span>
                  {renderMainButton()}
                </div>
              </div>
            )}
            
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
`;

code = code.replace(returnRegex, newRender);
fs.writeFileSync('App.tsx', code);
