
import React, { useState } from 'react';
import { StyleSettings, Character } from '../types';
import { geminiService } from '../services/geminiService';
import { Users, ToggleLeft, ToggleRight, Search, Loader, UserPlus, Trash2, User, ImageIcon, Lock, ChevronUp, ChevronDown, Palette, Film, Zap, Camera, Video, AlertTriangle, Download, Upload, X, Shield } from 'lucide-react';
import { StyleSelector, PresetManager } from './StyleControls';
import { VISUAL_STYLES, MOOD_OPTIONS, LIGHTING_OPTIONS, CAMERA_STYLES, CAMERA_MOVEMENTS } from '../constants';

interface CharacterEngineProps {
  settings: StyleSettings;
  setSettings: React.Dispatch<React.SetStateAction<StyleSettings>>;
  disabled: boolean;
  script: string;
  onAnalysisComplete?: () => void;
  analysisInProgress?: boolean;
  mode?: 'standard' | 'creature';
}

// ----------------------------------------------------------------------
// CHARACTER CARD (ADAPTED FOR SIDEBAR)
// ----------------------------------------------------------------------
interface CharacterCardProps {
  character: Character;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  removeCharacter: (id: string) => void;
  onImageUpload: (charId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  analyzingCharId: string | null;
  charError: {id: string, msg: string} | null;
  disabled: boolean;
  consistencyEnabled: boolean;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ 
  character, 
  updateCharacter, 
  removeCharacter, 
  onImageUpload, 
  analyzingCharId, 
  charError,
  disabled,
  consistencyEnabled
}) => {
  const [isStyleExpanded, setIsStyleExpanded] = useState(false);

  return (
    <div className={`border rounded-lg p-3 relative group transition-all ${
      consistencyEnabled 
        ? 'bg-[#0f172a] border-gray-700 hover:border-purple-500/50' 
        : 'bg-[#0f172a]/50 border-gray-800 opacity-60 grayscale-[0.5]'
    }`}>
      <button 
        onClick={() => removeCharacter(character.id)} 
        disabled={disabled}
        className="absolute top-2 right-2 p-1.5 text-gray-600 hover:text-red-400 hover:bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-all z-10"
        title="Remove Character"
      >
        <Trash2 size={14} />
      </button>

      <div className="space-y-3">
        {/* TOP SECTION: Name, Role, Frequency */}
        <div className="space-y-2">
          
          {/* Role Badge */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-purple-900/50 text-purple-200 px-1.5 py-0.5 rounded border border-purple-500/30 uppercase tracking-wider">
               {character.role || "Character"}
            </span>
          </div>

          <div>
            <div className="relative">
              <User size={12} className="absolute left-2.5 top-2.5 text-purple-400" />
              <input 
                type="text" 
                value={character.name}
                onChange={(e) => updateCharacter(character.id, { name: e.target.value })}
                disabled={disabled}
                placeholder="Character Name"
                className="w-full bg-[#1e293b] border border-gray-600 rounded p-1.5 pl-7 text-sm text-white focus:border-purple-500 outline-none font-bold"
              />
            </div>
            <div className="relative mt-2">
              <Shield size={12} className="absolute left-2.5 top-2.5 text-green-400" />
              <input 
                type="text" 
                value={character.alias || ''}
                onChange={(e) => updateCharacter(character.id, { alias: e.target.value })}
                disabled={disabled}
                placeholder="Safe Alias (e.g., fictional name)"
                title="If this is a historical figure, enter a fictional alias to step around filter safety checks."
                className="w-full bg-[#1e293b] border border-green-600/30 border-dashed rounded p-1.5 pl-7 text-xs text-green-200 focus:border-green-500 outline-none"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
             <input 
                type="text" 
                value={character.role || ''}
                onChange={(e) => updateCharacter(character.id, { role: e.target.value })}
                disabled={disabled}
                placeholder="Role (e.g. Hero)"
                className="w-full bg-[#1e293b] border border-gray-600 rounded p-1.5 text-[10px] text-gray-300 outline-none"
             />
             <select 
              value={character.frequency}
              onChange={(e) => updateCharacter(character.id, { frequency: e.target.value as any })}
              disabled={disabled}
              className="w-full bg-[#1e293b] border border-gray-600 rounded p-1.5 text-[10px] text-gray-300 outline-none"
            >
              <option value="Main Protagonist">Main Protagonist</option>
              <option value="Supporting">Supporting Character</option>
              <option value="Occasional">Occasional</option>
            </select>
          </div>

          {/* Character Image Upload */}
          <div>
            <div className="relative group">
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => onImageUpload(character.id, e)}
                disabled={!!analyzingCharId || disabled}
                className="hidden" 
                id={`upload-${character.id}`}
              />
              <label 
                htmlFor={`upload-${character.id}`}
                className={`flex items-center justify-center gap-2 w-full p-1.5 rounded border border-dashed border-gray-600 text-[10px] text-gray-400 hover:text-white hover:border-gray-400 hover:bg-gray-800 cursor-pointer transition-all ${analyzingCharId === character.id ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {analyzingCharId === character.id ? (
                  <>
                    <Loader size={10} className="animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <ImageIcon size={10} /> Auto-Describe from Image
                  </>
                )}
              </label>
              {charError?.id === character.id && (
                <p className="text-[10px] text-red-400 mt-1">{charError.msg}</p>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Description & Style Engine */}
        <div className="space-y-3 pt-1 border-t border-gray-800">
          
          {/* Full Description */}
          <div className="space-y-1 relative">
            <label className="text-[10px] font-bold text-gray-500 uppercase flex justify-between items-center">
              <span>Full Visual Anchor</span>
              <label className="flex items-center gap-1 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={character.isFaceLocked}
                  onChange={(e) => updateCharacter(character.id, { isFaceLocked: e.target.checked })}
                  disabled={disabled}
                  className="accent-purple-500 scale-75"
                />
                <span className={`text-[10px] flex items-center gap-0.5 ${character.isFaceLocked ? 'text-purple-400 font-bold' : 'text-gray-500'}`}>
                  <Lock size={10} /> Face Lock
                </span>
              </label>
            </label>
            <textarea 
              value={character.description}
              onChange={(e) => updateCharacter(character.id, { description: e.target.value })}
              placeholder="e.g. Young woman, 20s, sharp features..."
              disabled={disabled}
              className="w-full h-20 bg-[#1e293b] border border-gray-600 rounded p-2 text-xs text-gray-200 focus:border-purple-500 outline-none resize-none leading-relaxed transition-all"
            />
          </div>

          {/* Short Identifier */}
          <div className="space-y-1 relative">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Short Identifier (Subsequent Mentions)</label>
            <input 
              type="text" 
              value={character.shortDescription || ''}
              onChange={(e) => updateCharacter(character.id, { shortDescription: e.target.value })}
              placeholder="e.g. Wallace (leather armor, dark hair)"
              disabled={disabled}
              className="w-full bg-[#1e293b] border border-gray-600 rounded p-1.5 text-xs text-gray-300 focus:border-purple-500 outline-none"
            />
          </div>

          {/* COLLAPSIBLE: CHARACTER-SPECIFIC STYLE ENGINE */}
          <div className="bg-[#1e293b]/50 border border-gray-700/50 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-2 bg-gray-800/50 hover:bg-gray-800 transition-colors">
               <button 
                onClick={() => setIsStyleExpanded(!isStyleExpanded)}
                className="flex items-center gap-2 text-[10px] font-bold uppercase text-purple-300"
              >
                <Palette size={12} /> Specific Style Overrides
                {isStyleExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
            
            {isStyleExpanded && (
              <div className="p-2 bg-[#0f172a] border-t border-gray-700 animate-in slide-in-from-top-2 space-y-3">
                 {/* Preset Manager (Micro) */}
                <PresetManager 
                  compact 
                  disabled={disabled}
                  currentData={{
                    visualStyle: character.visualStyle,
                    mood: character.mood,
                    lighting: character.lighting,
                    cameraStyle: character.cameraStyle,
                    cameraMovement: character.cameraMovement,
                    colorPalette: character.colorPalette || { primary: '', secondary: '', accent: '' }
                  }}
                  onLoad={(data) => updateCharacter(character.id, { ...data })}
                />

                <div className="grid grid-cols-1 gap-2">
                  <StyleSelector 
                    label="Visual Style" 
                    icon={<Palette size={10} className="text-blue-500" />} 
                    value={character.visualStyle || ''} 
                    options={VISUAL_STYLES} 
                    onChange={(val) => updateCharacter(character.id, { visualStyle: val })} 
                    disabled={disabled}
                    compact
                  />
                  <StyleSelector 
                    label="Mood" 
                    icon={<Film size={10} className="text-purple-500" />} 
                    value={character.mood || ''} 
                    options={MOOD_OPTIONS} 
                    onChange={(val) => updateCharacter(character.id, { mood: val })} 
                    disabled={disabled}
                    compact
                  />
                  <StyleSelector 
                    label="Lighting" 
                    icon={<Zap size={10} className="text-yellow-500" />} 
                    value={character.lighting || ''} 
                    options={LIGHTING_OPTIONS} 
                    onChange={(val) => updateCharacter(character.id, { lighting: val })} 
                    disabled={disabled}
                    compact
                  />
                  <StyleSelector 
                    label="Camera" 
                    icon={<Camera size={10} className="text-green-500" />} 
                    value={character.cameraStyle || ''} 
                    options={CAMERA_STYLES} 
                    onChange={(val) => updateCharacter(character.id, { cameraStyle: val })} 
                    disabled={disabled}
                    compact
                  />
                  <StyleSelector 
                    label="Movement" 
                    icon={<Video size={10} className="text-red-500" />} 
                    value={character.cameraMovement || ''} 
                    options={CAMERA_MOVEMENTS} 
                    onChange={(val) => updateCharacter(character.id, { cameraMovement: val })} 
                    disabled={disabled}
                    compact
                  />
                  
                  {/* Mini Color Palette */}
                  <div className="space-y-1">
                     <label className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-400">Palette</label>
                     <div className="grid grid-cols-3 gap-1">
                        <input type="text" placeholder="#Pri" value={character.colorPalette?.primary || ''} onChange={(e) => updateCharacter(character.id, { colorPalette: { ...character.colorPalette!, primary: e.target.value } })} className="bg-[#0e1117] border border-gray-600 text-[10px] text-white rounded p-1 text-center" />
                        <input type="text" placeholder="#Sec" value={character.colorPalette?.secondary || ''} onChange={(e) => updateCharacter(character.id, { colorPalette: { ...character.colorPalette!, secondary: e.target.value } })} className="bg-[#0e1117] border border-gray-600 text-[10px] text-white rounded p-1 text-center" />
                        <input type="text" placeholder="#Acc" value={character.colorPalette?.accent || ''} onChange={(e) => updateCharacter(character.id, { colorPalette: { ...character.colorPalette!, accent: e.target.value } })} className="bg-[#0e1117] border border-gray-600 text-[10px] text-white rounded p-1 text-center" />
                     </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
export const CharacterEngine: React.FC<CharacterEngineProps> = ({ settings, setSettings, disabled, script, onAnalysisComplete, analysisInProgress, mode = 'standard' }) => {
  const [analyzingCharId, setAnalyzingCharId] = useState<string | null>(null);
  const [charError, setCharError] = useState<{id: string, msg: string} | null>(null);
  const [alertDialog, setAlertDialog] = useState<{isOpen: boolean; title: string; message: string;}>({ isOpen: false, title: '', message: '' });

  const addCharacter = () => {
    const newChar: Character = {
      id: crypto.randomUUID(),
      name: "New Character",
      alias: "",
      role: "Supporting",
      description: "Describe visual appearance here...",
      shortDescription: "",
      frequency: "Main Protagonist",
      isFaceLocked: true,
      visualStyle: settings.visualStyle,
      lighting: settings.lighting,
      mood: settings.mood,
      cameraStyle: settings.cameraStyle,
      cameraMovement: settings.cameraMovement,
      colorPalette: { ...settings.colorPalette }
    };
    setSettings(prev => ({ ...prev, characters: [...prev.characters, newChar] }));
  };

  const updateCharacter = (id: string, updates: Partial<Character>) => {
    setSettings(prev => ({
      ...prev,
      characters: prev.characters.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const removeCharacter = (id: string) => {
    setSettings(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== id)
    }));
  };

  const handleScriptAnalysis = async () => {
    if (!script || !script.trim()) {
      setAlertDialog({ isOpen: true, title: "Script Required", message: "Please enter a script in the main input box first." });
      return;
    }
    
    // Parent component handles the state 'analysisInProgress'
    if (onAnalysisComplete) {
       // We'll call the service here but the loading state comes from props for sync
       // Actually, we can just trigger the parent's handler
       onAnalysisComplete(); 
       return;
    }
  };

  const handleCharacterImageUpload = async (charId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzingCharId(charId);
    setCharError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const result = reader.result;
        if (!result) throw new Error("Failed to read file.");
        const base64String = result.toString().split(',')[1];
        
        const description = await geminiService.analyzeCharacterImage(base64String, file.type);
        updateCharacter(charId, { description });
      } catch (err) {
        setCharError({ id: charId, msg: "Could not analyze character. Please enter description manually." });
      } finally {
        setAnalyzingCharId(null);
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isImportingText, setIsImportingText] = useState(false);
  
  const [isDeepSearching, setIsDeepSearching] = useState(false);

  const handleExportCharacters = () => {
    if (settings.characters.length === 0) {
      setAlertDialog({ isOpen: true, title: "Export Failed", message: "No characters to export." });
      return;
    }
    const dataStr = JSON.stringify(settings.characters, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'cast_and_characters.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportCharacters = async () => {
    setImportError(null);
    if (!importJson.trim()) return;

    // First try standard JSON parse
    try {
      const parsed = JSON.parse(importJson);
      
      // If it's our native JSON format (array of Character objects)
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].description) {
        const newCharacters = parsed.map((c: any) => ({
          ...c,
          id: c.id || crypto.randomUUID()
        }));
        setSettings(prev => ({ ...prev, characters: [...prev.characters, ...newCharacters] }));
        setIsImportModalOpen(false);
        setImportJson('');
        return;
      }
      
      // If it's the specific custom 'creatures' JSON format with stages
      if (parsed.creatures && Array.isArray(parsed.creatures)) {
        const newCharacters: any[] = [];
        for (const creature of parsed.creatures) {
          if (creature.stages && Array.isArray(creature.stages)) {
            for (const stage of creature.stages) {
              const descriptionParts = [];
              if (stage.size) descriptionParts.push(`Size: ${stage.size}`);
              if (stage.appearance) descriptionParts.push(`Appearance: ${stage.appearance}`);
              if (stage.behavior && stage.behavior.length) descriptionParts.push(`Behavior: ${stage.behavior.join(', ')}`);
              
              const fullDesc = descriptionParts.join('. ').substring(0, 300);
              
              newCharacters.push({
                id: crypto.randomUUID(),
                name: `${creature.name} (${stage.stage})`,
                alias: "",
                role: creature.mythology || "Creature",
                description: fullDesc || "A mythical creature.",
                shortDescription: `${creature.name} - ${stage.stage}`,
                frequency: "Occasional",
                isFaceLocked: true,
                visualStyle: "",
                lighting: "",
                mood: "",
                cameraStyle: "",
                cameraMovement: "",
                artKeywords: "",
                colorPalette: { primary: '', secondary: '', accent: '' }
              });
            }
          } else if (creature.visual_identity || creature.physical_description) {
              const visual = creature.visual_identity || {};
              const phys = creature.physical_description || {};
              const fullDesc = (visual.locked_description_for_reuse || visual.distinguishing_features || phys.confirmed_details?.join('. ') || "A creature.").substring(0, 300);
              newCharacters.push({
                id: crypto.randomUUID(),
                name: creature.name || "Unknown",
                alias: "",
                role: "Creature",
                description: fullDesc,
                shortDescription: creature.name || "Unknown",
                frequency: "Occasional",
                isFaceLocked: true,
                visualStyle: visual.coloration || "",
                lighting: "",
                mood: "",
                cameraStyle: "",
                cameraMovement: "",
                artKeywords: "",
                colorPalette: { primary: '', secondary: '', accent: '' }
              });
          }
        }
        
        if (newCharacters.length > 0) {
          setSettings(prev => ({ ...prev, characters: [...prev.characters, ...newCharacters] }));
          setIsImportModalOpen(false);
          setImportJson('');
          return;
        }
      }
      
    } catch (e) {
      // Not standard JSON. We will use AI to parse the text.
    }

    // Try AI parsing
    setIsImportingText(true);
    try {
      const extractedCharacters = await geminiService.analyzeTextForCharacters(importJson, mode as 'standard' | 'creature');
      if (extractedCharacters && extractedCharacters.length > 0) {
        setSettings(prev => ({ ...prev, characters: [...prev.characters, ...extractedCharacters] }));
        setIsImportModalOpen(false);
        setImportJson('');
      } else {
        setImportError("Could not extract any characters/creatures from the provided text.");
      }
    } catch (e) {
      setImportError("Failed to parse characters/creatures from text.");
    } finally {
      setIsImportingText(false);
    }
  };

  const handleDeepSearch = async () => {
    if (!settings.protagonistLock?.name) {
      setAlertDialog({ isOpen: true, title: "Name Required", message: "Please enter a character name first." });
      return;
    }
    setIsDeepSearching(true);
    try {
      const description = await geminiService.deepSearchCharacterAppearance(settings.protagonistLock.name);
      setSettings(prev => ({
        ...prev,
        protagonistLock: {
          ...prev.protagonistLock!,
          description
        }
      }));
    } catch (e) {
      setAlertDialog({ isOpen: true, title: "Search Failed", message: "Failed to deep search character appearance. Character may not be well known." });
    } finally {
      setIsDeepSearching(false);
    }
  };

  const updateProtagonistLock = (updates: Partial<NonNullable<typeof settings.protagonistLock>>) => {
    setSettings(prev => ({
      ...prev,
      protagonistLock: {
        enabled: false,
        name: '',
        description: '',
        ...(prev.protagonistLock || {}),
        ...updates
      }
    }));
  };

  return (
    <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-4 space-y-4">
      {/* Alert Modal */}
      {alertDialog.isOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-red-400 mb-2">{alertDialog.title}</h3>
            <p className="text-gray-300 text-sm mb-6">{alertDialog.message}</p>
            <div className="flex justify-end">
              <button 
                onClick={() => setAlertDialog({ ...alertDialog, isOpen: false })}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e293b] border border-gray-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload size={20} className="text-blue-400" /> Import Characters
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <p className="text-gray-300 text-sm mb-3">Paste your lore, wiki entry, character descriptions, or raw JSON array here. We will use AI to extract the characters/creatures.</p>
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='Paste text or JSON here...'
                className="w-full h-64 bg-[#0f172a] border border-gray-600 rounded-lg p-4 font-mono text-sm text-green-400 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                disabled={isImportingText}
              />
              {importError && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2 text-red-200 text-sm">
                  <AlertTriangle size={16} className="shrink-0" />
                  <p>{importError}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-700 bg-[#1a202c] rounded-b-xl flex justify-end gap-3">
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-gray-300 hover:text-white font-medium text-sm"
                disabled={isImportingText}
              >
                Cancel
              </button>
              <button 
                onClick={handleImportCharacters}
                disabled={!importJson.trim() || isImportingText}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImportingText ? (
                  <><Loader size={16} className="animate-spin" /> Extracting...</>
                ) : (
                  "Import / Extract"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header & Toggle */}
      <div className="flex flex-col gap-3 pb-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
           <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
             <Users size={16} /> CAST & CONSISTENCY
           </h3>
           <div className="text-xs font-mono text-gray-500">{settings.characters.length} Active</div>
        </div>
        
        <button 
           onClick={() => setSettings(prev => ({ ...prev, isConsistencyEnabled: !prev.isConsistencyEnabled }))}
           className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
             settings.isConsistencyEnabled 
             ? 'bg-purple-900/30 text-purple-200 border-purple-500' 
             : 'bg-gray-800 text-gray-400 border-gray-700'
           }`}
         >
            <span className="flex items-center gap-2">
               {settings.isConsistencyEnabled ? "Consistency ENABLED" : "Consistency DISABLED"}
            </span>
            {settings.isConsistencyEnabled ? <ToggleRight size={20} className="text-purple-400" /> : <ToggleLeft size={20} />}
         </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
           {/* This button is now purely for manual overrides or re-analysis, 
               the main flow is controlled by the parent 'Generate' logic 
               but we keep it here for convenience. */}
           <button 
             onClick={onAnalysisComplete}
             disabled={disabled || analysisInProgress || !script}
             className="flex-1 px-3 py-2 bg-blue-900/20 hover:bg-blue-800/40 border border-blue-600/50 text-blue-200 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
             title="AI will read your script and identify the main cast."
           >
             {analysisInProgress ? <Loader className="animate-spin" size={14} /> : <Search size={14} />}
             Re-Analyze Cast
           </button>

           <button onClick={addCharacter} disabled={disabled} className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-lg shadow-purple-900/40 transition-all">
             <UserPlus size={14} />
           </button>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCharacters}
            disabled={disabled || settings.characters.length === 0}
            className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            title="Export Characters"
          >
            <Download size={14} /> Export
          </button>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            disabled={disabled}
            className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            title="Import Characters"
          >
            <Upload size={14} /> Import
          </button>
        </div>
      </div>
      
      {/* Protagonist Lock Section */}
      <div className={`border rounded-xl p-3 transition-all ${
        settings.protagonistLock?.enabled 
          ? 'bg-blue-900/10 border-blue-500/50' 
          : 'bg-[#0f172a]/50 border-gray-800 opacity-80'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
            <Lock size={16} /> PROTAGONIST LOCK
          </h3>
          <button 
             onClick={() => updateProtagonistLock({ enabled: !settings.protagonistLock?.enabled })}
             className="px-2 py-1 rounded text-xs font-bold transition-all border border-gray-600 hover:bg-gray-700 bg-gray-800 text-gray-300"
           >
             {settings.protagonistLock?.enabled ? "ENABLED" : "DISABLED"}
           </button>
        </div>
        
        {settings.protagonistLock?.enabled && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
            <div>
              <p className="text-[10px] text-gray-400 mb-1">Character Name (for Deep Search)</p>
              <input 
                type="text" 
                value={settings.protagonistLock?.name || ''}
                onChange={(e) => updateProtagonistLock({ name: e.target.value })}
                placeholder="e.g. Joseph Merrick"
                disabled={disabled || isDeepSearching}
                className="w-full bg-[#1e293b] border border-gray-600 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            
            <div className="relative">
              <p className="text-[10px] text-gray-400 mb-1">Detailed Appearance (Paste JSON or click Deep Search)</p>
              <textarea 
                value={settings.protagonistLock?.description || ''}
                onChange={(e) => updateProtagonistLock({ description: e.target.value })}
                placeholder="Paste detailed visual description/JSON here..."
                disabled={disabled || isDeepSearching}
                className="w-full h-40 bg-[#1e293b] border border-gray-600 rounded p-2 text-xs text-green-400 font-mono focus:border-blue-500 outline-none resize-none"
              />
            </div>

            <button 
              onClick={handleDeepSearch}
              disabled={disabled || isDeepSearching || !settings.protagonistLock?.name}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isDeepSearching ? <Loader className="animate-spin" size={14} /> : <Search size={14} />}
              Deep Search Internet for Appearance
            </button>
          </div>
        )}
      </div>

      {settings.isConsistencyEnabled && settings.characters.length === 0 && (
         <div className="text-center py-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3">
             <AlertTriangle size={16} className="mx-auto text-yellow-500 mb-2" />
             <p className="text-xs text-yellow-200 font-bold">Action Required</p>
             <p className="text-[10px] text-yellow-400/80 mt-1">
                 You must Analyze Cast before generating prompts.
             </p>
         </div>
      )}

      {/* Character List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
         {settings.characters.map(char => (
           <CharacterCard
             key={char.id}
             character={char}
             updateCharacter={updateCharacter}
             removeCharacter={removeCharacter}
             onImageUpload={handleCharacterImageUpload}
             analyzingCharId={analyzingCharId}
             charError={charError}
             disabled={disabled}
             consistencyEnabled={settings.isConsistencyEnabled}
           />
         ))}
      </div>
    </div>
  );
};
