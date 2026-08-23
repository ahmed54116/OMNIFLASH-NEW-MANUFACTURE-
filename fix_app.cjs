const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const oldClipCount = `  const wordCount = script.trim() ? script.trim().split(/\\s+/).length : (customSplitJson.trim() ? customSplitJson.split(/\\s+/).length : 0);
  const estimatedDurationMinutes = wordCount / 150;
  const estimatedClipCount = scriptChunks.length > 0 ? scriptChunks.length : Math.ceil((estimatedDurationMinutes * 60) / clipDuration);`;

const newClipCount = `  let parsedCustomChunksLength = 0;
  if (customSplitJson.trim()) {
    try {
      const parsed = JSON.parse(customSplitJson);
      if (Array.isArray(parsed)) {
        parsedCustomChunksLength = parsed.length;
      }
    } catch(e) {}
  }
  const wordCount = script.trim() ? script.trim().split(/\\s+/).length : (customSplitJson.trim() ? customSplitJson.split(/\\s+/).length : 0);
  const estimatedDurationMinutes = wordCount / 150;
  const estimatedClipCount = scriptChunks.length > 0 ? scriptChunks.length : (parsedCustomChunksLength > 0 ? parsedCustomChunksLength : Math.ceil((estimatedDurationMinutes * 60) / clipDuration));`;

if (code.includes(oldClipCount)) {
    code = code.replace(oldClipCount, newClipCount);
    fs.writeFileSync('App.tsx', code);
    console.log("Patched App.tsx clip count");
} else {
    console.log("Could not find old clip count in App.tsx");
}

