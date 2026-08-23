import {  storage } from "./utils";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleEngine } from './components/StyleEngine';
import { CharacterEngine } from './components/CharacterEngine';
import { ContinuityEngine } from './components/ContinuityEngine';
import { MetricsDisplay } from './components/MetricsDisplay';
import { PromptCard } from './components/PromptCard';
import { ExportActions } from './components/ExportActions';
import { ProjectImportModal } from './components/ProjectImportModal';
import { TokenOptimizationHUD } from './components/TokenOptimizationHUD';
import { ScenePacketInspector } from './components/ScenePacketInspector';
import { geminiClient } from './services/geminiClient';
import { manufacturingCompiler } from './services/manufacturingCompiler';
import { 
  GeneratedClip, StyleSettings, GenerationStatus, 
  GenerationProgress, ClipDuration, ScriptMetrics, OutputFormat,
  CompilerStatus, BatchContext, ManufacturingReferenceIndex
} from './types';
import { 
  Sparkles, Users, Play, Pause, AlertCircle, Video, Loader2, CheckCircle, 
  RotateCcw, ArrowDownCircle, Clock, Download, Upload, FileJson, 
  FileText, Search, UserCheck, ArrowRight, ArrowLeft, Check, Settings 
, Database } from 'lucide-react';

const BATCH_SIZE = 5;
const CLIP_DURATIONS: ClipDuration[] = [4, 5, 8];

export const parseCustomSplitJsonToChunks = (jsonString: string): string[] => {
  if (!jsonString || !jsonString.trim()) return [];
  try {
    let parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      if (Array.isArray(parsed.segments)) parsed = parsed.segments;
      else if (Array.isArray(parsed.chunks)) parsed = parsed.chunks;
      else if (Array.isArray(parsed.words)) parsed = parsed.words;
      else if (Array.isArray(parsed.results)) parsed = parsed.results;
      else if (Array.isArray(parsed.data)) parsed = parsed.data;
    }
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item: any) => {
      if (typeof item === 'string') return item;
      const text = item.text || item.script || item.chunk || item.line || item.content || item.word || item.sentence || '';
      if (!text) return JSON.stringify(item);
      const timestamp = item.timestamp ?? item.start ?? item.time ?? item.start_time;
      return timestamp !== undefined ? `[${timestamp}] ${text}` : text;
    }).filter(c => c && c.trim().length > 0);
  } catch (e) {
    return [];
  }
};

