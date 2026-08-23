const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

code = code.replace(/const clipSchema = \{[\s\S]*?const batchSchema = \{/m, `const clipSchema: any = {
    type: Type.OBJECT,
    properties: {
      narrativeContext: { type: Type.STRING, description: "Brief visual context" },
      visualPrompt: { type: Type.STRING, description: "The final detailed prompt" },
      shotType: { type: Type.STRING },
      cameraMovement: { type: Type.STRING }
    },
    required: ["narrativeContext", "visualPrompt"]
  };

  if (settings.generateImageAndAnimationPrompts) {
    clipSchema.properties.animationPrompt = { type: Type.STRING };
  }

  const batchSchema = {`);

fs.writeFileSync('services/geminiService.ts', code);
console.log("Updated clipSchema conditionally");
