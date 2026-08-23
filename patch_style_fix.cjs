const fs = require('fs');
let code = fs.readFileSync('components/StyleEngine.tsx', 'utf-8');

// I added an unclosed div: <div className="md:col-span-2 lg:col-span-3 space-y-2 mt-4">
// I should just replace that specific unclosed div.
code = code.replace(/<div className="md:col-span-2 lg:col-span-3 space-y-2 mt-4">$/m, "");

fs.writeFileSync('components/StyleEngine.tsx', code);
console.log("Fixed StyleEngine");
