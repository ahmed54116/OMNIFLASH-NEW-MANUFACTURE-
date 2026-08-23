const fs = require('fs');
let content = fs.readFileSync('services/geminiService.ts', 'utf-8');

// Replace the prompt limit
content = content.replace(/PROMPT LENGTH LIMIT: The app NEVER writes a prompt that's more than 80-150 words\. If it is inevitable and absolutely necessary, it can go up to 200 words\. Keep it concise, punchy, and dense\./g, "PROMPT LENGTH LIMIT: the app never writes a prompt thats more than 150-200 words,,,if it is inevitable and absolutely necessary then it can gi till 250 words.");

fs.writeFileSync('services/geminiService.ts', content);
console.log("Updated prompt length limits.");
