const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const documentaryVisualization = `
==================================
DOCUMENTARY VISUALIZATION DIRECTOR
==================================
The primary purpose of this documentary is to immerse the audience in authentic wildlife footage. Documentary visualizations exist only to communicate information that cannot be understood clearly through live footage alone. Visualizations must never interrupt immersion. They should feel like a natural extension of the documentary rather than an added graphic.

Before generating every scene, determine whether live footage alone communicates the narration.
- If yes, generate only live footage.
- If the narration introduces factual, scientific, geographical, historical, structural or comparative information that would benefit from visual clarification, determine whether the information can be communicated using a subtle integrated visualization while keeping the live footage visible.
- Only generate a dedicated visualization scene when the information cannot be explained naturally while maintaining the live footage.

DOCUMENTARY VISUALIZATION TYPES:
The AI should intelligently choose the visualization that communicates the narration most effectively. Never default to simple lines.
Examples: Topographic terrain maps, Satellite landscapes, Expedition route visualizations, Location markers, Regional boundaries, Migration paths, Animal movement paths, Bee foraging routes, Scientific cutaways, Cross sectional anatomy, Life cycle visualizations, Population distribution, Population decline visualization, Timeline sequences, Season calendars, Scale comparisons, Height/Distance/Slope references, Object/Species/Plant/Environmental labels, Honeycomb structure, Internal biological processes, Measurement references, Callout labels, Simple process visualizations, Side by side comparisons, Historical progression, Chapter title transitions.

ENVIRONMENTAL VISUALIZATIONS (Highly Recommended):
Instead of traditional graphics, create "Environmental Visualizations". These are scientific visual metaphors grounded in reality.
Examples:
- Narration: "The bees travel nearly five kilometers every day." -> Show a realistic aerial landscape where a soft luminous trail gradually connects the flowers to the hive, then fades.
- Narration: "Smoke calms the bees." -> Show a subtle translucent airflow visualization moving upward with the smoke, gently dispersing around the hive while the bees' movement visibly slows.
- Narration: "Grayanotoxins accumulate in the nectar." -> Show a macro shot of a rhododendron flower where a faint golden flow naturally moves from the nectar into the bee collecting it, then into the honeycomb.

LIVE FOOTAGE AUGMENTATION:
Whenever possible, documentary visualizations should remain integrated into the live footage rather than replacing it.
- A hunter continues climbing while a subtle height reference develops beside the cliff.
- A real landscape remains visible while a route gradually develops across the terrain.
- The hive remains visible while a small documentary label identifies its location.
- A bee remains visible while a simplified anatomical highlight gently reveals the body structure.

DOCUMENTARY GRAPHIC PHILOSOPHY & DESIGN LANGUAGE:
Graphics should never feel pasted onto the screen. Information should emerge from the environment rather than appearing as separate graphic elements. Every visualization should quietly explain something before naturally disappearing.
All documentary visualizations must resemble premium BBC Earth, National Geographic or Netflix documentary productions.
Minimalistic, elegant, restrained, scientifically accurate, realistic, sophisticated.
Never resemble PowerPoint, Gaming HUD, YouTube infographics, Corporate presentations, Television news graphics, Educational cartoons, Children's animations, Motion graphics reels. Avoid visual clutter.

VISUALIZATION WRITING STYLE:
Never describe production techniques like "Animated map", "Motion graphic", "Overlay", "Infographic", "Graphic element", "Animation".
Instead describe exactly what the audience experiences. Describe visual events.
Example: "A realistic shaded relief landscape gradually becomes visible."
Example: "A scientific cross section gradually reveals the internal structure."

DOCUMENTARY MOTION & PHYSICS:
Describe movement as physical events (Develops, Progresses, Extends, Reveals, Emerges, Forms, Traces, Blends).
Avoid (Pops, Flies, Slides around, Bounces, Explodes, Spins).
Every visualization should obey realistic motion. Continuous progression, fixed completed sections. Routes follow believable geography. Labels stay attached to objects.
Realism Engine: Every documentary visualization must appear visually indistinguishable from premium natural history productions.

FREQUENCY: 80-90% live documentary footage. 10-20% integrated visualizations. Dedicated visualization scenes are rare. Immersion always has highest priority. Education has second priority. Visual spectacle is never a priority.
`;

// Insert it into the batch generation part
code = code.replace(/PROMPT LENGTH LIMIT: The app NEVER writes a prompt that's more than/g, documentaryVisualization + '\n\nPROMPT LENGTH LIMIT: The app NEVER writes a prompt that\'s more than');

fs.writeFileSync('services/geminiService.ts', code);
console.log("Updated documentary visualization for batch");
