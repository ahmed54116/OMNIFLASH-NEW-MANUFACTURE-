const fs = require('fs');
let code = fs.readFileSync('components/ExportActions.tsx', 'utf-8');

// replace exportTXT signature and logic
code = code.replace(/const exportTXT = \(isAnimation: boolean = false\) => \{[\s\S]*?const blob = new Blob\(\[content\], \{ type: 'text\/plain;charset=utf-8;' \}\);/, `const exportTXT = () => {
    // STRICT FORMAT: Numbered list of prompts ONLY. No script, no context.
    const content = clips.map(c => {
      const prompt = c.visualPrompt;
      return \`\${c.clipNumber}. \${prompt}\`;
    }).join('\\n\\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });`);
code = code.replace(/link\.setAttribute\('download', isAnimation \? 'animation_prompts\.txt' : 'prompts_only\.txt'\);/g, "link.setAttribute('download', 'prompts_only.txt');");

// fix animation_prompt: c.animationPrompt, in JSON export
code = code.replace(/            animation_prompt: c\.animationPrompt,\n/g, '');

// fix standard script + prompts text export
code = code.replace(/const exportStandardTXT = \(isAnimation: boolean = false\) => \{[\s\S]*?const blob = new Blob\(\[content\], \{ type: 'text\/plain;charset=utf-8;' \}\);/, `const exportStandardTXT = () => {
    const content = clips.map(c => {
      const prompt = c.visualPrompt;
      return \`Clip \${c.clipNumber}\\nScript: "\${c.scriptLine}"\\nPrompt: \${prompt}\`;
    }).join('\\n\\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });`);
code = code.replace(/link\.setAttribute\('download', isAnimation \? 'veo animation prompts\.txt' : 'veo prompts\.txt'\);/g, "link.setAttribute('download', 'veo prompts.txt');");

fs.writeFileSync('components/ExportActions.tsx', code);
