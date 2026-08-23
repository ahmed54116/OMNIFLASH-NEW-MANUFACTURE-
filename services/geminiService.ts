import { GoogleGenAI, Type } from "@google/genai";
import { StyleSettings, GeneratedClip, ClipDuration, OutputFormat, Character, BatchContext, GenerationResult, ManufacturingReferenceIndex } from "../types";
import { 
  VISUAL_STYLES, 
  LIGHTING_OPTIONS, 
  MOOD_OPTIONS, 
  CAMERA_STYLES, 
  CAMERA_MOVEMENTS 
} from '../constants';
import { manufacturingCompiler } from './manufacturingCompiler';

export const getApiKey = (): string => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.API_KEY) return process.env.API_KEY;
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  }
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (win.__GEMINI_API_KEY__) return win.__GEMINI_API_KEY__;
    if (win.aistudio?.apiKey) return win.aistudio.apiKey;
    if (win.process?.env?.API_KEY) return win.process.env.API_KEY;
    if (win.process?.env?.GEMINI_API_KEY) return win.process.env.GEMINI_API_KEY;
    const local = localStorage.getItem('veo_gemini_api_key');
    if (local) return local;
  }
  return '';
};

export const getAIClient = () => {
  const apiKey = getApiKey() || 'AI_STUDIO_SESSION_KEY';
  const isBrowser = typeof window !== 'undefined';
  const origin = isBrowser ? window.location.origin : 'http://localhost:3000';
  
  const clientOptions: any = { apiKey };
  // If no direct key in browser, route through the secure server proxy
  if (!getApiKey() && isBrowser) {
    clientOptions.baseUrl = `${origin}/api/gemini/proxy`;
  }
  return new GoogleGenAI(clientOptions);
};

// ============================================================
// EMPTY BATCH CONTEXT FACTORY
// ============================================================
const createEmptyBatchContext = (): BatchContext => ({
  previous_prompts_summary: [],
  visual_vocabulary_history: [],
  establishing_shots_registry: [],
  temporal_state: '',
  process_stages_shown: [],
  primary_subjects_used: []
});

// ============================================================
// HELPER: Split script into chunks based on visual beats
// (BUG FIX: removed dead `settings` reference that was never in scope)
// ============================================================
const splitScriptToChunks = async (script: string, clipDuration: number, mode?: 'standard' | 'creature'): Promise<string[]> => {
  const ai = getAIClient();
  const targetWords = Math.round(clipDuration * 2.5);

  const systemInstruction = `You are an elite video script editor and director.
Your job is to split the user's entire script into sequential chunks (an array of strings) that will each become ONE generated video clip.

CRITICAL TIMING & MATH RULES:
- The user has explicitly selected a clip duration of ${clipDuration} seconds.
- At an average narration speed of 150 words per minute (2.5 words per second), ${clipDuration} seconds equals exactly ${targetWords} words per clip.
- You MUST aggressively adhere to this math. 
- You MUST split the script into chunks of approximately ${targetWords} words.
- Do NOT default to 8 seconds or 15 words if the user asked for something else.

RULES:
1. Identify visual beats in the script.
2. Align each beat with the exact narration timing of ${clipDuration} seconds (${targetWords} words).
3. Not every chunk has to be EXACTLY ${targetWords} words, but the AVERAGE must be. Sometimes ${targetWords} words contain two actions, and sometimes ${Math.max(40, targetWords * 2)} words describe one slow action.
4. Split by visual beats, then trim or merge those beats to match the corresponding ${clipDuration} seconds of voiceover (around ${targetWords} words on average).
5. Ensure the split covers the ENTIRE script with NO missed words and NO extra words. The combined text of your chunks MUST exactly equal the original script text.
6. Each chunk must be a coherent thought or action that can be represented as a single cinematic shot.
7. Return ONLY a JSON array of strings. Do not use markdown wrappers.`;

  try {
     const response = await ai.models.generateContent({
       model: "gemini-2.5-flash", 
       contents: `Split this script into chunks according to the rules:\n\n${script}`,
       config: {
         systemInstruction,
         responseMimeType: "application/json",
         responseSchema: {
           type: Type.ARRAY,
           items: { type: Type.STRING }
         }
       }
     });
     
     const jsonStr = response.text;
     if (!jsonStr) throw new Error("Empty response");
     return JSON.parse(jsonStr);
  } catch (error) {
     console.error("Split Script Error:", error);
     throw error;
  }
};

// ============================================================
// HELPER: Analyze video style from image/video
// (BUG FIX: removed dead `settings`/`continuityContext` reference)
// ============================================================
const analyzeVideoStyle = async (imageBase64: string, mimeType: string): Promise<any> => {
  const ai = getAIClient();

  const systemInstruction = `Analyze this image or video frame and determine the optimal visual style, mood, and technical camera instructions. Return ONLY a JSON object matching the schema.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: imageBase64 } },
          { text: "Analyze the visual style of this image." }
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            visualStyle: { type: Type.STRING, enum: VISUAL_STYLES },
            colorPalette: {
              type: Type.OBJECT,
              properties: {
                primary: { type: Type.STRING },
                secondary: { type: Type.STRING },
                accent: { type: Type.STRING }
              }
            },
            mood: { type: Type.STRING, enum: MOOD_OPTIONS },
            lighting: { type: Type.STRING, enum: LIGHTING_OPTIONS },
            cameraStyle: { type: Type.STRING, enum: CAMERA_STYLES },
            cameraMovement: { type: Type.STRING, enum: CAMERA_MOVEMENTS },
            artKeywords: { type: Type.STRING }
          },
          required: ["visualStyle", "colorPalette", "mood", "lighting", "cameraStyle", "cameraMovement", "artKeywords"]
        }
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) throw new Error("No analysis result");
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Video Analysis Error:", error);
    throw error;
  }
};

// ============================================================
// HELPER: Analyze character from image
// (BUG FIX: removed dead `settings`/`continuityContext` reference)
// ============================================================
const analyzeCharacterImage = async (imageBase64: string, mimeType: string): Promise<string> => {
  const ai = getAIClient();

  const systemInstruction = `You are a Character Designer for Film. Analyze this character image. Write a precise, 40-word physical description suitable for a video generation prompt. Focus STRICTLY on: Age, Gender, Ethnicity, Hairstyle/Color, Clothing (Style/Color), and Distinctive Facial Features. Do not describe the background, lighting, or pose. Output only the description string.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: imageBase64 } },
          { text: "Describe this character's physical appearance for a prompt." }
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "text/plain",
      }
    });
    return response.text || "Could not analyze character.";
  } catch (error) {
    console.error("Character Analysis Error:", error);
    throw new Error("Failed to analyze character image.");
  }
};

