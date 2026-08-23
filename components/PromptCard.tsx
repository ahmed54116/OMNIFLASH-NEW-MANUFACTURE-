import React, { useState } from 'react';
import { Copy, Check, Video, ArrowRight, RefreshCw, X, FileText, Camera, Code, FileJson, Layers } from 'lucide-react';
import { GeneratedClip, StyleSettings, OutputFormat, SceneReferencePacket } from '../types';
import { ScenePacketInspector } from './ScenePacketInspector';
import { manufacturingCompiler } from '../services/manufacturingCompiler';

interface PromptCardProps {
  clip: GeneratedClip;
  onRegenerate: (clipId: string, feedback: string) => void;
  isRegenerating: boolean;
  mode?: 'director' | 'prompt' | 'both';
  settings?: StyleSettings;
  packet?: SceneReferencePacket | null;
}

const ScoreBar = ({ label, score }: { label: string, score: number }) => {
  if (score === undefined || score === null) return null;
  const percentage = Math.max(0, Math.min(100, (score / 10) * 100));
  
  // Decide color based on score
  let colorClass = "bg-green-500";
  if (score < 6) colorClass = "bg-red-500";
  else if (score < 8) colorClass = "bg-yellow-500";
  
  return (
    <div className="flex items-center gap-3 text-xs font-mono">
      <div className="w-36 text-gray-400 truncate">{label}</div>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden flex">
         <div className={`h-full ${colorClass}`} style={{ width: `${percentage}%` }} />
      </div>
      <div className={`w-8 text-right font-bold ${score >= 8 ? 'text-green-400' : score >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>
        {Number(score).toFixed(1)}
      </div>
    </div>
  );
};

const PromptCard: React.FC<PromptCardProps> = ({ clip, onRegenerate, isRegenerating, mode = 'both', settings, packet }) => {
  const [copied, setCopied] = useState(false);
  const [animationCopied, setAnimationCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showJson, setShowJson] = useState(false);

  // Dynamically resolve manufacturing scene packet if compiledReference is available
  const resolvedPacket: SceneReferencePacket | null = packet !== undefined ? packet : (
    settings?.compiledReference && clip.scriptLine ? (() => {
      const beat = manufacturingCompiler.matchChunkToBeat(clip.scriptLine, settings.compiledReference.visual_beats);
      if (!beat) return null;
      const stageId = beat.stage_id || settings.compiledReference.construction_stages[0]?.reference_id || 'STAGE_01';
      return manufacturingCompiler.resolveScenePacket(settings.compiledReference, stageId, beat.reference_id, `SCENE_${clip.clipNumber}`);
    })() : null
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(clip.visualPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyJson = () => {
    if (clip.jsonOutput) {
      navigator.clipboard.writeText(JSON.stringify(clip.jsonOutput, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerateSubmit = () => {
    if (!feedback.trim()) return;
    onRegenerate(clip.id, feedback);
    setIsEditing(false);
    setFeedback('');
  };

  const db = clip.jsonOutput?.director_brain;
  const cd = clip.jsonOutput?.camera_director;
  const ds = clip.jsonOutput?.director_score;
  const pc = clip.jsonOutput?.prompt_composer;

  return (
    <div className={`bg-[#1e293b] rounded-xl overflow-hidden shadow-xl border transition-all duration-300 ${isRegenerating ? 'border-purple-500 shadow-purple-900/20 opacity-80' : 'border-gray-800'}`}>
      
      {isRegenerating && (
        <div className="bg-purple-900/40 border-b border-purple-500/50 p-2 flex justify-center items-center">
          <p className="text-purple-300 text-xs font-medium animate-pulse">Regenerating...</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#2d3748] px-4 py-2 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-blue-900 text-blue-200 px-2 py-1 rounded">
            BEAT {String(clip.clipNumber).padStart(2, '0')}
          </span>
          {clip.jsonOutput && (
            <span className="text-[10px] font-bold bg-purple-900/50 text-purple-300 px-2 py-1 rounded border border-purple-500/30 flex items-center gap-1">
              <FileJson size={10} /> JSON
            </span>
          )}
          {resolvedPacket && (
            <span className="text-[10px] font-bold bg-emerald-950/60 text-emerald-300 px-2 py-1 rounded border border-emerald-500/30 flex items-center gap-1">
              <Layers size={10} /> PACKET: {resolvedPacket.stage.reference_id}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
           <div className="text-xs text-gray-400 font-mono">~8.0s</div>
           {mode !== "prompt" && !isEditing && (
             <button 
               onClick={() => setIsEditing(true)}
               className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
               title="Regenerate this clip"
             >
               <RefreshCw size={14} />
             </button>
           )}
        </div>
      </div>

      {/* Regeneration Input Panel */}
      {isEditing && (
        <div className="bg-blue-900/10 border-b border-blue-500/30 p-4 animate-in slide-in-from-top-2">
          <div className="flex justify-between items-start mb-2">
            <label className="text-xs font-bold text-blue-300 uppercase">Custom Modification</label>
            <button 
              onClick={() => setIsEditing(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. 'Make it night time', 'Remove the car', 'Use a drone shot'..."
              className="flex-1 bg-[#0e1117] border border-blue-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleRegenerateSubmit()}
              autoFocus
            />
            <button 
              onClick={handleRegenerateSubmit}
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* JSON Toggle View */}
      {clip.jsonOutput && (
         <div className="px-5 pt-3 flex justify-end">
           <button 
             onClick={() => setShowJson(!showJson)}
             className="text-xs flex items-center gap-1 text-gray-500 hover:text-purple-400 transition-colors"
           >
             <Code size={12} /> {showJson ? "Hide JSON Source" : "View JSON Source"}
           </button>
         </div>
      )}

      <div className="p-5 space-y-5">
        
        {showJson && clip.jsonOutput ? (
          <div className="space-y-4">
             {/* Script Line Header in JSON Mode */}
            <div>
              <div className="flex items-center gap-2 mb-1 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <FileText size={14} /> Source Script Line
              </div>
              <div className="text-sm font-serif text-gray-300 italic border-l-2 border-purple-500 pl-3 py-1 bg-[#1e293b]/50 rounded-r">
                "{clip.scriptLine}"
              </div>
            </div>
            <div className="relative group">
              <pre className="bg-[#0e1117] p-4 rounded-lg border border-purple-500/30 text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap shadow-inner">
                {JSON.stringify(clip.jsonOutput, null, 2)}
              </pre>
              <button
                onClick={handleCopyJson}
                className="absolute top-2 right-2 p-2 rounded-md bg-gray-800 hover:bg-purple-600 text-gray-400 hover:text-white transition-all border border-gray-700 hover:border-purple-500"
                title="Copy JSON"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        ) : (
          <>
            {mode !== "prompt" && (<>
{/* Storyboard / Director Brain View */}
            <div className="bg-[#0e1117] border border-gray-800 rounded-lg p-4">
               {/* Script Line */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1 text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
                  🎙 Narration
                </div>
                <div className="text-base font-serif text-white italic border-l-2 border-blue-500 pl-3 py-1">
                  "{clip.scriptLine}"
                </div>
              </div>

              <div className="h-px bg-gray-800 w-full my-4" />

              {db ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">🎯 Purpose</div>
                      <div className="text-sm text-blue-300 font-semibold">{db.purpose || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">🐦 Primary Subject</div>
                      <div className="text-sm text-gray-200">{db.primary_subject || db.main_subject || "N/A"}</div>
                    </div>
                    {db.supporting_subject && db.supporting_subject !== "None" && (
                      <div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">🦌 Supporting Subject</div>
                        <div className="text-sm text-gray-200">{db.supporting_subject}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">⚡ Main Behavior</div>
                      <div className="text-sm text-gray-200">{db.main_behavior || db.primary_action || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">🎭 Emotional Tone</div>
                      <div className="text-sm text-purple-300">{db.emotional_tone || db.mood || "N/A"}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">👀 Viewer Notice First</div>
                      <div className="text-sm text-teal-300">{db.viewer_notice_first || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">🎬 Viewer Notice Last</div>
                      <div className="text-sm text-teal-300">{db.viewer_notice_last || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">🌿 Environment Interaction</div>
                      <div className="text-sm text-green-300">{db.environment_interaction || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">🔄 Visual Change</div>
                      <div className="text-sm text-amber-300">{db.visual_change || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">🎥 Documentary Goal</div>
                      <div className="text-sm text-gray-400 italic">{db.documentary_goal || "N/A"}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {clip.shotType && (
                    <div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Shot Type</div>
                      <div className="text-xs text-blue-300 font-mono font-bold leading-tight">{clip.shotType}</div>
                    </div>
                  )}
                  {clip.cameraMovement && (
                    <div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Camera Movement</div>
                      <div className="text-xs text-teal-300 font-mono leading-tight">{clip.cameraMovement}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Director Score */}
            {ds && (
              <div className="bg-[#1e293b]/50 border border-gray-800 rounded-lg p-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Camera size={14} /> Director Score
                </div>
                <div className="space-y-2">
                  <ScoreBar label="Story Clarity" score={ds.story_clarity} />
                  <ScoreBar label="Visual Interest" score={ds.visual_interest} />
                  <ScoreBar label="Camera Variety" score={ds.camera_variety} />
                  <ScoreBar label="Emotion" score={ds.emotion} />
                  <ScoreBar label="Omni Flash Success" score={ds.omni_flash_success} />
                  <ScoreBar label="Continuity" score={ds.continuity} />
                </div>
              </div>
            )}

              {/* Animation Prompt (if exists) */}
            {clip.animationPrompt && (
              <div className="bg-[#0e1117] rounded-lg border border-gray-800 p-4 relative group mt-4">
                <div className="flex items-center gap-2 mb-2 text-teal-400 text-[10px] font-bold uppercase tracking-wider">
                  <Video size={14} /> AI Animation Prompt
                </div>
                <p className="text-sm text-gray-200 font-mono leading-relaxed pb-6 whitespace-pre-wrap">
                  {clip.animationPrompt}
                </p>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(clip.animationPrompt!);
                    setAnimationCopied(true);
                    setTimeout(() => setAnimationCopied(false), 2000);
                  }}
                  className="absolute bottom-2 right-2 p-2 rounded-md bg-gray-800 hover:bg-teal-600 text-gray-400 hover:text-white transition-all border border-gray-700 hover:border-teal-500"
                  title="Copy Animation Prompt"
                >
                  {animationCopied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            )}
          </>)}
{mode !== "director" && (<>
            {/* Manufacturing Scene Packet Inspector (if resolved) */}
            {resolvedPacket && (
              <ScenePacketInspector packet={resolvedPacket} clipNumber={clip.clipNumber} className="mb-4" />
            )}

            {/* The Final Prompt */}
            <div className="bg-[#0e1117] rounded-lg border border-gray-700 p-4 relative group">
              <div className="flex items-center gap-2 mb-2 text-green-400 text-[10px] font-bold uppercase tracking-wider">
                <Video size={14} /> Final Omni Flash Prompt
              </div>
              <p className="text-sm text-gray-200 font-serif leading-relaxed pb-6 whitespace-pre-wrap">
                {clip.visualPrompt}
              </p>
              
              <button
                onClick={handleCopy}
                className="absolute bottom-2 right-2 p-2 rounded-md bg-gray-800 hover:bg-green-600 text-gray-400 hover:text-white transition-all border border-gray-700 hover:border-green-500"
                title="Copy Prompt"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>

            {/* Animation Prompt (if exists) */}
            {clip.animationPrompt && (
              <div className="bg-[#0e1117] rounded-lg border border-gray-800 p-4 relative group mt-4">
                <div className="flex items-center gap-2 mb-2 text-teal-400 text-[10px] font-bold uppercase tracking-wider">
                  <Video size={14} /> AI Animation Prompt
                </div>
                <p className="text-sm text-gray-200 font-mono leading-relaxed pb-6 whitespace-pre-wrap">
                  {clip.animationPrompt}
                </p>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(clip.animationPrompt!);
                    setAnimationCopied(true);
                    setTimeout(() => setAnimationCopied(false), 2000);
                  }}
                  className="absolute bottom-2 right-2 p-2 rounded-md bg-gray-800 hover:bg-teal-600 text-gray-400 hover:text-white transition-all border border-gray-700 hover:border-teal-500"
                  title="Copy Animation Prompt"
                >
                  {animationCopied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            )}
          </>)}
</>
        )}
      </div>
    </div>
  );
};

export { PromptCard };
export default PromptCard;
