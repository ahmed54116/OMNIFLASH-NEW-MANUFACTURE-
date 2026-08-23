const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const updatedClipSchema = `  const detailedJsonSchema: any = {
    type: Type.OBJECT,
    properties: {
      script_source: { type: Type.STRING },
      camera_director: {
        type: Type.OBJECT,
        properties: {
          shot_type: { type: Type.STRING },
          camera_movement: { type: Type.STRING }
        },
        required: ["shot_type", "camera_movement"]
      },
      visual_prompt: { type: Type.STRING }
    },
    required: ["script_source", "camera_director", "visual_prompt"]
  };

  if (settings.generateImageAndAnimationPrompts) {
    detailedJsonSchema.properties.animation_prompt = { type: Type.STRING, description: "Strictly motion-only instructions for animating the image." };
    detailedJsonSchema.required.push("animation_prompt");
  }

  const clipSchema: any = {
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

  if (isJsonMode) {
    clipSchema.properties.jsonOutput = detailedJsonSchema;
  }`;

code = code.replace(/const clipSchema: any = \{[\s\S]*?clipSchema\.properties\.animationPrompt = \{ type: Type\.STRING \};\n  \}/, updatedClipSchema);

fs.writeFileSync('services/geminiService.ts', code);
console.log("Updated json output for batch");
