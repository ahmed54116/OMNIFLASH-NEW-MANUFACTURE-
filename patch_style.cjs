const fs = require('fs');
let code = fs.readFileSync('components/StyleEngine.tsx', 'utf-8');

const regex1 = /<div className="bg-\[\#1e293b\] border border-teal-900\/50 rounded-xl p-4 md:col-span-2 lg:col-span-3">[\s\S]*?<\/div>\s*<\/div>\s*\{\/\* Custom Instructions Section \*\/\}/g;

code = code.replace(/<div className="bg-\[\#1e293b\] border border-teal-900\/50 rounded-xl p-4 md:col-span-2 lg:col-span-3">[\s\S]*?<\/div>\s*<\/div>\s*\{\/\* Custom Instructions Section \*\/\}/, '{/* Custom Instructions Section */}');

// Also modify the array includes: 'generateImageAndAnimationPrompts', -> remove it
code = code.replace(/'generateImageAndAnimationPrompts', /g, '');

fs.writeFileSync('components/StyleEngine.tsx', code);
