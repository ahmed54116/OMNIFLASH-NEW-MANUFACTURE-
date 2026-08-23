import { storage } from "../utils";

import React, { useState, useEffect } from 'react';
import { StylePreset } from '../types';
import { FACTORY_PRESETS } from '../constants';
import { ChevronDown, X, FolderOpen, Save, Trash2 } from 'lucide-react';

// ----------------------------------------------------------------------
// STYLE SELECTOR
// ----------------------------------------------------------------------
export const StyleSelector: React.FC<{
  label: string;
  icon: React.ReactNode;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  disabled: boolean;
  compact?: boolean;
}> = ({ label, icon, value, options, onChange, disabled, compact = false }) => {
  const [isCustomMode, setIsCustomMode] = useState(false);

  useEffect(() => {
    if (value && !options.includes(value)) {
      setIsCustomMode(true);
    } else {
      setIsCustomMode(false);
    }
  }, [value, options]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === "✏️ Custom...") {
      setIsCustomMode(true);
      onChange(""); 
    } else {
      onChange(selected);
    }
  };

  const handleResetToDropdown = () => {
    setIsCustomMode(false);
    onChange(options[0]);
  };

  return (
    <div className="space-y-1.5">
      <label className={`flex items-center gap-2 font-bold uppercase text-gray-400 ${compact ? 'text-[10px]' : 'text-xs'}`}>
        {icon} {label}
      </label>
      
      {isCustomMode ? (
        <div className="relative flex items-center animate-in fade-in zoom-in duration-200">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Custom ${label.toLowerCase()}...`}
            disabled={disabled}
            autoFocus
            className={`w-full bg-[#0e1117] border border-blue-500 text-white rounded-lg focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-600 ${compact ? 'p-1.5 text-xs' : 'p-2.5 pr-10'}`}
          />
          <button
            onClick={handleResetToDropdown}
            className="absolute right-2 text-gray-400 hover:text-red-400 p-1 hover:bg-gray-800 rounded transition-colors"
            title="Switch back to list"
          >
            <X size={compact ? 12 : 16} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <select
            value={value}
            onChange={handleSelectChange}
            disabled={disabled}
            className={`w-full bg-[#0e1117] border border-gray-600 text-gray-200 rounded-lg focus:border-blue-500 outline-none appearance-none ${compact ? 'p-1.5 text-xs' : 'p-2.5'}`}
          >
            {options.map(opt => (
              <option key={opt} value={opt} className={opt === "✏️ Custom..." ? "font-bold text-blue-400" : ""}>
                {opt}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-3 pointer-events-none text-gray-500">
            <ChevronDown size={14} />
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// PRESET MANAGER
// ----------------------------------------------------------------------
interface PresetManagerProps {
  currentData: any;
  onLoad: (data: any) => void;
  disabled: boolean;
  compact?: boolean;
}

export const PresetManager: React.FC<PresetManagerProps> = ({ currentData, onLoad, disabled, compact }) => {
  const [presets, setPresets] = useState<StylePreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  
  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [alertError, setAlertError] = useState("");

  useEffect(() => {
    // Load presets from local storage on mount
    const loadPresets = () => {
      try {
        const stored = storage.getItem('style_engine_presets');
        const userPresets: StylePreset[] = stored ? JSON.parse(stored) : [];
        setPresets([...FACTORY_PRESETS, ...userPresets]);
      } catch (e) {
        console.error("Failed to load presets", e);
        setPresets(FACTORY_PRESETS);
      }
    };
    loadPresets();
    
    // Listen for storage events to sync across components/tabs
    window.addEventListener('storage', loadPresets);
    return () => window.removeEventListener('storage', loadPresets);
  }, []);

  const handleSaveInit = () => {
    setPresetNameInput("");
    setSavePromptOpen(true);
  };

  const handleSaveConfirm = () => {
    if (!presetNameInput.trim()) return;
    
    const newPreset: StylePreset = {
      id: crypto.randomUUID(),
      name: presetNameInput.trim(),
      isSystem: false,
      data: { ...currentData } // Create copy
    };

    const stored = storage.getItem('style_engine_presets');
    const existingUserPresets: StylePreset[] = stored ? JSON.parse(stored) : [];
    const updatedUserPresets = [...existingUserPresets, newPreset];
    
    storage.setItem('style_engine_presets', JSON.stringify(updatedUserPresets));
    
    // Update local state immediately
    setPresets([...FACTORY_PRESETS, ...updatedUserPresets]);
    setSelectedPresetId(newPreset.id);
    setSavePromptOpen(false);
  };

  const handleDeleteInit = () => {
    if (!selectedPresetId) return;
    const preset = presets.find(p => p.id === selectedPresetId);
    if (preset?.isSystem) {
      setAlertError("Cannot delete factory presets.");
      return;
    }
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    const stored = storage.getItem('style_engine_presets');
    if (stored) {
      const existing: StylePreset[] = JSON.parse(stored);
      const updated = existing.filter(p => p.id !== selectedPresetId);
      storage.setItem('style_engine_presets', JSON.stringify(updated));
      
      setPresets([...FACTORY_PRESETS, ...updated]);
      setSelectedPresetId("");
    }
    setDeleteConfirmOpen(false);
  };

  const handleLoad = (id: string) => {
    setSelectedPresetId(id);
    if (!id) return;
    
    const preset = presets.find(p => p.id === id);
    if (preset) {
      onLoad(preset.data);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'} w-full`}>
      <div className="flex-1 relative">
         <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
           <FolderOpen size={compact ? 12 : 14} />
         </div>
         <select
           value={selectedPresetId}
           onChange={(e) => handleLoad(e.target.value)}
           disabled={disabled}
           className={`w-full bg-[#0e1117] border border-gray-600 rounded-lg text-gray-200 outline-none focus:border-blue-500 appearance-none ${compact ? 'pl-7 py-1.5' : 'pl-8 py-2'}`}
         >
           <option value="">📂 Load Preset...</option>
           <optgroup label="Factory Defaults">
             {presets.filter(p => p.isSystem).map(p => (
               <option key={p.id} value={p.id}>{p.name}</option>
             ))}
           </optgroup>
           {presets.some(p => !p.isSystem) && (
             <optgroup label="My Presets">
               {presets.filter(p => !p.isSystem).map(p => (
                 <option key={p.id} value={p.id}>{p.name}</option>
               ))}
             </optgroup>
           )}
         </select>
         <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            <ChevronDown size={12} />
         </div>
      </div>

      <button
        onClick={handleSaveInit}
        disabled={disabled}
        className={`bg-blue-900/40 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-800 hover:border-blue-500 rounded-lg transition-colors flex items-center gap-1 ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}`}
        title="Save Current Settings as Preset"
      >
        <Save size={compact ? 12 : 14} /> 
        {!compact && "Save"}
      </button>

      {selectedPresetId && !presets.find(p => p.id === selectedPresetId)?.isSystem && (
        <button
          onClick={handleDeleteInit}
          disabled={disabled}
          className={`bg-red-900/40 hover:bg-red-600 text-red-200 hover:text-white border border-red-800 hover:border-red-500 rounded-lg transition-colors ${compact ? 'p-1.5' : 'p-2'}`}
          title="Delete Selected Preset"
        >
          <Trash2 size={compact ? 12 : 14} />
        </button>
      )}

      {/* Save Prompt Modal */}
      {savePromptOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-5 max-w-sm w-full">
            <h4 className="text-white font-bold mb-3">Name your style preset:</h4>
            <input 
              type="text" 
              value={presetNameInput}
              onChange={(e) => setPresetNameInput(e.target.value)}
              className="w-full bg-[#0f172a] border border-gray-600 rounded p-2 text-white mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveConfirm()}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setSavePromptOpen(false)} className="px-3 py-1.5 text-gray-400 hover:bg-gray-800 rounded">Cancel</button>
              <button onClick={handleSaveConfirm} className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-5 max-w-sm w-full">
            <h4 className="text-white font-bold mb-3">Delete Preset?</h4>
            <p className="text-sm text-gray-400 mb-4">Are you sure you want to delete preset "{presets.find(p => p.id === selectedPresetId)?.name}"?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirmOpen(false)} className="px-3 py-1.5 text-gray-400 hover:bg-gray-800 rounded">Cancel</button>
              <button onClick={handleDeleteConfirm} className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-500">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Error Modal */}
      {alertError && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-5 max-w-sm w-full">
            <h4 className="text-red-400 font-bold mb-3">Error</h4>
            <p className="text-sm text-gray-300 mb-4">{alertError}</p>
            <div className="flex justify-end">
              <button onClick={() => setAlertError("")} className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
