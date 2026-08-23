import React, { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle, Loader2, FileJson, FileText, DownloadCloud } from 'lucide-react';

interface ProjectImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => void;
}

export const ProjectImportModal: React.FC<ProjectImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const parseAndImport = (content: string) => {
    setError(null);
    if (!content.trim()) {
      setError("Please paste a JSON string or drop a project file.");
      return;
    }

    try {
      const parsed = JSON.parse(content);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error("Invalid format: Expected a JSON object.");
      }
      onImport(parsed);
      setJsonInput('');
      setFileName(null);
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message || "Could not parse JSON"}`);
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.json') && !file.type.includes('json') && !file.type.includes('text')) {
      setError("Please upload a valid .json project file.");
      return;
    }

    setFileName(file.name);
    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setIsLoading(false);
      const text = e.target?.result as string;
      if (text) {
        setJsonInput(text);
        parseAndImport(text);
      }
    };
    reader.onerror = () => {
      setIsLoading(false);
      setError("Failed to read the selected file.");
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e293b] border border-gray-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload size={20} className="text-blue-400" /> Import Project
          </h3>
          <button 
            onClick={onClose} 
            disabled={isLoading} 
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
              isDragging 
                ? 'border-blue-500 bg-blue-950/40 scale-[0.99]' 
                : 'border-gray-700 hover:border-blue-500/60 bg-[#0f172a]/60 hover:bg-[#0f172a]'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".json,application/json" 
              onChange={handleFileInputChange}
              className="hidden" 
            />
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-blue-600/20 text-blue-400 rounded-full border border-blue-500/30">
                <DownloadCloud size={24} />
              </div>
              <p className="text-sm font-semibold text-gray-200">
                {fileName ? (
                  <span className="text-green-400">Selected: {fileName}</span>
                ) : (
                  <>Drag and drop your <span className="text-blue-400 font-mono">.json</span> project file here, or <span className="text-blue-400 underline">browse</span></>
                )}
              </p>
              <p className="text-xs text-gray-500">
                Restores script, manufacturing JSON, compiled reference index, and generated clips to resume where you left off.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px bg-gray-700 flex-1" />
            <span className="text-xs font-mono text-gray-500 uppercase">OR PASTE JSON DIRECTLY</span>
            <div className="h-px bg-gray-700 flex-1" />
          </div>

          {/* Paste JSON Area */}
          <textarea
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              setFileName(null);
            }}
            disabled={isLoading}
            placeholder='Paste full exported project JSON or settings here...'
            className="w-full h-48 bg-[#0f172a] border border-gray-700 rounded-lg p-3 font-mono text-xs text-green-400 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none leading-relaxed disabled:opacity-50"
          />

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2 text-red-200 text-sm animate-in slide-in-from-top-2">
              <AlertCircle size={16} className="shrink-0 text-red-400" />
              <p className="break-all">{error}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-700 bg-[#1a202c] rounded-b-xl flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Exported data is fully synced into browser storage.
          </span>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-300 hover:text-white font-medium text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={() => parseAndImport(jsonInput)}
              disabled={!jsonInput.trim() || isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Loading...
                </>
              ) : (
                <>
                  <Check size={16} /> Load Project
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
