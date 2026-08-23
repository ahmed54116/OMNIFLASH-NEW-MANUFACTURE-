const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const replacement = `  const confirmClearProject = () => {
    storage.clear();
    setScript(''); 
    setClips([]); 
    setStatus(GenerationStatus.IDLE);
    setSettings({
      visualStyle: '',
      colorPalette: { primary: '', secondary: '', accent: '' },
      mood: '',
      lighting: '',
      cameraStyle: '',
      cameraMovement: '',
      artKeywords: '',
      characters: [],
      isConsistencyEnabled: false,
      useEstablishingHook: true,
      generateImageAndAnimationPrompts: false,
    });
    setHasAnalyzedCast(false); 
    setNextClipIndex(0); 
    setIsClearDialogOpen(false);
    setCurrentStep(1);
    setScriptChunks([]);
    setIsAnalysisComplete(false);
    setViewTab('script');
    setRegeneratingIds(new Set());
    setProgress({ current: 0, total: 0, currentStep: '' });
    setEstTimeRemaining('--:--');
    setErrorMsg(null);
  };`;

// replace the existing confirmClearProject
code = code.replace(/  const confirmClearProject = \(\) => \{[\s\S]*?setCurrentStep\(1\);\n  \};/m, replacement);

fs.writeFileSync('App.tsx', code);
console.log("Patched confirmClearProject");
