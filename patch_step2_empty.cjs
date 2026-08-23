const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const oldEmpty = `            {clips.length === 0 ? (
               <div className="h-[400px] flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-gray-800 rounded-xl bg-[#1e293b]/50">
                 <p className="text-lg font-medium text-gray-400">No prompts generated yet.</p>
                 <p className="text-sm text-gray-500 mb-6">Go back to Step 1 to Analyze your script.</p>
                 <button
                onClick={() => setCurrentStep(1)}
                   className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg"
                 >
                   <ArrowLeft size={16} /> Return to Analyze Script
                 </button>
               </div>
            ) : (`;

const newEmpty = `            {clips.length === 0 ? (
               <div className="h-[400px] flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-gray-800 rounded-xl bg-[#1e293b]/50 gap-4">
                 <p className="text-lg font-medium text-gray-400">Ready to generate.</p>
                 <div className="flex items-center gap-4 mt-2">
                   <button
                     onClick={handleInitialGenerate}
                     className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg"
                   >
                     Start Generation
                   </button>
                   <button
                     onClick={() => setCurrentStep(1)}
                     className="px-4 py-3 bg-[#1e293b] hover:bg-[#334155] border border-gray-700 text-white rounded-lg text-sm font-bold flex items-center gap-2"
                   >
                     <ArrowLeft size={16} /> Back
                   </button>
                 </div>
               </div>
            ) : (`;

if (code.includes(oldEmpty)) {
    code = code.replace(oldEmpty, newEmpty);
    fs.writeFileSync('App.tsx', code);
    console.log("Patched Step 2 Empty State");
} else {
    console.log("Could not find oldEmpty block");
}