// ============================================================
// HELPER: Deep search character appearance
// (BUG FIX: removed dead `settings`/`continuityContext` reference)
// ============================================================
const deepSearchCharacterAppearance = async (characterName: string): Promise<string> => {
  const ai = getAIClient();

  const systemInstruction = `You are an elite Character Concept Artist and Medical/Historical Archivist. The user will provide a specific character, person, or historical figure name. Your task is to conduct a deep search and generate a highly detailed, comprehensive JSON object describing their EXACT physical appearance, clothing, and distinctive features based on historical records, clinical findings, or established canon. Output valid JSON ONLY.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Provide a highly detailed physical and visual breakdown for: ${characterName}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    const jsonStr = response.text;
    if (!jsonStr) throw new Error("No analysis result");
    const parsed = JSON.parse(jsonStr);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    console.error("Deep Search Error:", error);
    throw new Error("Failed to deep search character appearance.");
  }
};

// ============================================================
// HELPER: Analyze text for characters
// (BUG FIX: removed dead `settings`/`continuityContext` reference)
// ============================================================
const analyzeTextForCharacters = async (text: string, mode: 'standard' | 'creature' = 'standard'): Promise<Character[]> => {
  const ai = getAIClient();

  const systemInstruction = `You are an elite Character/Subject Consistency parser. The user will provide a text which could be a raw script, documentary bible, lore, or a raw JSON object/array. Extract all recurring characters, wildlife species, or key subjects into a strict JSON array matching the schema. If the input is a complex JSON (like a documentary build/bible), specifically look for 'creature_design_master', 'character_profiles', or similar sections and map them directly into this schema accurately and efficiently. Capture their physical descriptions, visual styles, and characteristics accurately. Ensure you extract the primary subject (e.g. Dunkleosteus, wolves, protagonist) as a character so the consistency engine can track them.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: text,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              role: { type: Type.STRING },
              description: { type: Type.STRING },
              shortDescription: { type: Type.STRING },
              alias: { type: Type.STRING },
              isFaceLocked: { type: Type.BOOLEAN },
              visualStyle: { type: Type.STRING }
            },
            required: ["name", "role", "description", "shortDescription", "isFaceLocked"]
          }
        }
      }
    });
    const jsonStr = response.text;
    if (!jsonStr) throw new Error("No characters found");
    return JSON.parse(jsonStr).map((c: any) => ({ ...c, id: crypto.randomUUID(), colorPalette: { primary: '', secondary: '', accent: '' }, artKeywords: '', cameraStyle: '', cameraMovement: '', mood: '', lighting: '' }));
  } catch (error) {
    console.error("Text Character Analysis Error:", error);
    return [];
  }
};

