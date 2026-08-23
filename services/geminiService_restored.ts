import { GoogleGenAI, Type } from "@google/genai";
import { StyleSettings, GeneratedClip, ClipDuration, OutputFormat, Character } from "../types";
import { 
  VISUAL_STYLES, 
  LIGHTING_OPTIONS, 
  MOOD_OPTIONS, 
  CAMERA_STYLES, 
  CAMERA_MOVEMENTS 
} from '../constants';

const getAIClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper: Split script into chunks based on visual beats
const splitScriptToChunks = async (script: string, clipDuration: number, mode?: 'standard' | 'creature'): Promise<string[]> => {
  const ai = getAIClient();
  const targetWords = Math.round(clipDuration * 2.5);
  
      
  const continuityContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : null)
    ? `\n==================================\nCONTINUITY CONTEXT (CRITICAL)\n==================================\n${typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : ''}\n\nCRITICAL INSTRUCTION FOR CONTINUITY:\n1. The Prompt Writer must automatically load the Character JSON, Visual Style JSON and Continuity JSON before generating every prompt.\n2. The Prompt Writer may never contradict any continuity information.\n3. If the narration explicitly changes an object's state, update that object's state while preserving its identity.\n4. Never create duplicate locations.\n5. Never create duplicate equipment.\n6. Never replace recurring objects.\n7. Never reset object state between scenes.\n8. Never reset environmental state.`
    : "";

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
       model: "gemini-3-flash-preview", 
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

const analyzeVideoStyle = async (imageBase64: string, mimeType: string): Promise<any> => {
  const ai = getAIClient();
  
  const continuityContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : null)
    ? `\n==================================\nCONTINUITY CONTEXT (CRITICAL)\n==================================\n${typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : ''}\n\nCRITICAL INSTRUCTION FOR CONTINUITY:\n1. The Prompt Writer must automatically load the Character JSON, Visual Style JSON and Continuity JSON before generating every prompt.\n2. The Prompt Writer may never contradict any continuity information.\n3. If the narration explicitly changes an object's state, update that object's state while preserving its identity.\n4. Never create duplicate locations.\n5. Never create duplicate equipment.\n6. Never replace recurring objects.\n7. Never reset object state between scenes.\n8. Never reset environmental state.`
    : "";

  const systemInstruction = `Analyze this image or video frame and determine the optimal visual style, mood, and technical camera instructions. Return ONLY a JSON object matching the schema.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

const analyzeCharacterImage = async (imageBase64: string, mimeType: string): Promise<string> => {
  const ai = getAIClient();
  
  const continuityContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : null)
    ? `\n==================================\nCONTINUITY CONTEXT (CRITICAL)\n==================================\n${typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : ''}\n\nCRITICAL INSTRUCTION FOR CONTINUITY:\n1. The Prompt Writer must automatically load the Character JSON, Visual Style JSON and Continuity JSON before generating every prompt.\n2. The Prompt Writer may never contradict any continuity information.\n3. If the narration explicitly changes an object's state, update that object's state while preserving its identity.\n4. Never create duplicate locations.\n5. Never create duplicate equipment.\n6. Never replace recurring objects.\n7. Never reset object state between scenes.\n8. Never reset environmental state.`
    : "";

  const systemInstruction = `You are a Character Designer for Film. Analyze this character image. Write a precise, 40-word physical description suitable for a video generation prompt. Focus STRICTLY on: Age, Gender, Ethnicity, Hairstyle/Color, Clothing (Style/Color), and Distinctive Facial Features. Do not describe the background, lighting, or pose. Output only the description string.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

const deepSearchCharacterAppearance = async (characterName: string): Promise<string> => {
  const ai = getAIClient();
  
  const continuityContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : null)
    ? `\n==================================\nCONTINUITY CONTEXT (CRITICAL)\n==================================\n${typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : ''}\n\nCRITICAL INSTRUCTION FOR CONTINUITY:\n1. The Prompt Writer must automatically load the Character JSON, Visual Style JSON and Continuity JSON before generating every prompt.\n2. The Prompt Writer may never contradict any continuity information.\n3. If the narration explicitly changes an object's state, update that object's state while preserving its identity.\n4. Never create duplicate locations.\n5. Never create duplicate equipment.\n6. Never replace recurring objects.\n7. Never reset object state between scenes.\n8. Never reset environmental state.`
    : "";

  const systemInstruction = `You are an elite Character Concept Artist and Medical/Historical Archivist. The user will provide a specific character, person, or historical figure name. Your task is to conduct a deep search and generate a highly detailed, comprehensive JSON object describing their EXACT physical appearance, clothing, and distinctive features based on historical records, clinical findings, or established canon. Output valid JSON ONLY.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

const analyzeTextForCharacters = async (text: string, mode: 'standard' | 'creature' = 'standard'): Promise<Character[]> => {
  const ai = getAIClient();
    
  const continuityContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : null)
    ? `\n==================================\nCONTINUITY CONTEXT (CRITICAL)\n==================================\n${typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : ''}\n\nCRITICAL INSTRUCTION FOR CONTINUITY:\n1. The Prompt Writer must automatically load the Character JSON, Visual Style JSON and Continuity JSON before generating every prompt.\n2. The Prompt Writer may never contradict any continuity information.\n3. If the narration explicitly changes an object's state, update that object's state while preserving its identity.\n4. Never create duplicate locations.\n5. Never create duplicate equipment.\n6. Never replace recurring objects.\n7. Never reset object state between scenes.\n8. Never reset environmental state.`
    : "";

  const systemInstruction = `You are an elite Character/Subject Consistency parser. The user will provide a text which could be a raw script, documentary bible, lore, or a raw JSON object/array. Extract all recurring characters, wildlife species, or key subjects into a strict JSON array matching the schema. If the input is a complex JSON (like a documentary build/bible), specifically look for 'creature_design_master', 'character_profiles', or similar sections and map them directly into this schema accurately and efficiently. Capture their physical descriptions, visual styles, and characteristics accurately. Ensure you extract the primary subject (e.g. Dunkleosteus, wolves, protagonist) as a character so the consistency engine can track them.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

