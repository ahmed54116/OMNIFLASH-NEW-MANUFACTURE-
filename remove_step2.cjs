const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const startStr = "{/* STEP 2: DIRECTOR REVIEW */}";
const endStr = "{/* STEP 3: PROMPT GENERATION */}";
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + code.substring(endIndex);
  // Also change STEP 3 to STEP 2
  code = code.replace("{/* STEP 3: PROMPT GENERATION */}", "{/* STEP 2: GENERATED PROMPTS */}");
  code = code.replace(/{currentStep === 3 && \(/g, "{currentStep === 2 && (");
  fs.writeFileSync('App.tsx', code);
  console.log("Removed old Step 2 and renamed Step 3 to Step 2");
} else {
  console.log("Could not find delimiters", startIndex, endIndex);
}