// ============================================================
// HELPER: Smart parse config
// (BUG FIX: removed dead `settings`/`continuityContext` reference)
// ============================================================
const smartParseConfig = async (text: string): Promise<any> => {
  const ai = getAIClient();

  const systemInstruction = `Extract any style override configuration from the text as a JSON object matching the visual style parameters.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: text,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             visualStyle: { type: Type.STRING },
             mood: { type: Type.STRING },
             lighting: { type: Type.STRING },
             cameraStyle: { type: Type.STRING },
             cameraMovement: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Config parse error:", error);
    return {};
  }
};


// ============================================================
// SHARED SCHEMAS
// ============================================================
const detailedJsonSchema: any = {
  type: Type.OBJECT,
  properties: {
    script_source: { type: Type.STRING },
    camera_director: {
      type: Type.OBJECT,
      properties: {
        shot_type: { type: Type.STRING },
        camera_movement: { type: Type.STRING }
      },
      required: ["shot_type", "camera_movement"]
    },
    visual_prompt: { type: Type.STRING }
  },
  required: ["script_source", "camera_director", "visual_prompt"]
};


// ============================================================
// MANUFACTURING MODE: Build system instruction from scene packet
// (NEW: uses compiled reference instead of raw JSON)
// ============================================================
const buildManufacturingSystemInstruction = (
  settings: StyleSettings,
  scenePacketText: string | null,
  batchContext: BatchContext | null,
  clipCount: number,
  clipDuration: number,
  isBatch: boolean
): string => {
  // Cross-batch context injection
  const crossBatchSection = (batchContext && batchContext.previous_prompts_summary.length > 0)
    ? `\n==================================
CROSS-BATCH CONTEXT (CRITICAL FOR DIVERSITY)
==================================
PREVIOUSLY GENERATED PROMPTS (summarized):
${batchContext.previous_prompts_summary.map((s, i) => `- Clip ${i + 1}: ${s}`).join('\n')}

VISUAL VOCABULARY USED SO FAR: ${batchContext.visual_vocabulary_history.join(' → ')}
LOCATIONS ALREADY ESTABLISHED: ${batchContext.establishing_shots_registry.join(', ') || 'None yet'}
PROCESS STAGES SHOWN: ${batchContext.process_stages_shown.join(' → ') || 'None yet'}
PRIMARY SUBJECTS USED: ${batchContext.primary_subjects_used.join(', ') || 'None yet'}
CURRENT TEMPORAL STATE: ${batchContext.temporal_state || 'Beginning'}

CRITICAL: You MUST NOT repeat the same primary subject, visual vocabulary category, or process stage as the last 2-3 clips listed above unless the narration explicitly requires it. Actively diversify.`
    : '';

  // Scene packet section (compiled reference or fallback to raw JSON)
  let sceneDataSection = '';
  if (scenePacketText) {
    sceneDataSection = `\n${scenePacketText}`;
  } else if (settings.manufacturingJson) {
    // Fallback: use raw JSON if no compiled reference available
    sceneDataSection = `\n==================================
MANUFACTURING JSON (STRICT OVERRIDE — FALLBACK MODE)
==================================
${settings.manufacturingJson}

CRITICAL INSTRUCTION: You MUST strictly adhere to the guidelines and rules provided in the Manufacturing JSON above for EVERY prompt. All other style, character, and continuity guidelines are IGNORED in favor of this JSON.`;
  }

  return `You are an elite cinematic director and AI video prompt engineer.
Your task is to generate visual prompts for ${isBatch ? `a sequence of ${clipCount} video clips` : 'a video clip'} (${clipDuration} seconds each).

MANUFACTURING REFERENCE DETECTED. IGNORE DEFAULT GLOBAL STYLE.
${sceneDataSection}
${crossBatchSection}

*** IDENTITY ANCHOR SYSTEM ***
When referencing machines, equipment, or environments from the reference:
- On FIRST mention in the sequence: Use the FULL ANCHOR description (~40 words with key dimensions, materials, components).
- On SUBSEQUENT mentions: Use the SHORT ANCHOR (~20 words with name + key dimension + distinguishing feature).
- Do NOT copy-paste the entire multi-sentence description every time. Use identity anchors.

*** WORD BUDGET ALLOCATION (300 words max) ***
- Identity anchors: ~60 words (20%) — machine/equipment identity
- Narrative evidence: ~120 words (40%) — the specific visual proving the narration claim  
- Environment/atmosphere: ~45 words (15%) — scene-relevant details only
- Camera/composition: ~45 words (15%) — purposeful framing
- Negative constraints: ~30 words (10%) — always last

REQUIRED PROMPT STRUCTURE (Follow EXACTLY in order):
1. VISUAL HOOK: First sentence establishes the frame (location, subject, mood).
2. PRIMARY SUBJECT & IDENTITY ANCHOR: Introduce with identity anchor. Use full anchor on first mention, short anchor on subsequent.
3. SUPPORTING SUBJECT: (If applicable).
4. ENVIRONMENT: Describe only what affects the shot. It must feel alive.
5. STARTING STATE: Where does the shot begin explicitly.
6. ONE CLEAR ACTION: One action only. Not five actions.
7. REALISTIC BEHAVIOR: Physical behavior > appearance description.
8. ENVIRONMENTAL INTERACTION: Everything interacts (mud compressing, water dripping, sparks flying).
9. VISUAL PROGRESSION: The shot should evolve. Something changes. Beginning → Middle → End.
10. VIEWER PERSPECTIVE: Tell the generator what the shot should feel like.
11. ENDING STATE: A natural destination for the frame.
12. DOCUMENTARY STYLE: Short tag at end: "photorealistic 35mm optical cinematography, natural film grain, authentic industrial realism, no CGI appearance, clean live-action frame without on-screen graphics".
13. NEGATIVE CONSTRAINTS: Always last.

====================================
ZERO ON-SCREEN TEXT & CLEAN FRAME RULE (CRITICAL)
====================================
1. CAMERA BRAND & MODEL NAMES BANNED: NEVER include camera brand names, camera model numbers, or trademark words in the prompt (e.g. NEVER write "ARRI", "Alexa 65", "RED", "Sony FX9", "IMAX"). Video generation models misinterpret these keywords as camera HUD overlays and render camera watermarks, logos, and telemetry directly onto the video frames!
   - INSTEAD USE: "photorealistic 35mm optical cinematography, natural film grain, authentic industrial realism, no CGI appearance, clean live-action frame without on-screen graphics".

2. RAW TELEMETRY & MEASUREMENT STRINGS BANNED: NEVER output raw technical dimension syntax, slashes, or unit codes in the prompt body (e.g. NEVER write "14.57m / 90r110/5", "8.5 bar", "191 MPa", "92m", "Light 100t", "4.5 0km"). AI video models misinterpret these strings as on-screen text, subtitles, and telemetry HUD overlays!
   - ALWAYS TRANSLATE NUMBERS INTO NATURAL VISUAL PROSE:
     * Instead of "14.57m diameter cutterhead" -> "colossal four-story-tall circular steel cutter head"
     * Instead of "92m depth below sea" -> "deep seabed cavern floor beneath murky ocean waters"
     * Instead of "8.5 bar pressure" -> "extreme hydrostatic water pressure with dense swirling sediment"
     * Instead of "191 MPa rock" -> "unyielding solid granite rock face"
     * Instead of "100t crane" -> "massive heavy-duty industrial gantry crane"
     * Instead of "The Yongzhou / Dinghai TBMs" -> "the colossal Yongzhou undersea tunnel boring machine"

3. LIVE-ACTION CINEMATOGRAPHY PURITY: Every live-action shot must be 100% clean cinematic footage with ZERO on-screen text, ZERO subtitles, ZERO watermarks, ZERO logos, and ZERO HUD telemetry.

4. MANDATORY NEGATIVE KEYWORDS AT END OF EVERY PROMPT:
   Every visual prompt MUST end with:
   "NEGATIVE: no text, no letters, no numbers, no words, no subtitles, no captions, no typography, no watermarks, no logos, no HUD, no UI overlays, no telemetry, no camera labels, no technical readouts, no on-screen graphics, no branding, clean live-action frame."

CRITICAL DIAGNOSTIC RULES FOR PROMPT GENERATION (ALL 22 MANDATORY):
1. TOPIC & NARRATION AWARE: For every shot, determine what exact statement, event, object, process, or consequence the narration is proving.
2. SCENE FUNCTION: What is the shot's unique Scene Function? Generic functions are invalid. A valid Scene Function identifies unique evidence.
3. VISUAL VOCABULARY: Which category is dominant? (MACHINE, PEOPLE, PROCESS, INFRASTRUCTURE, ENVIRONMENT, GEOGRAPHY, HUMAN CONSEQUENCE). Actively rotate. Do not allow 3+ consecutive identical categories.
4. SHOT DIVERSITY (DUPLICATE REJECTION): Is this shot genuinely visually different from nearby shots? Changing camera angle or rewording does NOT make it different.
5. ESTABLISHING VS EXPLANATORY: Does the shot establish location or explain a process? Don't repeatedly establish the same location.
6. CONTINUITY VS REDUNDANCY: Preserve environment when locked. But repeating environment does not make repeated content acceptable.
7. INVISIBLE CONCEPTS REQUIRE VISIBLE EVIDENCE: Abstract concepts must translate into specific visible physical consequences.
8. LOCKED VS CREATIVE: Locked facts (dimensions, geography, machinery) CANNOT change. Creative variables (camera, lighting, composition) CAN change.
9. TEMPORAL PROGRESSION: Shots must evolve chronologically. Do not repeat the same state.
10. SHOT ALLOCATION: Important technical events get highly specific shots; trivial transitions get fewer.
11. STRONG POSITIVE SPECIFICATION: Establish what SHOULD appear. Do not rely solely on negative prompts.
12. FINAL VALIDATION GATE: "Could the viewer replace this shot with the previous shot without losing unique visual information?" If yes, revise.
13. VIEWER-VISIBLE EVIDENCE: Compliance based on what the viewer can see, not technical descriptions.
14. SAME SUBJECT DIFFERENTIATION: Consecutive same-subject shots must prove different facts through different visible mechanisms.
15. INFRASTRUCTURE DUPLICATE DETECTION: Same infrastructure = potential duplicate even with different component names.
16. PROCESS SEQUENCE ENFORCEMENT: Assign explicit process stages (PREPARATION → POSITIONING → TOOL ENGAGEMENT → COMPONENT REMOVAL).
17. ATMOSPHERIC DESCRIPTION LIMIT: Environmental adjectives must not be primary content of multiple consecutive shots.
18. TECHNICAL CLAIM TRANSLATION: "Can the viewer actually see this claim?" Priority: visible proof over technical narration.
19. CONSECUTIVE SHOT REPLACEMENT TEST: "If Shot B were removed, would Shot A already communicate the same thing?" If yes, revise substantially.
20. NARRATION TO VISUAL CAUSALITY: Prioritize verbs, causality, consequences over nouns. Don't generate visuals just because they contain the same noun.
21. ABSTRACT CLAIM TRANSLATION: Abstract narration → visible physical evidence. "blind" → opaque slurry blocking visibility.
22. IDENTITY ANCHOR SYSTEM: Use short identity anchors for repeated mentions. Full description only on first introduction. Never use bare nouns without any identity anchor.

====================================
GROUNDED DOCUMENTARY CAMERA RULES (STRICT CINEMATOGRAPHY)
====================================
Every shot MUST have EXACTLY ONE simple, linear, physically grounded camera movement (or be a locked-off static shot).
1. FORBIDDEN: Compound multi-stage camera moves (e.g., "the camera pans across the port, then tilts to the coast, then zooms into the shaft").
2. FORBIDDEN: Rapid sweeping pans, 360-degree orbital arcs, swooping drone loops, fast rotational moves, or whip pans.
3. FORBIDDEN: Fast camera movement.
4. REQUIRED: Heavy, grounded ARRI Alexa cinema camera on a stabilized tripod, slow linear dolly track, or weighted crane.
5. ALLOWED CAMERA MOVES (Pick EXACTLY ONE per shot):
   - "Static locked-off tripod shot on a heavy fluid head with subtle natural ambient vibration"
   - "Slow, steady linear push-in on an 85mm prime lens at 0.2m/s"
   - "Slow, steady linear pull-back on a 50mm prime lens at 0.2m/s"
   - "Slow, level horizontal tracking dolly shot moving strictly parallel to the subject"
   - "Slow, vertical crane boom down/up along a single steady vertical axis"
   - "Fixed-altitude aerial straight-line tracking shot with steady, slow forward velocity"
6. CINEMATIC PRINCIPLE: The camera is rock-solid and stable. The motion in the scene comes from the SUBJECT and ENVIRONMENT (crashing storm waves, churning slurry, swinging crane rigging, divers torquing bolts), NOT from camera acrobatics!

====================================
DOCUMENTARY MOTION GRAPHICS PACING & QUOTA (MAX 10-12 TOTAL, SCATTERED)
====================================
1. STRICT QUOTA: No more than 10-12 motion graphic scenes across the ENTIRE 50-shot project (~20% maximum).
2. STRICT NON-CONSECUTIVE SPACING: NEVER generate two motion graphic scenes in a row. Every motion graphic MUST be followed by at least 3-4 photorealistic live-action documentary shots.
${batchContext?.last_was_motion_graphic ? '3. CRITICAL CONSTRAINT FOR THIS BATCH: The previous shot was a motion graphic. You are STRICTLY FORBIDDEN from generating a motion graphic in this batch. You MUST generate photorealistic live-action cinematography.' : ''}
${(batchContext?.motion_graphics_count || 0) >= 10 ? '3. CRITICAL CONSTRAINT: Maximum motion graphics quota reached (10/10). You are STRICTLY FORBIDDEN from generating any motion graphics. You MUST generate photorealistic live-action cinematography.' : ''}
4. DEFAULT: Photorealistic live-action ARRI Alexa cinematography is the DEFAULT for all narrative beats, machinery, maintenance, divers, ports, construction shafts, and storms.
5. MOTION GRAPHICS ARE STRICTLY RESERVED FOR:
   - Deep-subsurface geological cross-section maps (hidden underground strata).
   - Stylized global/regional geographic route comparison maps.
   - Abstract internal hydrostatic pressure/stress physics diagrams.
6. When a motion graphic is generated, it must be standalone (no photorealism, clean technical aesthetic, animated line work and depth indicators).
7. Never mix animated graphics with photorealistic live footage in the same shot.

====================================
CLEAN NEGATIVE CONSTRAINTS FORMATTING
====================================
At the end of every visual prompt, append ONLY clean, concise, human-readable negative keywords:
Format: "no fast pan, no sweeping camera, no circular motion, no dry conditions, no CGI appearance, no readable text, no military vessels, no normal atmosphere".
NEVER include raw database keys, boolean flags (like ":true"), or code identifiers in the prompt text!

${!settings.generateImageAndAnimationPrompts ? "IMPORTANT: Generate a single, comprehensive visual_prompt. This prompt MUST describe both the visual scene AND the animation/movement/behavior within a single cohesive text block. DO NOT split them." : "IMPORTANT: Generate a visual prompt and a separate animation prompt."}

OUTPUT RULES:
1. JSON STRUCTURE: Output valid JSON exactly matching the schema.
2. SCRIPT SYNC: Use the provided script line exactly. DO NOT INVENT NEXT ACTIONS.`;
};


// ============================================================
// STANDARD MODE: Build system instruction
// ============================================================
const buildStandardSystemInstruction = (
  settings: StyleSettings,
  batchContext: BatchContext | null,
  clipCount: number,
  clipDuration: number,
  isJsonMode: boolean,
  isBatch: boolean
): string => {
  const charactersContext = (settings.characters && settings.characters.length > 0)
    ? `\n==================================
CAST & CONSISTENCY (CRITICAL)
==================================
${settings.characters.map(c => `- [${c.shortDescription}]: ${c.description} | Style: ${c.visualStyle} | Palette: ${c.colorPalette?.primary || 'none'}, ${c.colorPalette?.secondary || 'none'}, ${c.colorPalette?.accent || 'none'}`).join('\n')}

CRITICAL INSTRUCTION FOR CHARACTERS: 
1. Whenever a character appears in a clip, you MUST explicitly describe them EXACTLY the same way using their FULL physical description.
2. Do NOT just refer to them by name. Video generators do not know who "John" is.
3. Replace the character's name with their detailed physical description seamlessly.
4. EACH PROMPT IS INDEPENDENT. Inject FULL detailed physical description into THAT specific prompt.`
    : "";

  // Build extra settings (excluding core fields and manufacturing-specific fields)
  const excludeKeys = ['visualStyle', 'colorPalette', 'mood', 'lighting', 'cameraStyle', 'cameraMovement', 'artKeywords', 'characters', 'isConsistencyEnabled', 'useEstablishingHook', 'protagonistLock', 'customInstructions', 'manufacturingJson', 'compiledReference', 'batchContext', 'continuityJson', 'worldBuildingJson', 'generateImageAndAnimationPrompts'];
  const extraSettings = Object.keys(settings)
    .filter(k => !excludeKeys.includes(k))
    .reduce((obj, key) => {
      if (settings[key] !== undefined && settings[key] !== null && settings[key] !== '') {
        obj[key] = settings[key];
      }
      return obj;
    }, {} as any);
  
  const extraSettingsText = Object.keys(extraSettings).length > 0 
    ? `\n==================================
ADDITIONAL VISUAL CONSISTENCY JSON GUIDELINES
==================================
${JSON.stringify(extraSettings, null, 2)}

CRITICAL INSTRUCTION: You MUST strictly adhere to the guidelines and rules provided in the JSON above for every prompt.`
    : "";

  const continuityContext = (settings.continuityJson && settings.continuityJson.trim())
    ? `\n==================================
CONTINUITY CONTEXT (CRITICAL)
==================================
${settings.continuityJson}

CRITICAL INSTRUCTION FOR CONTINUITY:
1. The Prompt Writer must automatically load the Character JSON, Visual Style JSON and Continuity JSON before generating every prompt.
2. The Prompt Writer may never contradict any continuity information.
3. If the narration explicitly changes an object's state, update that object's state while preserving its identity.
4. Never create duplicate locations.
5. Never create duplicate equipment.
6. Never replace recurring objects.
7. Never reset object state between scenes.
8. Never reset environmental state.`
    : "";

  const crossBatchSection = (batchContext && batchContext.previous_prompts_summary.length > 0)
    ? `\n==================================
CROSS-BATCH CONTEXT (DIVERSITY ENFORCEMENT)
==================================
PREVIOUSLY GENERATED: ${batchContext.previous_prompts_summary.map((s, i) => `Clip ${i + 1}: ${s}`).join(' | ')}
SUBJECTS USED: ${batchContext.primary_subjects_used.join(', ') || 'None yet'}
CRITICAL: Actively diversify from the above.`
    : '';

  return `You are the Prompt Director inside a documentary production system.
Your job is NOT to output your reasoning.
Your job is to silently think like a cinematographer and output ONLY production-ready prompts.

${isBatch ? `Your task is to generate visual prompts for a sequence of ${clipCount} video clips (${clipDuration} seconds each).` : ''}

GLOBAL STYLE & DIRECTION:
- Visual Style: ${settings.visualStyle}
- Lighting: ${settings.lighting}
- Mood: ${settings.mood}
- Default Camera Style: ${settings.cameraStyle}
- Default Camera Movement: ${settings.cameraMovement}
- Color Palette: Primary ${settings.colorPalette?.primary || 'none'}, Secondary ${settings.colorPalette?.secondary || 'none'}, Accent ${settings.colorPalette?.accent || 'none'}
- Extra Keywords: ${settings.artKeywords || 'None'}
${charactersContext}
${extraSettingsText}
${continuityContext}
${crossBatchSection}

${!settings.generateImageAndAnimationPrompts ? "IMPORTANT: Generate a single, comprehensive visual_prompt for each clip. This prompt MUST describe both the visual scene AND the animation/movement/behavior within a single cohesive text block. DO NOT split them." : "IMPORTANT: Generate a visual prompt and a separate animation prompt for each clip."}

PROMPT LENGTH LIMIT: 150-250 words max.
REQUIRED PROMPT STRUCTURE (Follow EXACTLY in order):
1. VISUAL HOOK: The first sentence should instantly establish the frame.
2. PRIMARY SUBJECT & CHARACTER INJECTION: IF a character is present, INJECT THEIR FULL DETAILED PHYSICAL DESCRIPTION.
3. SUPPORTING SUBJECT: (If applicable).
4. ENVIRONMENT: Describe only what affects the shot. It must feel alive.
5. STARTING STATE: Where does the shot begin explicitly.
6. ONE CLEAR ACTION: One action only.
7. REALISTIC BEHAVIOR: Behavior > Appearance.
8. ENVIRONMENTAL INTERACTION: Everything interacts.
9. VISUAL PROGRESSION: The shot should evolve. Something changes.
10. VIEWER PERSPECTIVE: Tell the generator what the shot should feel like.
11. ENDING STATE: A natural destination for the frame.
12. DOCUMENTARY STYLE: "photorealistic 35mm optical cinematography, natural film grain, authentic documentary realism, clean frame without on-screen graphics or text, no artificial CGI appearance".
13. NEGATIVE CONSTRAINTS: Always last.

====================================
ZERO ON-SCREEN TEXT & CLEAN FRAME RULE (CRITICAL)
====================================
1. CAMERA BRAND & MODEL NAMES BANNED: NEVER include camera brand names or model codes (e.g. NEVER write "ARRI", "Alexa 65", "RED", "Sony", "IMAX"). Video generation models treat these as prompt watermarks and render logos and HUD timecodes directly onto the video frames!
   - INSTEAD USE: "photorealistic 35mm optical cinematography, natural film grain, authentic documentary realism, no CGI appearance, clean live-action frame without on-screen graphics".

2. RAW TELEMETRY & MEASUREMENT STRINGS BANNED: NEVER output raw technical dimension syntax, slashes, or unit codes in the prompt body (e.g. NEVER write "14.57m / 90r110/5", "8.5 bar", "191 MPa", "92m", "Light 100t"). AI video models misinterpret these strings as on-screen text, subtitles, and telemetry HUD overlays!
   - ALWAYS TRANSLATE NUMBERS INTO NATURAL VISUAL PROSE: Describe physical visual scale instead of raw metric readouts.

3. LIVE-ACTION CINEMATOGRAPHY PURITY: Every live-action shot must be 100% clean cinematic footage with ZERO on-screen text, ZERO subtitles, ZERO watermarks, ZERO logos, and ZERO HUD telemetry.

4. MANDATORY NEGATIVE KEYWORDS AT END OF EVERY PROMPT:
   Every visual prompt MUST end with:
   "NEGATIVE: no text, no letters, no numbers, no words, no subtitles, no captions, no typography, no watermarks, no logos, no HUD, no UI overlays, no telemetry, no camera labels, no technical readouts, no on-screen graphics, no branding, clean live-action frame."

DIRECTOR BRAIN FORMULA:
Before writing each prompt, silently answer: Why does this shot exist? What is the visual event? What changes? What should the viewer notice first/last? What behavior sells realism? How does the environment react? What emotion should the viewer feel?

====================================
GROUNDED DOCUMENTARY CAMERA RULES (STRICT CINEMATOGRAPHY)
====================================
Every shot MUST have EXACTLY ONE simple, linear, physically grounded camera movement (or be a locked-off static shot).
1. FORBIDDEN: Compound multi-stage camera moves (e.g., "pans across X, then tilts to Y, then zooms into Z").
2. FORBIDDEN: Rapid sweeping pans, 360-degree orbital arcs, swooping drone loops, fast rotational moves, or whip pans.
3. FORBIDDEN: Fast camera movement.
4. REQUIRED: Heavy, grounded ARRI Alexa cinema camera on a stabilized tripod, slow linear dolly track, or weighted crane.
5. ALLOWED CAMERA MOVES (Pick EXACTLY ONE per shot):
   - "Static locked-off tripod shot on a heavy fluid head with subtle natural ambient vibration"
   - "Slow, steady linear push-in on an 85mm prime lens at 0.2m/s"
   - "Slow, steady linear pull-back on a 50mm prime lens at 0.2m/s"
   - "Slow, level horizontal tracking dolly shot moving strictly parallel to the subject"
   - "Slow, vertical crane boom down/up along a single steady vertical axis"
   - "Fixed-altitude aerial straight-line tracking shot with steady, slow forward velocity"
6. CINEMATIC PRINCIPLE: The camera is rock-solid and stable. The motion in the scene comes from the SUBJECT and ENVIRONMENT, NOT from camera acrobatics!

====================================
DOCUMENTARY MOTION GRAPHICS PACING & QUOTA (MAX 10-12 TOTAL, SCATTERED)
====================================
1. STRICT QUOTA: No more than 10-12 motion graphic scenes across the entire 50-shot project (~20% maximum).
2. STRICT NON-CONSECUTIVE SPACING: NEVER generate two motion graphic scenes in a row. Every motion graphic MUST be followed by at least 3-4 photorealistic live-action documentary shots.
${batchContext?.last_was_motion_graphic ? '3. CRITICAL CONSTRAINT: The previous shot was a motion graphic. You are STRICTLY FORBIDDEN from generating a motion graphic in this batch. You MUST generate photorealistic live-action cinematography.' : ''}
${(batchContext?.motion_graphics_count || 0) >= 10 ? '3. CRITICAL CONSTRAINT: Maximum motion graphics quota reached (10/10). You are STRICTLY FORBIDDEN from generating any motion graphics. You MUST generate photorealistic live-action cinematography.' : ''}
4. DEFAULT: Photorealistic live-action cinematography is the standard.
5. MOTION GRAPHICS ARE STRICTLY RESERVED FOR:
   - Deep-subsurface geological cross-section maps.
   - Stylized global/regional geographic route comparison maps.
   - Abstract internal hydrostatic pressure/stress physics diagrams.

OUTPUT RULES:
1. JSON STRUCTURE: Output valid JSON exactly matching the schema.
2. SCRIPT SYNC: Use the provided script line exactly. DO NOT INVENT NEXT ACTIONS.
3. NO GENERIC TERMS: Do not say "Good lighting". Say "${settings.lighting}".
${isJsonMode ? '4. SAFETY: negative_prompt MUST include: "no text, no letters, no numbers, no subtitles, no captions, no typography, no watermarks, no logos, no HUD, no UI overlays, no telemetry, no fast pan, no sweeping camera, no circular motion".' : ''}`;
};


// ============================================================
// GENERATE SINGLE CLIP
// ============================================================
const generateSingleClip = async (
  chunkText: string,
  clipNumber: number,
  settings: StyleSettings,
  clipDuration: number,
  outputFormat: OutputFormat,
  mode: 'standard' | 'creature' = 'standard'
): Promise<GeneratedClip> => {
  const ai = getAIClient();
  const hasManufacturingJson = settings.manufacturingJson && settings.manufacturingJson.trim().length > 0;

  // Build scene packet if compiled reference exists
  let scenePacketText: string | null = null;
  if (hasManufacturingJson && settings.compiledReference) {
    const beats = settings.compiledReference.visual_beats;
    const matchedBeat = manufacturingCompiler.matchChunkToBeat(chunkText, beats);
    if (matchedBeat) {
      const stageId = matchedBeat.stage_id || settings.compiledReference.construction_stages[0]?.reference_id || 'STAGE_01';
      const packet = manufacturingCompiler.resolveScenePacket(
        settings.compiledReference, stageId, matchedBeat.reference_id, `SCENE_${String(clipNumber).padStart(3, '0')}`
      );
      const validation = manufacturingCompiler.validateScene(packet);
      if (validation.valid || validation.errors.length === 0) {
        scenePacketText = manufacturingCompiler.formatScenePacketForPrompt(packet);
      } else {
        console.warn(`Scene validation warnings for clip ${clipNumber}:`, validation.warnings);
        scenePacketText = manufacturingCompiler.formatScenePacketForPrompt(packet);
      }
    }
  }

  let systemInstruction: string;
  if (hasManufacturingJson) {
    systemInstruction = buildManufacturingSystemInstruction(
      settings, scenePacketText, settings.batchContext || null, 1, clipDuration, false
    );
  } else {
    systemInstruction = buildStandardSystemInstruction(
      settings, settings.batchContext || null, 1, clipDuration, outputFormat === 'json', false
    );
  }

  try {
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash", 
        contents: `Generate Prompt for Clip #${clipNumber}. Script Segment: "${chunkText}"\n\n${!settings.generateImageAndAnimationPrompts ? "IMPORTANT: Generate a single, comprehensive visual_prompt. This prompt MUST describe both the visual scene AND the animation/movement/behavior within a single cohesive text block. DO NOT split them into separate prompts." : "IMPORTANT: Generate a visual prompt and a separate animation prompt."}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: detailedJsonSchema
        }
      });
    } catch (singleErr: any) {
      console.warn(`Initial single clip generation failed for clip ${clipNumber}, retrying in 2s...`, singleErr);
      await new Promise(res => setTimeout(res, 2000));
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash", 
        contents: `Generate Prompt for Clip #${clipNumber}. Script Segment: "${chunkText}"\n\n${!settings.generateImageAndAnimationPrompts ? "IMPORTANT: Generate a single, comprehensive visual_prompt. This prompt MUST describe both the visual scene AND the animation/movement/behavior within a single cohesive text block. DO NOT split them into separate prompts." : "IMPORTANT: Generate a visual prompt and a separate animation prompt."}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: detailedJsonSchema
        }
      });
    }

    const jsonStr = response.text;
    if (!jsonStr) throw new Error("Empty response from AI");
    
    const data = JSON.parse(jsonStr);

    return {
      id: crypto.randomUUID(),
      clipNumber: clipNumber,
      scriptLine: data.script_source || chunkText,
      narrativeContext: data.script_source || "",
      visualPrompt: data.visual_prompt || '',
      animationPrompt: settings.generateImageAndAnimationPrompts ? (data.animation_prompt || '') : '',
      // BUG FIX: Don't fall back to global settings.cameraStyle in manufacturing mode
      shotType: data.camera_director?.shot_type || (hasManufacturingJson ? '' : settings.cameraStyle) || '',
      cameraMovement: data.camera_director?.camera_movement || (hasManufacturingJson ? '' : settings.cameraMovement) || '',
      jsonOutput: data
    };
  } catch (error) {
    console.error(`Error generating clip ${clipNumber}:`, error);
    throw error;
  }
};


// ============================================================
// GENERATE CLIP BATCH (with cross-batch context)
// ============================================================
const generateClipBatch = async (
  chunks: string[],
  startClipNumber: number,
  settings: StyleSettings,
  clipDuration: number,
  outputFormat: OutputFormat,
  mode: 'standard' | 'creature' = 'standard',
  batchContext?: BatchContext
): Promise<GenerationResult> => {
  const ai = getAIClient();
  const isJsonMode = outputFormat === 'json';
  const hasManufacturingJson = settings.manufacturingJson && settings.manufacturingJson.trim().length > 0;
  const currentBatchContext = batchContext || createEmptyBatchContext();

  // Build scene packets for each chunk if compiled reference exists
  let combinedScenePacketText: string | null = null;
  if (hasManufacturingJson && settings.compiledReference) {
    const { packets } = manufacturingCompiler.resolveChunksToPackets(
      chunks, settings.compiledReference, startClipNumber
    );
    const packetTexts: string[] = [];
    const isFirstMention: Record<string, boolean> = {};
    
    // Track which identity anchors have already been introduced in previous batches
    for (const subject of currentBatchContext.primary_subjects_used) {
      isFirstMention[subject] = true;
    }
    
    for (let i = 0; i < packets.length; i++) {
      if (packets[i]) {
        packetTexts.push(`\n--- CLIP ${startClipNumber + i} SCENE REFERENCE ---\n${manufacturingCompiler.formatScenePacketForPrompt(packets[i]!, isFirstMention)}`);
      }
    }
    if (packetTexts.length > 0) {
      combinedScenePacketText = packetTexts.join('\n');
    }
  }

  // Build schema
  const clipSchema: any = {
    type: Type.OBJECT,
    properties: {
      narrativeContext: { type: Type.STRING, description: "Brief visual context" },
      visualPrompt: { type: Type.STRING, description: "The final detailed prompt" },
      shotType: { type: Type.STRING },
      cameraMovement: { type: Type.STRING },
      primary_subject: { type: Type.STRING, description: "The primary visual subject of this clip" },
      visual_vocabulary_category: { type: Type.STRING, description: "MACHINE, PEOPLE, PROCESS, INFRASTRUCTURE, ENVIRONMENT, GEOGRAPHY, or HUMAN_CONSEQUENCE" }
    },
    required: ["narrativeContext", "visualPrompt"]
  };

  if (settings.generateImageAndAnimationPrompts) {
    clipSchema.properties.animationPrompt = { type: Type.STRING };
  }
  if (isJsonMode) {
    clipSchema.properties.jsonOutput = detailedJsonSchema;
  }

  const batchSchema = {
    type: Type.ARRAY,
    items: clipSchema,
    description: "An array of generated clips exactly matching the number of input chunks."
  };

  // Build input data
  let inputData = "";
  chunks.forEach((chunk, index) => {
     inputData += `Clip ${startClipNumber + index} Script: "${chunk}"\n`;
  });

  // Build system instruction
  let systemInstruction: string;
  if (hasManufacturingJson) {
    systemInstruction = buildManufacturingSystemInstruction(
      settings, combinedScenePacketText, currentBatchContext, chunks.length, clipDuration, true
    );
  } else {
    systemInstruction = buildStandardSystemInstruction(
      settings, currentBatchContext, chunks.length, clipDuration, isJsonMode, true
    );
  }

  // Add input chunks to contents
  const contents = `INPUT SCRIPT CHUNKS:\n${inputData}\n\nFor each clip, return its details matching the required schema. Ensure the array length is exactly ${chunks.length}.`;

  let response;
  try {
    response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: batchSchema,
        temperature: 0.7,
      }
    });
  } catch (apiErr: any) {
    console.warn("Primary batch generation attempt failed, retrying once in 2s...", apiErr);
    // Short backoff retry if rate limited or temporarily overloaded
    await new Promise(res => setTimeout(res, 2000));
    response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: batchSchema,
        temperature: 0.7,
      }
    });
  }

  try {
    const data = JSON.parse(response.text || '[]');
    const generatedClips: GeneratedClip[] = data.map((clipData: any, i: number) => ({
      id: crypto.randomUUID(),
      clipNumber: startClipNumber + i,
      scriptLine: chunks[i],
      narrativeContext: clipData.narrativeContext || clipData.jsonOutput?.script_source || 'Visual sequence',
      visualPrompt: clipData.visualPrompt || clipData.jsonOutput?.visual_prompt || '',
      animationPrompt: settings.generateImageAndAnimationPrompts ? (clipData.animationPrompt || clipData.jsonOutput?.animation_prompt || '') : '',
      // BUG FIX: Don't fall back to global settings in manufacturing mode
      shotType: clipData.shotType || clipData.jsonOutput?.camera_director?.shot_type || (hasManufacturingJson ? '' : settings.cameraStyle) || '',
      cameraMovement: clipData.cameraMovement || clipData.jsonOutput?.camera_director?.camera_movement || (hasManufacturingJson ? '' : settings.cameraMovement) || '',
      jsonOutput: isJsonMode ? clipData.jsonOutput : undefined
    }));

    // Check motion graphics generated in this batch
    const lastClip = generatedClips[generatedClips.length - 1];
    const lastWasMotionGraphic = lastClip ? (
      lastClip.visualPrompt.toLowerCase().includes('motion graphic') ||
      lastClip.visualPrompt.toLowerCase().includes('cross-section map') ||
      lastClip.visualPrompt.toLowerCase().includes('technical animation')
    ) : false;

    const newMotionGraphics = generatedClips.filter(c => 
      c.visualPrompt.toLowerCase().includes('motion graphic') ||
      c.visualPrompt.toLowerCase().includes('cross-section map') ||
      c.visualPrompt.toLowerCase().includes('technical animation')
    ).length;

    // Update batch context for next batch
    const updatedBatchContext: BatchContext = {
      previous_prompts_summary: [
        ...currentBatchContext.previous_prompts_summary,
        ...generatedClips.map(c => c.visualPrompt.substring(0, 80) + '...')
      ],
      visual_vocabulary_history: [
        ...currentBatchContext.visual_vocabulary_history,
        ...data.map((d: any) => d.visual_vocabulary_category || 'UNKNOWN')
      ],
      establishing_shots_registry: [...currentBatchContext.establishing_shots_registry],
      temporal_state: currentBatchContext.temporal_state,
      process_stages_shown: [...currentBatchContext.process_stages_shown],
      primary_subjects_used: [
        ...currentBatchContext.primary_subjects_used,
        ...data.map((d: any) => d.primary_subject || '').filter((s: string) => s)
      ],
      motion_graphics_count: (currentBatchContext.motion_graphics_count || 0) + newMotionGraphics,
      last_was_motion_graphic: lastWasMotionGraphic
    };

    return { clips: generatedClips, updatedBatchContext };
  } catch (error) {
    console.error("Failed to parse batch:", error);
    const fallbackClips = chunks.map((chunk, i) => ({
      id: crypto.randomUUID(),
      clipNumber: startClipNumber + i,
      scriptLine: chunk,
      narrativeContext: "Fallback context",
      visualPrompt: 'Failed to generate prompt. Please regenerate.',
      animationPrompt: '',
    }));
    return { clips: fallbackClips, updatedBatchContext: currentBatchContext };
  }
};


// ============================================================
// REGENERATE CLIP (BUG FIX: includes all 22 diagnostic rules)
// ============================================================
const regenerateClip = async (
  originalClip: GeneratedClip,
  settings: StyleSettings,
  instruction: string,
  outputFormat: OutputFormat,
  mode: 'standard' | 'creature' = 'standard'
): Promise<GeneratedClip> => {
  const ai = getAIClient();
  const hasManufacturingJson = settings.manufacturingJson && settings.manufacturingJson.trim().length > 0;

  // Build scene packet for this clip's script if compiled reference exists
  let scenePacketText: string | null = null;
  if (hasManufacturingJson && settings.compiledReference) {
    const matchedBeat = manufacturingCompiler.matchChunkToBeat(
      originalClip.scriptLine, settings.compiledReference.visual_beats
    );
    if (matchedBeat) {
      const stageId = matchedBeat.stage_id || settings.compiledReference.construction_stages[0]?.reference_id || 'STAGE_01';
      const packet = manufacturingCompiler.resolveScenePacket(
        settings.compiledReference, stageId, matchedBeat.reference_id, `SCENE_REGEN_${originalClip.clipNumber}`
      );
      scenePacketText = manufacturingCompiler.formatScenePacketForPrompt(packet);
    }
  }

  let systemInstruction: string;
  if (hasManufacturingJson) {
    // Use full manufacturing instruction with ALL 22 rules (BUG FIX: previously only had 12)
    systemInstruction = `Regenerate the clip's prompt using the custom user instruction: ${instruction}. Follow the exact same schema and guidelines.\n\n` +
      buildManufacturingSystemInstruction(settings, scenePacketText, null, 1, 8, false);
  } else {
    const continuityContext = (settings.continuityJson && settings.continuityJson.trim())
      ? `\nCONTINUITY CONTEXT:\n${settings.continuityJson}`
      : "";
    systemInstruction = `Regenerate the clip's prompt using the custom user instruction: ${instruction}. Follow the exact same schema and Director Score guidelines. ${continuityContext}`;
  }

  try {
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Regenerate this clip's JSON with instruction: "${instruction}". Original Script: "${originalClip.scriptLine}"`,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });
    } catch (regenErr: any) {
      console.warn(`Initial regeneration failed for clip ${originalClip.clipNumber}, retrying in 2s...`, regenErr);
      await new Promise(res => setTimeout(res, 2000));
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Regenerate this clip's JSON with instruction: "${instruction}". Original Script: "${originalClip.scriptLine}"`,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });
    }
    
    const jsonStr = response.text;
    if (!jsonStr) throw new Error("Empty response from AI");
    
    const data = JSON.parse(jsonStr);
    
    return {
      ...originalClip,
      visualPrompt: data.visual_prompt || originalClip.visualPrompt,
      animationPrompt: originalClip.animationPrompt ? (data.animation_prompt || originalClip.animationPrompt) : '',
      // BUG FIX: Don't fall back to global settings in manufacturing mode
      shotType: data.camera_director?.shot_type || originalClip.shotType || '',
      cameraMovement: data.camera_director?.camera_movement || originalClip.cameraMovement || '',
      jsonOutput: data
    };
  } catch (error) {
    console.error(`Error regenerating clip ${originalClip.clipNumber}:`, error);
    throw error;
  }
};