const smartParseConfig = async (text: string): Promise<any> => {
  const ai = getAIClient();
  
  const continuityContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : null)
    ? `\n==================================\nCONTINUITY CONTEXT (CRITICAL)\n==================================\n${typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : ''}\n\nCRITICAL INSTRUCTION FOR CONTINUITY:\n1. The Prompt Writer must automatically load the Character JSON, Visual Style JSON and Continuity JSON before generating every prompt.\n2. The Prompt Writer may never contradict any continuity information.\n3. If the narration explicitly changes an object's state, update that object's state while preserving its identity.\n4. Never create duplicate locations.\n5. Never create duplicate equipment.\n6. Never replace recurring objects.\n7. Never reset object state between scenes.\n8. Never reset environmental state.`
    : "";

  const systemInstruction = `Extract any style override configuration from the text as a JSON object matching the visual style parameters.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

const generateSingleClip = async (
  chunkText: string,
  clipNumber: number,
  settings: StyleSettings,
  clipDuration: number,
  outputFormat: OutputFormat,
  mode: 'standard' | 'creature' = 'standard'
): Promise<GeneratedClip> => {
  const ai = getAIClient();
  const isJsonMode = outputFormat === 'json';

  const directorScoreSchema = {
    type: Type.OBJECT,
    properties: {
      story_clarity: { type: Type.NUMBER, description: "Score out of 10.0" },
      visual_interest: { type: Type.NUMBER, description: "Score out of 10.0" },
      camera_variety: { type: Type.NUMBER, description: "Score out of 10.0" },
      emotion: { type: Type.NUMBER, description: "Score out of 10.0" },
      omni_flash_success: { type: Type.NUMBER, description: "Score out of 10.0" },
      continuity: { type: Type.NUMBER, description: "Score out of 10.0" }
    },
    required: ["story_clarity", "visual_interest", "camera_variety", "emotion", "omni_flash_success", "continuity"]
  };

  const directorBrainSchema = {
    type: Type.OBJECT,
    properties: {
      purpose: { type: Type.STRING, description: "Why this shot exists. e.g. Reveal the wolf's endurance before introducing the raven." },
      primary_subject: { type: Type.STRING },
      supporting_subject: { type: Type.STRING },
      main_behavior: { type: Type.STRING, description: "One specific action only. MUST strictly follow ONLY what happens in the provided narration for this clip, do not invent next actions." },
      viewer_notice_first: { type: Type.STRING },
      viewer_notice_last: { type: Type.STRING },
      environment_interaction: { type: Type.STRING },
      emotional_tone: { type: Type.STRING },
      visual_change: { type: Type.STRING },
      documentary_goal: { type: Type.STRING }
    },
    required: ["purpose", "primary_subject", "supporting_subject", "main_behavior", "viewer_notice_first", "viewer_notice_last", "environment_interaction", "emotional_tone", "visual_change", "documentary_goal"]
  };

  const promptComposerSchema = {
    type: Type.OBJECT,
    properties: {
      subject_priority: { type: Type.STRING, description: "Primary Subject, Secondary Subject, Background" },
      character_identity: { type: Type.STRING, description: "FULL identity continuity for ALL characters in the scene. Always fully describe the character (e.g. 'The same young olive-brown oxpecker with bright scarlet bill...')." },
      environment_description: { type: Type.STRING, description: "Always fully describe the environment." },
      start_frame: { type: Type.STRING, description: "Explicitly define the starting frame composition." },
      animal_movement: { type: Type.STRING, description: "Describe movement instead of abstract verbs. One action." },
      lighting_and_physics: { type: Type.STRING },
      end_frame: { type: Type.STRING, description: "Explicitly define the ending frame composition." },
      documentary_style: { type: Type.STRING, description: "Documentary Style." },
      negative_constraints: { type: Type.STRING, description: "Negative Constraints." }
    },
    required: [
      "subject_priority", "character_identity", "environment_description", "start_frame", 
      "animal_movement", "lighting_and_physics", "end_frame", "documentary_style", "negative_constraints"
    ]
  };

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


  
  const extraSettings = Object.keys(settings)
    .filter(k => !['visualStyle', 'colorPalette', 'mood', 'lighting', 'cameraStyle', 'cameraMovement', 'artKeywords', 'characters', 'isConsistencyEnabled', 'useEstablishingHook', 'protagonistLock', 'customInstructions'].includes(k))
    .reduce((obj, key) => {
      obj[key] = settings[key];
      return obj;
    }, {} as any);
  
    const extraSettingsText = (typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) ? '' :  Object.keys(extraSettings).length > 0 
    ? `\n==================================\nADDITIONAL VISUAL CONSISTENCY JSON GUIDELINES\n==================================\n${JSON.stringify(extraSettings, null, 2)}\n\nCRITICAL INSTRUCTION: You MUST strictly adhere to the guidelines and rules provided in the JSON above for every prompt. Ensure complete consistency with these instructions. Each prompt is independent, so make sure the visual style guidelines from the JSON are respected fully in every relevant prompt.`
    : "";

    const charactersContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && settings.characters.length > 0)
    ? `\n==================================\nCAST & CONSISTENCY (CRITICAL)\n==================================\n${settings.characters.map(c => `- [${c.shortDescription}]: ${c.description} | Style: ${c.visualStyle} | Palette: ${c.colorPalette?.primary || 'none'}, ${c.colorPalette?.secondary || 'none'}, ${c.colorPalette?.accent || 'none'}`).join('\n')}\n\nCRITICAL INSTRUCTION FOR CHARACTERS: \n1. Whenever a character appears in a clip, you MUST explicitly describe them EXACTLY the same way using their FULL physical description, visual style, and color palette provided above. This is mandatory to maintain character consistency across all clips.\n2. Do NOT just refer to them by name or alias (e.g., do not just say \"The Protagonist\" or \"John\"). Video generators do not know who \"John\" is.\n3. Replace the character's name with their detailed physical description seamlessly inside the prompt's sentences.\n4. Follow character consistency data and visual style data VERY STRICTLY.\n5. EACH PROMPT IS INDEPENDENT. If a character appears in a clip, you MUST inject their FULL detailed physical description into THAT specific prompt. Do not assume the video generator will remember them from a previous prompt.`
    : "";
  
  const continuityContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : null)
    ? `\n==================================\nCONTINUITY CONTEXT (CRITICAL)\n==================================\n${typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : ''}\n\nCRITICAL INSTRUCTION FOR CONTINUITY:\n1. The Prompt Writer must automatically load the Character JSON, Visual Style JSON and Continuity JSON before generating every prompt.\n2. The Prompt Writer may never contradict any continuity information.\n3. If the narration explicitly changes an object's state, update that object's state while preserving its identity.\n4. Never create duplicate locations.\n5. Never create duplicate equipment.\n6. Never replace recurring objects.\n7. Never reset object state between scenes.\n8. Never reset environmental state.`
    : "";

  
  const hasManufacturingJson = typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0;
  
  let systemInstruction = "";
  if (hasManufacturingJson) {
      systemInstruction = `You are an elite cinematic director and AI video prompt engineer.
Your task is to generate visual prompts for a video clip.
MANUFACTURING JSON DETECTED. IGNORE DEFAULT GLOBAL STYLE.
==================================
MANUFACTURING JSON (STRICT OVERRIDE)
==================================
${settings.manufacturingJson}

CRITICAL INSTRUCTION: You MUST strictly adhere to the guidelines and rules provided in the Manufacturing JSON above for EVERY prompt. All other style, character, and continuity guidelines are IGNORED in favor of this JSON.

CRITICAL DIAGNOSTIC RULES FOR PROMPT GENERATION:
1. TOPIC & NARRATION AWARE: Do not just generate a generic shot of the topic. Ask "What exactly is the narrator saying right here?" and show the physical event/object/person/process.
2. SCENE FUNCTION: Every shot must have a job (e.g. if narration says "cutters wear out", show worn cutters, not just the whole tunnel).
3. VISUAL VOCABULARY: Rotate between Machine, People, Process, Infrastructure, Environment, Geography, Human consequence. Keep it consistent with the JSON.
4. SHOT DIVERSITY: Different visual purposes. Don't just change the camera angle on the identical underlying visual content.
5. ESTABLISHING VS EXPLANATORY: Use establishing shots to show "where we are" and explanatory shots to show "what is happening" (close-ups, actions).
6. PRESERVE STATE (CONTINUITY): Dimensions, depth, environment color, etc., must carry over. No state loss across generation!
7. LOCKED VS CREATIVE: LOCKED facts (dimensions, geography, machinery, materials) CANNOT change. CREATIVE variables (camera, lighting, composition) CAN change.
8. TEMPORAL PROGRESSION: Visuals must evolve along a timeline (preparation -> excavation -> problem -> maintenance -> completion).
9. SHOT ALLOCATION: Important technical events get highly specific shots; trivial transitions get fewer generic shots.
10. DO NOT REUSE UNLESS JUSTIFIED: Each shot must introduce a new visual subject, action, environment, state, or interaction unless continuity is required.
11. STRONG POSITIVE SPECIFICATION: Tell the model exactly what SHOULD be there instead of just relying on negative prompts.
12. SHOT-LEVEL SEMANTICS: For every generated shot, define its Narrative Purpose, Primary Subject, Action, Environment, Technical Facts, Human Presence, Visual State, Cinematography, and Continuity.

OUTPUT RULES:
1. JSON STRUCTURE: Output valid JSON exactly matching the schema.
2. SCRIPT SYNC: Use the provided script line exactly. DO NOT INVENT NEXT ACTIONS.`;
  } else {
      systemInstruction = `You are the Prompt Director inside a wildlife documentary production system.
Your job is NOT to output your reasoning.
Your job is to silently think like a wildlife cinematographer and output ONLY production-ready prompts.
The application has three internal stages:
========================
STEP 1: Analysis
========================
Silently analyze the script.
Internally identify visual beats, creatures, environments, story flow.
========================
STEP 2: Director Review
========================
Create a Director Review card for the beat. Show only creative decisions.
Do NOT show Shot Type, Lens, Camera Movement in the review card (these are internal, use them silently for the prompt).
Instead focus on Purpose, Subjects, Behavior, Viewer Attention, Environment Interaction, Emotional Tone, Visual Change, Documentary Goal.
========================
STEP 3: Prompt Generation
========================
You are now entering the final production stage.
The Director Review has already been approved.
Use all approved creative decisions from the director_brain to generate production-ready Omni Flash prompts.
Every prompt must be immediately usable.
Do not explain your reasoning.
Do not expose internal planning.
In the \`visual_prompt\` field, you MUST follow this EXACT formula and order for every single prompt. Do NOT use markdown or bullet points in the final prompt, just natural connected sentences that follow this flow.
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
When graphics are required, generate a dedicated standalone motion graphics prompt instead of attempting to overlay graphics onto wildlife footage.
PROMPT LENGTH LIMIT: the app never writes a prompt thats more than 150-200 words,,,if it is inevitable and absolutely necessary then it can gi till 250 words.
REQUIRED PROMPT STRUCTURE (Follow exactly):
1. VISUAL HOOK: The first sentence should instantly establish the frame (location, subject, mood).
2. PRIMARY SUBJECT & CHARACTER INJECTION: Only introduce what matters. IF a character is present, YOU MUST INJECT THEIR FULL DETAILED PHYSICAL DESCRIPTION here. Do not just say their name. Ensure the creature description from the character json is explicitly described in every single prompt so it remains consistent.
3. SUPPORTING SUBJECT: (If applicable).
4. ENVIRONMENT: Describe only what affects the shot. It must feel alive.
5. STARTING STATE: Where does the shot begin explicitly.
6. ONE CLEAR ACTION: One action only. Not five actions.
7. REALISTIC BEHAVIOR: Behavior > Appearance. (e.g. adjusts primary feathers, keeps head low).
8. ENVIRONMENTAL INTERACTION: Everything interacts. (e.g. paws compress the powder, wind moves feathers).
9. VISUAL PROGRESSION: The shot should evolve. Something changes. Beginning -> Middle -> End.
10. VIEWER PERSPECTIVE: Tell Omni what the shot should feel like (e.g. "The viewer quietly observes from high above"). Not just "Slow push".
11. ENDING STATE: A natural destination for the frame.
12. DOCUMENTARY STYLE: Very short at the end. YOU MUST INCLUDE THIS TEXT EXACTLY: "filmed on ARRI Alexa 65, visually indistinguishable from genuine wildlife documentary footage, no artificial CGI appearance".
13. NEGATIVE CONSTRAINTS: Always last. (e.g. "No text, no subtitles, no humans, no logos, no exaggerated expressions, no cartoon appearance").
DIRECTOR BRAIN FORMULA:
Before writing each prompt, silently answer these questions in your head (do NOT output the answers):
- Why does this shot exist? (Storytelling)
- What is the visual event? (Main action)
- What changes? (Beginning -> Ending)
- What should the viewer notice first? (Focus)
- What should they notice last? (Ending)
- What behavior sells realism? (Animal authenticity)
- How does the environment react? (Cinematic realism)
- What emotion should the viewer feel? (Mood)
- Why is this perspective the best? (Camera intent)
Then discard those answers and write the final visual_prompt following the 13-step formula above.
OUTPUT RULES:
1. JSON STRUCTURE: Output valid JSON exactly matching the schema.
2. SCRIPT SYNC: Use the provided script line exactly. DO NOT INVENT NEXT ACTIONS.
3. NO GENERIC TERMS: Do not say "Good lighting". Say "${settings.lighting}".
${isJsonMode ? '4. SAFETY: \`safety_rules.negative_prompt\` MUST include: "text, typography, subtitles, watermarks".' : ''}
${charactersContext}
${extraSettingsText}
${continuityContext}`;
  }
 Type } from "@google/genai";
