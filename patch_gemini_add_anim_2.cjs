const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

code = code.replace(/      visualPrompt: data\.visual_prompt \|\| "",\n/g, "      visualPrompt: data.visual_prompt || '',\n      animationPrompt: settings.generateImageAndAnimationPrompts ? (data.animation_prompt || '') : '',\n");

code = code.replace(/      visualPrompt: data\.visual_prompt \|\| originalClip\.visualPrompt,\n/g, "      visualPrompt: data.visual_prompt || originalClip.visualPrompt,\n      animationPrompt: originalClip.animationPrompt ? (data.animation_prompt || originalClip.animationPrompt) : '',\n");

code = code.replace(/      visualPrompt: clipData\.visualPrompt \|\| clipData\.jsonOutput\?\.visual_prompt \|\| '',\n/g, "      visualPrompt: clipData.visualPrompt || clipData.jsonOutput?.visual_prompt || '',\n      animationPrompt: settings.generateImageAndAnimationPrompts ? (clipData.animationPrompt || clipData.jsonOutput?.animation_prompt || '') : '',\n");

code = code.replace(/      visualPrompt: "Failed to generate prompt\. Please regenerate\.",\n/g, "      visualPrompt: 'Failed to generate prompt. Please regenerate.',\n      animationPrompt: '',\n");

fs.writeFileSync('services/geminiService.ts', code);
