const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const oldGen = `  const handleInitialGenerate = async () => {
    if (!script.trim()) return;
    setStatus(GenerationStatus.PREPARING);
    setErrorMsg(null);
    stopGenerationRef.current = false;
    
    try {
      const chunks = await geminiService.splitScriptToChunks(script, clipDuration, 'standard');
      setScriptChunks(chunks);
      setClips([]);
      setNextClipIndex(0);
      setProgress({ current: 0, total: chunks.length, currentStep: 'Initializing generation...' });
      
      startSessionTracking();
      setStatus(GenerationStatus.GENERATING);
      const isTestBatchPhase = chunks.length > 10;
      const targetEnd = isTestBatchPhase ? 10 : chunks.length;
      await processScriptQueue(0, targetEnd, chunks);
    } catch (e: any) {
      setStatus(GenerationStatus.ERROR);
      setErrorMsg(e.message || "Failed to split script.");
    }
  };`;

const newGen = `  const handleInitialGenerate = async () => {
    if (!script.trim() && !customSplitJson.trim()) return;
    setStatus(GenerationStatus.PREPARING);
    setErrorMsg(null);
    stopGenerationRef.current = false;
    
    try {
      let chunksToUse = scriptChunks;
      if (chunksToUse.length === 0) {
         if (customSplitJson.trim()) {
           throw new Error("Please run Analyze Script first to parse your Custom JSON.");
         }
         chunksToUse = await geminiService.splitScriptToChunks(script, clipDuration, 'standard');
         setScriptChunks(chunksToUse);
      }
      setClips([]);
      setNextClipIndex(0);
      setProgress({ current: 0, total: chunksToUse.length, currentStep: 'Initializing generation...' });
      
      startSessionTracking();
      setStatus(GenerationStatus.GENERATING);
      const isTestBatchPhase = chunksToUse.length > 10;
      const targetEnd = isTestBatchPhase ? 10 : chunksToUse.length;
      await processScriptQueue(0, targetEnd, chunksToUse);
    } catch (e: any) {
      setStatus(GenerationStatus.ERROR);
      setErrorMsg(e.message || "Failed to start generation.");
    }
  };`;

if (code.includes(oldGen)) {
    code = code.replace(oldGen, newGen);
    fs.writeFileSync('App.tsx', code);
    console.log("Patched Initial Generate logic");
} else {
    console.log("Could not find oldGen block");
}