import { StyleSettings, GeneratedClip, ClipDuration, OutputFormat, Character } from "../types";
import { 
  VISUAL_STYLES, 
  LIGHTING_OPTIONS, 
  MOOD_OPTIONS, 
  CAMERA_STYLES, 
  CAMERA_MOVEMENTS 
} from '../constants';

const getAIClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper: Split script into chunks based on visual beats
const splitScriptToChunks = async (script: string, clipDuration: number, mode?: 'standard' | 'creature'): Promise<string[]> => {
  const ai = getAIClient();
  const targetWords = Math.round(clipDuration * 2.5);
  
      
  const continuityContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : null)
    ? `\n==================================\nCONTINUITY CONTEXT (CRITICAL)\n==================================\n${typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : ''}\n\nCRITICAL INSTRUCTION FOR CONTINUITY:\n1. The Prompt Writer must automatically load the Character JSON, Visual Style JSON and Continuity JSON before generating every prompt.\n2. The Prompt Writer may never contradict any continuity information.\n3. If the narration explicitly changes an object's state, update that object's state while preserving its identity.\n4. Never create duplicate locations.\n5. Never create duplicate equipment.\n6. Never replace recurring objects.\n7. Never reset object state between scenes.\n8. Never reset environmental state.`
    : "";

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
       model: "gemini-3-flash-preview", 
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

