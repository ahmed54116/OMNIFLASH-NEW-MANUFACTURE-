const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const updatedPromptLogic = "  const prompt = `You are an elite cinematic director and AI video prompt engineer.\\n" +
"Your task is to generate visual prompts for a sequence of ${chunks.length} video clips (${clipDuration} seconds each).\\n\\n" +
"GLOBAL STYLE & DIRECTION:\\n" +
"- Visual Style: ${settings.visualStyle}\\n" +
"- Lighting: ${settings.lighting}\\n" +
"- Mood: ${settings.mood}\\n" +
"- Default Camera Style: ${settings.cameraStyle}\\n" +
"- Default Camera Movement: ${settings.cameraMovement}\\n" +
"- Color Palette: Primary ${settings.colorPalette?.primary || 'none'}, Secondary ${settings.colorPalette?.secondary || 'none'}, Accent ${settings.colorPalette?.accent || 'none'}\\n" +
"- Extra Keywords: ${settings.artKeywords || 'None'}\\n" +
"${charactersContext}\\n\\n" +
"${!settings.generateImageAndAnimationPrompts ? \"IMPORTANT: Generate a single, comprehensive visual_prompt for each clip. This prompt MUST describe both the visual scene AND the animation/movement/behavior within a single cohesive text block. DO NOT split them.\" : \"IMPORTANT: Generate a visual prompt and a separate animation prompt for each clip.\"}\\n\\n" +
"INPUT SCRIPT CHUNKS:\\n" +
"${inputData}\\n\\n" +
"For each clip, return its details matching the required schema. Ensure the array length is exactly ${chunks.length}.`;";

code = code.replace(/const prompt = `You are an elite cinematic director[\s\S]*?Ensure the array length is exactly \$\{chunks\.length\}\.`;/, updatedPromptLogic);

fs.writeFileSync('services/geminiService.ts', code);
console.log("Updated prompt generation logic");
