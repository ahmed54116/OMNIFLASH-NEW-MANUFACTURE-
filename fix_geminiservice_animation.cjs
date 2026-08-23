const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

// For generateSingleClip
code = code.replace(/animationPrompt: data\.animation_prompt,/g, "animationPrompt: settings.generateImageAndAnimationPrompts ? (data.animation_prompt || '') : '',");

// For generateClipBatch
code = code.replace(/animationPrompt: clipData\.animationPrompt \|\| '',/g, "animationPrompt: settings.generateImageAndAnimationPrompts ? (clipData.animationPrompt || '') : '',");

// For regenerateClip (wait, regenerateClip doesn't have `settings` easily accessible unless we pass it, but if originalClip doesn't have it, we just preserve it)
code = code.replace(/animationPrompt: data\.animation_prompt \|\| originalClip\.animationPrompt,/g, "animationPrompt: originalClip.animationPrompt ? (data.animation_prompt || originalClip.animationPrompt) : '',");

fs.writeFileSync('services/geminiService.ts', code);
console.log("Fixed animationPrompt logic");
