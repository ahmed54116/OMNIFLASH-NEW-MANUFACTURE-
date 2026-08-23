import React, { useState } from 'react';
import { StyleSettings } from '../types';
import { Search, Loader2, Database } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface Props {
  script: string;
  settings: StyleSettings;
  setSettings: React.Dispatch<React.SetStateAction<StyleSettings>>;
  disabled: boolean;
}

export const ContinuityEngine: React.FC<Props> = ({ script, settings, setSettings, disabled }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzeContinuity = async () => {
    setIsAnalyzing(true);
    try {
      const generatedContinuity = await geminiService.analyzeContinuity(script, settings);
      setSettings(prev => ({
        ...prev,
        continuityJson: generatedContinuity
      }));
    } catch (err) {
      console.error("Failed to analyze continuity", err);
      alert("Failed to analyze continuity. Please check console.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#0f172a] p-4 rounded-lg border border-teal-900/30">
        <div>
          <h3 className="font-bold text-teal-400 flex items-center gap-2">
            <Database size={18} /> Continuity Extraction
          </h3>
          <p className="text-sm text-gray-400 mt-1">Automatically extract structural and persistent context.</p>
        </div>
        <button
          onClick={handleAnalyzeContinuity}
          disabled={isAnalyzing || !script.trim() || disabled}
          className="px-6 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg transition-all flex items-center gap-2"
        >
          {isAnalyzing ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : <><Search size={16} /> Extract Continuity</>}
        </button>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-400 mb-2">Continuity JSON Data</label>
        <p className="text-xs text-gray-500 mb-2">This data is injected into the prompt generator to maintain world and object consistency across clips.</p>
        <textarea
          value={settings.continuityJson || ''}
          onChange={(e) => setSettings(prev => ({ ...prev, continuityJson: e.target.value }))}
          disabled={disabled}
          placeholder="Continuity JSON will appear here..."
          className="w-full h-96 bg-[#0f172a] border border-gray-700 rounded-lg p-4 text-gray-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-mono text-xs resize-none"
        />
      </div>
    </div>
  );
};
