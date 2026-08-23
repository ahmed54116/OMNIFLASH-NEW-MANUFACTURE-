const fs = require('fs');
let code = fs.readFileSync('serverGeminiService.ts', 'utf-8');
const oldText = "PROMPT LENGTH LIMIT: the app never writes a prompt thats more than 150-200 words,,,if it is inevitable and absolutely necessary then it can gi till 250 words.";
const newText = "PROMPT LENGTH LIMIT: You may write robust and highly detailed prompts up to 300 words to ensure all rules, descriptive structures, and exact details from the Manufacturing JSON are comprehensively captured.";

if(code.includes(oldText)) {
  code = code.split(oldText).join(newText);
  fs.writeFileSync('serverGeminiService.ts', code);
  console.log("Updated prompt length limit successfully.");
} else {
  console.log("Old text not found!");
}
