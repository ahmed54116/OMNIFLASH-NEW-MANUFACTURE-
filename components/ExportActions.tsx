
import React, { useState } from 'react';
import { GeneratedClip, StyleSettings } from '../types';
import { Download, FileText, Table, FileJson, Copy, CheckCircle2 } from 'lucide-react';

interface ExportActionsProps {
  clips: GeneratedClip[];
  settings: StyleSettings;
}

export const ExportActions: React.FC<ExportActionsProps> = ({ clips, settings }) => {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  if (clips.length === 0) return null;

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const exportCSV = () => {
    // Construct a Tech Specs summary string
    const techSpecs = `Style: ${settings.visualStyle} | Mood: ${settings.mood} | Lighting: ${settings.lighting} | Camera: ${settings.cameraStyle} (${settings.cameraMovement}) | Palette: ${settings.colorPalette?.primary || ""}/${settings.colorPalette?.secondary || ""}`;

    const headers = ["Scene #", "Script Line", "Narrative Context", "Visual Prompt", "Tech Specs"];
    const rows = clips.map(c => [
      c.clipNumber,
      `"${c.scriptLine.replace(/"/g, '""')}"`,
      `"${c.narrativeContext.replace(/"/g, '""')}"`,
      `"${c.visualPrompt.replace(/"/g, '""')}"`,
      `"${techSpecs.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'video_prompts_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportTXT = (isAnimation: boolean = false) => {
    // STRICT FORMAT: Numbered list of prompts ONLY. No script, no context.
    const content = clips.map(c => {
      const prompt = isAnimation ? (c.animationPrompt || "No animation prompt generated") : c.visualPrompt;
      return `${c.clipNumber}. ${prompt}`;
    }).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', isAnimation ? 'animation_prompts.txt' : 'prompts_only.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportBatchJSON = () => {
    const content = clips.map(c => {
      const jsonBody = c.jsonOutput
        ? JSON.stringify(c.jsonOutput, null, 2)
        : JSON.stringify({ 
            sequence_id: c.clipNumber,
            note: "Generated in Standard Mode",
            visual_prompt: c.visualPrompt,
            animation_prompt: c.animationPrompt,
            script_context: c.scriptLine
          }, null, 2);
      
      return `--- PROMPT ${c.clipNumber} ---\n${jsonBody}`;
    }).join('\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'batch_prompts_full.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportVeo3Pk = (isAnimation: boolean = false) => {
    const content = "Provide Ouput Prompts in this Formate (very Important):\n\n" + clips.map(c => `Prompt ${c.clipNumber}:\n${c.clipNumber}. ${isAnimation ? (c.animationPrompt || "No animation prompt generated") : c.visualPrompt}`).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', isAnimation ? 'veo animation prompts.txt' : 'veo prompts.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <button 
          onClick={exportCSV}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1e293b] border border-gray-600 hover:border-blue-500 text-gray-200 rounded-lg transition-all hover:bg-[#2d3748] text-sm font-medium"
        >
          <Table size={16} className="text-green-400" /> Export CSV
        </button>
        <button 
          onClick={() => exportTXT(false)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1e293b] border border-gray-600 hover:border-blue-500 text-gray-200 rounded-lg transition-all hover:bg-[#2d3748] text-sm font-medium"
        >
          <FileText size={16} className="text-blue-400" /> Export Prompts (.txt)
        </button>
        <button 
          onClick={exportBatchJSON}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1e293b] border border-gray-600 hover:border-purple-500 text-gray-200 rounded-lg transition-all hover:bg-[#2d3748] text-sm font-medium"
        >
          <FileJson size={16} className="text-purple-400" /> Batch JSON
        </button>
        <button 
          onClick={() => exportVeo3Pk(false)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1e293b] border border-gray-600 hover:border-orange-500 text-gray-200 rounded-lg transition-all hover:bg-[#2d3748] text-sm font-medium"
        >
          <FileText size={16} className="text-orange-400" /> export veo3.pk
        </button>
      </div>

      <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-700">
        <span className="flex items-center text-sm font-medium text-gray-400 px-2">Copy to Clipboard:</span>
        <button 
          onClick={() => {
            const content = clips.map(c => `${c.clipNumber}. ${c.visualPrompt}`).join('\n\n');
            handleCopy('prompts', content);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1e293b] border border-gray-600 hover:border-gray-500 text-gray-200 rounded-lg transition-all hover:bg-[#2d3748] text-sm font-medium"
        >
          {copiedStates['prompts'] ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-400" />} 
          {copiedStates['prompts'] ? 'Copied!' : 'All Prompts'}
        </button>
        <button 
          onClick={() => {
            const content = clips.map(c => `${c.clipNumber}. ${c.animationPrompt || ''}`).join('\n\n');
            handleCopy('anim_prompts', content);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1e293b] border border-gray-600 hover:border-gray-500 text-gray-200 rounded-lg transition-all hover:bg-[#2d3748] text-sm font-medium"
        >
          {copiedStates['anim_prompts'] ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-400" />} 
          {copiedStates['anim_prompts'] ? 'Copied!' : 'Animation Prompts'}
        </button>
        <button 
          onClick={() => {
            const content = "Provide Ouput Prompts in this Formate (very Important):\n\n" + clips.map(c => `Prompt ${c.clipNumber}:\n${c.clipNumber}. ${c.visualPrompt}`).join('\n\n');
            handleCopy('veo3', content);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1e293b] border border-gray-600 hover:border-gray-500 text-gray-200 rounded-lg transition-all hover:bg-[#2d3748] text-sm font-medium"
        >
          {copiedStates['veo3'] ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-400" />} 
          {copiedStates['veo3'] ? 'Copied!' : 'All Prompts (veo3.pk)'}
        </button>
        <button 
          onClick={() => {
            const content = "Provide Ouput Prompts in this Formate (very Important):\n\n" + clips.map(c => `Prompt ${c.clipNumber}:\n${c.clipNumber}. ${c.animationPrompt || ''}`).join('\n\n');
            handleCopy('anim_veo3', content);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1e293b] border border-gray-600 hover:border-gray-500 text-gray-200 rounded-lg transition-all hover:bg-[#2d3748] text-sm font-medium"
        >
          {copiedStates['anim_veo3'] ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-400" />} 
          {copiedStates['anim_veo3'] ? 'Copied!' : 'Animation Prompts (veo3.pk)'}
        </button>
        <button 
          onClick={() => {
            const content = clips.map(c => `${c.clipNumber}. ${c.scriptLine}`).join('\n\n');
            handleCopy('vo', content);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1e293b] border border-gray-600 hover:border-gray-500 text-gray-200 rounded-lg transition-all hover:bg-[#2d3748] text-sm font-medium"
        >
          {copiedStates['vo'] ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-400" />} 
          {copiedStates['vo'] ? 'Copied!' : 'All Voiceover'}
        </button>
      </div>

      
    </div>
  );
};
