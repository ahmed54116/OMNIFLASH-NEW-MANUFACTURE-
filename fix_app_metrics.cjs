const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

// Fix metrics.estimatedClipCount
code = code.replace(
  /const estimatedClipCount = Math\.ceil\(\(estimatedDurationMinutes \* 60\) \/ clipDuration\);/,
  "const estimatedClipCount = scriptChunks.length > 0 ? scriptChunks.length : Math.ceil((estimatedDurationMinutes * 60) / clipDuration);"
);

// Remove ~ from Estimated Clips
code = code.replace(
  /Est\. Clips: ~\{metrics\.estimatedClipCount\}/g,
  "Est. Clips: {metrics.estimatedClipCount}"
);
code = code.replace(
  /Estimated Clips: ~\{metrics\.estimatedClipCount\}/g,
  "Estimated Clips: {metrics.estimatedClipCount}"
);

fs.writeFileSync('App.tsx', code);
console.log("Fixed App metrics");