const App: React.FC = () => {
  const [viewTab, setViewTab] = useState<'script' | 'characters' | 'continuity' | 'manufacturing'>('script');
  /*
    
  */

  
  const [customSplitJson, setCustomSplitJson] = useState(() => {
    return storage.getItem(`veo_main_customSplitJson`) || '';
  });

  const [script, setScript] = useState(() => {
    return storage.getItem('veo_main_script') || '';
  });

  const [settings, setSettings] = useState<StyleSettings>(() => {
    try {
      const saved = storage.getItem('veo_main_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.colorPalette) parsed.colorPalette = { primary: '', secondary: '', accent: '' };
        if (!parsed.characters) parsed.characters = [];
        return parsed;
      }
    } catch {}
    return {
      visualStyle: '',
      colorPalette: { primary: '', secondary: '', accent: '' },
      mood: '',
      lighting: '',
      cameraStyle: '',
      cameraMovement: '',
      artKeywords: '',
      characters: [],
      isConsistencyEnabled: false,
      useEstablishingHook: true,
      generateImageAndAnimationPrompts: false,
    };
  });

  const [clipDuration, setClipDuration] = useState<ClipDuration>(() => {
    
    const saved = storage.getItem('veo_main_clipDuration') || storage.getItem('veo_clipDuration');
    return saved ? (Number(saved) as ClipDuration) : 8;
  });

  const [outputFormat, setOutputFormat] = useState<OutputFormat>(() => {
    
    const saved = storage.getItem('veo_main_outputFormat') || storage.getItem('veo_outputFormat');
    return saved ? (saved as OutputFormat) : 'standard';
  });

  const [hasAnalyzedCast, setHasAnalyzedCast] = useState(() => {
    
    const saved = storage.getItem('veo_main_hasAnalyzedCast') || storage.getItem('veo_hasAnalyzedCast');
    return saved ? JSON.parse(saved) : false;
  });
  const [isAnalyzingCast, setIsAnalyzingCast] = useState(false);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '' });

  // Manufacturing Reference Compiler state
  const [compilerStatus, setCompilerStatus] = useState<CompilerStatus>(() => {
    try {
      const saved = storage.getItem('veo_main_compiledReference');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { state: 'compiled', message: `Compiled at ${new Date(parsed.compiledAt).toLocaleTimeString()}`, referenceIndex: parsed };
      }
    } catch {}
    return { state: 'idle', message: '', referenceIndex: null };
  });
  const batchContextRef = useRef<BatchContext>({
    previous_prompts_summary: [],
    visual_vocabulary_history: [],
    establishing_shots_registry: [],
    temporal_state: '',
    process_stages_shown: [],
    primary_subjects_used: []
  });

  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [clips, setClips] = useState<GeneratedClip[]>(() => {
    
    try {
      const saved = storage.getItem('veo_main_clips') || storage.getItem('veo_clips');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [scriptChunks, setScriptChunks] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [progress, setProgress] = useState<GenerationProgress>({ current: 0, total: 0, currentStep: '' });
  const [estTimeRemaining, setEstTimeRemaining] = useState<string>('--:--');
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());
  const [nextClipIndex, setNextClipIndex] = useState(0);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const stopGenerationRef = useRef(false);
  const sessionStartTimeRef = useRef<number | null>(null);

  const customChunks = parseCustomSplitJsonToChunks(customSplitJson);
  const parsedCustomChunksLength = customChunks.length;
  const wordCount = script.trim() ? script.trim().split(/\s+/).length : (customSplitJson.trim() ? customSplitJson.split(/\s+/).length : 0);
  const estimatedDurationMinutes = wordCount / 150;
  const estimatedClipCount = parsedCustomChunksLength > 0 
    ? parsedCustomChunksLength 
    : (scriptChunks.length > 0 ? scriptChunks.length : Math.ceil((estimatedDurationMinutes * 60) / clipDuration));
  const metrics: ScriptMetrics = { wordCount, estimatedDurationMinutes, estimatedClipCount };

  // Automatically sync scriptChunks when customSplitJson is present
  useEffect(() => {
    if (customSplitJson.trim()) {
      const chunks = parseCustomSplitJsonToChunks(customSplitJson);
      if (chunks.length > 0 && chunks.length !== scriptChunks.length) {
        setScriptChunks(chunks);
        setIsAnalysisComplete(true);
      }
    }
  }, [customSplitJson]);

  useEffect(() => { storage.setItem(`veo_main_script`, script); }, [script, 'standard']);
  useEffect(() => { storage.setItem(`veo_main_customSplitJson`, customSplitJson); }, [customSplitJson, 'standard']);
  useEffect(() => { storage.setItem(`veo_main_settings`, JSON.stringify(settings)); }, [settings, 'standard']);
  useEffect(() => { storage.setItem(`veo_main_clipDuration`, String(clipDuration)); }, [clipDuration, 'standard']);
  useEffect(() => { storage.setItem(`veo_main_outputFormat`, outputFormat); }, [outputFormat, 'standard']);
  useEffect(() => { storage.setItem(`veo_main_hasAnalyzedCast`, JSON.stringify(hasAnalyzedCast)); }, [hasAnalyzedCast, 'standard']);
  useEffect(() => { storage.setItem(`veo_main_clips`, JSON.stringify(clips)); }, [clips, 'standard']);

  // Persist compiled reference to localStorage
  useEffect(() => {
    if (compilerStatus.referenceIndex) {
      storage.setItem('veo_main_compiledReference', JSON.stringify(compilerStatus.referenceIndex));
    }
  }, [compilerStatus.referenceIndex]);

  // Mark compiled reference as stale when manufacturing JSON changes
  useEffect(() => {
    if (compilerStatus.state === 'compiled' && compilerStatus.referenceIndex) {
      const currentJson = settings.manufacturingJson || '';
      if (currentJson.trim().length > 0) {
        // Simple hash check
        let hash = 0;
        for (let i = 0; i < currentJson.length; i++) {
          hash = ((hash << 5) - hash) + currentJson.charCodeAt(i);
          hash |= 0;
        }
        const currentHash = 'MFG_' + Math.abs(hash).toString(36).toUpperCase();
        if (currentHash !== compilerStatus.referenceIndex.contentHash) {
          setCompilerStatus(prev => ({ ...prev, state: 'stale', message: 'Manufacturing JSON changed — recompile required' }));
        }
      }
    }
  }, [settings.manufacturingJson]);

  useEffect(() => {
    if (showToast) {
      const t = setTimeout(() => setShowToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [showToast]);

  

  const handleClearPrompts = () => {
    setClips([]);
    setStatus(GenerationStatus.IDLE);
    setNextClipIndex(0);
    setProgress({ current: 0, total: 0, currentStep: '' });
  };

  const handleClearProject = () => setIsClearDialogOpen(true);

  const confirmClearProject = () => {
    storage.clear();
    setScript(''); 
    setClips([]); 
    setStatus(GenerationStatus.IDLE);
    setSettings({
      visualStyle: '',
      continuityJson: '',
      manufacturingJson: '',
      compiledReference: null,
      batchContext: undefined,
      colorPalette: { primary: '', secondary: '', accent: '' },
      mood: '',
      lighting: '',
      cameraStyle: '',
      cameraMovement: '',
      artKeywords: '',
      characters: [],
      isConsistencyEnabled: false,
      useEstablishingHook: true,
      generateImageAndAnimationPrompts: false,
    });
    // Clear compiled reference from localStorage and state
    setCompilerStatus({ state: 'idle', message: '', referenceIndex: null });
    batchContextRef.current = {
      previous_prompts_summary: [],
      visual_vocabulary_history: [],
      establishing_shots_registry: [],
      temporal_state: '',
      process_stages_shown: [],
      primary_subjects_used: []
    };
    setHasAnalyzedCast(false); 
    setNextClipIndex(0); 
    setIsClearDialogOpen(false);
    setCurrentStep(1);
    setScriptChunks([]);
    setIsAnalysisComplete(false);
    setViewTab('script');
    setRegeneratingIds(new Set());
    setProgress({ current: 0, total: 0, currentStep: '' });
    setEstTimeRemaining('--:--');
    setErrorMsg(null);
  };

  const handleExportProject = () => {
    const compiledRef = compilerStatus.referenceIndex || settings.compiledReference || null;
    const projectData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      script,
      customSplitJson,
      scriptChunks: scriptChunks.length > 0 ? scriptChunks : clips.map(c => c.scriptLine),
      clipDuration,
      outputFormat,
      currentStep,
      nextClipIndex: clips.length,
      batchContext: batchContextRef.current,
      settings: {
        ...settings,
        manufacturingJson: settings.manufacturingJson || '',
        compiledReference: compiledRef
      },
      compiledReference: compiledRef,
      compilerStatus: {
        state: compilerStatus.state,
        message: compilerStatus.message,
        referenceIndex: compiledRef
      },
      clips
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omniflash_project_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShowToast("Project exported successfully!");
  };

  const handleImportProject = (data: any) => {
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse JSON string:", e);
      }
    }

    if (!data || typeof data !== 'object') {
      setShowToast("Invalid project data.");
      return;
    }

    // 1. Restore script & Custom JSON
    if (data.script) {
      setScript(data.script);
      storage.setItem('veo_main_script', data.script);
    }
    if (data.customSplitJson) {
      setCustomSplitJson(data.customSplitJson);
      storage.setItem('veo_main_customSplitJson', data.customSplitJson);
    }
    
    // 2. Restore or reconstruct script chunks
    let restoredChunks: string[] = [];
    if (data.customSplitJson && data.customSplitJson.trim()) {
      restoredChunks = parseCustomSplitJsonToChunks(data.customSplitJson);
    }
    if (restoredChunks.length === 0 && Array.isArray(data.scriptChunks) && data.scriptChunks.length > 0) {
      restoredChunks = data.scriptChunks;
    }
    if (restoredChunks.length === 0 && data.script && data.script.trim()) {
      // Estimate if needed
    }
    if (restoredChunks.length === 0 && Array.isArray(data.clips) && data.clips.length > 0) {
      restoredChunks = data.clips.map((c: any) => c.scriptLine || c.narrativeContext || '');
    }

    if (restoredChunks.length > 0) {
      setScriptChunks(restoredChunks);
      setIsAnalysisComplete(true);
    }

    // 3. Restore settings (Manufacturing JSON, Characters, World, Continuity, Style, etc.)
    if (data.settings) {
      const s = { ...data.settings };
      if (!s.colorPalette) s.colorPalette = { primary: '', secondary: '', accent: '' };
      if (!s.characters) s.characters = [];
      setSettings(s);
      storage.setItem('veo_main_settings', JSON.stringify(s));
    }

    // 4. Restore Compiled Reference & Compiler Status
    const compiledRef = data.compiledReference || data.compilerStatus?.referenceIndex || data.settings?.compiledReference;
    if (compiledRef) {
      setCompilerStatus({
        state: 'compiled',
        message: `Imported compiled reference (${compiledRef.construction_stages?.length || 0} stages, ${compiledRef.visual_beats?.length || 0} beats, ${compiledRef.facility_modules?.length || 0} modules)`,
        referenceIndex: compiledRef
      });
      setSettings(prev => ({ ...prev, compiledReference: compiledRef }));
      storage.setItem('veo_main_compiledReference', JSON.stringify(compiledRef));
    } else if (data.settings?.manufacturingJson) {
      setCompilerStatus({
        state: 'idle',
        message: 'Manufacturing JSON imported. Ready to compile.',
        referenceIndex: null
      });
    }

    // 5. Restore clips & generation state
    const importedClips: GeneratedClip[] = Array.isArray(data.clips) ? data.clips : [];
    setClips(importedClips);
    storage.setItem('veo_main_clips', JSON.stringify(importedClips));
    
    const totalCount = restoredChunks.length || importedClips.length || metrics.estimatedClipCount;
    setNextClipIndex(importedClips.length);
    setProgress({
      current: importedClips.length,
      total: totalCount,
      currentStep: importedClips.length < totalCount 
        ? `Loaded ${importedClips.length}/${totalCount} prompts. Ready to resume from prompt #${importedClips.length + 1}.` 
        : `Loaded all ${importedClips.length} completed prompts.`
    });

    // 6. Restore batch context
    if (data.batchContext) {
      batchContextRef.current = data.batchContext;
    } else if (importedClips.length > 0) {
      batchContextRef.current = {
        previous_prompts_summary: importedClips.map((c: any) => (c.visualPrompt || '').substring(0, 80) + '...'),
        visual_vocabulary_history: [],
        establishing_shots_registry: [],
        temporal_state: 'Resumed',
        process_stages_shown: [],
        primary_subjects_used: [],
        motion_graphics_count: importedClips.filter((c: any) => (c.visualPrompt || '').toLowerCase().includes('motion graphic')).length,
        last_was_motion_graphic: (importedClips[importedClips.length - 1]?.visualPrompt || '').toLowerCase().includes('motion graphic')
      };
    }

    // 7. Configs
    if (data.clipDuration) {
      setClipDuration(data.clipDuration);
      storage.setItem('veo_main_clipDuration', String(data.clipDuration));
    }
    if (data.outputFormat) {
      setOutputFormat(data.outputFormat);
      storage.setItem('veo_main_outputFormat', data.outputFormat);
    }
    setHasAnalyzedCast(data.settings?.characters?.length > 0);

    // 8. Navigation Step
    if (data.currentStep) {
      setCurrentStep(data.currentStep);
    } else if (importedClips.length > 0) {
      setCurrentStep(2);
    }

    setStatus(GenerationStatus.IDLE);
    setIsImportModalOpen(false);
    setShowToast(`Project imported! Loaded ${importedClips.length} prompts.`);
  };

  const startSessionTracking = () => { sessionStartTimeRef.current = Date.now(); };
  
  const updateTimeRemaining = (currentIndex: number, total: number) => {
    if (!sessionStartTimeRef.current || currentIndex === 0) return;
    const elapsed = Date.now() - sessionStartTimeRef.current;
    const timePerClip = elapsed / currentIndex;
    const remaining = total - currentIndex;
    const estTimeMs = timePerClip * remaining;
    const mins = Math.floor(estTimeMs / 60000);
    const secs = Math.floor((estTimeMs % 60000) / 1000);
    setEstTimeRemaining(`${mins}:${secs.toString().padStart(2, '0')}`);
  };

  // Compile Manufacturing Reference handler
  const handleCompileReference = async () => {
    if (!settings.manufacturingJson || !settings.manufacturingJson.trim()) return;
    setCompilerStatus({ state: 'compiling', message: 'Compiling Manufacturing JSON into indexed reference...', referenceIndex: null });
    try {
      const res = await fetch('/api/gemini/compileReference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manufacturingJson: settings.manufacturingJson }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errData.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      const index = data.referenceIndex;
      setCompilerStatus({ state: 'compiled', message: `Compiled successfully — ${index.construction_stages.length} stages, ${index.visual_beats.length} beats, ${index.facility_modules.length} modules`, referenceIndex: index });
      setSettings(prev => ({ ...prev, compiledReference: index }));
      setShowToast('Manufacturing Reference compiled successfully!');
    } catch (e: any) {
      setCompilerStatus({ state: 'error', message: e.message || 'Compilation failed', referenceIndex: null });
    }
  };

  const processScriptQueue = async (startIndex: number, endIndex: number, chunks: string[]) => {
    const BATCH_SIZE = 5;
    // Reset batch context at the start of a full generation
    if (startIndex === 0) {
      batchContextRef.current = {
        previous_prompts_summary: [],
        visual_vocabulary_history: [],
        establishing_shots_registry: [],
        temporal_state: '',
        process_stages_shown: [],
        primary_subjects_used: []
      };
    }

    // Inject compiled reference into settings for this generation session
    const generationSettings: StyleSettings = {
      ...settings,
      compiledReference: compilerStatus.referenceIndex,
      batchContext: batchContextRef.current
    };

    for (let i = startIndex; i < endIndex; i += BATCH_SIZE) {
      if (stopGenerationRef.current) break;
      const batchEnd = Math.min(i + BATCH_SIZE, endIndex);
      setProgress(prev => ({ ...prev, currentStep: `Generating clips ${i + 1} to ${batchEnd} of ${chunks.length}... (Batching for efficiency)` }));
      try {
        const batchChunks = chunks.slice(i, batchEnd);
        // Pass cross-batch context
        const result = await geminiClient.generateClipBatch(
          batchChunks, i + 1, 
          { ...generationSettings, batchContext: batchContextRef.current },
          clipDuration, outputFormat, 'standard',
          batchContextRef.current
        );
        // Update batch context for next iteration
        batchContextRef.current = result.updatedBatchContext;
        
        setClips(prev => {
          const newClips = [...prev];
          for (let j = 0; j < result.clips.length; j++) {
            newClips[i + j] = result.clips[j];
          }
          return newClips;
        });
        setNextClipIndex(batchEnd);
        setProgress(prev => ({ ...prev, current: batchEnd }));
        updateTimeRemaining(batchEnd - startIndex, endIndex - startIndex);
      } catch (err: any) {
        setNextClipIndex(i);
        setStatus(GenerationStatus.ERROR);
        setErrorMsg(err.message || "An error occurred during generation.");
        return;
      }
    }
    
    if (!stopGenerationRef.current) {
      if (endIndex === 10 && chunks.length > 10) {
        setStatus(GenerationStatus.WAITING_APPROVAL);
        setProgress(prev => ({ ...prev, currentStep: 'Test batch complete. Waiting for approval.' }));
      } else {
        setStatus(GenerationStatus.IDLE);
        setProgress(prev => ({ ...prev, currentStep: 'Generation complete!' }));
        setShowToast('Generation Complete!');
      }
    }
  };

  const handleAnalyzeCast = async () => {
    if (!script.trim()) return;
    setIsAnalyzingCast(true);
    try {
      const chars = await geminiClient.analyzeTextForCharacters(script, 'standard');
      setSettings(prev => ({ ...prev, characters: [...prev.characters, ...chars] }));
      setHasAnalyzedCast(true);
      setShowToast(`Found ${chars.length} characters!`);
    } catch (err: any) {
      setAlertDialog({ isOpen: true, title: "Analysis Failed", message: err.message });
    } finally {
      setIsAnalyzingCast(false);
    }
  };

  
  const handleAnalyzeScript = async () => {
    if (!script.trim() && !customSplitJson.trim()) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      // Step 1: Split chunks
      let chunks: string[] = [];
      if (customSplitJson.trim()) {
        chunks = parseCustomSplitJsonToChunks(customSplitJson);
        if (chunks.length === 0) throw new Error("Custom JSON array is empty or could not be parsed.");
      } else {
        chunks = await geminiClient.splitScriptToChunks(script, clipDuration, 'standard');
      }
      setScriptChunks(chunks);
      
      const scriptToAnalyze = script.trim() || chunks.join('\n');

      // Step 2: Analyze characters
      const hasManufacturingJson = settings.manufacturingJson && settings.manufacturingJson.trim().length > 0;
      if (!hasAnalyzedCast && !hasManufacturingJson) {
        try {
          const chars = await geminiClient.analyzeTextForCharacters(scriptToAnalyze, 'standard');
          if (chars.length > 0) {
            setSettings(prev => ({ ...prev, characters: [...prev.characters, ...chars] }));
            setHasAnalyzedCast(true);
          }
        } catch (charErr) {
          console.warn("Skipping character analysis due to error:", charErr);
          // Don't block the progression if character analysis fails
        }
      }
      
      setIsAnalysisComplete(true);
    } catch (e: any) {
      setErrorMsg(e.message || "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInitialGenerate = async () => {
    if (!script.trim() && !customSplitJson.trim()) return;
    setStatus(GenerationStatus.PREPARING);
    setErrorMsg(null);
    stopGenerationRef.current = false;
    
    try {
      let chunksToUse = scriptChunks;
      if (chunksToUse.length === 0) {
         if (customSplitJson.trim()) {
           throw new Error("Please run Analyze Script first to parse your Custom JSON.");
         }
         chunksToUse = await geminiClient.splitScriptToChunks(script, clipDuration, 'standard');
         setScriptChunks(chunksToUse);
      }
      setClips([]);
      setNextClipIndex(0);
      setProgress({ current: 0, total: chunksToUse.length, currentStep: 'Initializing generation...' });
      
      startSessionTracking();
      setStatus(GenerationStatus.GENERATING);
      const isTestBatchPhase = chunksToUse.length > 10;
      const targetEnd = isTestBatchPhase ? 10 : chunksToUse.length;
      await processScriptQueue(0, targetEnd, chunksToUse);
    } catch (e: any) {
      setStatus(GenerationStatus.ERROR);
      setErrorMsg(e.message || "Failed to start generation.");
    }
  };

  const handlePause = () => {
    stopGenerationRef.current = true;
    setStatus(GenerationStatus.PAUSED);
    setProgress(prev => ({ ...prev, currentStep: 'Generation Paused.' }));
  };

  const handleResume = async () => {
    setStatus(GenerationStatus.PREPARING);
    stopGenerationRef.current = false;
    startSessionTracking();
    
    let chunksToUse = scriptChunks;
    if (chunksToUse.length === 0) {
      if (customSplitJson.trim()) {
        try {
          let parsed = JSON.parse(customSplitJson);
          if (parsed && typeof parsed === 'object' && Array.isArray(parsed.segments)) parsed = parsed.segments;
          if (Array.isArray(parsed)) {
            chunksToUse = parsed.map((item: any) => {
              if (typeof item === 'string') return item;
              const text = item.text || item.script || item.chunk || item.line || item.content;
              if (!text) return JSON.stringify(item);
              const timestamp = item.timestamp ?? item.start ?? item.time;
              return timestamp !== undefined ? `[${timestamp}] ${text}` : text;
            });
          }
        } catch (e) {}
      } else if (script.trim()) {
        chunksToUse = await geminiClient.splitScriptToChunks(script, clipDuration, 'standard');
      }
      if (chunksToUse.length > 0) {
        setScriptChunks(chunksToUse);
      }
    }

    const startIndex = clips.length;
    const targetEnd = chunksToUse.length > 0 ? chunksToUse.length : metrics.estimatedClipCount;
    setNextClipIndex(startIndex);
    setProgress({ current: startIndex, total: targetEnd, currentStep: `Resuming from Prompt #${startIndex + 1}...` });
    setStatus(GenerationStatus.GENERATING);
    await processScriptQueue(startIndex, targetEnd, chunksToUse);
  };

  const handleRetry = async () => {
    setStatus(GenerationStatus.GENERATING);
    setErrorMsg(null);
    stopGenerationRef.current = false;
    await processScriptQueue(nextClipIndex, scriptChunks.length, scriptChunks);
  };

  const handleApproveAndContinue = async () => {
    setStatus(GenerationStatus.GENERATING);
    stopGenerationRef.current = false;
    startSessionTracking();
    await processScriptQueue(10, scriptChunks.length, scriptChunks);
  };

  const handleRegenerateClip = async (clipId: string, feedback: string) => {
    const originalClip = clips.find(c => c.id === clipId);
    if (!originalClip) return;
    setRegeneratingIds(prev => new Set(prev).add(clipId));
    try {
      const newClip = await geminiClient.regenerateClip(originalClip, settings, feedback, outputFormat, 'standard');
      setClips(prev => prev.map(c => c.id === clipId ? newClip : c));
      setShowToast(`Clip ${originalClip.clipNumber} regenerated!`);
    } catch (e: any) {
      setAlertDialog({ isOpen: true, title: "Regeneration Failed", message: e.message });
    } finally {
      setRegeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(clipId);
        return next;
      });
    }
  };

  const renderMainButton = () => {
    const totalChunks = scriptChunks.length || parsedCustomChunksLength || metrics.estimatedClipCount;
    const isPartiallyComplete = clips.length > 0 && totalChunks > clips.length;

    if (clips.length > 0) {
      return (
        <div className="flex flex-col sm:flex-row gap-3">
          {isPartiallyComplete && status === GenerationStatus.IDLE && (
            <button
              onClick={handleResume}
              className="flex-1 py-4 rounded-lg flex items-center justify-center gap-2 font-bold text-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-900/50 hover:shadow-emerald-700/50 transition-all transform active:scale-95"
            >
              <Play fill="currentColor" size={20} /> CONTINUE FROM PROMPT #{clips.length + 1} OF {totalChunks}
            </button>
          )}

          <button
            onClick={handleInitialGenerate}
            className={`py-4 px-6 rounded-lg flex items-center justify-center gap-2 font-bold text-lg text-white shadow-xl transition-all transform active:scale-95 ${
              isPartiallyComplete && status === GenerationStatus.IDLE 
                ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' 
                : 'flex-1 bg-red-600 hover:bg-red-500 shadow-red-900/50'
            }`}
          >
            {status === GenerationStatus.GENERATING ? (
              <><Loader2 className="animate-spin" size={20} /> GENERATING...</>
            ) : status === GenerationStatus.ERROR ? (
              <><RotateCcw size={20} /> RETRY GENERATION</>
            ) : status === GenerationStatus.PAUSED ? (
              <><Play size={20} /> RESUME GENERATION</>
            ) : isPartiallyComplete ? (
              <><RotateCcw size={18} /> RESTART FROM #1</>
            ) : (
              <><RotateCcw size={20} /> REGENERATE ALL</>
            )}
          </button>
          
          {status === GenerationStatus.GENERATING && (
            <button
              onClick={handlePause}
              className="py-4 px-6 rounded-lg flex items-center justify-center gap-2 font-bold text-lg bg-yellow-600 hover:bg-yellow-500 text-white shadow-xl transition-all"
            >
              <Pause size={20} /> PAUSE
            </button>
          )}
          {status === GenerationStatus.PAUSED && (
            <button
              onClick={handleResume}
              className="py-4 px-6 rounded-lg flex items-center justify-center gap-2 font-bold text-lg bg-green-600 hover:bg-green-500 text-white shadow-xl transition-all"
            >
              <Play fill="currentColor" size={20} /> RESUME
            </button>
          )}
        </div>
      );
    }

    return (
      <button
        onClick={handleInitialGenerate}
        disabled={status === GenerationStatus.GENERATING || status === GenerationStatus.PREPARING}
        className="w-full py-4 rounded-lg flex items-center justify-center gap-2 font-bold text-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-gray-300 text-white shadow-xl shadow-blue-900/50 hover:shadow-blue-700/50 transition-all transform active:scale-[0.98]"
      >
        {status === GenerationStatus.GENERATING || status === GenerationStatus.PREPARING ? (
          <><Loader2 className="animate-spin" size={20} /> GENERATING...</>
        ) : (
          <><Play fill="currentColor" size={20} /> GENERATE DIRECTOR CARDS</>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-200 pb-20 relative">
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
      
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/50">
              <Video className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Veo Script<span className="text-blue-500">2</span>Prompt</h1>
              <p className="text-xs text-blue-400 font-medium">ELITE EDITION 2.0</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] border border-gray-700 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
            >
              <Upload size={16} /> Import
            </button>
            <button
              onClick={handleExportProject}
              className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] border border-gray-700 rounded-lg text-sm font-bold transition-all flex items-center gap-2 text-blue-400"
            >
              <Download size={16} /> Export Project
            </button>
            <button
              onClick={handleClearProject}
              className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
            >
              <RotateCcw size={16} /> Clear
            </button>
          </div>
        </div>
        
        {/* Step Indicator */}
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-800 -z-10 transform -translate-y-1/2" />
            {[
              { num: 1 as const, label: 'Analyze Script' },
  { num: 2 as const, label: 'Generated Prompts' }
            ].map(step => (
              <button
                key={step.num}
                disabled={step.num > currentStep && !(step.num === 2 && (script.trim().length > 0 || customSplitJson.trim().length > 0)) }
                onClick={() => setCurrentStep(step.num)}
                className={`flex flex-col items-center gap-2 ${step.num > currentStep && !(step.num === 2 && (script.trim().length > 0 || customSplitJson.trim().length > 0))  ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                  currentStep === step.num ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 ring-4 ring-blue-900/30' :
                  step.num < currentStep || (step.num === 2 && clips.length > 0) ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}>
                  {step.num < currentStep || (step.num === 2 && clips.length > 0) ? <Check size={20} /> : step.num}
                </div>
                <span className={`text-sm font-bold ${currentStep === step.num ? 'text-blue-400' : step.num < currentStep || (step.num === 2 && clips.length > 0) ? 'text-green-400' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        
        {/* Token Optimization HUD Badge */}
        <TokenOptimizationHUD 
          manufacturingJson={settings.manufacturingJson} 
          compiledReference={compilerStatus.referenceIndex} 
          clipCount={scriptChunks.length || clips.length || metrics.estimatedClipCount} 
          className="mb-6" 
        />

        {/* STEP 1: ANALYZE */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#1e293b] rounded-xl p-6 shadow-xl border border-gray-800">
                  <div className="flex border-b border-gray-700 mb-6">
                    <button
                      onClick={() => setViewTab('script')}
                      className={`px-6 py-3 font-bold text-sm flex items-center gap-2 transition-all ${
                        viewTab === 'script' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <Video size={16} /> VIDEO SCRIPT
                    </button>
                    <button
                      onClick={() => setViewTab('characters')}
                      className={`px-6 py-3 font-bold text-sm flex items-center gap-2 transition-all ${
                        viewTab === 'characters' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <Users size={16} /> CHARACTER CONSISTENCY
                    </button>
                    <button
                      onClick={() => setViewTab('continuity')}
                      className={`px-6 py-3 font-bold text-sm flex items-center gap-2 transition-all ${
                        viewTab === 'continuity' ? 'border-b-2 border-teal-500 text-teal-400' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <Database size={16} /> CONTINUITY
                    </button>
                    <button
                      onClick={() => setViewTab('manufacturing')}
                      className={`pb-2 px-1 text-sm font-medium transition-colors ${
                        viewTab === 'manufacturing' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      Manufacturing JSON
                    </button>


                  </div>
                  
                  {viewTab === 'script' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium px-2 py-1 bg-gray-800 rounded text-gray-400">
                          {wordCount} words
                        </span>
                      </div>
                      <textarea
                        value={script}
                        onChange={(e) => setScript(e.target.value)}
                        placeholder="Paste your video script or voiceover here..."
                        className="w-full h-96 bg-[#0f172a] border border-gray-700 rounded-lg p-4 text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
                      />
                    </div>
                  )}
                  
                  {viewTab === 'script' && (
                    <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                          <FileJson size={16} className="text-purple-400" /> Pre-split JSON (Overrides Automatic Splitting)
                        </label>
                      </div>
                      <textarea
                        value={customSplitJson}
                        onChange={(e) => setCustomSplitJson(e.target.value)}
                        placeholder={'[{ "timestamp": "00:00", "text": "Script line 1" }, ...]'}
                        className="w-full h-32 bg-[#0f172a] border border-gray-700 rounded-lg p-4 text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none font-mono text-sm leading-relaxed"
                      />
                    </div>
                  )}

                  {viewTab === 'characters' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="flex justify-between items-center bg-[#0f172a] p-4 rounded-lg border border-purple-900/30">
                        <div>
                          <h3 className="font-bold text-purple-400 flex items-center gap-2">
                            <UserCheck size={18} /> Cast Analysis
                          </h3>
                          <p className="text-sm text-gray-400 mt-1">Automatically extract characters from your video script to maintain consistency.</p>
                        </div>
                        <button
                          onClick={handleAnalyzeCast}
                          disabled={isAnalyzingCast || !script.trim() || status !== GenerationStatus.IDLE}
                          className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg transition-all flex items-center gap-2"
                        >
                          {isAnalyzingCast ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : <><Search size={16} /> Extract Cast</>}
                        </button>
                      </div>
                      <CharacterEngine settings={settings} setSettings={setSettings} disabled={status !== GenerationStatus.IDLE} script={script} mode="standard" />
                    </div>
                  )}

                  {viewTab === 'continuity' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <ContinuityEngine settings={settings} setSettings={setSettings} disabled={status !== GenerationStatus.IDLE} script={script} />
                    </div>
                  )}
                  
                  {viewTab === 'manufacturing' && (
                    <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                          <FileJson size={16} className="text-orange-400" /> Manufacturing JSON (Overrides everything else)
                        </label>
                      </div>
                      <textarea
                        value={settings.manufacturingJson || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, manufacturingJson: e.target.value }))}
                        placeholder="Paste your Manufacturing JSON here..."
                        className="w-full h-[400px] bg-[#0f172a] border border-gray-700 rounded-lg p-4 text-gray-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none font-mono text-sm leading-relaxed"
                      />

                      {/* COMPILE REFERENCE BUTTON & STATUS */}
                      {settings.manufacturingJson && settings.manufacturingJson.trim().length > 0 && (
                        <div className="bg-[#0f172a] border border-gray-700 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Database size={16} className="text-orange-400" />
                              <span className="text-sm font-bold text-gray-200">Manufacturing Reference Compiler</span>
                            </div>
                            <button
                              onClick={handleCompileReference}
                              disabled={compilerStatus.state === 'compiling'}
                              className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
                                compilerStatus.state === 'compiling'
                                  ? 'bg-orange-900/30 text-orange-300 cursor-wait'
                                  : compilerStatus.state === 'compiled'
                                    ? 'bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-800'
                                    : compilerStatus.state === 'stale'
                                      ? 'bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400 border border-yellow-800'
                                      : 'bg-orange-600 hover:bg-orange-500 text-white'
                              }`}
                            >
                              {compilerStatus.state === 'compiling' ? (
                                <><Loader2 size={14} className="animate-spin" /> Compiling...</>
                              ) : compilerStatus.state === 'compiled' ? (
                                <><CheckCircle size={14} /> Recompile</>
                              ) : compilerStatus.state === 'stale' ? (
                                <><AlertCircle size={14} /> Recompile (Stale)</>
                              ) : (
                                <><Database size={14} /> Compile Reference</>
                              )}
                            </button>
                          </div>

                          {/* Status Message */}
                          {compilerStatus.message && (
                            <div className={`text-xs px-3 py-2 rounded-lg ${
                              compilerStatus.state === 'error' ? 'bg-red-900/20 text-red-400 border border-red-900/50' :
                              compilerStatus.state === 'stale' ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-900/50' :
                              compilerStatus.state === 'compiled' ? 'bg-green-900/20 text-green-400 border border-green-900/50' :
                              'bg-gray-800 text-gray-400'
                            }`}>
                              {compilerStatus.state === 'compiled' && <CheckCircle size={12} className="inline mr-1" />}
                              {compilerStatus.state === 'error' && <AlertCircle size={12} className="inline mr-1" />}
                              {compilerStatus.state === 'stale' && <AlertCircle size={12} className="inline mr-1" />}
                              {compilerStatus.message}
                            </div>
                          )}

                          {/* Compiled Reference Summary */}
                          {compilerStatus.state === 'compiled' && compilerStatus.referenceIndex && (
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                                <div className="text-orange-400 font-bold text-lg">{compilerStatus.referenceIndex.construction_stages.length}</div>
                                <div className="text-gray-500">Stages</div>
                              </div>
                              <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                                <div className="text-orange-400 font-bold text-lg">{compilerStatus.referenceIndex.visual_beats.length}</div>
                                <div className="text-gray-500">Beats</div>
                              </div>
                              <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                                <div className="text-orange-400 font-bold text-lg">{compilerStatus.referenceIndex.facility_modules.length}</div>
                                <div className="text-gray-500">Modules</div>
                              </div>
                              <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                                <div className="text-orange-400 font-bold text-lg">{compilerStatus.referenceIndex.environments.length}</div>
                                <div className="text-gray-500">Environments</div>
                              </div>
                              <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                                <div className="text-orange-400 font-bold text-lg">{Object.keys(compilerStatus.referenceIndex.identity_anchors || {}).length}</div>
                                <div className="text-gray-500">Anchors</div>
                              </div>
                              <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                                <div className="text-orange-400 font-bold text-lg">{compilerStatus.referenceIndex.visual_rules.length}</div>
                                <div className="text-gray-500">Rules</div>
                              </div>
                            </div>
                          )}

                          <p className="text-xs text-gray-500">
                            The compiler transforms your Manufacturing JSON into an indexed reference. Each prompt receives only the relevant scene packet instead of the entire JSON.
                          </p>
                        </div>
                      )}
                    </div>
                  )}


                </div>
                <StyleEngine settings={settings} setSettings={setSettings} disabled={status !== GenerationStatus.IDLE} />
              </div>

              <div className="space-y-6">
                <div className="bg-[#1e293b] rounded-xl p-6 shadow-xl border border-gray-800">
                  <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                    <Settings className="text-gray-400" /> Output Settings
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-400 mb-3">Clip Duration</label>
                      <div className="grid grid-cols-3 gap-2">
                        {CLIP_DURATIONS.map(dur => (
                          <button
                            key={dur}
                            onClick={() => setClipDuration(dur)}
                            className={`py-2 px-2 rounded-lg font-bold text-sm transition-all border ${
                              clipDuration === dur ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[#0f172a] border-gray-700 text-gray-500 hover:border-gray-500'
                            }`}
                          >
                            {dur}s
                          </button>
                        ))}
                        <input 
                           type="number"
                           value={clipDuration}
                           onChange={(e) => setClipDuration(Number(e.target.value) || 5)}
                           className="flex-1 min-w-0 bg-[#0f172a] border border-gray-700 rounded-lg px-2 text-center font-bold text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
                           min="1"
                           max="60"
                           title="Custom Seconds"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-400 mb-3">Prompt Format</label>
                      <select
                        value={outputFormat}
                        onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-gray-200 focus:outline-none focus:border-blue-500 font-medium"
                      >
                        <option value="standard">Standard (Descriptive)</option>
                        <option value="json">Detailed JSON (Director Brain)</option>
                      </select>
                    </div>

                  </div>
                </div>

                

                <div className="bg-gradient-to-br from-blue-900/40 to-[#1e293b] rounded-xl p-6 shadow-xl border border-blue-500/30">
                  <h3 className="font-bold text-lg mb-4 text-white">Analysis Summary</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className={(script.trim() || customSplitJson.trim()) ? "text-green-500" : "text-gray-600"} size={16} />
                      <span className={(script.trim() || customSplitJson.trim()) ? "text-gray-200" : "text-gray-500"}>Script/JSON Loaded ({wordCount} words)</span>
                    </div>
                    {settings.worldBuildingJson && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="text-green-500" size={16} />
                        <span className="text-gray-200">World JSON Loaded</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className={metrics.estimatedClipCount > 0 ? "text-green-500" : "text-gray-600"} size={16} />
                      <span className={metrics.estimatedClipCount > 0 ? "text-gray-200" : "text-gray-500"}>Est. Clips: {metrics.estimatedClipCount}</span>
                    </div>
                    {false && settings.characters.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="text-green-500" size={16} />
                        <span className="text-gray-200">{settings.characters.length} Characters Analyzed</span>
                      </div>
                    )}
                  </div>
                  
                  {!isAnalysisComplete ? (
                    (settings.manufacturingJson && settings.manufacturingJson.trim().length > 0) ? (
                      <button
                        onClick={async () => {
                          await handleAnalyzeScript();
                          setCurrentStep(2);
                        }}
                        disabled={(!script.trim() && !customSplitJson.trim()) || isAnalyzing}
                        className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/30"
                      >
                        {isAnalyzing ? <><Loader2 size={18} className="animate-spin" /> Preparing...</> : "Parse JSON & Move to Step 2"}
                      </button>
                    ) : (
                      <button
                        onClick={handleAnalyzeScript}
                        disabled={(!script.trim() && !customSplitJson.trim()) || isAnalyzing}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        {isAnalyzing ? <><Loader2 size={18} className="animate-spin" /> Analyzing...</> : "Analyze Script"}
                      </button>
                    )
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-2">
                        <div className="flex items-center gap-2 text-green-400 font-medium text-sm"><CheckCircle size={16}/> Script Loaded</div>
                        {settings.worldBuildingJson && <div className="flex items-center gap-2 text-green-400 font-medium text-sm"><CheckCircle size={16}/> World JSON Loaded</div>}
                        <div className="flex items-center gap-2 text-green-400 font-medium text-sm"><CheckCircle size={16}/> Estimated Duration: ~{metrics.estimatedDurationMinutes * 60}s</div>
                        <div className="flex items-center gap-2 text-green-400 font-medium text-sm"><CheckCircle size={16}/> Estimated Clips: {metrics.estimatedClipCount}</div>
                        {settings.characters.length > 0 && <div className="flex items-center gap-2 text-green-400 font-medium text-sm"><CheckCircle size={16}/> {settings.characters.length} Creatures Detected</div>}
                        <div className="flex items-center gap-2 text-green-400 font-medium text-sm"><CheckCircle size={16}/> Director Planning Complete</div>
                      </div>
                      {/* Preview Resolved Scene Packets in Step 1 if compiledReference exists */}
                      {compilerStatus.referenceIndex && scriptChunks.length > 0 && (
                        <div className="mt-4 space-y-2 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Database size={13} className="text-blue-400" />
                              Resolved Scene Packets ({scriptChunks.length})
                            </span>
                            <span className="text-[10px] text-green-400 font-mono">
                              ✓ Auto-Mapped to Manufacturing Beats
                            </span>
                          </div>
                          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {scriptChunks.map((chunk, idx) => {
                              const beat = manufacturingCompiler.matchChunkToBeat(chunk, compilerStatus.referenceIndex!.visual_beats);
                              const stageId = beat?.stage_id || compilerStatus.referenceIndex!.construction_stages[0]?.reference_id || 'STAGE_01';
                              const packet = beat ? manufacturingCompiler.resolveScenePacket(compilerStatus.referenceIndex!, stageId, beat.reference_id, `SCENE_${idx + 1}`) : null;
                              return (
                                <ScenePacketInspector 
                                  key={idx} 
                                  packet={packet} 
                                  clipNumber={idx + 1} 
                                  className="text-left" 
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {clips.length > 0 && clips.length < (scriptChunks.length || metrics.estimatedClipCount) ? (
                        <div className="space-y-3 pt-2">
                          <button
                            onClick={() => {
                              setCurrentStep(2);
                              handleResume();
                            }}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-900/40 transform hover:scale-[1.01]"
                          >
                            <Play size={18} fill="currentColor" /> Continue from Prompt #{clips.length + 1} of {scriptChunks.length || metrics.estimatedClipCount}
                          </button>
                          <button
                            onClick={() => setCurrentStep(2)}
                            className="w-full py-2.5 bg-[#1e293b] hover:bg-[#334155] text-gray-300 hover:text-white border border-gray-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                          >
                            View {clips.length} Completed Prompts <ArrowRight size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setCurrentStep(2);
                            if (clips.length === 0 && status === GenerationStatus.IDLE) {
                              handleInitialGenerate();
                            }
                          }}
                          className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/30"
                        >
                          {clips.length > 0 ? `View ${clips.length} Generated Prompts` : "Generate Production Prompts"} <ArrowRight size={18} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: GENERATED PROMPTS */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] border border-gray-700 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
              >
                <ArrowLeft size={16} /> Back to Analyze Script
              </button>
              {clips.length > 0 && (
                <button
                  onClick={handleClearPrompts}
                  className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                >
                  <RotateCcw size={16} /> Delete All Prompts
                </button>
              )}
            </div>

            
            <div className={`border rounded-xl p-6 shadow-lg transition-all duration-300 ${status === GenerationStatus.ERROR ? 'bg-red-900/10 border-red-800' : 'bg-[#1e293b] border-gray-700'}`}>
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {status === GenerationStatus.GENERATING && <Loader2 className="animate-spin text-blue-400" size={16} />}
                        {status === GenerationStatus.ERROR && <AlertCircle className="text-red-500" size={16} />}
                        <span className={`text-sm font-bold ${status === GenerationStatus.ERROR ? 'text-red-400' : 'text-blue-300'}`}>
                          {status === GenerationStatus.ERROR ? "Generation Interrupted" : (progress.currentStep || (clips.length > 0 ? "Reviewing Prompts" : "Ready to generate"))}
                        </span>
                      </div>
                      {status === GenerationStatus.GENERATING && (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                           <Clock size={12} />
                           <span>Est. Remaining: <span className="text-white font-mono">{estTimeRemaining}</span></span>
                        </div>
                      )}
                    </div>
                    {clips.length > 0 && (
                      <span className="text-xs text-gray-500 font-mono">
                        {Math.round((clips.length / (progress.total || 1)) * 100)}% ({clips.length}/{progress.total || metrics.estimatedClipCount})
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-700">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 relative overflow-hidden ${
                        status === GenerationStatus.ERROR ? 'bg-red-500' : 
                        status === GenerationStatus.PAUSED ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${Math.max(2, (clips.length / (progress.total || Math.max(1, metrics.estimatedClipCount))) * 100)}%` }}
                    >
                      {status === GenerationStatus.GENERATING && (
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] -skew-x-12" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className={`mt-4 p-4 rounded-lg text-sm flex items-start gap-3 border ${
                  errorMsg.toLowerCase().includes('quota') || errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')
                    ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                    : 'bg-red-900/30 border-red-800 text-red-200'
                }`}>
                  <AlertCircle className={`shrink-0 mt-0.5 ${
                    errorMsg.toLowerCase().includes('quota') || errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')
                      ? 'text-amber-400'
                      : 'text-red-500'
                  }`} size={18} />
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {errorMsg.toLowerCase().includes('quota') || errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')
                        ? 'Google Account API Quota Reached'
                        : 'Generation Error'}
                    </p>
                    <p className="text-xs opacity-90">{errorMsg}</p>
                    {clips.length > 0 && (
                      <p className="text-xs text-emerald-400 pt-1 font-medium">
                        ✓ All {clips.length} generated prompts are safely saved. You can retry shortly or resume from prompt #{clips.length + 1}.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <div className="w-full md:w-1/2 lg:w-1/3">
                  {/* We need the renderGenerationControls() here. It requires calling it if we can. Wait, it's a function. */}
                  
                  {status === GenerationStatus.GENERATING || status === GenerationStatus.PREPARING ? (
                    <button
                      onClick={handlePause}
                      className="w-full py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Pause size={16} /> Pause Generation
                    </button>
                  ) : status === GenerationStatus.PAUSED ? (
                    <button
                      onClick={handleResume}
                      className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Play size={16} fill="currentColor" /> Resume Generation
                    </button>
                  ) : status === GenerationStatus.ERROR ? (
                    <button
                      onClick={handleRetry}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <RotateCcw size={16} /> Retry Failed Clip
                    </button>
                  ) : (clips.length > 0 && (scriptChunks.length > clips.length || (scriptChunks.length === 0 && metrics.estimatedClipCount > clips.length))) ? (
                    <button
                      onClick={handleResume}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transform hover:scale-[1.02]"
                    >
                      <Play size={16} fill="currentColor" /> Continue from Prompt #{clips.length + 1} of {scriptChunks.length || metrics.estimatedClipCount}
                    </button>
                  ) : null}

                </div>
              </div>
            </div>

            {status === GenerationStatus.WAITING_APPROVAL && (
              <div className="sticky bottom-6 z-20">
                <div className="bg-[#1e293b] border border-blue-500/50 p-4 rounded-xl shadow-2xl shadow-black/50 flex flex-col items-center gap-3 backdrop-blur-sm">
                  <div className="text-center">
                    <h3 className="text-white font-bold text-lg">Test Batch Prompts Ready</h3>
                    <p className="text-gray-400 text-sm">Review the first 10 prompts. If satisfied, continue generating the rest.</p>
                  </div>
                  <button 
                    onClick={handleApproveAndContinue}
                    className="w-full md:w-auto px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg shadow-green-900/50 flex items-center justify-center gap-2 transition-all transform hover:scale-105"
                  >
                    <CheckCircle size={20} /> GENERATE REMAINING {scriptChunks.length > 0 ? scriptChunks.length - 10 : '?'} CARDS
                  </button>
                </div>
              </div>
            )}


            <ExportActions clips={clips} settings={settings} />

            {clips.length === 0 ? (
               <div className="h-[400px] flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-gray-800 rounded-xl bg-[#1e293b]/50 gap-4">
                 <p className="text-lg font-medium text-gray-400">Ready to generate.</p>
                 <div className="flex items-center gap-4 mt-2">
                   <button
                     onClick={handleInitialGenerate}
                     className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg"
                   >
                     Start Generation
                   </button>
                   <button
                     onClick={() => setCurrentStep(1)}
                     className="px-4 py-3 bg-[#1e293b] hover:bg-[#334155] border border-gray-700 text-white rounded-lg text-sm font-bold flex items-center gap-2"
                   >
                     <ArrowLeft size={16} /> Back
                   </button>
                 </div>
               </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {clips.map((clip) => (
                  <PromptCard 
                    key={clip.id} 
                    clip={clip} 
                    settings={settings}
                    onRegenerate={handleRegenerateClip}
                    isRegenerating={regeneratingIds.has(clip.id)}
                    mode="prompt"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals & Dialogs */}
      {isImportModalOpen && (
        <ProjectImportModal 
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportProject}
        />
      )}

      {isClearDialogOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] rounded-xl p-6 border border-gray-700 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-2">Clear Project?</h3>
            <p className="text-gray-400 text-sm mb-6">
              This will delete all script data, settings, and generated clips. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsClearDialogOpen(false)}
                className="px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmClearProject}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg shadow-red-900/20 transition-colors"
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {alertDialog.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] rounded-xl p-6 border border-gray-700 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="text-red-500" size={24} />
              <h3 className="text-xl font-bold text-white">{alertDialog.title}</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6 mt-2">{alertDialog.message}</p>
            <div className="flex justify-end">
              <button 
                onClick={() => setAlertDialog({ isOpen: false, title: '', message: '' })}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 transform ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
        <div className="bg-[#334155] border border-gray-600 text-white px-6 py-3 rounded-lg shadow-2xl shadow-black/50 flex items-center gap-3">
          <CheckCircle className="text-green-400" size={20} />
          <span className="font-medium">{showToast}</span>
        </div>
      </div>
    </div>
  );
};

export default App;