const analyzeVideoStyle = async (imageBase64: string, mimeType: string): Promise<any> => {
  const ai = getAIClient();
  
  const continuityContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : null)
    ? `\n==================================\nCONTINUITY CONTEXT (CRITICAL)\n==================================\n${typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : ''}\n\nCRITICAL INSTRUCTION FOR CONTINUITY:\n1. The Prompt Writer must automatically load the Character JSON, Visual Style JSON and Continuity JSON before generating every prompt.\n2. The Prompt Writer may never contradict any continuity information.\n3. If the narration explicitly changes an object's state, update that object's state while preserving its identity.\n4. Never create duplicate locations.\n5. Never create duplicate equipment.\n6. Never replace recurring objects.\n7. Never reset object state between scenes.\n8. Never reset environmental state.`
    : "";

  const systemInstruction = `Analyze this image or video frame and determine the optimal visual style, mood, and technical camera instructions. Return ONLY a JSON object matching the schema.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

const analyzeCharacterImage = async (imageBase64: string, mimeType: string): Promise<string> => {
  const ai = getAIClient();
  
  const continuityContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : null)
    ? `\n==================================\nCONTINUITY CONTEXT (CRITICAL)\n==================================\n${typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : ''}\n\nCRITICAL INSTRUCTION FOR CONTINUITY:\n1. The Prompt Writer must automatically load the Character JSON, Visual Style JSON and Continuity JSON before generating every prompt.\n2. The Prompt Writer may never contradict any continuity information.\n3. If the narration explicitly changes an object's state, update that object's state while preserving its identity.\n4. Never create duplicate locations.\n5. Never create duplicate equipment.\n6. Never replace recurring objects.\n7. Never reset object state between scenes.\n8. Never reset environmental state.`
    : "";

  const systemInstruction = `You are a Character Designer for Film. Analyze this character image. Write a precise, 40-word physical description suitable for a video generation prompt. Focus STRICTLY on: Age, Gender, Ethnicity, Hairstyle/Color, Clothing (Style/Color), and Distinctive Facial Features. Do not describe the background, lighting, or pose. Output only the description string.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

const deepSearchCharacterAppearance = async (characterName: string): Promise<string> => {
  const ai = getAIClient();
  
  const continuityContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : null)
    ? `\n==================================\nCONTINUITY CONTEXT (CRITICAL)\n==================================\n${typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : ''}\n\nCRITICAL INSTRUCTION FOR CONTINUITY:\n1. The Prompt Writer must automatically load the Character JSON, Visual Style JSON and Continuity JSON before generating every prompt.\n2. The Prompt Writer may never contradict any continuity information.\n3. If the narration explicitly changes an object's state, update that object's state while preserving its identity.\n4. Never create duplicate locations.\n5. Never create duplicate equipment.\n6. Never replace recurring objects.\n7. Never reset object state between scenes.\n8. Never reset environmental state.`
    : "";

  const systemInstruction = `You are an elite Character Concept Artist and Medical/Historical Archivist. The user will provide a specific character, person, or historical figure name. Your task is to conduct a deep search and generate a highly detailed, comprehensive JSON object describing their EXACT physical appearance, clothing, and distinctive features based on historical records, clinical findings, or established canon. Output valid JSON ONLY.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

const analyzeTextForCharacters = async (text: string, mode: 'standard' | 'creature' = 'standard'): Promise<Character[]> => {
  const ai = getAIClient();
    
  const continuityContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : null)
    ? `\n==================================\nCONTINUITY CONTEXT (CRITICAL)\n==================================\n${typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : ''}\n\nCRITICAL INSTRUCTION FOR CONTINUITY:\n1. The Prompt Writer must automatically load the Character JSON, Visual Style JSON and Continuity JSON before generating every prompt.\n2. The Prompt Writer may never contradict any continuity information.\n3. If the narration explicitly changes an object's state, update that object's state while preserving its identity.\n4. Never create duplicate locations.\n5. Never create duplicate equipment.\n6. Never replace recurring objects.\n7. Never reset object state between scenes.\n8. Never reset environmental state.`
    : "";

  const systemInstruction = `You are an elite Character/Subject Consistency parser. The user will provide a text which could be a raw script, documentary bible, lore, or a raw JSON object/array. Extract all recurring characters, wildlife species, or key subjects into a strict JSON array matching the schema. If the input is a complex JSON (like a documentary build/bible), specifically look for 'creature_design_master', 'character_profiles', or similar sections and map them directly into this schema accurately and efficiently. Capture their physical descriptions, visual styles, and characteristics accurately. Ensure you extract the primary subject (e.g. Dunkleosteus, wolves, protagonist) as a character so the consistency engine can track them.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

