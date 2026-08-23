const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const newMethod = `
const analyzeContinuity = async (script: string, settings: StyleSettings): Promise<string> => {
  const ai = getAIClient();

  const characterContext = settings.characters.map(c => \`- [\${c.shortDescription}]: \${c.description} | Style: \${c.visualStyle}\`).join('\\n');
  const styleContext = JSON.stringify(settings.worldBuildingJson || {}, null, 2);

  const systemInstruction = \`You are the Continuity Generator inside a wildlife documentary production system.
Your job is to preserve documentary continuity by generating a Continuity JSON.

Input provided:
1. Full documentary script
2. Character JSON (Context)
3. Visual Style JSON (Context)

RULES:
- You must never rewrite the script.
- You must never write prompts.
- You must never modify Character JSON.
- You must never modify Visual Style JSON.
- The Continuity JSON should contain ONLY information that is NOT already represented inside Character JSON or Visual Style JSON. Avoid duplication completely.
- Extract:
  - Documentary structure.
  - Intro length.
  - Story stages.
  - Chapter boundaries.
  - Persistent locations.
  - Persistent objects.
  - Persistent wildlife groups.
  - Environmental progression.
  - Object state progression.
  - Action progression.
  - Story progression.
  - Continuity rules.
- Assign every recurring location, object, animal group and environmental feature a persistent internal identifier.
- If the narration explicitly changes an object's state, update that object's state while preserving its identity.
- Never create duplicate locations, equipment, or replace recurring objects.
- Never reset object state or environmental state between scenes.

Output ONLY valid JSON representing the Continuity JSON. Do not include markdown formatting like \`\`\`json.\`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.0-pro",
      contents: \`Script:\\n\${script}\\n\\nCharacter Context:\\n\${characterContext}\\n\\nStyle Context:\\n\${styleContext}\\n\\nGenerate the Continuity JSON.\`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) throw new Error("Empty response from AI");
    
    // We can just format it nicely
    return JSON.stringify(JSON.parse(jsonStr), null, 2);
  } catch (error) {
    console.error('Error extracting continuity:', error);
    throw error;
  }
};
\`;

// Inject into geminiService
code = code.replace(/export const geminiService = \{/, newMethod + "\nexport const geminiService = {\n  analyzeContinuity,");

fs.writeFileSync('services/geminiService.ts', code);
console.log("Patched geminiService with analyzeContinuity");
