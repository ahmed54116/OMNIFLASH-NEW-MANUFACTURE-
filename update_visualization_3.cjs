const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const documentaryVisualization = `==================================
DOCUMENTARY VISUALIZATION DIRECTOR
==================================
The documentary should primarily consist of uninterrupted live-action footage.
Visualizations are secondary storytelling tools whose purpose is to explain information that cannot be communicated clearly through live footage alone.
Before generating every scene ask:
Can this narration be fully understood through live footage?
If YES
Generate only live documentary footage.
If NO
Ask
Can subtle visual augmentation explain it while keeping the live footage visible?
If YES
Generate live footage with integrated documentary visualization.
If NO
Generate a dedicated documentary information scene.
Always prefer the least intrusive solution.
Never interrupt the documentary unnecessarily.
VALID VISUALIZATION TYPES
The AI should intelligently choose the most appropriate visualization.
Do not always use lines.
Possible visualization types include:
Location markers
Expedition routes
Topographic maps
Satellite landscapes
Scientific cutaways
Anatomical cross sections
Bee flight paths
Migration paths
Territory boundaries
Height references
Distance references
Scale comparisons
Species comparisons
Population distribution
Timeline visualizations
Season calendars
Life cycle diagrams
Object identification labels
Environmental callouts
Chapter titles
Measurement references
Simple process visualizations
The chosen visualization should communicate the narration in the clearest possible way.
LIVE FOOTAGE AUGMENTATION
Whenever possible the visualization should remain integrated into the real documentary footage instead of replacing it.
Examples
A cliff remains visible while a subtle height reference develops.
Hunters continue walking while the expedition path is indicated.
The forest remains visible while bee flight paths become gently apparent.
The hive remains visible while its structure is identified.
The audience should continue watching reality while receiving additional information.
DOCUMENTARY DESIGN LANGUAGE
Every visualization must resemble a premium BBC Earth, National Geographic or Netflix documentary.
Minimalistic.
Elegant.
Restrained.
Realistic.
Use thin lines.
Small typography.
Muted colors.
Natural transparency.
Soft fades.
Smooth continuous movement.
Never resemble:
PowerPoint
Gaming HUD
News graphics
YouTube infographics
Corporate presentations
Educational cartoons
VISUALIZATION MOTION
Describe visual events instead of animation techniques.
Never say:
Animated map
Motion graphic
Overlay
Infographic
Instead describe exactly what the audience experiences.
Examples
A realistic shaded relief landscape gradually becomes visible.
A route progressively develops across mountain valleys.
A subtle boundary slowly forms around the region.
A scientific cutaway gradually reveals the internal structure.
A measurement reference extends naturally toward the hive.
Labels quietly appear only when needed before gently disappearing.
Motion should always feel physically believable.
Elements should never bounce.
Never overshoot.
Never jitter.
Never oscillate.
Never redraw completed sections.
Never randomly move.
Every movement should have a clear beginning, progression and ending.
VISUALIZATION PHYSICS
Every visualization should obey realistic motion.
Routes always progress in one direction.
Reference lines remain anchored.
Labels remain fixed.
Paths follow realistic geography.
Flight paths follow believable animal behavior.
Boundaries remain stable.
Graphs reveal progressively.
Timelines develop chronologically.
Nothing should flicker.
Nothing should randomly change position.
Nothing should detach from its anchor.
Nothing should deform unnaturally.
FREQUENCY
Visualizations should remain rare.
Approximately
80 to 90 percent
of scenes should contain only live documentary footage.
Approximately
10 to 20 percent
may contain documentary visualizations.
Dedicated information scenes should be even rarer.
Only use them when live footage cannot communicate the information.
Never generate visualizations simply for visual variety.
Every visualization must teach something the audience could not immediately understand from the footage alone.
REALISM
Every visualization should feel like it exists naturally within the documentary world.
The audience should remember the information.
Not the graphic.
Every visualization must appear visually indistinguishable from premium wildlife documentary productions.`;

// Replace all occurrences of DOCUMENTARY VISUALIZATION DIRECTOR block.
// We match up to the next section or line

code = code.replace(/==================================\nDOCUMENTARY VISUALIZATION DIRECTOR[\s\S]*?(?=PROMPT LENGTH LIMIT:|OUTPUT RULES:|\`)/g, documentaryVisualization + '\n\n');

fs.writeFileSync('services/geminiService.ts', code);
console.log("Updated full visualization guidelines 3.");
