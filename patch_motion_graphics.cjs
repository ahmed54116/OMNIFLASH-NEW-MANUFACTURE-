const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const motionGraphicsText = `
====================================
DOCUMENTARY MOTION GRAPHICS DIRECTOR
====================================
Before generating each visual beat, determine whether the narration would be better explained using a dedicated documentary motion graphic instead of live-action footage.
Never attempt to place graphics on top of wildlife footage.
Never generate overlays.
Never mix animated graphics with photorealistic wildlife scenes.
If a graphic is needed, the entire prompt must become a standalone motion graphics scene.
Treat it as its own independent clip.
====================================
WHEN TO USE MOTION GRAPHICS
====================================
Use only when narration explains:
Locations
Maps
Migration routes
Travel paths
Distances
Statistics
Timelines
Historical events
Evolution
Anatomy
Scientific processes
Behavior diagrams
Food chains
Territories
Environmental change
Any concept that cannot be clearly shown with wildlife footage alone.
====================================
STYLE
====================================
Create a clean, modern documentary information graphic.
Flat design.
Minimal colors.
Subtle animation.
Professional typography.
Simple icons.
Smooth transitions.
Natural movement.
High readability.
Premium documentary broadcast quality.
The graphic itself is the scene.
No wildlife footage behind it.
No compositing.
No picture-in-picture.
No overlay.
No floating labels attached to animals.
====================================
EXAMPLES
====================================
INFOGRAPHIC SCENE. A clean animated topographic map of Yellowstone National Park gradually appears on a textured parchment background. A thin white line animates across the valley, tracing the wolves' hunting route while subtle location labels fade in. Minimal colors. Smooth motion. Professional wildlife documentary graphic.
INFOGRAPHIC SCENE. A minimalist timeline fills the frame, illustrating the evolution of ravens and wolves with clean animated icons, simple labels, and subtle connecting lines. Broadcast-quality documentary design.
====================================
OUTPUT
====================================
When graphics are unnecessary, generate a normal wildlife prompt.
When graphics are required, generate a dedicated standalone motion graphics prompt instead of attempting to overlay graphics onto wildlife footage.`;

// 1. Single Clip replacement
code = code.replace(
  "2. SCRIPT SYNC: Use the provided script line exactly. DO NOT INVENT NEXT ACTIONS.`;",
  "2. SCRIPT SYNC: Use the provided script line exactly. DO NOT INVENT NEXT ACTIONS.\n" + motionGraphicsText + "\n`;"
);

// 2. Batch Clip replacement
code = code.replace(
  "For each clip, return its details matching the required schema. Ensure the array length is exactly ${chunks.length}.`;",
  "For each clip, return its details matching the required schema. Ensure the array length is exactly ${chunks.length}.\n" + motionGraphicsText + "\n`;"
);

fs.writeFileSync('services/geminiService.ts', code);
console.log("Patched motion graphics successfully");
