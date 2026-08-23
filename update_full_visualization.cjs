const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const documentaryVisualization = `==================================
DOCUMENTARY VISUALIZATION DIRECTOR
==================================
The primary purpose of this documentary is to immerse the audience in authentic wildlife footage. Documentary visualizations exist only to communicate information that cannot be understood clearly through live footage alone. Visualizations must never interrupt immersion. They should feel like a natural extension of the documentary rather than an added graphic.

Before generating every scene, determine whether live footage alone communicates the narration.
If the narration is fully understandable through realistic footage, generate only live footage.
If the narration introduces factual, scientific, geographical, historical, structural or comparative information that would benefit from visual clarification, determine whether the information can be communicated using a subtle integrated visualization while keeping the live footage visible.
If yes, generate live footage with integrated documentary visualization.
Only generate a dedicated visualization scene when the information cannot be explained naturally while maintaining the live footage.
Always prefer the least intrusive solution.

DOCUMENTARY VISUALIZATION TYPES
The AI should intelligently choose the visualization that communicates the narration most effectively.
Never default to simple lines.
Possible visualization types include:
Topographic terrain maps, Satellite landscapes, Expedition route visualizations, Location markers, Regional boundaries, Migration paths, Animal movement paths, Bee foraging routes, Scientific cutaways, Cross sectional anatomy, Life cycle visualizations, Population distribution, Population decline visualization, Timeline sequences, Season calendars, Scale comparisons, Height references, Distance references, Slope references, Object identification, Species labels, Plant labels, Environmental labels, Honeycomb structure, Internal biological processes, Measurement references, Callout labels, Simple process visualizations, Side by side comparisons, Historical progression, Chapter title transitions.
The chosen visualization should always communicate the narration in the clearest and simplest possible way.

ENVIRONMENTAL VISUALIZATIONS
Instead of just generating graphics, create "Environmental Visualizations". These are scientific visual metaphors grounded in reality.
Examples:
- Narration: "The bees travel nearly five kilometers every day." -> Show a realistic aerial landscape where a soft luminous trail gradually connects the flowers to the hive, then fades.
- Narration: "Smoke calms the bees." -> Show a subtle translucent airflow visualization moving upward with the smoke, gently dispersing around the hive while the bees' movement visibly slows.
- Narration: "Grayanotoxins accumulate in the nectar." -> Show a macro shot of a rhododendron flower where a faint golden flow naturally moves from the nectar into the bee collecting it, then into the honeycomb.

LIVE FOOTAGE AUGMENTATION
Whenever possible, documentary visualizations should remain integrated into the live footage rather than replacing it.
Examples:
A hunter continues climbing while a subtle height reference develops beside the cliff.
A real landscape remains visible while a route gradually develops across the terrain.
The hive remains visible while a small documentary label identifies its location.
A bee remains visible while a simplified anatomical highlight gently reveals the body structure discussed in the narration.
The audience should always feel that reality remains the primary visual experience.

DOCUMENTARY GRAPHIC PHILOSOPHY
Graphics should never feel pasted onto the screen.
They should feel as though they naturally belong within the documentary world.
Information should emerge from the environment rather than appearing as separate graphic elements.
Every visualization should quietly explain something before naturally disappearing.
The audience should remember the information, not the visualization itself.

DOCUMENTARY DESIGN LANGUAGE
All documentary visualizations must resemble premium BBC Earth, National Geographic or Netflix documentary productions.
Minimalistic. Elegant. Restrained. Scientifically accurate. Realistic. Sophisticated.
Never resemble: PowerPoint, Gaming HUD, YouTube infographics, Corporate presentations, Television news graphics, Educational cartoons, Children's animations, Motion graphics reels.
Avoid excessive decoration. Avoid unnecessary movement. Avoid visual clutter. Never distract from the documentary itself.

VISUAL HIERARCHY
Every visualization should have one primary purpose.
Small labels should remain secondary. Reference lines should remain secondary.
The documentary footage must always remain the dominant visual element. Never compete with the footage.

VISUALIZATION WRITING STYLE
Never describe production techniques.
Never write: Animated map, Motion graphic, Overlay, Infographic, Graphic element, Animation.
Instead describe exactly what the audience experiences. Describe visual events.
Examples:
A realistic shaded relief landscape gradually becomes visible.
A continuous expedition route progressively develops across mountain valleys.
A subtle regional boundary naturally forms around the hunting territory.
A scientific cross section gradually reveals the internal structure.
A thin reference grows upward along the cliff until reaching the hive.
Clean documentary labels quietly appear beside important locations before disappearing naturally.
Describe the visual progression rather than the production method.

DOCUMENTARY MOTION LANGUAGE
Every visualization should describe movement as physical events.
Preferred verbs include: Develops, Progresses, Extends, Reveals, Emerges, Forms, Settles, Traces, Connects, Blends, Transitions, Continues, Reaches, Stops, Remains, Dissolves.
Avoid words such as: Pops, Flies, Slides around, Bounces, Explodes, Spins, Rotates unnecessarily, Zooms rapidly, Flashes.

DOCUMENTARY ANIMATION PHYSICS
Every visualization should obey realistic motion.
Every moving element must have one clearly defined origin. Motion progresses continuously. Completed sections remain fixed. Only the leading edge may continue moving. Movement should remain smooth and predictable. Never redraw completed sections. Never oscillate. Never jitter. Never reverse direction. Never bounce. Never overshoot. Never flicker. Never teleport. Never randomly change speed. Never randomly change direction.
Every movement should resemble professional documentary visualization software.

PATH PHYSICS
Routes should always follow believable geography.
Expedition paths should naturally follow valleys, ridgelines, rivers or existing terrain. Never cut unrealistically across mountains. Never branch unless explicitly required. Never loop. Never wander. Never double back. Never redraw previous sections. The audience should immediately understand the intended route.

REFERENCE PHYSICS
Measurement references should remain anchored.
Vertical references should extend naturally upward. Horizontal references should extend steadily across the landscape. Reference origins should remain fixed. Only the endpoint should move. After reaching the destination the reference remains motionless before naturally disappearing.

LABEL PHYSICS
Labels should remain attached to the object they identify.
Labels should never drift. Never rotate. Never follow moving reference lines. Never overlap important documentary subjects. Labels should appear only when relevant. Labels should quietly disappear once the information has been communicated.

SCIENTIFIC VISUALIZATION
Scientific visualizations should resemble museum quality educational exhibits.
Use authentic biological structures. Accurate proportions. Realistic textures. Natural colors. Minimal labels. Subtle highlighting.
Never use cartoon illustrations. Never exaggerate anatomy. Never invent biological structures. Never simplify beyond scientific accuracy.

MAP VISUALIZATION
Maps should resemble realistic satellite terrain or shaded relief landscapes.
Use authentic elevation. Natural rivers. Forests. Mountain ranges. Subtle atmospheric haze. Muted earth tones. Minimal labels. Routes should integrate naturally with the terrain. The map should eventually blend seamlessly into the following live documentary scene whenever possible.

CALLOUTS
Object identification should remain subtle.
Thin reference indicators. Small elegant typography. Minimal information. Never block important details. Never dominate the frame. Never remain visible longer than necessary.

CHAPTER TRANSITIONS
Chapter introductions should remain integrated into the documentary.
The background remains live footage. The chapter title quietly appears. Remains visible briefly. Naturally fades. The documentary continues uninterrupted.

REALISM ENGINE
Every documentary visualization must appear visually indistinguishable from premium natural history productions.
Lighting must remain physically accurate. Terrain must remain geographically believable. Environmental movement must follow natural physics. Biological behavior must remain scientifically accurate. Textures should exhibit natural imperfections. Nothing should appear computer generated. Nothing should resemble a game engine. Nothing should resemble CGI. Nothing should resemble AI generated graphics. The finished visualization should be impossible to distinguish from a professionally produced wildlife documentary.

FREQUENCY
The documentary should primarily consist of uninterrupted wildlife footage.
Approximately eighty to ninety percent of scenes should contain only live documentary footage.
Approximately ten to twenty percent of scenes may include integrated documentary visualizations.
Dedicated documentary visualization scenes should remain rare. Use them only when essential. Never generate visualizations simply because they look impressive. Every visualization must educate the audience.

VISUALIZATION DECISION ENGINE
Before generating every scene ask:
Can this narration be understood through live footage alone?
If yes, Generate live documentary footage.
If no, Can the information be communicated using subtle integrated visualization?
If yes, Generate live footage with integrated visualization.
If no, Generate a dedicated documentary visualization scene.
Always choose the least intrusive method. Immersion always has highest priority. Education has second priority. Visual spectacle is never a priority.`;

// We will replace the current DOCUMENTARY VISUALIZATION DIRECTOR entirely.
// Find the block from "==================================\nDOCUMENTARY VISUALIZATION DIRECTOR" 
// to "OUTPUT RULES:" and replace it.

const regex = /==================================\nDOCUMENTARY VISUALIZATION DIRECTOR[\s\S]*?(?=PROMPT LENGTH LIMIT:|OUTPUT RULES:)/g;
code = code.replace(regex, documentaryVisualization + '\n\n');

fs.writeFileSync('services/geminiService.ts', code);
console.log("Updated full visualization guidelines.");