// ============================================================
// ANALYZE CONTINUITY
// ============================================================
const analyzeContinuity = async (script: string, settings: StyleSettings): Promise<string> => {
  const ai = getAIClient();

  const characterContext = settings.characters.map(c => `- [${c.shortDescription}]: ${c.description} | Style: ${c.visualStyle}`).join('\n');
  const styleContext = JSON.stringify(settings.worldBuildingJson || {}, null, 2);

  const systemInstruction = "You are the Continuity Generator inside a documentary production system.\n" +
"Your job is to preserve documentary continuity by generating a Continuity JSON.\n\n" +
"Input provided:\n" +
"1. Full documentary script\n" +
"2. Character JSON (Context)\n" +
"3. Visual Style JSON (Context)\n\n" +
"RULES:\n" +
"- You must never rewrite the script.\n" +
"- You must never write prompts.\n" +
"- You must never modify Character JSON.\n" +
"- You must never modify Visual Style JSON.\n" +
"- The Continuity JSON should contain ONLY information that is NOT already represented inside Character JSON or Visual Style JSON. Avoid duplication completely.\n" +
"- Extract:\n" +
"  - Documentary structure.\n" +
"  - Intro length.\n" +
"  - Story stages.\n" +
"  - Chapter boundaries.\n" +
"  - Persistent locations.\n" +
"  - Persistent objects.\n" +
"  - Persistent wildlife groups.\n" +
"  - Environmental progression.\n" +
"  - Object state progression.\n" +
"  - Action progression.\n" +
"  - Story progression.\n" +
"  - Continuity rules.\n" +
"- Assign every recurring location, object, animal group and environmental feature a persistent internal identifier.\n" +
"- If the narration explicitly changes an object's state, update that object's state while preserving its identity.\n" +
"- Never create duplicate locations, equipment, or replace recurring objects.\n" +
"- Never reset object state or environmental state between scenes.\n\n" +
"Output ONLY valid JSON representing the Continuity JSON. Do not include markdown formatting like ```json.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Script:\n" + script + "\n\nCharacter Context:\n" + characterContext + "\n\nStyle Context:\n" + styleContext + "\n\nGenerate the Continuity JSON.",
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) throw new Error("Empty response from AI");
    
    return JSON.stringify(JSON.parse(jsonStr), null, 2);
  } catch (error) {
    console.error('Error extracting continuity:', error);
    throw error;
  }
};

export const geminiService = {
  analyzeContinuity,
  generateClipBatch,
  splitScriptToChunks,
  generateSingleClip,
  regenerateClip,
  analyzeVideoStyle,
  analyzeCharacterImage,
  analyzeTextForCharacters,
  smartParseConfig,
  deepSearchCharacterAppearance,
  analyzeScriptForCharacters: analyzeTextForCharacters
};
