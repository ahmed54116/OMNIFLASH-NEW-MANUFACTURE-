import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer as createViteServer } from 'vite';
import 'dotenv/config';

import { geminiService } from './services/geminiService.js';
import { manufacturingCompiler } from './services/manufacturingCompiler.js';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // 2. Dedicated Backend API Endpoints (Fallback & Direct Service)
  app.post('/api/gemini/compileReference', async (req, res) => {
    try {
      const { manufacturingJson } = req.body;
      if (!manufacturingJson) throw new Error("manufacturingJson is required");
      const index = await manufacturingCompiler.compileManufacturingJson(manufacturingJson);
      res.json({ referenceIndex: index });
    } catch (e: any) {
      handleApiError(e, res, 'compileReference');
    }
  });

  // Helper: detect quota errors and return proper status code + structured error
  const handleApiError = (e: any, res: any, label: string) => {
    console.error(`API ${label} error:`, e);
    const msg = e?.message || '';
    
    // Check if this is a QUOTA_EXHAUSTED error from our callWithRetry
    if (msg.startsWith('QUOTA_EXHAUSTED|')) {
      const parts = msg.split('|');
      return res.status(429).json({ 
        error: parts[1] || 'Quota exceeded', 
        retryDelay: parseInt(parts[2]) || 60,
        isQuotaError: true 
      });
    }
    
    // Check for raw 429 / quota errors from the API
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota exceeded')) {
      const retryMatch = msg.match(/"retryDelay"\s*:\s*"(\d+)s"/);
      const retryDelay = retryMatch ? parseInt(retryMatch[1]) : 60;
      return res.status(429).json({ 
        error: `API quota exceeded. Please wait ${retryDelay}s and try again.`, 
        retryDelay,
        isQuotaError: true 
      });
    }
    
    res.status(500).json({ error: msg || `${label} failed` });
  };

  app.post('/api/gemini/split', async (req, res) => {
    try {
      const { script, clipDuration, mode } = req.body;
      const chunks = await geminiService.splitScriptToChunks(script, clipDuration, mode);
      res.json({ chunks });
    } catch (e: any) {
      handleApiError(e, res, 'split');
    }
  });

  app.post('/api/gemini/characters', async (req, res) => {
    try {
      const { text, mode } = req.body;
      const characters = await geminiService.analyzeTextForCharacters(text, mode);
      res.json({ characters });
    } catch (e: any) {
      handleApiError(e, res, 'characters');
    }
  });

  app.post('/api/gemini/generateSingle', async (req, res) => {
    try {
      const { chunkText, clipNumber, settings, clipDuration, outputFormat, mode } = req.body;
      const clip = await geminiService.generateSingleClip(chunkText, clipNumber, settings, clipDuration, outputFormat, mode);
      res.json({ clip });
    } catch (e: any) {
      handleApiError(e, res, 'generateSingle');
    }
  });

  app.post('/api/gemini/generateBatch', async (req, res) => {
    try {
      const { chunks, startClipNumber, settings, clipDuration, outputFormat, mode, batchContext } = req.body;
      const result = await geminiService.generateClipBatch(chunks, startClipNumber, settings, clipDuration, outputFormat, mode, batchContext);
      res.json(result);
    } catch (e: any) {
      handleApiError(e, res, 'generateBatch');
    }
  });

  app.post('/api/gemini/regenerate', async (req, res) => {
    try {
      const { originalClip, settings, instruction, outputFormat, mode } = req.body;
      const clip = await geminiService.regenerateClip(originalClip, settings, instruction, outputFormat, mode);
      res.json({ clip });
    } catch (e: any) {
      handleApiError(e, res, 'regenerate');
    }
  });

  app.post('/api/gemini/continuity', async (req, res) => {
    try {
      const { script, settings } = req.body;
      const continuityJson = await geminiService.analyzeContinuity(script, settings);
      res.json({ continuityJson });
    } catch (e: any) {
      handleApiError(e, res, 'continuity');
    }
  });

  // Catch unhandled /api/* routes with JSON 404 instead of HTML SPA fallback
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  // Vite middleware for development / SPA serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
