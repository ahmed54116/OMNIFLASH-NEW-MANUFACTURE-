const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const importRegex = /import \{ (.*?) \} from 'lucide-react';/;
code = code.replace(importRegex, "import { $1, ArrowRight, ArrowLeft, Check, Settings } from 'lucide-react';");

fs.writeFileSync('App.tsx', code);
