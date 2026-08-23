const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

// Fix step 3 comparisons in step indicator
code = code.replace(/&&\s*!\(step\.num === 3 && clips\.length > 0\)/g, "");

// Fix estimatedDuration
code = code.replace(/metrics\.estimatedDuration/g, "metrics.estimatedDurationMinutes * 60");

// Fix renderGenerationControls
const buttonsCode = `
                  {status === GenerationStatus.GENERATING || status === GenerationStatus.PREPARING ? (
                    <button
                      onClick={handlePause}
                      className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Pause size={16} /> Pause Generation
                    </button>
                  ) : status === GenerationStatus.PAUSED ? (
                    <button
                      onClick={handleResume}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Play size={16} /> Resume Generation
                    </button>
                  ) : status === GenerationStatus.ERROR ? (
                    <button
                      onClick={handleRetry}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={16} /> Retry Failed Clip
                    </button>
                  ) : null}
`;

code = code.replace(/{renderGenerationControls\(\)}/g, buttonsCode);

fs.writeFileSync('App.tsx', code);
console.log("Fixed App.tsx errors");
