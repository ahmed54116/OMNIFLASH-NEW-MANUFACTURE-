const fs = require('fs');
let code = fs.readFileSync('components/PromptCard.tsx', 'utf8');

const interfaceRegex = /interface PromptCardProps \{[\s\S]*?isRegenerating: boolean;\n\}/;
const newInterface = `interface PromptCardProps {
  clip: GeneratedClip;
  onRegenerate: (clipId: string, feedback: string) => void;
  isRegenerating: boolean;
  mode?: 'director' | 'prompt' | 'both';
}`;
code = code.replace(interfaceRegex, newInterface);

const componentRegex = /const PromptCard: React\.FC<PromptCardProps> = \(\{ clip, onRegenerate, isRegenerating \}\) => \{/;
const newComponent = `const PromptCard: React.FC<PromptCardProps> = ({ clip, onRegenerate, isRegenerating, mode = 'both' }) => {`;
code = code.replace(componentRegex, newComponent);

fs.writeFileSync('components/PromptCard.tsx', code);
