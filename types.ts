
export interface ScriptMetrics {
  wordCount: number;
  estimatedDurationMinutes: number;
  estimatedClipCount: number;
}

export type OutputFormat = 'standard' | 'json';

export interface GeneratedClip {
  id: string;
  scriptLine: string;
  narrativeContext: string;
  visualPrompt: string;
  animationPrompt?: string;
  clipNumber: number;
  shotType?: string;
  cameraMovement?: string;
  jsonOutput?: any;
}

export interface Character {
  id: string;
  name: string;
  alias?: string;
  role: string;
  description: string;
  shortDescription: string;
  frequency: 'Main Protagonist' | 'Supporting' | 'Occasional';
  isFaceLocked: boolean;
  visualStyle: string;
  lighting: string;
  mood: string;
  cameraStyle: string;
  cameraMovement: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface ProtagonistLock {
  enabled: boolean;
  name: string;
  description: string;
}

export interface StyleSettings {
  visualStyle: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
  };
  mood: string;
  lighting: string;
  cameraStyle: string;
  cameraMovement: string;
  artKeywords: string;
  characters: Character[];
  isConsistencyEnabled: boolean;
  useEstablishingHook: boolean;
  manufacturingJson?: string;
  compiledReference?: ManufacturingReferenceIndex | null;
  batchContext?: BatchContext;
  generateImageAndAnimationPrompts: boolean;
  customInstructions?: string;
  protagonistLock?: ProtagonistLock;
  [key: string]: any;
}

export interface StylePreset {
  id: string;
  name: string;
  isSystem: boolean;
  data: {
    visualStyle: string;
    mood: string;
    lighting: string;
    cameraStyle: string;
    cameraMovement: string;
    colorPalette: {
      primary: string;
      secondary: string;
      accent: string;
    };
    [key: string]: any;
  };
}

export interface ProjectExportData {
  version?: string;
  type?: string;
  mode?: string;
  timestamp?: string;
  payload?: any;
  script?: string;
  pacing?: string;
  outputFormat?: OutputFormat;
  globalStyle?: Omit<StyleSettings, 'characters'>;
  characters?: Character[];
  settings?: StyleSettings;
  clipDuration?: ClipDuration;
  clips?: GeneratedClip[];
  compiledReference?: ManufacturingReferenceIndex | null;
}

export type ClipDuration = number;

export enum GenerationStatus {
  IDLE = 'IDLE',
  PREPARING = 'PREPARING',
  GENERATING = 'GENERATING',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  PAUSED = 'PAUSED'
}

export interface GenerationProgress {
  current: number;
  total: number;
  currentStep: string;
}

// ============================================================
// MANUFACTURING REFERENCE COMPILER TYPES
// ============================================================

export interface ManufacturingReferenceIndex {
  version: string;
  contentHash: string;
  compiledAt: string;
  project_identity: ProjectIdentity;
  facility_modules: FacilityModule[];
  environments: EnvironmentRef[];
  construction_stages: StageRef[];
  visual_beats: VisualBeatRef[];
  visual_rules: VisualRule[];
  negative_constraints: CategorizedNegatives;
  spatial_relationships: SpatialRelationship[];
  identity_anchors: Record<string, IdentityAnchor>;
  global_prompt_rules: string[];
  truth_and_evidence_rules: string[];
  media_routing_rules: string[];
}

export interface ProjectIdentity {
  reference_id: string;
  project_name: string;
  location: string;
  summary: string;
  source_path: string;
}

export interface FacilityModule {
  reference_id: string;
  name: string;
  identity_anchor: string;
  full_description: string;
  key_dimensions: string[];
  key_materials: string[];
  key_components: string[];
  source_path: string;
}

export interface EnvironmentRef {
  reference_id: string;
  name: string;
  description: string;
  atmospheric_conditions: string[];
  visibility_conditions: string[];
  lighting_conditions: string[];
  source_path: string;
}

export interface StageRef {
  reference_id: string;
  stage_name: string;
  facility_state_code: string;
  facility_state_description: string;
  environment_ids: string[];
  primary_module_id: string;
  secondary_module_ids: string[];
  present_features: string[];
  absent_features: string[];
  primary_action: string;
  secondary_actions: string[];
  camera_guidance: CameraGuidance;
  negative_constraints: string[];
  source_path: string;
}

export interface VisualBeatRef {
  reference_id: string;
  chapter_id: string;
  beat_index: number;
  story_function: string;
  visual_family: string;
  narrative_purpose: string;
  must_show: string[];
  must_not_show: string[];
  semantic_alignment_terms: string[];
  environment_ids: string[];
  facility_module_ids: string[];
  stage_id: string;
  generation_permission: 'T2V_ALLOWED' | 'REFERENCE_REQUIRED' | 'EDITOR_ONLY' | 'NOT_ALLOWED';
  preferred_media_routes: string[];
  facility_visibility: string;
  facility_claim_status: string;
  layout_claim_status: string;
  duration_guidance: string;
  source_path: string;
}

export interface CameraGuidance {
  preferred_views: string[];
  safe_shot_scales: string[];
  preferred_camera_movements: string[];
  forbidden_camera_movements: string[];
}

export interface VisualRule {
  rule_id: string;
  description: string;
  applies_to: string[];
  source_path: string;
}

export interface CategorizedNegatives {
  geometry: string[];
  action: string[];
  camera: string[];
  environment: string[];
  evidence: string[];
  text: string[];
  security: string[];
}

export interface SpatialRelationship {
  module_a_id: string;
  module_b_id: string;
  relationship: string;
  claim_status: 'CONFIRMED' | 'CORROBORATED' | 'CONCEPTUAL_ONLY' | 'UNVERIFIED';
  source_path: string;
}

export interface IdentityAnchor {
  reference_id: string;
  short_anchor: string;
  full_anchor: string;
  source_path: string;
}

export interface SceneReferencePacket {
  project_reference_id: string;
  scene_id: string;
  stage: StageRef;
  beat: VisualBeatRef;
  environment: EnvironmentRef;
  modules: FacilityModule[];
  continuity: StageContinuity;
  identity_anchors: Record<string, IdentityAnchor>;
  camera: CameraGuidance;
  negative_constraints: CategorizedNegatives;
  visual_rules: VisualRule[];
  media_route: string;
  generation_permission: string;
  facility_state_lock: {
    stage_id: string;
    facility_state_code: string;
    facility_state_description: string;
  };
  source_references: string[];
}

export interface StageContinuity {
  previous_stage_id: string | null;
  previous_state: string | null;
  current_state: string;
  next_expected_state: string | null;
}

export interface SceneValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BatchContext {
  previous_prompts_summary: string[];
  visual_vocabulary_history: string[];
  establishing_shots_registry: string[];
  temporal_state: string;
  process_stages_shown: string[];
  primary_subjects_used: string[];
  motion_graphics_count?: number;
  last_was_motion_graphic?: boolean;
}

export interface CompilerStatus {
  state: 'idle' | 'compiling' | 'compiled' | 'error' | 'stale';
  message: string;
  referenceIndex: ManufacturingReferenceIndex | null;
}

export interface GenerationResult {
  clips: GeneratedClip[];
  updatedBatchContext: BatchContext;
}
