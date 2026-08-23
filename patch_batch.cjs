const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const newContinuityContext = `
  const continuityContext = (typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : null)
    ? \`\\n==================================\\nCONTINUITY CONTEXT (CRITICAL)\\n==================================\\n\${settings.continuityJson}\\n\\nCRITICAL INSTRUCTION FOR CONTINUITY:\\n1. The Prompt Writer must automatically load the Character JSON, Visual Style JSON and Continuity JSON before generating every prompt.\\n2. The Prompt Writer may never contradict any continuity information.\\n3. If the narration explicitly changes an object's state, update that object's state while preserving its identity.\\n4. Never create duplicate locations.\\n5. Never create duplicate equipment.\\n6. Never replace recurring objects.\\n7. Never reset object state between scenes.\\n8. Never reset environmental state.\`
    : "";
`;

code = code.replace(/  let inputData = "";/g, newContinuityContext + "\n  let inputData = \"\";");

fs.writeFileSync('services/geminiService.ts', code);
console.log("Patched generateClipBatch");
