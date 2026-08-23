/**
 * geminiClient.ts — Browser-safe client that routes all Gemini calls
 * through the Express server API endpoints.
 * 
 * In Google AI Studio shared apps, the API key is only available server-side.
 * The browser must call the server, which then calls the Gemini API.
 */

import { StyleSettings, GeneratedClip, ClipDuration, OutputFormat, Character, BatchContext, GenerationResult } from "../types";

const SERVER_BASE = ''; // Same origin

async function serverPost(endpoint: string, body: any): Promise<any> {
  const res = await fetch(`${SERVER_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: res.statusText }));
    const error: any = new Error(errData.error || `Server error ${res.status}`);
    error.status = res.status;
    error.isQuotaError = errData.isQuotaError || res.status === 429;
    error.retryDelay = errData.retryDelay || (res.status === 429 ? 60 : undefined);
    throw error;
  }
  return res.json();
}

// Split script into chunks via server
const splitScriptToChunks = async (
  script: string, 
  clipDuration: ClipDuration, 
  mode?: 'standard' | 'creature'
): Promise<string[]> => {
  const data = await serverPost('/api/gemini/split', { script, clipDuration, mode });
  return data.chunks;
};

// Analyze text for characters via server
const analyzeTextForCharacters = async (
  text: string, 
  mode?: 'standard' | 'creature'
): Promise<Character[]> => {
  const data = await serverPost('/api/gemini/characters', { text, mode });
  return data.characters;
};

// Generate a single clip via server
const generateSingleClip = async (
  chunkText: string,
  clipNumber: number,
  settings: StyleSettings,
  clipDuration: ClipDuration,
  outputFormat: OutputFormat,
  mode: 'standard' | 'creature'
): Promise<GeneratedClip> => {
  const data = await serverPost('/api/gemini/generateSingle', {
    chunkText, clipNumber, settings, clipDuration, outputFormat, mode
  });
  return data.clip;
};

// Generate a batch of clips via server
const generateClipBatch = async (
  chunks: string[],
  startClipNumber: number,
  settings: StyleSettings,
  clipDuration: ClipDuration,
  outputFormat: OutputFormat,
  mode: 'standard' | 'creature',
  batchContext?: BatchContext
): Promise<GenerationResult> => {
  const data = await serverPost('/api/gemini/generateBatch', {
    chunks, startClipNumber, settings, clipDuration, outputFormat, mode, batchContext
  });
  return data;
};

// Regenerate a single clip via server
const regenerateClip = async (
  originalClip: GeneratedClip,
  settings: StyleSettings,
  instruction: string,
  outputFormat: OutputFormat,
  mode: 'standard' | 'creature'
): Promise<GeneratedClip> => {
  const data = await serverPost('/api/gemini/regenerate', {
    originalClip, settings, instruction, outputFormat, mode
  });
  return data.clip;
};

// Analyze continuity via server
const analyzeContinuity = async (
  script: string,
  settings: StyleSettings
): Promise<string> => {
  const data = await serverPost('/api/gemini/continuity', {
    script, settings
  });
  return data.continuityJson;
};

export const geminiClient = {
  splitScriptToChunks,
  analyzeTextForCharacters,
  generateSingleClip,
  generateClipBatch,
  regenerateClip,
  analyzeContinuity,
};
