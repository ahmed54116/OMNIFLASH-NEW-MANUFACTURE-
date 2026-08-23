const fs = require('fs');
let code = fs.readFileSync('components/ExportActions.tsx', 'utf-8');

// The exportVeo3Pk logic
code = code.replace(/const exportVeo3Pk = \(isAnimation: boolean = false\) => \{[\s\S]*?const blob = new Blob\(\[content\], \{ type: 'text\/plain;charset=utf-8;' \}\);/, `const exportVeo3Pk = () => {
    const content = "Provide Ouput Prompts in this Formate (very Important):\\n\\n" + clips.map(c => \`Prompt \${c.clipNumber}:\\n\${c.clipNumber}. \${c.visualPrompt}\`).join('\\n\\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });`);

// The onClick calls and UI for animation
code = code.replace(/\{settings\.generateImageAndAnimationPrompts && \([\s\S]*?<\/div>\s*\)\}/, '');

code = code.replace(/exportTXT\(false\)/g, 'exportTXT()');
code = code.replace(/exportStandardTXT\(false\)/g, 'exportStandardTXT()');
code = code.replace(/exportVeo3Pk\(false\)/g, 'exportVeo3Pk()');

fs.writeFileSync('components/ExportActions.tsx', code);
