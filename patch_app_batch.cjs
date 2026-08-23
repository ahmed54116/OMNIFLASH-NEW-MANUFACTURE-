const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const oldLoop = `    for (let i = startIndex; i < endIndex; i++) {
      if (stopGenerationRef.current) break;
      setProgress(prev => ({ ...prev, currentStep: \`Generating clip \${i + 1} of \${chunks.length}...\` }));
      try {
        const clip = await geminiService.generateSingleClip(
          chunks[i], i + 1, settings, clipDuration, outputFormat, activeTab
        );
        setClips(prev => {
          const newClips = [...prev];
          newClips[i] = clip;
          return newClips;
        });
        setNextClipIndex(i + 1);
        setProgress(prev => ({ ...prev, current: i + 1 }));
        updateTimeRemaining(i + 1 - startIndex, endIndex - startIndex);
      } catch (err: any) {
        setStatus(GenerationStatus.ERROR);
        setErrorMsg(err.message || "An error occurred during generation.");
        return;
      }
    }`;

const newLoop = `    const BATCH_SIZE = 5;
    for (let i = startIndex; i < endIndex; i += BATCH_SIZE) {
      if (stopGenerationRef.current) break;
      const batchEnd = Math.min(i + BATCH_SIZE, endIndex);
      setProgress(prev => ({ ...prev, currentStep: \`Generating clips \${i + 1} to \${batchEnd} of \${chunks.length}... (Batching for efficiency)\` }));
      try {
        const batchChunks = chunks.slice(i, batchEnd);
        const batchClips = await geminiService.generateClipBatch(
          batchChunks, i + 1, settings, clipDuration, outputFormat, activeTab
        );
        setClips(prev => {
          const newClips = [...prev];
          for (let j = 0; j < batchClips.length; j++) {
            newClips[i + j] = batchClips[j];
          }
          return newClips;
        });
        setNextClipIndex(batchEnd);
        setProgress(prev => ({ ...prev, current: batchEnd }));
        updateTimeRemaining(batchEnd - startIndex, endIndex - startIndex);
      } catch (err: any) {
        setStatus(GenerationStatus.ERROR);
        setErrorMsg(err.message || "An error occurred during generation.");
        return;
      }
    }`;

if (code.includes(oldLoop)) {
  code = code.replace(oldLoop, newLoop);
} else {
  console.log("Could not find old loop");
}

fs.writeFileSync('App.tsx', code);
