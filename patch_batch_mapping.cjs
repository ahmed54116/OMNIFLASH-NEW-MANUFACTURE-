const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const updatedMapping = `    return data.map((clipData: any, i: number) => ({
      id: crypto.randomUUID(),
      clipNumber: startClipNumber + i,
      scriptLine: chunks[i],
      narrativeContext: clipData.narrativeContext || clipData.jsonOutput?.script_source || 'Visual sequence',
      visualPrompt: clipData.visualPrompt || clipData.jsonOutput?.visual_prompt || '',
      animationPrompt: settings.generateImageAndAnimationPrompts ? (clipData.animationPrompt || clipData.jsonOutput?.animation_prompt || '') : '',
      shotType: clipData.shotType || clipData.jsonOutput?.camera_director?.shot_type || settings.cameraStyle,
      cameraMovement: clipData.cameraMovement || clipData.jsonOutput?.camera_director?.camera_movement || settings.cameraMovement,
      jsonOutput: isJsonMode ? clipData.jsonOutput : undefined
    }));`;

code = code.replace(/return data\.map\(\(clipData: any, i: number\) => \(\{\s*id: crypto\.randomUUID\(\),\s*clipNumber: startClipNumber \+ i,\s*scriptLine: chunks\[i\],\s*narrativeContext: clipData\.narrativeContext \|\| 'Visual sequence',\s*visualPrompt: clipData\.visualPrompt \|\| '',\s*animationPrompt: settings\.generateImageAndAnimationPrompts \? \(clipData\.animationPrompt \|\| ''\) : '',\s*shotType: clipData\.shotType \|\| settings\.cameraStyle,\s*cameraMovement: clipData\.cameraMovement \|\| settings\.cameraMovement,\s*jsonOutput: isJsonMode \? clipData\.jsonOutput : undefined\s*\}\)\);/, updatedMapping);

fs.writeFileSync('services/geminiService.ts', code);
console.log("Updated batch mapping");