const smartParseConfig = async (text: string): Promise<any> => {
  const ai = getAIClient();
  
  const continuityContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : null)
    ? `\n==================================\nCONTINUITY CONTEXT (CRITICAL)\n==================================\n${typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : ''}\n\nCRITICAL INSTRUCTION FOR CONTINUITY:\n1. The Prompt Writer must automatically load the Character JSON, Visual Style JSON and Continuity JSON before generating every prompt.\n2. The Prompt Writer may never contradict any continuity information.\n3. If the narration explicitly changes an object's state, update that object's state while preserving its identity.\n4. Never create duplicate locations.\n5. Never create duplicate equipment.\n6. Never replace recurring objects.\n7. Never reset object state between scenes.\n8. Never reset environmental state.`
    : "";

  const systemInstruction = `Extract any style override configuration from the text as a JSON object matching the visual style parameters.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

const generateSingleClip = async (
  chunkText: string,
  clipNumber: number,
  settings: StyleSettings,
  clipDuration: number,
  outputFormat: OutputFormat,
  mode: 'standard' | 'creature' = 'standard'
): Promise<GeneratedClip> => {
  const ai = getAIClient();
  const isJsonMode = outputFormat === 'json';

  const directorScoreSchema = {
    type: Type.OBJECT,
    properties: {
      story_clarity: { type: Type.NUMBER, description: "Score out of 10.0" },
      visual_interest: { type: Type.NUMBER, description: "Score out of 10.0" },
      camera_variety: { type: Type.NUMBER, description: "Score out of 10.0" },
      emotion: { type: Type.NUMBER, description: "Score out of 10.0" },
      omni_flash_success: { type: Type.NUMBER, description: "Score out of 10.0" },
      continuity: { type: Type.NUMBER, description: "Score out of 10.0" }
    },
    required: ["story_clarity", "visual_interest", "camera_variety", "emotion", "omni_flash_success", "continuity"]
  };

  const directorBrainSchema = {
    type: Type.OBJECT,
    properties: {
      purpose: { type: Type.STRING, description: "Why this shot exists. e.g. Reveal the wolf's endurance before introducing the raven." },
      primary_subject: { type: Type.STRING },
      supporting_subject: { type: Type.STRING },
      main_behavior: { type: Type.STRING, description: "One specific action only. MUST strictly follow ONLY what happens in the provided narration for this clip, do not invent next actions." },
      viewer_notice_first: { type: Type.STRING },
      viewer_notice_last: { type: Type.STRING },
      environment_interaction: { type: Type.STRING },
      emotional_tone: { type: Type.STRING },
      visual_change: { type: Type.STRING },
      documentary_goal: { type: Type.STRING }
    },
    required: ["purpose", "primary_subject", "supporting_subject", "main_behavior", "viewer_notice_first", "viewer_notice_last", "environment_interaction", "emotional_tone", "visual_change", "documentary_goal"]
  };

  const promptComposerSchema = {
    type: Type.OBJECT,
    properties: {
      subject_priority: { type: Type.STRING, description: "Primary Subject, Secondary Subject, Background" },
      character_identity: { type: Type.STRING, description: "FULL identity continuity for ALL characters in the scene. Always fully describe the character (e.g. 'The same young olive-brown oxpecker with bright scarlet bill...')." },
      environment_description: { type: Type.STRING, description: "Always fully describe the environment." },
      start_frame: { type: Type.STRING, description: "Explicitly define the starting frame composition." },
      animal_movement: { type: Type.STRING, description: "Describe movement instead of abstract verbs. One action." },
      lighting_and_physics: { type: Type.STRING },
      end_frame: { type: Type.STRING, description: "Explicitly define the ending frame composition." },
      documentary_style: { type: Type.STRING, description: "Documentary Style." },
      negative_constraints: { type: Type.STRING, description: "Negative Constraints." }
    },
    required: [
      "subject_priority", "character_identity", "environment_description", "start_frame", 
      "animal_movement", "lighting_and_physics", "end_frame", "documentary_style", "negative_constraints"
    ]
  };

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


  
  const extraSettings = Object.keys(settings)
    .filter(k => !['visualStyle', 'colorPalette', 'mood', 'lighting', 'cameraStyle', 'cameraMovement', 'artKeywords', 'characters', 'isConsistencyEnabled', 'useEstablishingHook', 'protagonistLock', 'customInstructions'].includes(k))
    .reduce((obj, key) => {
      obj[key] = settings[key];
      return obj;
    }, {} as any);
  
    const extraSettingsText = (typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) ? '' :  Object.keys(extraSettings).length > 0 
    ? `\n==================================\nADDITIONAL VISUAL CONSISTENCY JSON GUIDELINES\n==================================\n${JSON.stringify(extraSettings, null, 2)}\n\nCRITICAL INSTRUCTION: You MUST strictly adhere to the guidelines and rules provided in the JSON above for every prompt. Ensure complete consistency with these instructions. Each prompt is independent, so make sure the visual style guidelines from the JSON are respected fully in every relevant prompt.`
    : "";

    const charactersContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && settings.characters.length > 0)
    ? `\n==================================\nCAST & CONSISTENCY (CRITICAL)\n==================================\n${settings.characters.map(c => `- [${c.shortDescription}]: ${c.description} | Style: ${c.visualStyle} | Palette: ${c.colorPalette?.primary || 'none'}, ${c.colorPalette?.secondary || 'none'}, ${c.colorPalette?.accent || 'none'}`).join('\n')}\n\nCRITICAL INSTRUCTION FOR CHARACTERS: \n1. Whenever a character appears in a clip, you MUST explicitly describe them EXACTLY the same way using their FULL physical description, visual style, and color palette provided above. This is mandatory to maintain character consistency across all clips.\n2. Do NOT just refer to them by name or alias (e.g., do not just say \"The Protagonist\" or \"John\"). Video generators do not know who \"John\" is.\n3. Replace the character's name with their detailed physical description seamlessly inside the prompt's sentences.\n4. Follow character consistency data and visual style data VERY STRICTLY.\n5. EACH PROMPT IS INDEPENDENT. If a character appears in a clip, you MUST inject their FULL detailed physical description into THAT specific prompt. Do not assume the video generator will remember them from a previous prompt.`
    : "";
  
  const continuityContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : null)
    ? `\n==================================\nCONTINUITY CONTEXT (CRITICAL)\n==================================\n${typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : ''}\n\nCRITICAL INSTRUCTION FOR CONTINUITY:\n1. The Prompt Writer must automatically load the Character JSON, Visual Style JSON and Continuity JSON before generating every prompt.\n2. The Prompt Writer may never contradict any continuity information.\n3. If the narration explicitly changes an object's state, update that object's state while preserving its identity.\n4. Never create duplicate locations.\n5. Never create duplicate equipment.\n6. Never replace recurring objects.\n7. Never reset object state between scenes.\n8. Never reset environmental state.`
    : "";

  const systemInstruction = `You are the Prompt Director inside a wildlife documentary production system.
Your job is NOT to output your reasoning.
Your job is to silently think like a wildlife cinematographer and output ONLY production-ready prompts.

The application has three internal stages:

========================
STEP 1: Analysis
========================
Silently analyze the script.
Internally identify visual beats, creatures, environments, story flow.

========================
STEP 2: Director Review
========================
Create a Director Review card for the beat. Show only creative decisions.
Do NOT show Shot Type, Lens, Camera Movement in the review card (these are internal, use them silently for the prompt).
Instead focus on Purpose, Subjects, Behavior, Viewer Attention, Environment Interaction, Emotional Tone, Visual Change, Documentary Goal.

========================
STEP 3: Prompt Generation
========================
You are now entering the final production stage.
The Director Review has already been approved.
Use all approved creative decisions from the director_brain to generate production-ready Omni Flash prompts.

Every prompt must be immediately usable.
Do not explain your reasoning.
Do not expose internal planning.

In the \`visual_prompt\` field, you MUST follow this EXACT formula and order for every single prompt. Do NOT use markdown or bullet points in the final prompt, just natural connected sentences that follow this flow.



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
When graphics are required, generate a dedicated standalone motion graphics prompt instead of attempting to overlay graphics onto wildlife footage.

PROMPT LENGTH LIMIT: the app never writes a prompt thats more than 150-200 words,,,if it is inevitable and absolutely necessary then it can gi till 250 words.

REQUIRED PROMPT STRUCTURE (Follow exactly):
1. VISUAL HOOK: The first sentence should instantly establish the frame (location, subject, mood).
2. PRIMARY SUBJECT & CHARACTER INJECTION: Only introduce what matters. IF a character is present, YOU MUST INJECT THEIR FULL DETAILED PHYSICAL DESCRIPTION here. Do not just say their name. Ensure the creature description from the character json is explicitly described in every single prompt so it remains consistent.
3. SUPPORTING SUBJECT: (If applicable).
4. ENVIRONMENT: Describe only what affects the shot. It must feel alive.
5. STARTING STATE: Where does the shot begin explicitly.
6. ONE CLEAR ACTION: One action only. Not five actions.
7. REALISTIC BEHAVIOR: Behavior > Appearance. (e.g. adjusts primary feathers, keeps head low).
8. ENVIRONMENTAL INTERACTION: Everything interacts. (e.g. paws compress the powder, wind moves feathers).
9. VISUAL PROGRESSION: The shot should evolve. Something changes. Beginning -> Middle -> End.
10. VIEWER PERSPECTIVE: Tell Omni what the shot should feel like (e.g. "The viewer quietly observes from high above"). Not just "Slow push".
11. ENDING STATE: A natural destination for the frame.
12. DOCUMENTARY STYLE: Very short at the end. YOU MUST INCLUDE THIS TEXT EXACTLY: "filmed on ARRI Alexa 65, visually indistinguishable from genuine wildlife documentary footage, no artificial CGI appearance".
13. NEGATIVE CONSTRAINTS: Always last. (e.g. "No text, no subtitles, no humans, no logos, no exaggerated expressions, no cartoon appearance").

DIRECTOR BRAIN FORMULA:
Before writing each prompt, silently answer these questions in your head (do NOT output the answers):
- Why does this shot exist? (Storytelling)
- What is the visual event? (Main action)
- What changes? (Beginning -> Ending)
- What should the viewer notice first? (Focus)
- What should they notice last? (Ending)
- What behavior sells realism? (Animal authenticity)
- How does the environment react? (Cinematic realism)
- What emotion should the viewer feel? (Mood)
- Why is this perspective the best? (Camera intent)
Then discard those answers and write the final visual_prompt following the 13-step formula above.


OUTPUT RULES:
1. JSON STRUCTURE: Output valid JSON exactly matching the schema.
2. SCRIPT SYNC: Use the provided script line exactly. DO NOT INVENT NEXT ACTIONS.
3. NO GENERIC TERMS: Do not say "Good lighting". Say "${settings.lighting}".


${isJsonMode ? '4. SAFETY: `safety_rules.negative_prompt` MUST include: "text, typography, subtitles, watermarks".' : ''}
${charactersContext}
${extraSettingsText}
${continuityContext}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: `Generate Prompt for Clip #${clipNumber}. Script Segment: "${chunkText}"\n\n${!settings.generateImageAndAnimationPrompts ? "IMPORTANT: Generate a single, comprehensive visual_prompt. This prompt MUST describe both the visual scene AND the animation/movement/behavior within a single cohesive text block. DO NOT split them into separate prompts." : "IMPORTANT: Generate a visual prompt and a separate animation prompt."}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: detailedJsonSchema
      }
    });

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
      
      shotType: data.camera_director?.shot_type || "",
      cameraMovement: data.camera_director?.camera_movement || "",
      jsonOutput: data
    };
  } catch (error) {
    console.error(`Error generating clip ${clipNumber}:`, error);
    throw error;
  }
};

