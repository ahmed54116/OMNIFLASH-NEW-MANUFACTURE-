const fs = require('fs');
let code = fs.readFileSync('components/ExportActions.tsx', 'utf-8');

// revert exportTXT
code = code.replace(/const exportTXT = \(\) => \{\n    \/\/ STRICT FORMAT: Numbered list of prompts ONLY\. No script, no context\.\n    const content = clips\.map\(c => \{\n      const prompt = c\.visualPrompt;\n      return `\$\{c\.clipNumber\}\. \$\{prompt\}`;\n    \}\)\.join\('\\n\\n'\);\n    \n    const blob = new Blob\(\[content\], \{ type: 'text\/plain;charset=utf-8;' \}\);/g, `const exportTXT = (isAnimation: boolean = false) => {
    // STRICT FORMAT: Numbered list of prompts ONLY. No script, no context.
    const content = clips.map(c => {
      const prompt = isAnimation ? (c.animationPrompt || "No animation prompt generated") : c.visualPrompt;
      return \`\${c.clipNumber}. \${prompt}\`;
    }).join('\\n\\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });`);

code = code.replace(/link\.setAttribute\('download', 'prompts_only\.txt'\);/g, "link.setAttribute('download', isAnimation ? 'animation_prompts.txt' : 'prompts_only.txt');");

// revert JSON mapping
code = code.replace(/            visual_prompt: c\.visualPrompt,\n/g, "            visual_prompt: c.visualPrompt,\n            animation_prompt: c.animationPrompt,\n");

// revert standard TXT
code = code.replace(/const exportStandardTXT = \(\) => \{\n    const content = clips\.map\(c => \{\n      const prompt = c\.visualPrompt;\n      return `Clip \$\{c\.clipNumber\}\\nScript: "\$\{c\.scriptLine\}"\\nPrompt: \$\{prompt\}`;\n    \}\)\.join\('\\n\\n'\);\n    \n    const blob = new Blob\(\[content\], \{ type: 'text\/plain;charset=utf-8;' \}\);/g, `const exportStandardTXT = (isAnimation: boolean = false) => {
    const content = clips.map(c => {
      const prompt = isAnimation ? (c.animationPrompt || "No animation prompt generated") : c.visualPrompt;
      return \`Clip \${c.clipNumber}\\nScript: "\${c.scriptLine}"\\nPrompt: \${prompt}\`;
    }).join('\\n\\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });`);

code = code.replace(/link\.setAttribute\('download', 'veo prompts\.txt'\);/g, "link.setAttribute('download', isAnimation ? 'veo animation prompts.txt' : 'veo prompts.txt');");

// revert veo3
code = code.replace(/const exportVeo3Pk = \(\) => \{\n    const content = "Provide Ouput Prompts in this Formate \(very Important\):\\n\\n" \+ clips\.map\(c => `Prompt \$\{c\.clipNumber\}:\\n\$\{c\.clipNumber\}\. \$\{c\.visualPrompt\}`\)\.join\('\\n\\n'\);\n    \n    const blob = new Blob\(\[content\], \{ type: 'text\/plain;charset=utf-8;' \}\);/g, `const exportVeo3Pk = (isAnimation: boolean = false) => {
    const content = "Provide Ouput Prompts in this Formate (very Important):\\n\\n" + clips.map(c => \`Prompt \${c.clipNumber}:\\n\${c.clipNumber}. \${isAnimation ? (c.animationPrompt || "No animation prompt generated") : c.visualPrompt}\`).join('\\n\\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });`);

code = code.replace(/exportTXT\(\)/g, "exportTXT(false)");
code = code.replace(/exportStandardTXT\(\)/g, "exportStandardTXT(false)");
code = code.replace(/exportVeo3Pk\(\)/g, "exportVeo3Pk(false)");

const animButtons = `
      {settings.generateImageAndAnimationPrompts && (
        <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-700">
          <span className="flex items-center text-sm font-medium text-teal-400 px-2">Animation Exports:</span>
          <button 
            onClick={() => exportTXT(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1e293b] border border-teal-600 hover:border-teal-400 text-teal-200 rounded-lg transition-all hover:bg-[#2d3748] text-sm font-medium"
          >
            <FileText size={16} className="text-teal-400" /> Export Anim Prompts (.txt)
          </button>
          <button 
            onClick={() => exportVeo3Pk(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1e293b] border border-teal-600 hover:border-teal-400 text-teal-200 rounded-lg transition-all hover:bg-[#2d3748] text-sm font-medium"
          >
            <FileText size={16} className="text-teal-400" /> export animation veo3.pk
          </button>
          <button 
            onClick={() => {
              const content = clips.map(c => \`\${c.clipNumber}. \${c.animationPrompt || "No animation prompt generated"}\`).join('\\n\\n');
              handleCopy('anim_prompts', content);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1e293b] border border-teal-600 hover:border-teal-400 text-teal-200 rounded-lg transition-all hover:bg-[#2d3748] text-sm font-medium"
          >
            {copiedStates['anim_prompts'] ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} className="text-teal-400" />} 
            {copiedStates['anim_prompts'] ? 'Copied!' : 'Copy Anim Prompts'}
          </button>
          <button 
            onClick={() => {
              const content = "Provide Ouput Prompts in this Formate (very Important):\\n\\n" + clips.map(c => \`Prompt \${c.clipNumber}:\\n\${c.clipNumber}. \${c.animationPrompt || "No animation prompt generated"}\`).join('\\n\\n');
              handleCopy('anim_veo3', content);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1e293b] border border-teal-600 hover:border-teal-400 text-teal-200 rounded-lg transition-all hover:bg-[#2d3748] text-sm font-medium"
          >
            {copiedStates['anim_veo3'] ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} className="text-teal-400" />} 
            {copiedStates['anim_veo3'] ? 'Copied!' : 'Copy Anim Prompts (veo3.pk)'}
          </button>
        </div>
      )}
    </div>`;

code = code.replace(/    <\/div>\n  \);\n};\n\nexport default ExportActions;/g, animButtons + "\n  );\n};\n\nexport default ExportActions;");

fs.writeFileSync('components/ExportActions.tsx', code);
console.log("Restored ExportActions");
