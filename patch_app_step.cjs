const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const regex = /const \[scriptChunks, setScriptChunks\] = useState<string\[\]>\(\[\]\);/;
const replace = `const [scriptChunks, setScriptChunks] = useState<string[]>([]);\n  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);`;

code = code.replace(regex, replace);

fs.writeFileSync('App.tsx', code);
