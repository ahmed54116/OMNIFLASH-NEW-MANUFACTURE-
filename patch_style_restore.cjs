const fs = require('fs');
let code = fs.readFileSync('components/StyleEngine.tsx', 'utf-8');

const uiSection = `
          {/* Custom Instructions Section */}
          <div className="md:col-span-2 lg:col-span-3 space-y-2 mt-4">
             <div className="flex items-center justify-between">
                <div className="space-y-1">
                   <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2">
                     ✨ Image + Animation Prompts
                   </h3>
                   <p className="text-xs text-gray-400">
                     Generates a separate, motion-only animation prompt alongside the main image prompt for every shot.
                   </p>
                </div>
                <button 
                  onClick={() => handleChange('generateImageAndAnimationPrompts', !settings.generateImageAndAnimationPrompts)}
                  disabled={disabled}
                  className={\`px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold transition-all border \${
                    settings.generateImageAndAnimationPrompts 
                    ? 'bg-teal-900/50 text-teal-200 border-teal-500' 
                    : 'bg-gray-800 text-gray-400 border-gray-700'
                  }\`}
                >
                  {settings.generateImageAndAnimationPrompts ? <ToggleRight size={20} className="text-teal-400" /> : <ToggleLeft size={20} />}
                  {settings.generateImageAndAnimationPrompts ? "ON" : "OFF"}
                </button>
             </div>
          </div>
          
          <div className="md:col-span-2 lg:col-span-3 space-y-2 mt-4">`;

code = code.replace(/\{\/\* Custom Instructions Section \*\/\}/g, uiSection);

// add generateImageAndAnimationPrompts to array filter
code = code.replace(/'useEstablishingHook', 'protagonistLock'/g, "'useEstablishingHook', 'generateImageAndAnimationPrompts', 'protagonistLock'");

fs.writeFileSync('components/StyleEngine.tsx', code);
console.log("Restored StyleEngine");