const regenerateClip = async (
  originalClip: GeneratedClip,
  settings: StyleSettings,
  instruction: string,
  outputFormat: OutputFormat,
  mode: 'standard' | 'creature' = 'standard'
): Promise<GeneratedClip> => {
  const ai = getAIClient();
  
  const continuityContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : null)
    ? `\n==================================\nCONTINUITY CONTEXT (CRITICAL)\n==================================\n${typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : ''}\n\nCRITICAL INSTRUCTION FOR CONTINUITY:\n1. The Prompt Writer must automatically load the Character JSON, Visual Style JSON and Continuity JSON before generating every prompt.\n2. The Prompt Writer may never contradict any continuity information.\n3. If the narration explicitly changes an object's state, update that object's state while preserving its identity.\n4. Never create duplicate locations.\n5. Never create duplicate equipment.\n6. Never replace recurring objects.\n7. Never reset object state between scenes.\n8. Never reset environmental state.`
    : "";

  const systemInstruction = `Regenerate the clip's prompt using the custom user instruction: ${instruction}. Follow the exact same schema and Director Score guidelines. ${(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) ? "\n\n==================================\nMANUFACTURING JSON (STRICT OVERRIDE)\n==================================\n" + settings.manufacturingJson + "\n\nCRITICAL INSTRUCTION: You MUST strictly adhere to the guidelines and rules provided in the Manufacturing JSON above.\n\nCRITICAL DIAGNOSTIC RULES:\n1. TOPIC & NARRATION AWARE\n2. SCENE FUNCTION\n3. VISUAL VOCABULARY\n4. SHOT DIVERSITY\n5. ESTABLISHING VS EXPLANATORY\n6. PRESERVE STATE (CONTINUITY)\n7. LOCKED VS CREATIVE\n8. TEMPORAL PROGRESSION\n9. SHOT ALLOCATION\n10. DO NOT REUSE UNLESS JUSTIFIED\n11. STRONG POSITIVE SPECIFICATION\n12. SHOT-LEVEL SEMANTICS" : ""}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Regenerate this clip's JSON with instruction: "${instruction}". Original Script: "${originalClip.scriptLine}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });
    
    const jsonStr = response.text;
    if (!jsonStr) throw new Error("Empty response from AI");
    
    const data = JSON.parse(jsonStr);
    
    return {
      ...originalClip,
      visualPrompt: data.visual_prompt || originalClip.visualPrompt,
      animationPrompt: originalClip.animationPrompt ? (data.animation_prompt || originalClip.animationPrompt) : '',
      
      shotType: data.camera_director?.shot_type || originalClip.shotType,
      cameraMovement: data.camera_director?.camera_movement || originalClip.cameraMovement,
      jsonOutput: data
    };
  } catch (error) {
    console.error(`Error regenerating clip ${originalClip.clipNumber}:`, error);
    throw error;
  }
};


const generateClipBatch = async (
  chunks: string[],
  startClipNumber: number,
  settings: StyleSettings,
  clipDuration: number,
  outputFormat: OutputFormat,
  mode: 'standard' | 'creature' = 'standard'
): Promise<GeneratedClip[]> => {
  const ai = getAIClient();
  const isJsonMode = outputFormat === 'json';

  const directorScoreSchema = {
    type: Type.OBJECT,
    properties: {
      story_clarity: { type: Type.NUMBER, description: "Score out of 10.0" },
      visual_interest: { type: Type.NUMBER, description: "Score out of 10.0" },
      camera_variety: { type: Type.NUMBER, description: "Score out of 10.0" },
      emotion: { type: Type.NUMBER, description: "Score out of 10.0" },
      omni_flash_success: { type: Type.NUMBER, description: "Score out of 10.0" },
      continuity: { type: Type.NUMBER, description: "Score out of 10.0" }
    },
    required: ["story_clarity", "visual_interest", "camera_variety", "emotion", "omni_flash_success", "continuity"]
  };

  const directorBrainSchema = {
    type: Type.OBJECT,
    properties: {
      purpose: { type: Type.STRING },
      primary_subject: { type: Type.STRING },
      supporting_subject: { type: Type.STRING },
      main_behavior: { type: Type.STRING },
      viewer_notice_first: { type: Type.STRING },
      viewer_notice_last: { type: Type.STRING },
      environment_interaction: { type: Type.STRING },
      emotional_tone: { type: Type.STRING },
      visual_change: { type: Type.STRING },
      documentary_goal: { type: Type.STRING }
    },
    required: ["purpose", "primary_subject", "supporting_subject", "main_behavior", "viewer_notice_first", "viewer_notice_last", "environment_interaction", "emotional_tone", "visual_change", "documentary_goal"]
  };

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


  const clipSchema: any = {
    type: Type.OBJECT,
    properties: {
      narrativeContext: { type: Type.STRING, description: "Brief visual context" },
      visualPrompt: { type: Type.STRING, description: "The final detailed prompt" },
      shotType: { type: Type.STRING },
      cameraMovement: { type: Type.STRING }
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

  
  const extraSettings = Object.keys(settings)
    .filter(k => !['visualStyle', 'colorPalette', 'mood', 'lighting', 'cameraStyle', 'cameraMovement', 'artKeywords', 'characters', 'isConsistencyEnabled', 'useEstablishingHook', 'protagonistLock', 'customInstructions'].includes(k))
    .reduce((obj, key) => {
      obj[key] = settings[key];
      return obj;
    }, {} as any);
  
    const extraSettingsText = (typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) ? '' : Object.keys(extraSettings).length > 0 
    ? `\n==================================\nADDITIONAL VISUAL CONSISTENCY JSON GUIDELINES\n==================================\n${JSON.stringify(extraSettings, null, 2)}\n\nCRITICAL INSTRUCTION: You MUST strictly adhere to the guidelines and rules provided in the JSON above for every prompt. Ensure complete consistency with these instructions. Each prompt is independent, so make sure the visual style guidelines from the JSON are respected fully in every relevant prompt.`
    : "";

    const charactersContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && settings.characters.length > 0)
    ? `\n==================================\nCAST & CONSISTENCY (CRITICAL)\n==================================\n${settings.characters.map(c => `- [${c.shortDescription}]: ${c.description} | Style: ${c.visualStyle} | Palette: ${c.colorPalette?.primary || 'none'}, ${c.colorPalette?.secondary || 'none'}, ${c.colorPalette?.accent || 'none'}`).join('\n')}\n\nCRITICAL INSTRUCTION FOR CHARACTERS: \n1. Whenever a character appears in a clip, you MUST explicitly describe them EXACTLY the same way using their FULL physical description, visual style, and color palette provided above. This is mandatory to maintain character consistency across all clips.\n2. Do NOT just refer to them by name or alias (e.g., do not just say \"The Protagonist\" or \"John\"). Video generators do not know who \"John\" is.\n3. Replace the character's name with their detailed physical description seamlessly inside the prompt's sentences.\n4. Follow character consistency data and visual style data VERY STRICTLY.\n5. EACH PROMPT IS INDEPENDENT. If a character appears in a clip, you MUST inject their FULL detailed physical description into THAT specific prompt. Do not assume the video generator will remember them from a previous prompt.`
    : "";

const continuityContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : null)
    ? `\n==================================\nCONTINUITY CONTEXT (CRITICAL)\n==================================\n${typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : ''}\n\nCRITICAL INSTRUCTION FOR CONTINUITY:\n1. The Prompt Writer must automatically load the Character JSON, Visual Style JSON and Continuity JSON before generating every prompt.\n2. The Prompt Writer may never contradict any continuity information.\n3. If the narration explicitly changes an object's state, update that object's state while preserving its identity.\n4. Never create duplicate locations.\n5. Never create duplicate equipment.\n6. Never replace recurring objects.\n7. Never reset object state between scenes.\n8. Never reset environmental state.`
    : "";

  let inputData = "";
  chunks.forEach((chunk, index) => {
     inputData += `Clip ${startClipNumber + index} Script: "${chunk}"\n`;
  });

    
  const hasManufacturingJson = typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0;
  
  let prompt = "";
  if (hasManufacturingJson) {
      prompt = `You are an elite cinematic director and AI video prompt engineer.
Your task is to generate visual prompts for a sequence of ${chunks.length} video clips (${clipDuration} seconds each).

MANUFACTURING JSON DETECTED. IGNORE DEFAULT GLOBAL STYLE.
==================================
MANUFACTURING JSON (STRICT OVERRIDE)
==================================
${settings.manufacturingJson}

CRITICAL INSTRUCTION: You MUST strictly adhere to the guidelines and rules provided in the Manufacturing JSON above for EVERY prompt. All other style, character, and continuity guidelines are IGNORED in favor of this JSON.

CRITICAL DIAGNOSTIC RULES FOR PROMPT GENERATION:
1. TOPIC & NARRATION AWARE: Do not just generate a generic shot of the topic. Ask "What exactly is the narrator saying right here?" and show the physical event/object/person/process.
2. SCENE FUNCTION: Every shot must have a job (e.g. if narration says "cutters wear out", show worn cutters, not just the whole tunnel).
3. VISUAL VOCABULARY: Rotate between Machine, People, Process, Infrastructure, Environment, Geography, Human consequence. Keep it consistent with the JSON.
4. SHOT DIVERSITY: Different visual purposes. Don't just change the camera angle on the identical underlying visual content.
5. ESTABLISHING VS EXPLANATORY: Use establishing shots to show "where we are" and explanatory shots to show "what is happening" (close-ups, actions).
6. PRESERVE STATE (CONTINUITY): Dimensions, depth, environment color, etc., must carry over. No state loss across generation!
7. LOCKED VS CREATIVE: LOCKED facts (dimensions, geography, machinery, materials) CANNOT change. CREATIVE variables (camera, lighting, composition) CAN change.
8. TEMPORAL PROGRESSION: Visuals must evolve along a timeline (preparation -> excavation -> problem -> maintenance -> completion).
9. SHOT ALLOCATION: Important technical events get highly specific shots; trivial transitions get fewer generic shots.
10. DO NOT REUSE UNLESS JUSTIFIED: Each shot must introduce a new visual subject, action, environment, state, or interaction unless continuity is required.
11. STRONG POSITIVE SPECIFICATION: Tell the model exactly what SHOULD be there instead of just relying on negative prompts.
12. SHOT-LEVEL SEMANTICS: For every generated shot, define its Narrative Purpose, Primary Subject, Action, Environment, Technical Facts, Human Presence, Visual State, Cinematography, and Continuity.

${!settings.generateImageAndAnimationPrompts ? "IMPORTANT: Generate a single, comprehensive visual_prompt for each clip. This prompt MUST describe both the visual scene AND the animation/movement/behavior within a single cohesive text block. DO NOT split them." : "IMPORTANT: Generate a visual prompt and a separate animation prompt for each clip."}

INPUT SCRIPT CHUNKS:
${inputData}

For each clip, return its details matching the required schema. Ensure the array length is exactly ${chunks.length}.`;
  } else {
      prompt = `You are an elite cinematic director and AI video prompt engineer.
Your task is to generate visual prompts for a sequence of ${chunks.length} video clips (${clipDuration} seconds each).

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

${!settings.generateImageAndAnimationPrompts ? "IMPORTANT: Generate a single, comprehensive visual_prompt for each clip. This prompt MUST describe both the visual scene AND the animation/movement/behavior within a single cohesive text block. DO NOT split them." : "IMPORTANT: Generate a visual prompt and a separate animation prompt for each clip."}

INPUT SCRIPT CHUNKS:
${inputData}

For each clip, return its details matching the required schema. Ensure the array length is exactly ${chunks.length}.
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
When graphics are required, generate a dedicated standalone motion graphics prompt instead of attempting to overlay graphics onto wildlife footage.
PROMPT LENGTH LIMIT: the app never writes a prompt thats more than 150-200 words,,,if it is inevitable and absolutely necessary then it can gi till 250 words.
REQUIRED PROMPT STRUCTURE FOR visual_prompt (Follow EXACTLY in order):
1. VISUAL HOOK: The first sentence should instantly establish the frame.
2. PRIMARY SUBJECT & CHARACTER INJECTION: Only introduce what matters. IF a character is present, YOU MUST INJECT THEIR FULL DETAILED PHYSICAL DESCRIPTION here. Do not just say their name. Ensure the creature description from the character json is explicitly described in every single prompt so it remains consistent.
3. SUPPORTING SUBJECT: (If applicable).
4. ENVIRONMENT: Describe only what affects the shot. It must feel alive.
5. STARTING STATE: Where does the shot begin explicitly.
6. ONE CLEAR ACTION: One action only. Not five actions.
7. REALISTIC BEHAVIOR: Behavior > Appearance.
8. ENVIRONMENTAL INTERACTION: Everything interacts.
9. VISUAL PROGRESSION: The shot should evolve. Something changes.
10. VIEWER PERSPECTIVE: Tell Omni what the shot should feel like.
11. ENDING STATE: A natural destination for the frame.
12. DOCUMENTARY STYLE: Very short at the end. YOU MUST INCLUDE THIS TEXT EXACTLY: "filmed on ARRI Alexa 65, visually indistinguishable from genuine wildlife documentary footage, no artificial CGI appearance".
13. NEGATIVE CONSTRAINTS: Always last.`;
  }


  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: batchSchema,
      temperature: 0.7,
    }
  });

  try {
    const data = JSON.parse(response.text || '[]');
        return data.map((clipData: any, i: number) => ({
      id: crypto.randomUUID(),
      clipNumber: startClipNumber + i,
      scriptLine: chunks[i],
      narrativeContext: clipData.narrativeContext || clipData.jsonOutput?.script_source || 'Visual sequence',
      visualPrompt: clipData.visualPrompt || clipData.jsonOutput?.visual_prompt || '',
      animationPrompt: settings.generateImageAndAnimationPrompts ? (clipData.animationPrompt || clipData.jsonOutput?.animation_prompt || '') : '',
      
      shotType: clipData.shotType || clipData.jsonOutput?.camera_director?.shot_type || settings.cameraStyle,
      cameraMovement: clipData.cameraMovement || clipData.jsonOutput?.camera_director?.camera_movement || settings.cameraMovement,
      jsonOutput: isJsonMode ? clipData.jsonOutput : undefined
    }));
  } catch (error) {
    console.error("Failed to parse batch:", error);
    // fallback empty array
    return chunks.map((chunk, i) => ({
      id: crypto.randomUUID(),
      clipNumber: startClipNumber + i,
      scriptLine: chunk,
      narrativeContext: "Fallback context",
      visualPrompt: 'Failed to generate prompt. Please regenerate.',
      animationPrompt: '',
      
    }));
  }
};


