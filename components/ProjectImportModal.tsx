
import React, { useState } from 'react';
import { Upload, X, Check, AlertCircle, Loader2 } from 'lucide-react';

interface ProjectImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (jsonString: string) => Promise<{ success: boolean; message?: string }>;
}

export const ProjectImportModal: React.FC<ProjectImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleImportClick = async () => {
    setError(null);
    if (!jsonInput.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await onImport(jsonInput);
      if (result.success) {
        setJsonInput('');
        onClose();
      } else {
        setError(result.message || "Import failed due to unknown error.");
      }
    } catch (e) {
      setError("An unexpected error occurred during import.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e293b] border border-gray-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload size={20} className="text-blue-400" /> Import Project
          </h3>
          <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-white transition-colors disabled:opacity-50">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3 mb-4">
             <p className="text-sm text-blue-200">
               <strong>Smart AI Import:</strong> You can paste ANY configuration format, unstructured text, or LLM output. The system will intelligently map it to the correct engine settings.
             </p>
          </div>
          
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            disabled={isLoading}
            placeholder='Paste JSON, Config Text, or Notes here...
Example:
{
  "visualDetailUsage": "High",
  "shotHierarchy": { ... },
  ...
}'
            className="w-full h-64 bg-[#0f172a] border border-gray-600 rounded-lg p-4 font-mono text-xs text-green-400 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none leading-relaxed disabled:opacity-50"
          />

          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2 text-red-200 text-sm animate-in slide-in-from-top-2">
              <AlertCircle size={16} className="shrink-0" />
              <p className="break-all">{error}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 bg-[#1a202c] rounded-b-xl flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-300 hover:text-white font-medium text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleImportClick}
            disabled={!jsonInput.trim() || isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} /> AI Interpreting...
              </>
            ) : (
              <>
                <Check size={16} /> Load Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
