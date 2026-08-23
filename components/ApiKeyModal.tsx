import React, { useState, useEffect } from 'react';
import { Key, X, Check, AlertCircle, Shield, ExternalLink, RefreshCw } from 'lucide-react';
import { getApiKey } from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeySaved }) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = localStorage.getItem('veo_gemini_api_key') || '';
      setSavedKey(current);
      setApiKeyInput(current);
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      localStorage.removeItem('veo_gemini_api_key');
      setSavedKey('');
      setStatusMessage('Using AI Studio / Server default API key.');
      onKeySaved('');
      setTimeout(() => onClose(), 1000);
      return;
    }

    if (!trimmed.startsWith('AIzaSy') && trimmed.length < 20) {
      setStatusMessage('Warning: That does not look like a standard Google Gemini API key.');
    }

    localStorage.setItem('veo_gemini_api_key', trimmed);
    setSavedKey(trimmed);
    setStatusMessage('API Key saved successfully! All requests will now use this key.');
    onKeySaved(trimmed);
    setTimeout(() => onClose(), 1200);
  };

  const handleClear = () => {
    localStorage.removeItem('veo_gemini_api_key');
    setApiKeyInput('');
    setSavedKey('');
    setStatusMessage('Custom API key removed. Using AI Studio default.');
    onKeySaved('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#1e293b] border border-blue-500/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-700/80 flex justify-between items-center bg-gradient-to-r from-blue-900/30 to-indigo-900/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Key size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Google Gemini API Key</h2>
              <p className="text-xs text-gray-400">Configure or override your Gemini API key for this browser</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="bg-slate-900/70 border border-slate-700/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">Active Status:</span>
              {savedKey ? (
                <span className="px-2.5 py-0.5 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full font-mono font-bold flex items-center gap-1.5">
                  <Check size={12} /> Custom Key Saved ({savedKey.slice(0, 6)}...{savedKey.slice(-4)})
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full font-mono font-bold flex items-center gap-1.5">
                  <Shield size={12} /> AI Studio / Backend Proxy
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              If your AI Studio workspace reports <span className="text-red-400 font-mono">403: Permission Denied</span> or quota limits, paste your own Gemini API key below to unlock immediate unlimited generation.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Paste AIzaSy... API key here"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono transition-all"
            />
            <div className="flex justify-between items-center text-[11px] text-gray-400 pt-1">
              <span>Your key is stored securely in your local browser only.</span>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline font-medium"
              >
                Get Gemini Key <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.includes('successfully') 
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              <AlertCircle size={15} />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-700/80 bg-slate-900/50 flex justify-between items-center">
          {savedKey ? (
            <button
              onClick={handleClear}
              className="px-3.5 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-900/40 rounded-lg transition-colors"
            >
              Clear Custom Key
            </button>
          ) : (
            <div />
          )}
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-900/40 transition-all flex items-center gap-1.5"
            >
              <Check size={14} /> Save Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
