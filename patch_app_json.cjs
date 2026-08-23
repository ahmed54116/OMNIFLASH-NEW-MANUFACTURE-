const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

// Patch parsedCustomChunksLength
const oldLengthLogic = `  let parsedCustomChunksLength = 0;
  if (customSplitJson.trim()) {
    try {
      const parsed = JSON.parse(customSplitJson);
      if (Array.isArray(parsed)) {
        parsedCustomChunksLength = parsed.length;
      }
    } catch(e) {}
  }`;

const newLengthLogic = `  let parsedCustomChunksLength = 0;
  if (customSplitJson.trim()) {
    try {
      const parsed = JSON.parse(customSplitJson);
      if (Array.isArray(parsed)) {
        parsedCustomChunksLength = parsed.length;
      } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.segments)) {
        parsedCustomChunksLength = parsed.segments.length;
      }
    } catch(e) {}
  }`;

code = code.replace(oldLengthLogic, newLengthLogic);

// Patch handleAnalyzeScript mapped logic
const oldMapLogic = `      if (customSplitJson.trim()) {
        try {
          const parsed = JSON.parse(customSplitJson);
          if (!Array.isArray(parsed)) throw new Error("Custom JSON must be an array of objects.");
          chunks = parsed.map(item => {
            if (typeof item === 'string') return item;
            const text = item.text || item.script || item.chunk || item.line || item.content;
            if (!text) return JSON.stringify(item);
            const timestamp = item.timestamp || item.start || item.time;
            return timestamp ? \`[\${timestamp}] \${text}\` : text;
          });
          if (chunks.length === 0) throw new Error("Custom JSON array is empty.");
        } catch (e) {
          throw new Error("Invalid Custom Split JSON: " + e.message);
        }`;

const newMapLogic = `      if (customSplitJson.trim()) {
        try {
          let parsed = JSON.parse(customSplitJson);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray(parsed.segments)) {
            parsed = parsed.segments;
          }
          if (!Array.isArray(parsed)) throw new Error("Custom JSON must be an array of objects or contain a 'segments' array.");
          chunks = parsed.map(item => {
            if (typeof item === 'string') return item;
            const text = item.text || item.script || item.chunk || item.line || item.content;
            if (!text) return JSON.stringify(item);
            const timestamp = item.timestamp ?? item.start ?? item.time;
            return timestamp !== undefined ? \`[\${timestamp}] \${text}\` : text;
          });
          if (chunks.length === 0) throw new Error("Custom JSON array is empty.");
        } catch (e) {
          throw new Error("Invalid Custom Split JSON: " + e.message);
        }`;

code = code.replace(oldMapLogic, newMapLogic);

fs.writeFileSync('App.tsx', code);
console.log("Patched JSON parsing logic");
