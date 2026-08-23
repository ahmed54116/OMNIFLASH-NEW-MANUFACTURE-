const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

// Replace detailedJsonSchema
code = code.replace(/const detailedJsonSchema: any = {[\s\S]*?required: \["script_source", "director_brain", "director_score", "camera_director", "visual_prompt"\]\n  };/, `const detailedJsonSchema: any = {
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
      visual_prompt: { type: Type.STRING },
      animation_prompt: { type: Type.STRING }
    },
    required: ["script_source", "camera_director", "visual_prompt"]
  };`);

// Replace clipSchema
code = code.replace(/const clipSchema = {[\s\S]*?required: \["narrativeContext", "visualPrompt"\]\n  };/, `const clipSchema = {
    type: Type.OBJECT,
    properties: {
      narrativeContext: { type: Type.STRING, description: "Brief visual context" },
      visualPrompt: { type: Type.STRING, description: "The final detailed prompt" },
      animationPrompt: { type: Type.STRING },
      shotType: { type: Type.STRING },
      cameraMovement: { type: Type.STRING }
    },
    required: ["narrativeContext", "visualPrompt"]
  };`);

// Also fix where generateSingleClip accesses director_brain
code = code.replace(/narrativeContext: data\.director_brain\?\.main_behavior \|\| "",/, 'narrativeContext: data.script_source || "",');

fs.writeFileSync('services/geminiService.ts', code);
console.log("Updated JSON schemas in geminiService.ts");
