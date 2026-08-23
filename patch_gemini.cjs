const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

// 1. Remove detailedJsonSchema animation
code = code.replace(/  if \(settings\.generateImageAndAnimationPrompts\) \{\n    detailedJsonSchema\.properties\.animation_prompt = \{ type: Type\.STRING, description: "Strictly motion-only instructions for animating the image\." \};\n    detailedJsonSchema\.required\.push\("animation_prompt"\);\n  \}\n/g, '');

// 2. Remove single prompt instructions
code = code.replace(/\$\{!(settings\.)?generateImageAndAnimationPrompts \? "IMPORTANT: Generate a single, comprehensive visual_prompt\. This prompt MUST describe both the visual scene AND the animation\/movement\/behavior within a single cohesive text block\. DO NOT split them into separate prompts\." : "IMPORTANT: Generate a visual prompt and a separate animation prompt\."\}/g, '');

// 3. Remove single prompt mapping
code = code.replace(/animationPrompt: (settings\.)?generateImageAndAnimationPrompts \? \(data\.animation_prompt \|\| ''\) : '',/g, '');

// 4. Remove originalClip animation mapping (if any)
code = code.replace(/animationPrompt: originalClip\.animationPrompt \? \(data\.animation_prompt \|\| originalClip\.animationPrompt\) : '',/g, '');
code = code.replace(/animationPrompt: "",/g, '');

// 5. Remove batch schema animation
code = code.replace(/  if \(settings\.generateImageAndAnimationPrompts\) \{\n    clipSchema\.properties\.animationPrompt = \{ type: Type\.STRING \};\n  \}\n/g, '');

// 6. Remove batch prompt instructions
code = code.replace(/\$\{!(settings\.)?generateImageAndAnimationPrompts \? "IMPORTANT: Generate a single, comprehensive visual_prompt for each clip\. This prompt MUST describe both the visual scene AND the animation\/movement\/behavior within a single cohesive text block\. DO NOT split them\." : "IMPORTANT: Generate a visual prompt and a separate animation prompt for each clip\."\}/g, '');

// 7. Remove batch mapping
code = code.replace(/animationPrompt: (settings\.)?generateImageAndAnimationPrompts \? \(clipData\.animationPrompt \|\| clipData\.jsonOutput\?\.animation_prompt \|\| ''\) : '',/g, '');

fs.writeFileSync('services/geminiService.ts', code);
