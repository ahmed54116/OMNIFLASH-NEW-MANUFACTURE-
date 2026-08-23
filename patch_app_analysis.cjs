const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const oldBlock = `      // Step 2: Analyze characters
      if (!hasAnalyzedCast) {
        const chars = await geminiService.analyzeTextForCharacters(scriptToAnalyze, 'standard');
        if (chars.length > 0) {
          setSettings(prev => ({ ...prev, characters: [...prev.characters, ...chars] }));
          setHasAnalyzedCast(true);
        }
      }`;

const newBlock = `      // Step 2: Analyze characters
      const hasManufacturingJson = settings.manufacturingJson && settings.manufacturingJson.trim().length > 0;
      if (!hasAnalyzedCast && !hasManufacturingJson) {
        try {
          const chars = await geminiService.analyzeTextForCharacters(scriptToAnalyze, 'standard');
          if (chars.length > 0) {
            setSettings(prev => ({ ...prev, characters: [...prev.characters, ...chars] }));
            setHasAnalyzedCast(true);
          }
        } catch (charErr) {
          console.warn("Skipping character analysis due to error:", charErr);
          // Don't block the progression if character analysis fails
        }
      }`;

if (code.includes(oldBlock)) {
    code = code.replace(oldBlock, newBlock);
    fs.writeFileSync('App.tsx', code);
    console.log("Patched App.tsx analysis");
} else {
    console.log("Could not find block in App.tsx");
}
