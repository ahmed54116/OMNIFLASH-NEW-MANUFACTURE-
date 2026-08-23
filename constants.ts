
import { StyleSettings, StylePreset } from './types';

export const VISUAL_STYLES = [
  "Cinematic Photorealistic",
  "Modern Corporate",
  "Documentary Style",
  "Vintage Film Look (1950s-90s)",
  "3D Render (Unreal Engine 5)",
  "Cyberpunk / Neon",
  "Anime / Cel-Shaded",
  "Digital Art / Oil Painting",
  "Claymation / Stop Motion",
  "Minimalist Clean",
  "Dark & Gritty",
  "Fantasy / Ethereal",
  "VHS / Glitch Aesthetic",
  "GoPro / Action Cam",
  "Architectural Visualization",
  "Noir / Black & White",
  "✏️ Custom..."
];

export const LIGHTING_OPTIONS = [
  "Soft Natural Lighting",
  "Dramatic High-Contrast",
  "Golden Hour (Sunrise/Sunset)",
  "Blue Hour (Twilight)",
  "Cinematic Low-Key",
  "Studio Three-Point",
  "Cool Blue Tech",
  "Neon / Cyberpunk",
  "Volumetric / God Rays",
  "Firelight / Candlelight",
  "Bioluminescent",
  "Harsh Overhead",
  "Silhouette / Backlit",
  "Rim Lighting",
  "✏️ Custom..."
];

export const MOOD_OPTIONS = [
  "Professional & Trustworthy",
  "Inspiring & Uplifting",
  "Dramatic & Intense",
  "Educational & Clear",
  "Melancholic & Atmospheric",
  "Fast-Paced & Energetic",
  "Mysterious & Suspenseful",
  "Whimsical & Playful",
  "Horror / Unsettling",
  "Romantic & Soft",
  "Aggressive / Action",
  "Nostalgic",
  "Calm & Zen",
  "Chaotic",
  "✏️ Custom..."
];

export const CAMERA_STYLES = [
  "Establishing Shot",
  "Wide / Full Shot",
  "Medium Shot",
  "Medium Close-Up",
  "Close-Up",
  "Extreme Close-Up",
  "Low Angle Shot",
  "High Angle Shot",
  "Aerial Shot",
  "Dutch Angle",
  "Over The Shoulder",
  "POV (Point of View)",
  "Insert Shot",
  "Specialty / Creative Framing",
  "✏️ Custom..."
];

export const CAMERA_MOVEMENTS = [
  "Smooth Tracking",
  "Slow Pan",
  "Static / Locked",
  "Handheld Shake",
  "Crane / Jib",
  "Dynamic Zoom (Dolly Zoom)",
  "Push In",
  "Pull Out",
  "Orbit / Arc",
  "Truck Left/Right",
  "Pedestal Up/Down",
  "Hyperlapse",
  "Slow Motion (High FPS)",
  "Crash Zoom",
  "✏️ Custom..."
];

export const CLIP_DURATIONS = [5, 8, 10, 12, 15];

export const BATCH_SIZE = 5;

export const DEFAULT_SETTINGS: StyleSettings = {
  visualStyle: "Cinematic Photorealistic",
  colorPalette: {
    primary: "#000000",
    secondary: "#FFFFFF",
    accent: "#0000FF"
  },
  mood: "Professional & Trustworthy",
  lighting: "Soft Natural Lighting",
  cameraStyle: "Establishing Shot",
  cameraMovement: "Smooth Tracking",
  artKeywords: "4K, high detail, masterpiece",
  characters: [],
  isConsistencyEnabled: true,
  useEstablishingHook: false,
  generateImageAndAnimationPrompts: false,
  customInstructions: ""
};

export const FACTORY_PRESETS: StylePreset[] = [
  {
    id: 'sys_cinematic_drama',
    name: 'Cinematic Drama',
    isSystem: true,
    data: {
      visualStyle: "Cinematic Photorealistic",
      lighting: "Dramatic High-Contrast",
      mood: "Dramatic & Intense",
      cameraStyle: "Establishing Shot",
      cameraMovement: "Slow Pan",
      colorPalette: { primary: "#0f172a", secondary: "#e2e8f0", accent: "#3b82f6" }
    }
  },
  {
    id: 'sys_corporate_clean',
    name: 'Corporate Clean',
    isSystem: true,
    data: {
      visualStyle: "Modern Corporate",
      lighting: "Soft Natural Lighting",
      mood: "Professional & Trustworthy",
      cameraStyle: "Medium Shot",
      cameraMovement: "Static / Locked",
      colorPalette: { primary: "#FFFFFF", secondary: "#F0F0F0", accent: "#0055FF" }
    }
  },
  {
    id: 'sys_youtube_explainer',
    name: 'YouTube Explainer',
    isSystem: true,
    data: {
      visualStyle: "Minimalist Clean",
      lighting: "Studio Three-Point",
      mood: "Fast-Paced & Energetic",
      cameraStyle: "Medium Close-Up",
      cameraMovement: "Handheld Shake",
      colorPalette: { primary: "#FF0000", secondary: "#FFFFFF", accent: "#000000" }
    }
  },
  {
    id: 'sys_noir_mystery',
    name: 'Noir / Mystery',
    isSystem: true,
    data: {
      visualStyle: "Noir / Black & White",
      lighting: "Cinematic Low-Key",
      mood: "Mysterious & Suspenseful",
      cameraStyle: "Low Angle Shot",
      cameraMovement: "Slow Pan",
      colorPalette: { primary: "#000000", secondary: "#1a1a1a", accent: "#333333" }
    }
  }
];
