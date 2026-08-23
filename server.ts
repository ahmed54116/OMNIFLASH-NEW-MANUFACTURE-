import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer as createViteServer } from 'vite';
import 'dotenv/config';

// Ensure API_KEY is available (Platform provides it as API_KEY or GEMINI_API_KEY)
if (process.env.GEMINI_API_KEY && !process.env.API_KEY) {
  process.env.API_KEY = process.env.GEMINI_API_KEY;
}

import { geminiService } from './serverGeminiService.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // API endpoints
  app.post('/api/gemini/split', async (req, res) => {
    try {
      const { script, clipDuration, mode } = req.body;
      const chunks = await geminiService.splitScriptToChunks(script, clipDuration, mode);
      res.json({ chunks });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/gemini/characters', async (req, res) => {
    try {
      const { text, mode } = req.body;
      const characters = await geminiService.analyzeTextForCharacters(text, mode);
      res.json({ characters });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/gemini/generateSingle', async (req, res) => {
    try {
      const { chunkText, clipDuration, globalStyle, previousClips, nextChunkText, settings } = req.body;
      const clip = await geminiService.generateSingleClip(chunkText, clipDuration, globalStyle, previousClips, nextChunkText, settings);
      res.json({ clip });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/gemini/generateBatch', async (req, res) => {
    try {
      const { chunks, startIndex, clipDuration, globalStyle, previousClips, settings } = req.body;
      const generatedClips = await geminiService.generateClipBatch(chunks, startIndex, clipDuration, globalStyle, previousClips, settings);
      res.json({ clips: generatedClips });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
