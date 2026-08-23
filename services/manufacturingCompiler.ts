import { GoogleGenAI, Type } from "@google/genai";
import {
  ManufacturingReferenceIndex,
  SceneReferencePacket,
  SceneValidationResult,
  VisualBeatRef,
  StageRef,
  EnvironmentRef,
  FacilityModule,
  CategorizedNegatives,
  IdentityAnchor,
  StageContinuity,
  CameraGuidance,
  VisualRule
} from '../types';

// ============================================================
// CONTENT HASH — for cache invalidation
// ============================================================
const computeContentHash = (text: string): string => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'MFG_' + Math.abs(hash).toString(36).toUpperCase();
};

// Configurable model — same as geminiService.ts
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// ============================================================
// 1. MANUFACTURING REFERENCE COMPILER
// ============================================================
export const compileManufacturingJson = async (rawJson: string): Promise<ManufacturingReferenceIndex> => {
  const ai = getAIClient();
  const contentHash = computeContentHash(rawJson);

  const systemInstruction = `You are the Manufacturing Reference Compiler.

Your job is to transform a large Manufacturing JSON into a compact, indexed reference structure.

CRITICAL RULES:
1. DO NOT invent, modify, reinterpret, or replace information from the Manufacturing JSON.
2. Extract and organize information into stable indexed sections.
3. Create deterministic IDs for every important object (e.g., STAGE_01, ENV_CONSTRUCTION_ZONE, MODULE_TBM_SYSTEM).
4. Preserve the original field names and values where possible.
5. Every extracted item should retain its source path in the original JSON.
6. Create identity anchors: a short_anchor (~20 words for repeated use) and full_anchor (complete description for first introduction).
7. Compile negative constraints into categorized groups: geometry, action, camera, environment, evidence, text, security.
8. Preserve source authority distinctions: CONFIRMED, CORROBORATED, CREATOR_PROVIDED, ANALYST_INFERRED, UNVERIFIED.
9. Never upgrade uncertainty. Never convert analyst inference into confirmed fact.
10. Never convert conceptual relationships into exact geometry.
11. Never invent missing dimensions, layouts, markings, equipment, or spatial relationships.
12. Create relationship maps between IDs (which stages use which environments and modules).
13. Extract visual beats with their story_function, must_show, must_not_show, semantic_alignment_terms.
14. Extract media routing rules and generation permissions per beat.
15. Extract global prompt rules and truth/evidence rules.

OUTPUT: A structured JSON matching the provided schema exactly.`;

  const referenceSchema: any = {
    type: Type.OBJECT,
    properties: {
      project_identity: {
        type: Type.OBJECT,
        properties: {
          reference_id: { type: Type.STRING },
          project_name: { type: Type.STRING },
          location: { type: Type.STRING },
          summary: { type: Type.STRING },
          source_path: { type: Type.STRING }
        },
        required: ["reference_id", "project_name", "location", "summary", "source_path"]
      },
      facility_modules: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            reference_id: { type: Type.STRING },
            name: { type: Type.STRING },
            identity_anchor: { type: Type.STRING, description: "Short ~20 word identification string for repeated prompt use" },
            full_description: { type: Type.STRING, description: "Complete physical description from the JSON" },
            key_dimensions: { type: Type.ARRAY, items: { type: Type.STRING } },
            key_materials: { type: Type.ARRAY, items: { type: Type.STRING } },
            key_components: { type: Type.ARRAY, items: { type: Type.STRING } },
            source_path: { type: Type.STRING }
          },
          required: ["reference_id", "name", "identity_anchor", "full_description", "key_dimensions", "key_materials", "key_components", "source_path"]
        }
      },
      environments: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            reference_id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            atmospheric_conditions: { type: Type.ARRAY, items: { type: Type.STRING } },
            visibility_conditions: { type: Type.ARRAY, items: { type: Type.STRING } },
            lighting_conditions: { type: Type.ARRAY, items: { type: Type.STRING } },
            source_path: { type: Type.STRING }
          },
          required: ["reference_id", "name", "description", "atmospheric_conditions", "visibility_conditions", "lighting_conditions", "source_path"]
        }
      },
      construction_stages: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            reference_id: { type: Type.STRING },
            stage_name: { type: Type.STRING },
            facility_state_code: { type: Type.STRING },
            facility_state_description: { type: Type.STRING },
            environment_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
            primary_module_id: { type: Type.STRING },
            secondary_module_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
            present_features: { type: Type.ARRAY, items: { type: Type.STRING } },
            absent_features: { type: Type.ARRAY, items: { type: Type.STRING } },
            primary_action: { type: Type.STRING },
            secondary_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
            camera_guidance: {
              type: Type.OBJECT,
              properties: {
                preferred_views: { type: Type.ARRAY, items: { type: Type.STRING } },
                safe_shot_scales: { type: Type.ARRAY, items: { type: Type.STRING } },
                preferred_camera_movements: { type: Type.ARRAY, items: { type: Type.STRING } },
                forbidden_camera_movements: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["preferred_views", "safe_shot_scales", "preferred_camera_movements", "forbidden_camera_movements"]
            },
            negative_constraints: { type: Type.ARRAY, items: { type: Type.STRING } },
            source_path: { type: Type.STRING }
          },
          required: ["reference_id", "stage_name", "facility_state_code", "facility_state_description", "environment_ids", "primary_module_id", "secondary_module_ids", "present_features", "absent_features", "primary_action", "secondary_actions", "camera_guidance", "negative_constraints", "source_path"]
        }
      },
      visual_beats: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            reference_id: { type: Type.STRING },
            chapter_id: { type: Type.STRING },
            beat_index: { type: Type.NUMBER },
            story_function: { type: Type.STRING },
            visual_family: { type: Type.STRING },
            narrative_purpose: { type: Type.STRING },
            must_show: { type: Type.ARRAY, items: { type: Type.STRING } },
            must_not_show: { type: Type.ARRAY, items: { type: Type.STRING } },
            semantic_alignment_terms: { type: Type.ARRAY, items: { type: Type.STRING } },
            environment_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
            facility_module_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
            stage_id: { type: Type.STRING },
            generation_permission: { type: Type.STRING, enum: ["T2V_ALLOWED", "REFERENCE_REQUIRED", "EDITOR_ONLY", "NOT_ALLOWED"] },
            preferred_media_routes: { type: Type.ARRAY, items: { type: Type.STRING } },
            facility_visibility: { type: Type.STRING },
            facility_claim_status: { type: Type.STRING },
            layout_claim_status: { type: Type.STRING },
            duration_guidance: { type: Type.STRING },
            source_path: { type: Type.STRING }
          },
          required: ["reference_id", "chapter_id", "beat_index", "story_function", "visual_family", "narrative_purpose", "must_show", "must_not_show", "semantic_alignment_terms", "environment_ids", "facility_module_ids", "stage_id", "generation_permission", "preferred_media_routes", "source_path"]
        }
      },
      visual_rules: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            rule_id: { type: Type.STRING },
            description: { type: Type.STRING },
            applies_to: { type: Type.ARRAY, items: { type: Type.STRING } },
            source_path: { type: Type.STRING }
          },
          required: ["rule_id", "description", "applies_to", "source_path"]
        }
      },
      negative_constraints: {
        type: Type.OBJECT,
        properties: {
          geometry: { type: Type.ARRAY, items: { type: Type.STRING } },
          action: { type: Type.ARRAY, items: { type: Type.STRING } },
          camera: { type: Type.ARRAY, items: { type: Type.STRING } },
          environment: { type: Type.ARRAY, items: { type: Type.STRING } },
          evidence: { type: Type.ARRAY, items: { type: Type.STRING } },
          text: { type: Type.ARRAY, items: { type: Type.STRING } },
          security: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["geometry", "action", "camera", "environment", "evidence", "text", "security"]
      },
      spatial_relationships: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            module_a_id: { type: Type.STRING },
            module_b_id: { type: Type.STRING },
            relationship: { type: Type.STRING },
            claim_status: { type: Type.STRING, enum: ["CONFIRMED", "CORROBORATED", "CONCEPTUAL_ONLY", "UNVERIFIED"] },
            source_path: { type: Type.STRING }
          },
          required: ["module_a_id", "module_b_id", "relationship", "claim_status", "source_path"]
        }
      },
      identity_anchors: {
        type: Type.OBJECT,
        description: "Map of reference_id to identity anchor objects. Keys are the reference IDs of modules, environments, etc."
      },
      global_prompt_rules: { type: Type.ARRAY, items: { type: Type.STRING } },
      truth_and_evidence_rules: { type: Type.ARRAY, items: { type: Type.STRING } },
      media_routing_rules: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: [
      "project_identity", "facility_modules", "environments", "construction_stages",
      "visual_beats", "visual_rules", "negative_constraints", "spatial_relationships",
      "identity_anchors", "global_prompt_rules", "truth_and_evidence_rules", "media_routing_rules"
    ]
  };

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Compile the following Manufacturing JSON into a structured Reference Index.\n\nMANUFACTURING JSON:\n${rawJson}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: referenceSchema,
        temperature: 0.1
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) throw new Error("Empty response from compiler");

    let compiled;
    try {
      if (jsonStr.trim().startsWith('<')) {
        throw new Error("HTML response received from proxy");
      }
      compiled = JSON.parse(jsonStr);
    } catch (parseErr) {
      // Fallback: try calling the server endpoint directly
      if (typeof window !== 'undefined') {
        const backendRes = await fetch('/api/gemini/compileReference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ manufacturingJson: rawJson })
        });
        if (backendRes.ok) {
          const resData = await backendRes.json();
          if (resData.referenceIndex) return resData.referenceIndex;
        }
      }
      throw parseErr;
    }

    // Attach metadata
    const index: ManufacturingReferenceIndex = {
      ...compiled,
      version: '1.0',
      contentHash,
      compiledAt: new Date().toISOString()
    };

    return index;
  } catch (error) {
    console.error("Manufacturing Reference Compiler Error, trying backend fallback:", error);
    if (typeof window !== 'undefined') {
      try {
        const backendRes = await fetch('/api/gemini/compileReference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ manufacturingJson: rawJson })
        });
        if (backendRes.ok) {
          const resData = await backendRes.json();
          if (resData.referenceIndex) return resData.referenceIndex;
        }
      } catch (fallbackErr) {
        console.error("Backend compileReference fallback failed:", fallbackErr);
      }
    }
    throw new Error("Failed to compile Manufacturing JSON: " + (error as Error).message);
  }
};

