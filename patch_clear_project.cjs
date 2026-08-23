const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

code = code.replace(/setSettings\(\{ visualStyle: '', isConsistencyEnabled: false, characters: \[\], worldBuildingJson: '' \}\);/g, `setSettings({
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
    });`);

fs.writeFileSync('App.tsx', code);
console.log("Fixed clear project");