const analyzeContinuity = async (script: string, settings: StyleSettings): Promise<string> => {
  const ai = getAIClient();

  const characterContext = settings.characters.map(c => `- [${c.shortDescription}]: ${c.description} | Style: ${c.visualStyle}`).join('\n');
  const styleContext = JSON.stringify(settings.worldBuildingJson || {}, null, 2);

  
  const continuityContext = (!(typeof settings !== 'undefined' && settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) && typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : null)
    ? `\n==================================\nCONTINUITY CONTEXT (CRITICAL)\n==================================\n${typeof settings !== 'undefined' && settings.continuityJson ? settings.continuityJson : ''}\n\nCRITICAL INSTRUCTION FOR CONTINUITY:\n1. The Prompt Writer must automatically load the Character JSON, Visual Style JSON and Continuity JSON before generating every prompt.\n2. The Prompt Writer may never contradict any continuity information.\n3. If the narration explicitly changes an object's state, update that object's state while preserving its identity.\n4. Never create duplicate locations.\n5. Never create duplicate equipment.\n6. Never replace recurring objects.\n7. Never reset object state between scenes.\n8. Never reset environmental state.`
    : "";

  const systemInstruction = "You are the Continuity Generator inside a wildlife documentary production system.\n" +
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
      model: "gemini-3-flash-preview",
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