// ============================================================
// 2. BEAT MATCHER — match script chunk to visual beat
// ============================================================
export const matchChunkToBeat = (chunk: string, beats: VisualBeatRef[]): VisualBeatRef | null => {
  if (!beats || beats.length === 0) return null;

  const chunkLower = chunk.toLowerCase();
  let bestMatch: VisualBeatRef | null = null;
  let bestScore = 0;

  for (const beat of beats) {
    let score = 0;
    // Check semantic alignment terms
    for (const term of (beat.semantic_alignment_terms || [])) {
      if (chunkLower.includes(term.toLowerCase())) {
        score += 3;
      }
    }
    // Check must_show terms
    for (const term of (beat.must_show || [])) {
      if (chunkLower.includes(term.toLowerCase())) {
        score += 2;
      }
    }
    // Check story function keywords
    if (beat.story_function) {
      const funcWords = beat.story_function.toLowerCase().split(/\s+/);
      for (const word of funcWords) {
        if (word.length > 3 && chunkLower.includes(word)) {
          score += 1;
        }
      }
    }
    // Check narrative purpose keywords
    if (beat.narrative_purpose) {
      const purposeWords = beat.narrative_purpose.toLowerCase().split(/\s+/);
      for (const word of purposeWords) {
        if (word.length > 3 && chunkLower.includes(word)) {
          score += 1;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = beat;
    }
  }

  return bestMatch;
};

// ============================================================
// 3. SCENE REFERENCE RESOLVER
// ============================================================
export const resolveScenePacket = (
  index: ManufacturingReferenceIndex,
  stageId: string,
  beatId: string,
  sceneId: string
): SceneReferencePacket => {
  // Find stage
  const stage = index.construction_stages.find(s => s.reference_id === stageId)
    || index.construction_stages[0];

  // Find beat
  const beat = index.visual_beats.find(b => b.reference_id === beatId)
    || index.visual_beats[0];

  // Find environment
  const envId = (beat?.environment_ids?.[0]) || (stage?.environment_ids?.[0]) || '';
  const environment = index.environments.find(e => e.reference_id === envId)
    || index.environments[0]
    || { reference_id: 'ENV_DEFAULT', name: 'Default', description: '', atmospheric_conditions: [], visibility_conditions: [], lighting_conditions: [], source_path: '' };

  // Find modules
  const moduleIds = new Set<string>();
  if (stage?.primary_module_id) moduleIds.add(stage.primary_module_id);
  for (const id of (stage?.secondary_module_ids || [])) moduleIds.add(id);
  for (const id of (beat?.facility_module_ids || [])) moduleIds.add(id);
  const modules = index.facility_modules.filter(m => moduleIds.has(m.reference_id));

  // Build continuity from adjacent stages
  const stageIndex = index.construction_stages.indexOf(stage);
  const prevStage = stageIndex > 0 ? index.construction_stages[stageIndex - 1] : null;
  const nextStage = stageIndex < index.construction_stages.length - 1 ? index.construction_stages[stageIndex + 1] : null;
  const continuity: StageContinuity = {
    previous_stage_id: prevStage?.reference_id || null,
    previous_state: prevStage?.primary_action || null,
    current_state: stage?.primary_action || '',
    next_expected_state: nextStage?.primary_action || null
  };

  // Collect relevant identity anchors
  const relevantAnchors: Record<string, IdentityAnchor> = {};
  for (const mod of modules) {
    if (index.identity_anchors[mod.reference_id]) {
      relevantAnchors[mod.reference_id] = index.identity_anchors[mod.reference_id];
    }
  }
  if (index.identity_anchors[envId]) {
    relevantAnchors[envId] = index.identity_anchors[envId];
  }

  // Merge camera guidance (beat > stage > defaults)
  const camera: CameraGuidance = {
    preferred_views: [...(stage?.camera_guidance?.preferred_views || [])],
    safe_shot_scales: [...(stage?.camera_guidance?.safe_shot_scales || [])],
    preferred_camera_movements: [...(stage?.camera_guidance?.preferred_camera_movements || [])],
    forbidden_camera_movements: [...(stage?.camera_guidance?.forbidden_camera_movements || [])]
  };

  // Merge negative constraints from all levels (deduplicated)
  const merged: CategorizedNegatives = {
    geometry: [...(index.negative_constraints?.geometry || [])],
    action: [...(index.negative_constraints?.action || [])],
    camera: [...(index.negative_constraints?.camera || []), ...(camera.forbidden_camera_movements || [])],
    environment: [...(index.negative_constraints?.environment || [])],
    evidence: [...(index.negative_constraints?.evidence || [])],
    text: [...(index.negative_constraints?.text || [])],
    security: [...(index.negative_constraints?.security || [])]
  };
  // Add stage-level negatives into action category
  for (const neg of (stage?.negative_constraints || [])) {
    if (!merged.action.includes(neg)) merged.action.push(neg);
  }
  // Add beat-level must_not_show into environment
  for (const neg of (beat?.must_not_show || [])) {
    if (!merged.environment.includes(neg)) merged.environment.push(neg);
  }
  // Deduplicate all arrays
  for (const key of Object.keys(merged) as (keyof CategorizedNegatives)[]) {
    merged[key] = [...new Set(merged[key])];
  }

  // Collect applicable visual rules
  const applicableRules = index.visual_rules.filter(r =>
    r.applies_to.includes('GLOBAL') ||
    r.applies_to.includes(stageId) ||
    r.applies_to.includes(beatId)
  );

  // Build source references
  const sourceRefs: string[] = [];
  if (stage?.source_path) sourceRefs.push(stage.source_path);
  if (beat?.source_path) sourceRefs.push(beat.source_path);
  if (environment?.source_path) sourceRefs.push(environment.source_path);

  return {
    project_reference_id: index.project_identity?.reference_id || 'PROJECT_001',
    scene_id: sceneId,
    stage,
    beat,
    environment,
    modules,
    continuity,
    identity_anchors: relevantAnchors,
    camera,
    negative_constraints: merged,
    visual_rules: applicableRules,
    media_route: beat?.preferred_media_routes?.[0] || 'T2V',
    generation_permission: beat?.generation_permission || 'T2V_ALLOWED',
    facility_state_lock: {
      stage_id: stage?.reference_id || stageId,
      facility_state_code: stage?.facility_state_code || '',
      facility_state_description: stage?.facility_state_description || ''
    },
    source_references: sourceRefs
  };
};

// ============================================================
// 4. SCENE VALIDATION
// ============================================================
export const validateScene = (packet: SceneReferencePacket): SceneValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Valid stage
  if (!packet.stage?.reference_id) errors.push("Scene has no valid construction stage.");
  // 2. Valid beat
  if (!packet.beat?.reference_id) errors.push("Scene has no valid visual beat.");
  // 3. Stage and beat compatible
  if (packet.beat?.stage_id && packet.stage?.reference_id && packet.beat.stage_id !== packet.stage.reference_id) {
    warnings.push(`Beat stage_id '${packet.beat.stage_id}' does not match resolved stage '${packet.stage.reference_id}'.`);
  }
  // 4. Environment exists
  if (!packet.environment?.reference_id) warnings.push("Scene has no resolved environment.");
  // 5. At least one module
  if (packet.modules.length === 0) warnings.push("Scene has no facility modules resolved.");
  // 6. Generation permission
  if (packet.generation_permission === 'NOT_ALLOWED') {
    errors.push("Generation is NOT_ALLOWED for this scene.");
  }
  if (packet.generation_permission === 'EDITOR_ONLY') {
    warnings.push("Scene requires EDITOR_ONLY treatment — return graphic specification instead of T2V prompt.");
  }
  if (packet.generation_permission === 'REFERENCE_REQUIRED') {
    warnings.push("Scene requires REFERENCE material — pure generation may be insufficient.");
  }
  // 7. Primary action exists
  if (!packet.stage?.primary_action) warnings.push("No primary action defined for this stage.");
  // 8. Camera constraints
  const camMoveCount = packet.camera.preferred_camera_movements.length;
  if (camMoveCount > 2) warnings.push(`${camMoveCount} camera movements specified — recommend max 1 primary movement.`);
  // 9. Negative constraints present
  const totalNegatives = Object.values(packet.negative_constraints).reduce((sum, arr) => sum + arr.length, 0);
  if (totalNegatives === 0) warnings.push("No negative constraints resolved for this scene.");
  // 10. Facility state lock
  if (!packet.facility_state_lock.facility_state_code) warnings.push("No facility state code — state drift risk.");

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

// ============================================================
// 5. FORMAT SCENE PACKET FOR PROMPT
// ============================================================
export const formatScenePacketForPrompt = (
  packet: SceneReferencePacket,
  isFirstMention: Record<string, boolean> = {}
): string => {
  const lines: string[] = [];

  lines.push('==================================');
  lines.push('SCENE REFERENCE PACKET');
  lines.push('==================================');
  lines.push('');

  // FACILITY
  lines.push(`FACILITY: ${packet.project_reference_id}`);
  lines.push('');

  // STAGE
  lines.push(`STAGE: ${packet.stage.reference_id}`);
  lines.push(`${packet.stage.stage_name}`);
  lines.push(`FACILITY STATE: ${packet.stage.facility_state_code} — ${packet.stage.facility_state_description || 'N/A'}`);
  lines.push('');

  // ENVIRONMENT
  lines.push(`ENVIRONMENT: ${packet.environment.reference_id}`);
  lines.push(`${packet.environment.description}`);
  if (packet.environment.atmospheric_conditions.length > 0) {
    lines.push(`Atmosphere: ${packet.environment.atmospheric_conditions.join(', ')}`);
  }
  if (packet.environment.visibility_conditions.length > 0) {
    lines.push(`Visibility: ${packet.environment.visibility_conditions.join(', ')}`);
  }
  if (packet.environment.lighting_conditions.length > 0) {
    lines.push(`Lighting: ${packet.environment.lighting_conditions.join(', ')}`);
  }
  lines.push('');

  // MODULES WITH IDENTITY ANCHORS
  lines.push('MODULES & IDENTITY ANCHORS:');
  for (const mod of packet.modules) {
    const anchor = packet.identity_anchors[mod.reference_id];
    const firstMention = !isFirstMention[mod.reference_id];
    if (anchor) {
      if (firstMention) {
        lines.push(`[${mod.reference_id}] FIRST MENTION — USE FULL ANCHOR:`);
        lines.push(`  ${anchor.full_anchor}`);
        isFirstMention[mod.reference_id] = true;
      } else {
        lines.push(`[${mod.reference_id}] SUBSEQUENT — USE SHORT ANCHOR:`);
        lines.push(`  ${anchor.short_anchor}`);
      }
    } else {
      lines.push(`[${mod.reference_id}] ${mod.identity_anchor || mod.name}`);
    }
  }
  lines.push('');

  // PRIMARY ACTION
  lines.push(`PRIMARY ACTION: ${packet.stage.primary_action}`);
  if (packet.stage.secondary_actions && packet.stage.secondary_actions.length > 0) {
    lines.push(`MINOR SUPPORTING ACTION: ${packet.stage.secondary_actions[0]}`);
  }
  lines.push('');

  // VISUAL BEAT
  lines.push('VISUAL BEAT:');
  lines.push(`Story Function: ${packet.beat.story_function}`);
  lines.push(`Narrative Purpose: ${packet.beat.narrative_purpose}`);
  lines.push(`Visual Family: ${packet.beat.visual_family || 'N/A'}`);
  if (packet.beat.must_show.length > 0) {
    lines.push(`MUST SHOW: ${packet.beat.must_show.join(', ')}`);
  }
  lines.push('');

  // PRESENT / ABSENT
  lines.push('PRESENT IN SCENE:');
  for (const f of packet.stage.present_features) lines.push(`  ✓ ${f}`);
  lines.push('');
  if (packet.stage.absent_features.length > 0) {
    lines.push('ABSENT / NOT YET BUILT:');
    for (const f of packet.stage.absent_features) lines.push(`  ✗ ${f}`);
    lines.push('');
  }

  // CONTINUITY
  lines.push('CONTINUITY:');
  if (packet.continuity.previous_state) {
    lines.push(`  Previous state: ${packet.continuity.previous_state}`);
  }
  lines.push(`  Current state: ${packet.continuity.current_state}`);
  if (packet.continuity.next_expected_state) {
    lines.push(`  Expected next state: ${packet.continuity.next_expected_state}`);
  }
  lines.push('');

  // CAMERA (positive first)
  lines.push('CAMERA:');
  if (packet.camera.preferred_views.length > 0) {
    lines.push(`  Views: ${packet.camera.preferred_views.join(', ')}`);
  }
  if (packet.camera.safe_shot_scales.length > 0) {
    lines.push(`  Scales: ${packet.camera.safe_shot_scales.join(', ')}`);
  }
  if (packet.camera.preferred_camera_movements.length > 0) {
    lines.push(`  Movement: ${packet.camera.preferred_camera_movements[0]}`);
  }
  lines.push('');

  // FACILITY STATE LOCK
  lines.push('FACILITY STATE LOCK:');
  lines.push(`  Stage: ${packet.facility_state_lock.stage_id}`);
  lines.push(`  State Code: ${packet.facility_state_lock.facility_state_code}`);
  lines.push(`  Description: ${packet.facility_state_lock.facility_state_description}`);
  lines.push(`  DO NOT allow the clip to drift into another construction state.`);
  lines.push('');

  // GENERATION PERMISSION
  lines.push(`GENERATION PERMISSION: ${packet.generation_permission}`);
  lines.push(`MEDIA ROUTE: ${packet.media_route}`);
  lines.push('');

  // NEGATIVE CONSTRAINTS (categorized, after positives)
  const cleanList = (arr: string[]) => {
    return arr
      .map(item => item.replace(/:\s*true/gi, '').replace(/:\s*false/gi, '').replace(/_/g, ' ').trim())
      .filter(item => item && !item.toLowerCase().includes('forbidden:true') && !item.toLowerCase().includes('requires verified'));
  };

  lines.push('==================================');
  lines.push('NEGATIVE CONSTRAINTS (FORMATTED CONCISELY)');
  lines.push('==================================');
  const cats = packet.negative_constraints;
  const geom = cleanList(cats.geometry);
  const act = cleanList(cats.action);
  const cam = cleanList(cats.camera);
  const env = cleanList(cats.environment);
  const evid = cleanList(cats.evidence);
  const txt = cleanList(cats.text);
  const sec = cleanList(cats.security);

  if (geom.length > 0) lines.push(`GEOMETRY: ${geom.join(', ')}`);
  if (act.length > 0) lines.push(`ACTION: ${act.join(', ')}`);
  if (cam.length > 0) lines.push(`CAMERA: ${cam.join(', ')}`);
  if (env.length > 0) lines.push(`ENVIRONMENT: ${env.join(', ')}`);
  if (evid.length > 0) lines.push(`EVIDENCE: ${evid.join(', ')}`);
  if (txt.length > 0) lines.push(`TEXT: ${txt.join(', ')}`);
  if (sec.length > 0) lines.push(`SECURITY: ${sec.join(', ')}`);
  lines.push('');

  // BEAT MUST NOT SHOW
  if (packet.beat.must_not_show && packet.beat.must_not_show.length > 0) {
    const cleanedMustNot = cleanList(packet.beat.must_not_show);
    if (cleanedMustNot.length > 0) {
      lines.push(`BEAT MUST NOT SHOW: ${cleanedMustNot.join(', ')}`);
      lines.push('');
    }
  }

  // SOURCE REFERENCES
  lines.push(`SOURCE REFERENCES: ${packet.source_references.join(', ')}`);

  return lines.join('\n');
};

// ============================================================
// 6. AUTO-RESOLVE FOR BATCH: match chunks to beats & build packets
// ============================================================
export const resolveChunksToPackets = (
  chunks: string[],
  index: ManufacturingReferenceIndex,
  startClipNumber: number
): { packets: (SceneReferencePacket | null)[], beatAssignments: (VisualBeatRef | null)[] } => {
  const packets: (SceneReferencePacket | null)[] = [];
  const beatAssignments: (VisualBeatRef | null)[] = [];
  const usedBeatIds = new Set<string>();

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    // Try to match chunk to a beat
    let beat = matchChunkToBeat(chunk, index.visual_beats);

    // If matched beat was already used, try to find the next unused beat sequentially
    if (beat && usedBeatIds.has(beat.reference_id)) {
      const beatIndex = index.visual_beats.indexOf(beat);
      let found = false;
      for (let j = beatIndex + 1; j < index.visual_beats.length; j++) {
        if (!usedBeatIds.has(index.visual_beats[j].reference_id)) {
          beat = index.visual_beats[j];
          found = true;
          break;
        }
      }
      if (!found) beat = null;
    }

    if (beat) {
      usedBeatIds.add(beat.reference_id);
      const stageId = beat.stage_id || (index.construction_stages[0]?.reference_id || 'STAGE_01');
      const sceneId = `SCENE_${String(startClipNumber + i).padStart(3, '0')}`;
      const packet = resolveScenePacket(index, stageId, beat.reference_id, sceneId);
      packets.push(packet);
      beatAssignments.push(beat);
    } else {
      packets.push(null);
      beatAssignments.push(null);
    }
  }

  return { packets, beatAssignments };
};

export const manufacturingCompiler = {
  compileManufacturingJson,
  matchChunkToBeat,
  resolveScenePacket,
  validateScene,
  formatScenePacketForPrompt,
  resolveChunksToPackets
};
