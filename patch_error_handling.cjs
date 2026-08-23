const fs = require('fs');
let code = fs.readFileSync('./services/geminiService.ts', 'utf-8');

code = code.replace(/const error = await response\.json\(\);\s*throw new Error\(error\.error \|\| (.*?)\);/g, `
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        const error = await response.json();
        throw new Error(error.error || $1);
    } else {
        const text = await response.text();
        throw new Error("Server Error " + response.status + ": " + text.substring(0, 100));
    }
`);

fs.writeFileSync('./services/geminiService.ts', code);
console.log("Patched error handling in frontend service.");
