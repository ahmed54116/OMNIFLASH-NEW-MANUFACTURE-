const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const pauseResumeCode = `

  const handlePause = () => {
    stopGenerationRef.current = true;
    setStatus(GenerationStatus.PAUSED);
    setProgress(prev => ({ ...prev, currentStep: 'Generation Paused.' }));
  };

  const handleResume = async () => {
    setStatus(GenerationStatus.PREPARING);
    stopGenerationRef.current = false;
    startSessionTracking();
    const startIndex = clips.length;
    setNextClipIndex(startIndex);
    setProgress({ current: startIndex, total: scriptChunks.length, currentStep: \`Resuming from Clip \${startIndex + 1}...\` });
    const isTestBatchPhase = scriptChunks.length > 10 && startIndex < 10;
    const targetEnd = isTestBatchPhase ? 10 : scriptChunks.length;
    await processScriptQueue(startIndex, targetEnd, scriptChunks);
  };
`;

code = code.replace("const renderMainButton = () => {", pauseResumeCode + "\n  const renderMainButton = () => {");
fs.writeFileSync('App.tsx', code);
