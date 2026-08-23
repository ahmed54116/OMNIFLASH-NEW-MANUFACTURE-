const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const analyzeContinuityCode = `
const analyzeContinuity = async (script: string, settings: StyleSettings): Promise<string> => {
  const ai = getAIClient();

  const characterContext = settings.characters.map(c => \`- [\${c.shortDescription}]: \${c.description} | Style: \${c.visualStyle}\`).join('\\n');
  const styleContext = JSON.stringify(settings.worldBuildingJson || {}, null, 2);

  const systemInstruction = "You are the Continuity Generator inside a wildlife documentary production system.\\n" +
"Your job is to preserve documentary continuity by generating a Continuity JSON.\\n\\n" +
"Input provided:\\n" +
"1. Full documentary script\\n" +
"2. Character JSON (Context)\\n" +
"3. Visual Style JSON (Context)\\n\\n" +
"RULES:\\n" +
"- You must never rewrite the script.\\n" +
"- You must never write prompts.\\n" +
"- You must never modify Character JSON.\\n" +
"- You must never modify Visual Style JSON.\\n" +
"- The Continuity JSON should contain ONLY information that is NOT already represented inside Character JSON or Visual Style JSON. Avoid duplication completely.\\n" +
"- Extract:\\n" +
"  - Documentary structure.\\n" +
"  - Intro length.\\n" +
"  - Story stages.\\n" +
"  - Chapter boundaries.\\n" +
"  - Persistent locations.\\n" +
"  - Persistent objects.\\n" +
"  - Persistent wildlife groups.\\n" +
"  - Environmental progression.\\n" +
"  - Object state progression.\\n" +
"  - Action progression.\\n" +
"  - Story progression.\\n" +
"  - Continuity rules.\\n" +
"- Assign every recurring location, object, animal group and environmental feature a persistent internal identifier.\\n" +
"- If the narration explicitly changes an object's state, update that object's state while preserving its identity.\\n" +
"- Never create duplicate locations, equipment, or replace recurring objects.\\n" +
"- Never reset object state or environmental state between scenes.\\n\\n" +
"Output ONLY valid JSON representing the Continuity JSON. Do not include markdown formatting like \`\`\`json.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: "Script:\\n" + script + "\\n\\nCharacter Context:\\n" + characterContext + "\\n\\nStyle Context:\\n" + styleContext + "\\n\\nGenerate the Continuity JSON.",
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) throw new Error("Empty response from AI");
    
    return JSON.stringify(JSON.parse(jsonStr), null, 2);
  } catch (error) {
    console.error('Error extracting continuity:', error);
    throw error;
  }
};
`;

code = code.replace("export const geminiService = {", analyzeContinuityCode + "\\nexport const geminiService = {\\n  analyzeContinuity,");
fs.writeFileSync('services/geminiService.ts', code);
console.log("Success");
