const fs = require('fs');
let code = fs.readFileSync('components/PromptCard.tsx', 'utf-8');

const animUi = `            {/* Animation Prompt (if exists) */}
            {clip.animationPrompt && (
              <div className="bg-[#0e1117] rounded-lg border border-gray-800 p-4 relative group mt-4">
                <div className="flex items-center gap-2 mb-2 text-teal-400 text-[10px] font-bold uppercase tracking-wider">
                  <Video size={14} /> AI Animation Prompt
                </div>
                <p className="text-sm text-gray-200 font-mono leading-relaxed pb-6 whitespace-pre-wrap">
                  {clip.animationPrompt}
                </p>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(clip.animationPrompt!);
                    setAnimationCopied(true);
                    setTimeout(() => setAnimationCopied(false), 2000);
                  }}
                  className="absolute bottom-2 right-2 p-2 rounded-md bg-gray-800 hover:bg-teal-600 text-gray-400 hover:text-white transition-all border border-gray-700 hover:border-teal-500"
                  title="Copy Animation Prompt"
                >
                  {animationCopied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            )}
          </>)}
`;

code = code.replace(/          <\/>\)}\n/g, animUi);

// also add state if needed
if (!code.includes('animationCopied')) {
  code = code.replace(/const \[copied, setCopied\] = useState\(false\);\n/g, "const [copied, setCopied] = useState(false);\n  const [animationCopied, setAnimationCopied] = useState(false);\n");
}

fs.writeFileSync('components/PromptCard.tsx', code);
console.log("Restored PromptCard");
