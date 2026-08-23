const fs = require('fs');
let code = fs.readFileSync('components/ExportActions.tsx', 'utf-8');

const target = `      <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-700">
        <span className="flex items-center text-sm font-medium text-gray-400 px-2">Copy to Clipboard:</span>
        <button 
          onClick={() => {
            const content = clips.map(c => \`\${c.clipNumber}. \${c.visualPrompt}\`).join('\\n\\n');
            handleCopy('prompts', content);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1e293b] border border-gray-600 hover:border-gray-500 text-gray-200 rounded-lg transition-all hover:bg-[#2d3748] text-sm font-medium"
        >
          {copiedStates['prompts'] ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-400" />} 
          {copiedStates['prompts'] ? 'Copied!' : 'All Prompts'}
        </button>
        <button 
          onClick={() => {
            const content = "Provide Ouput Prompts in this Formate (very Important):\\n\\n" + clips.map(c => \`Prompt \${c.clipNumber}:\\n\${c.clipNumber}. \${c.visualPrompt}\`).join('\\n\\n');
            handleCopy('veo3', content);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1e293b] border border-gray-600 hover:border-gray-500 text-gray-200 rounded-lg transition-all hover:bg-[#2d3748] text-sm font-medium"
        >
          {copiedStates['veo3'] ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-400" />} 
          {copiedStates['veo3'] ? 'Copied!' : 'All Prompts (veo3.pk)'}
        </button>`;

const replacement = `      <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-700">
        <span className="flex items-center text-sm font-medium text-gray-400 px-2">Copy to Clipboard:</span>
        <button 
          onClick={() => {
            const content = clips.map(c => \`\${c.clipNumber}. \${c.visualPrompt}\`).join('\\n\\n');
            handleCopy('prompts', content);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1e293b] border border-gray-600 hover:border-gray-500 text-gray-200 rounded-lg transition-all hover:bg-[#2d3748] text-sm font-medium"
        >
          {copiedStates['prompts'] ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-400" />} 
          {copiedStates['prompts'] ? 'Copied!' : 'All Prompts'}
        </button>
        <button 
          onClick={() => {
            const content = clips.map(c => \`\${c.clipNumber}. \${c.animationPrompt || ''}\`).join('\\n\\n');
            handleCopy('anim_prompts', content);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1e293b] border border-gray-600 hover:border-gray-500 text-gray-200 rounded-lg transition-all hover:bg-[#2d3748] text-sm font-medium"
        >
          {copiedStates['anim_prompts'] ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-400" />} 
          {copiedStates['anim_prompts'] ? 'Copied!' : 'Animation Prompts'}
        </button>
        <button 
          onClick={() => {
            const content = "Provide Ouput Prompts in this Formate (very Important):\\n\\n" + clips.map(c => \`Prompt \${c.clipNumber}:\\n\${c.clipNumber}. \${c.visualPrompt}\`).join('\\n\\n');
            handleCopy('veo3', content);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1e293b] border border-gray-600 hover:border-gray-500 text-gray-200 rounded-lg transition-all hover:bg-[#2d3748] text-sm font-medium"
        >
          {copiedStates['veo3'] ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-400" />} 
          {copiedStates['veo3'] ? 'Copied!' : 'All Prompts (veo3.pk)'}
        </button>
        <button 
          onClick={() => {
            const content = "Provide Ouput Prompts in this Formate (very Important):\\n\\n" + clips.map(c => \`Prompt \${c.clipNumber}:\\n\${c.clipNumber}. \${c.animationPrompt || ''}\`).join('\\n\\n');
            handleCopy('anim_veo3', content);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1e293b] border border-gray-600 hover:border-gray-500 text-gray-200 rounded-lg transition-all hover:bg-[#2d3748] text-sm font-medium"
        >
          {copiedStates['anim_veo3'] ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-400" />} 
          {copiedStates['anim_veo3'] ? 'Copied!' : 'Animation Prompts (veo3.pk)'}
        </button>`;

code = code.replace(target, replacement);
fs.writeFileSync('components/ExportActions.tsx', code);
console.log("Patched ExportActions.tsx");
