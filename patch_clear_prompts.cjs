const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const newClearFunc = `
  const handleClearPrompts = () => {
    setClips([]);
    setStatus(GenerationStatus.IDLE);
    setNextClipIndex(0);
    setProgress({ current: 0, total: 0, currentStep: '' });
  };

  const handleClearProject = () => setIsClearDialogOpen(true);
`;

code = code.replace("  const handleClearProject = () => setIsClearDialogOpen(true);", newClearFunc);

const newButtons = `
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] border border-gray-700 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
              >
                <ArrowLeft size={16} /> Back to Analyze Script
              </button>
              {clips.length > 0 && (
                <button
                  onClick={handleClearPrompts}
                  className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                >
                  <RotateCcw size={16} /> Delete All Prompts
                </button>
              )}
`;

code = code.replace(/<button\s*onClick=\{\(\) => setCurrentStep\(1\)\}\s*className="px-4 py-2 bg-\[#1e293b\] hover:bg-\[#334155\] border border-gray-700 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"\s*>\s*<ArrowLeft size=\{16\} \/> Back to Analyze Script\s*<\/button>/, newButtons.trim());

fs.writeFileSync('App.tsx', code);
console.log("Patched App.tsx for clear prompts");
