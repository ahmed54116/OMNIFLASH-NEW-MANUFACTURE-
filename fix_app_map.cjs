const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const oldMap = `          chunks = parsed.map(item => {
            const text = item.text || item.script || item.chunk || item.line || item.content;
            if (!text) return JSON.stringify(item);
            const timestamp = item.timestamp || item.start || item.time;
            return timestamp ? \`[\${timestamp}] \${text}\` : text;
          });`;

const newMap = `          chunks = parsed.map(item => {
            if (typeof item === 'string') return item;
            const text = item.text || item.script || item.chunk || item.line || item.content;
            if (!text) return JSON.stringify(item);
            const timestamp = item.timestamp || item.start || item.time;
            return timestamp ? \`[\${timestamp}] \${text}\` : text;
          });`;

if (code.includes(oldMap)) {
    code = code.replace(oldMap, newMap);
    fs.writeFileSync('App.tsx', code);
    console.log("Patched App.tsx array mapping");
} else {
    console.log("Could not find array mapping in App.tsx");
}

