
import React, { useRef, useState, useEffect } from 'react';
import { StyleSettings } from '../types';
import { 
  VISUAL_STYLES, 
  LIGHTING_OPTIONS, 
  MOOD_OPTIONS, 
  CAMERA_STYLES, 
  CAMERA_MOVEMENTS 
} from '../constants';
import { Palette, Zap, Film, Camera, Video, Upload, Sparkles, Loader, X, AlertCircle, Edit3, FileJson, ToggleLeft, ToggleRight } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { StyleSelector, PresetManager } from './StyleControls';

interface StyleEngineProps {
  settings: StyleSettings;
  setSettings: React.Dispatch<React.SetStateAction<StyleSettings>>;
  disabled: boolean;
}

// ----------------------------------------------------------------------
// MAIN STYLE ENGINE COMPONENT
// ----------------------------------------------------------------------

export const StyleEngine: React.FC<StyleEngineProps> = ({ settings, setSettings, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  
  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [videoPreview]);

  const handleChange = (key: keyof StyleSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleColorChange = (key: 'primary' | 'secondary' | 'accent', value: string) => {
    setSettings(prev => ({
      ...prev,
      colorPalette: { ...prev.colorPalette, [key]: value }
    }));
  };

  const clearVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setError("File size exceeds 100MB limit. Please upload a smaller video clip.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const supportedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/mpeg', 'video/x-matroska'];
    if (!supportedTypes.includes(file.type)) {
      setError("Unsupported file format. Please use MP4, MOV, WEBM, or MPEG.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoPreview(url);

    setAnalyzing(true);
    const reader = new FileReader();
    
    reader.onloadend = async () => {
      try {
        const result = reader.result;
        if (!result) throw new Error("Failed to read file data.");
        
        const base64String = result.toString().split(',')[1];
        if (base64String) {
          const newStyles = await geminiService.analyzeVideoStyle(base64String, file.type);
          setSettings(prev => ({ ...prev, ...newStyles }));
        }
      } catch (err: any) {
        console.error("Analysis failed", err);
        let errorMessage = "Failed to analyze video style.";
        const msg = err.message || '';

        if (msg.includes('400')) errorMessage = "Invalid Request (400): The AI model rejected the video format.";
        else if (msg.includes('413')) errorMessage = "Payload Too Large (413): The video file is too heavy.";
        else if (msg.includes('429')) errorMessage = "Rate Limit Exceeded (429): System is busy.";
        else if (msg.includes('safety')) errorMessage = "Safety Filter: Video content flagged.";
        else if (msg.includes('No analysis result')) errorMessage = "Analysis Failed: No data returned.";

        setError(errorMessage);
        if (videoPreview) URL.revokeObjectURL(videoPreview);
        setVideoPreview(null);
      } finally {
        setAnalyzing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setAnalyzing(false);
      setError("Browser Error: Failed to read file.");
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsDataURL(file);
  };

  const handleJsonImport = () => {
    setJsonError(null);
    if (!jsonInput.trim()) return;
    try {
      const parsed = JSON.parse(jsonInput);
      const mapped: any = { ...parsed };
      
      if (parsed.visual_style) mapped.visualStyle = parsed.visual_style;
      if (parsed.mood_and_tone) mapped.mood = parsed.mood_and_tone;
      if (parsed.lighting_style) mapped.lighting = parsed.lighting_style;
      if (parsed.camera_style) mapped.cameraStyle = parsed.camera_style;
      if (parsed.camera_movement) mapped.cameraMovement = parsed.camera_movement;
      if (parsed.art_direction_keywords) mapped.artKeywords = parsed.art_direction_keywords;
      // also if color_palette_hex or color_palette_full, try to map it?
      // it's okay to let them be extra configs.

      setSettings(prev => ({ ...prev, ...mapped }));
      setIsJsonModalOpen(false);
      setJsonInput('');
    } catch (e) {
      setJsonError("Invalid JSON format. Please check your syntax.");
    }
  };

  return (
    <div className="bg-[#1a202c] border border-gray-700 rounded-xl mb-6 shadow-lg relative overflow-hidden flex flex-col">
      {/* JSON Import Modal */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e293b] border border-gray-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileJson size={20} className="text-blue-400" /> Import Style JSON
              </h3>
              <button onClick={() => setIsJsonModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='Paste JSON here...'
                className="w-full h-64 bg-[#0f172a] border border-gray-600 rounded-lg p-4 font-mono text-xs text-green-400 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
              />
              {jsonError && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2 text-red-200 text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  <p>{jsonError}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-700 bg-[#1a202c] rounded-b-xl flex justify-end gap-3">
              <button 
                onClick={() => setIsJsonModalOpen(false)}
                className="px-4 py-2 text-gray-300 hover:text-white font-medium text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleJsonImport}
                disabled={!jsonInput.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {analyzing && (
        <div className="absolute inset-0 z-50 bg-[#1a202c]/90 flex flex-col items-center justify-center backdrop-blur-sm">
           <Loader className="animate-spin text-blue-500 w-10 h-10 mb-4" />
           <p className="text-blue-300 font-medium animate-pulse">Analyzing visual style...</p>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-700 bg-[#0f172a] px-6 py-4 flex items-center gap-2 text-blue-400">
        <Palette size={18} />
        <h2 className="font-bold text-sm tracking-wide">VISUAL STYLE ENGINE</h2>
      </div>

      <div className="p-6 animate-in fade-in duration-300">
        {/* Auto-Fill Header */}
        <div className="flex flex-col gap-4 mb-6 border-b border-gray-700 pb-4">
          
          {/* Preset Toolbar */}
          <div className="flex items-center gap-4 bg-[#1e293b] p-3 rounded-lg border border-gray-600 mb-2">
            <span className="text-xs font-bold uppercase text-gray-400 whitespace-nowrap hidden sm:block">Global Presets:</span>
            <PresetManager 
              disabled={disabled}
              currentData={Object.fromEntries(Object.entries(settings).filter(([k]) => !['characters', 'isConsistencyEnabled'].includes(k)))}
              onLoad={(data) => setSettings(prev => ({ ...prev, ...data }))}
            />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
            <div className="space-y-1 max-w-lg">
              <h3 className="text-sm font-bold text-gray-200">Reference Video (Upload .mp4/mov) or JSON</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                💡 Pro Tip: For YouTube videos, screen-record the specific scene you want to mimic and upload that clip here. Or import a JSON style definition.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button 
                onClick={() => setIsJsonModalOpen(true)}
                disabled={disabled}
                className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] hover:bg-gray-700 text-gray-200 border border-gray-600 rounded-lg text-sm font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileJson size={16} />
                Import JSON
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleVideoUpload}
                accept="video/mp4,video/quicktime,video/webm" 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || analyzing}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? <Sparkles className="animate-spin" size={16} /> : <Upload size={16} />}
                Auto-Fill from Video
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-200 p-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {videoPreview && !error && (
            <div className="relative w-full md:w-1/3 aspect-video bg-black rounded-lg overflow-hidden border border-gray-600 mx-auto md:mx-0">
              <video src={videoPreview} className="w-full h-full object-contain" controls playsInline />
              <button 
                onClick={clearVideo}
                className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-600 rounded-full text-white transition-colors"
                title="Remove video"
              >
                <X size={14} />
              </button>
              {!analyzing && (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-green-400 flex items-center gap-1">
                  <CheckIcon /> Style Analyzed
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StyleSelector label="Visual Style" icon={<Palette size={14} className="text-blue-500" />} value={settings.visualStyle} options={VISUAL_STYLES} onChange={(val) => handleChange('visualStyle', val)} disabled={disabled} />
          <StyleSelector label="Mood & Tone" icon={<Film size={14} className="text-purple-500" />} value={settings.mood} options={MOOD_OPTIONS} onChange={(val) => handleChange('mood', val)} disabled={disabled} />
          <StyleSelector label="Lighting Style" icon={<Zap size={14} className="text-yellow-500" />} value={settings.lighting} options={LIGHTING_OPTIONS} onChange={(val) => handleChange('lighting', val)} disabled={disabled} />
          <StyleSelector label="Camera Style" icon={<Camera size={14} className="text-green-500" />} value={settings.cameraStyle} options={CAMERA_STYLES} onChange={(val) => handleChange('cameraStyle', val)} disabled={disabled} />
          <StyleSelector label="Camera Movement" icon={<Video size={14} className="text-red-500" />} value={settings.cameraMovement} options={CAMERA_MOVEMENTS} onChange={(val) => handleChange('cameraMovement', val)} disabled={disabled} />
          
          <div className="space-y-2">
             <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400">Color Palette (Hex)</label>
             <div className="grid grid-cols-3 gap-2">
                <input type="text" placeholder="#Pri" value={settings.colorPalette?.primary || ''} onChange={(e) => handleColorChange('primary', e.target.value)} className="bg-[#0e1117] border border-gray-600 text-xs text-white rounded p-2 text-center" />
                <input type="text" placeholder="#Sec" value={settings.colorPalette?.secondary || ''} onChange={(e) => handleColorChange('secondary', e.target.value)} className="bg-[#0e1117] border border-gray-600 text-xs text-white rounded p-2 text-center" />
                <input type="text" placeholder="#Acc" value={settings.colorPalette?.accent || ''} onChange={(e) => handleColorChange('accent', e.target.value)} className="bg-[#0e1117] border border-gray-600 text-xs text-white rounded p-2 text-center" />
             </div>
          </div>

          <div className="md:col-span-2 lg:col-span-3 space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400">Art Direction Keywords</label>
            <div className="relative">
               <input type="text" value={settings.artKeywords} onChange={(e) => handleChange('artKeywords', e.target.value)} placeholder="e.g. clean, minimal, 4K, bokeh, volumetric fog" disabled={disabled} className="w-full bg-[#0e1117] border border-gray-600 text-gray-200 rounded-lg p-2.5 pl-9 focus:border-blue-500 outline-none" />
               <div className="absolute left-3 top-3 text-gray-500"><Edit3 size={14} /></div>
            </div>
          </div>

          {/* Establishing Hook Section */}
          <div className="md:col-span-2 lg:col-span-3 mt-4 border border-indigo-500/30 bg-indigo-900/10 p-4 rounded-lg">
             <div className="flex items-center justify-between">
                <div className="space-y-1">
                   <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                     🎬 Establishing Hook
                   </h3>
                   <p className="text-xs text-gray-400">
                     Forces the first 5-7 shots to follow a cinematic hook structure emphasizing visual storytelling without relying on audio.
                   </p>
                </div>
                <button 
                  onClick={() => handleChange('useEstablishingHook', !settings.useEstablishingHook)}
                  disabled={disabled}
                  className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold transition-all border ${
                    settings.useEstablishingHook 
                    ? 'bg-indigo-900/50 text-indigo-200 border-indigo-500' 
                    : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}
                >
                  {settings.useEstablishingHook ? <ToggleRight size={20} className="text-indigo-400" /> : <ToggleLeft size={20} />}
                  {settings.useEstablishingHook ? "ON" : "OFF"}
                </button>
             </div>
          </div>

          {/* Animation Prompt Generator Section */}
          <div className="md:col-span-2 lg:col-span-3 mt-2 border border-teal-500/30 bg-teal-900/10 p-4 rounded-lg">
             <div className="flex items-center justify-between">
                <div className="space-y-1">
                   <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2">
                     ✨ Image + Animation Prompts
                   </h3>
                   <p className="text-xs text-gray-400">
                     Generates a separate, motion-only animation prompt alongside the main image prompt for every shot.
                   </p>
                </div>
                <button 
                  onClick={() => handleChange(!settings.generateImageAndAnimationPrompts)}
                  disabled={disabled}
                  className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold transition-all border ${
                    settings.generateImageAndAnimationPrompts 
                    ? 'bg-teal-900/50 text-teal-200 border-teal-500' 
                    : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}
                >
                  {settings.generateImageAndAnimationPrompts ? <ToggleRight size={20} className="text-teal-400" /> : <ToggleLeft size={20} />}
                  {settings.generateImageAndAnimationPrompts ? "ON" : "OFF"}
                </button>
             </div>
          </div>

          
          {/* Custom Instructions Section */}
          
             <div className="flex items-center justify-between">
                <div className="space-y-1">
                   <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2">
                     ✨ Image + Animation Prompts
                   </h3>
                   <p className="text-xs text-gray-400">
                     Generates a separate, motion-only animation prompt alongside the main image prompt for every shot.
                   </p>
                </div>
                <button 
                  onClick={() => handleChange('generateImageAndAnimationPrompts', !settings.generateImageAndAnimationPrompts)}
                  disabled={disabled}
                  className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold transition-all border ${
                    settings.generateImageAndAnimationPrompts 
                    ? 'bg-teal-900/50 text-teal-200 border-teal-500' 
                    : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}
                >
                  {settings.generateImageAndAnimationPrompts ? <ToggleRight size={20} className="text-teal-400" /> : <ToggleLeft size={20} />}
                  {settings.generateImageAndAnimationPrompts ? "ON" : "OFF"}
                </button>
             </div>
          </div>
          
          <div className="md:col-span-2 lg:col-span-3 space-y-2 mt-4">
          <div className="md:col-span-2 lg:col-span-3 space-y-2 mt-4">
             <label className="flex items-center gap-2 text-sm font-bold uppercase text-gray-300">
               📝 Custom Instructions
             </label>
             <p className="text-xs text-gray-400">
               Add any specific rules, constraints, or overrides (e.g., "Don't show the narrator in more than 4 scenes", "First 5 prompts must be wide shots"). The AI will follow these strictly.
             </p>
             <textarea
               value={settings.customInstructions || ""}
               onChange={(e) => handleChange("customInstructions", e.target.value)}
               disabled={disabled}
               placeholder="Enter your custom prompt rules here..."
               className="w-full bg-[#1e293b] border border-gray-700 rounded-md p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 min-h-[100px] resize-y"
             />
          </div>

          {/* Dynamic Extra Fields */}
          {Object.keys(settings)
            .filter(key => !['visualStyle', 'colorPalette', 'mood', 'lighting', 'cameraStyle', 'cameraMovement', 'artKeywords', 'characters', 'isConsistencyEnabled', 'useEstablishingHook', 'generateImageAndAnimationPrompts', 'protagonistLock', 'customInstructions'].includes(key))
            .map(key => {
              const value = settings[key];
              const isObject = typeof value === 'object' && value !== null;
              const displayValue = isObject ? JSON.stringify(value, null, 2) : String(value);

              return (
                <div key={key} className="md:col-span-2 lg:col-span-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <button 
                      onClick={() => {
                        const newSettings = { ...settings };
                        delete newSettings[key];
                        setSettings(newSettings);
                      }}
                      className="text-gray-500 hover:text-red-400"
                      title="Remove field"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="relative">
                    {isObject || displayValue.length > 100 ? (
                      <textarea 
                        value={displayValue} 
                        onChange={(e) => {
                          try {
                            const parsed = isObject ? JSON.parse(e.target.value) : e.target.value;
                            handleChange(key, parsed);
                          } catch (err) {
                            // If it's an object but invalid JSON, we might just store the string temporarily or ignore
                            handleChange(key, e.target.value);
                          }
                        }}
                        disabled={disabled} 
                        className="w-full bg-[#0e1117] border border-gray-600 text-gray-200 rounded-lg p-2.5 focus:border-blue-500 outline-none min-h-[100px] font-mono text-xs" 
                      />
                    ) : (
                      <input 
                        type="text" 
                        value={displayValue} 
                        onChange={(e) => handleChange(key, e.target.value)} 
                        disabled={disabled} 
                        className="w-full bg-[#0e1117] border border-gray-600 text-gray-200 rounded-lg p-2.5 focus:border-blue-500 outline-none" 
                      />
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

const CheckIcon = () => (
  <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);
