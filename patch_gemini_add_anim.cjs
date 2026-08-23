const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

// 1. Single clip detailedJsonSchema
code = code.replace(/    required: \["script_source", "camera_director", "visual_prompt"\]\n  \};\n\n  \n/g, `    required: ["script_source", "camera_director", "visual_prompt"]\n  };\n\n  if (settings.generateImageAndAnimationPrompts) {\n    detailedJsonSchema.properties.animation_prompt = { type: Type.STRING, description: "Strictly motion-only instructions for animating the image." };\n    detailedJsonSchema.required.push("animation_prompt");\n  }\n\n`);

// 2. Batch clip schema
code = code.replace(/    required: \["narrativeContext", "visualPrompt"\]\n  \};\n\n/g, `    required: ["narrativeContext", "visualPrompt"]\n  };\n\n  if (settings.generateImageAndAnimationPrompts) {\n    clipSchema.properties.animationPrompt = { type: Type.STRING };\n  }\n\n`);

// 3. Single clip generation contents
code = code.replace(/      contents: \`Generate Prompt for Clip #\$\{clipNumber\}\. Script Segment: "\$\{chunkText\}"\`/g, "      contents: `Generate Prompt for Clip #${clipNumber}. Script Segment: \"${chunkText}\"\\n\\n${!settings.generateImageAndAnimationPrompts ? \"IMPORTANT: Generate a single, comprehensive visual_prompt. This prompt MUST describe both the visual scene AND the animation/movement/behavior within a single cohesive text block. DO NOT split them into separate prompts.\" : \"IMPORTANT: Generate a visual prompt and a separate animation prompt.\"}`");

// 4. Batch generation contents
code = code.replace(/INPUT SCRIPT CHUNKS:\\n\$\{inputData\}\\n\\nFor each clip, return its details matching the required schema\. Ensure the array length is exactly \$\{chunks\.length\}\./g, "${!settings.generateImageAndAnimationPrompts ? \"IMPORTANT: Generate a single, comprehensive visual_prompt for each clip. This prompt MUST describe both the visual scene AND the animation/movement/behavior within a single cohesive text block. DO NOT split them.\" : \"IMPORTANT: Generate a visual prompt and a separate animation prompt for each clip.\"}\\n\\nINPUT SCRIPT CHUNKS:\\n${inputData}\\n\\nFor each clip, return its details matching the required schema. Ensure the array length is exactly ${chunks.length}.");

// 5. Mapping single clip
code = code.replace(/visualPrompt: data\.visual_prompt \|\| '',\n      shotType: data/g, "visualPrompt: data.visual_prompt || '',\n      animationPrompt: settings.generateImageAndAnimationPrompts ? (data.animation_prompt || '') : '',\n      shotType: data");

// 6. Mapping regen clip
code = code.replace(/visualPrompt: data\.visual_prompt \|\| originalClip\.visualPrompt,\n      shotType: data/g, "visualPrompt: data.visual_prompt || originalClip.visualPrompt,\n      animationPrompt: originalClip.animationPrompt ? (data.animation_prompt || originalClip.animationPrompt) : '',\n      shotType: data");

// 7. Mapping batch clip
code = code.replace(/visualPrompt: clipData\.visualPrompt \|\| clipData\.jsonOutput\?\.visual_prompt \|\| '',\n      shotType: clipData/g, "visualPrompt: clipData.visualPrompt || clipData.jsonOutput?.visual_prompt || '',\n      animationPrompt: settings.generateImageAndAnimationPrompts ? (clipData.animationPrompt || clipData.jsonOutput?.animation_prompt || '') : '',\n      shotType: clipData");

fs.writeFileSync('services/geminiService.ts', code);
console.log("Restored animation mapping");
