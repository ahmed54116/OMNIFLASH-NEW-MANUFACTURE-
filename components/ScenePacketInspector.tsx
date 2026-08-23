import React, { useState } from 'react';
import { Layers, ShieldAlert, Video, Box, Eye, Sparkles, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { SceneReferencePacket } from '../types';

interface ScenePacketInspectorProps {
  packet: SceneReferencePacket | null;
  clipNumber?: number;
  className?: string;
  defaultExpanded?: boolean;
}

export const ScenePacketInspector: React.FC<ScenePacketInspectorProps> = ({
  packet,
  clipNumber,
  className = '',
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!packet) {
    return (
      <div className={`p-3 bg-gray-900/40 border border-gray-800 rounded-lg text-xs text-gray-500 flex items-center gap-2 ${className}`}>
        <Box size={14} className="text-gray-600" />
        <span>No specific Manufacturing Scene Packet matched. Using global directive.</span>
      </div>
    );
  }

  const stage = packet.stage;
  const beat = packet.beat;
  const env = packet.environment;
  const modules = packet.modules || [];
  const anchors = Object.values(packet.identity_anchors || {});

  const totalNegatives = Object.values(packet.negative_constraints || {}).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
    0
  );

  return (
    <div className={`bg-[#0b1329] border border-blue-900/40 rounded-xl overflow-hidden shadow-lg transition-all ${className}`}>
      {/* Header Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-950/70 to-slate-900/80 hover:from-blue-900/70 hover:to-slate-800/80 flex items-center justify-between border-b border-blue-900/30 transition-all text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1 bg-blue-600/30 text-blue-400 rounded border border-blue-500/30">
            <Layers size={14} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-200 tracking-wide uppercase">
                Scene Reference Packet {clipNumber ? `(Beat ${clipNumber})` : ''}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                packet.generation_permission === 'T2V_ALLOWED'
                  ? 'bg-green-950/60 text-green-400 border-green-700/50'
                  : packet.generation_permission === 'REFERENCE_REQUIRED'
                    ? 'bg-yellow-950/60 text-yellow-400 border-yellow-700/50'
                    : 'bg-purple-950/60 text-purple-400 border-purple-700/50'
              }`}>
                {packet.generation_permission}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 truncate max-w-md">
              {stage?.stage_name || 'Stage'} • {beat?.story_function || 'Visual Beat'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="text-[11px] text-blue-400/80 hidden sm:inline font-mono">
            {modules.length} Module{modules.length !== 1 ? 's' : ''} • {totalNegatives} Negatives
          </span>
          {isExpanded ? <ChevronUp size={16} className="text-blue-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* Expanded Blueprint Details */}
      {isExpanded && (
        <div className="p-4 space-y-4 text-xs">
          {/* Stage & Facility State Lock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-orange-400 font-bold">
                <Box size={13} />
                <span>Construction Stage & State Lock</span>
              </div>
              <p className="text-gray-200 font-semibold text-xs">
                {stage?.reference_id}: {stage?.stage_name}
              </p>
              <div className="text-[11px] text-gray-400 font-mono">
                State Code: <span className="text-orange-300 font-bold">{packet.facility_state_lock?.facility_state_code || stage?.facility_state_code}</span>
              </div>
              {stage?.facility_state_description && (
                <p className="text-[11px] text-gray-400 italic">
                  "{stage.facility_state_description}"
                </p>
              )}
            </div>

            {/* Visual Beat & Story Function */}
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                <Sparkles size={13} />
                <span>Narrative Purpose & Beat</span>
              </div>
              <p className="text-gray-200 font-semibold text-xs">
                {beat?.reference_id}: {beat?.story_function || 'General Narrative Beat'}
              </p>
              {beat?.narrative_purpose && (
                <p className="text-[11px] text-gray-400">
                  Purpose: <span className="text-gray-300">{beat.narrative_purpose}</span>
                </p>
              )}
              {beat?.visual_family && (
                <div className="text-[11px] text-gray-400 font-mono">
                  Visual Family: <span className="text-blue-300">{beat.visual_family}</span>
                </div>
              )}
            </div>
          </div>

          {/* Identity Anchors */}
          {modules.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={12} className="text-emerald-400" />
                <span>Resolved Modules & Identity Anchors ({modules.length})</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {modules.map((mod, idx) => {
                  const anchor = packet.identity_anchors?.[mod.reference_id];
                  return (
                    <div key={idx} className="p-2.5 bg-emerald-950/20 border border-emerald-800/30 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-300 text-xs">{mod.name} ({mod.reference_id})</span>
                        {mod.key_dimensions?.length > 0 && (
                          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-900/40 px-1.5 py-0.5 rounded">
                            {mod.key_dimensions.join(', ')}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-300 leading-relaxed">
                        <span className="text-emerald-500 font-semibold">Short Anchor:</span> {anchor?.short_anchor || mod.identity_anchor || mod.full_description}
                      </p>
                      {anchor?.full_anchor && (
                        <p className="text-[10px] text-gray-400 italic">
                          <span className="text-gray-500">Full Anchor:</span> {anchor.full_anchor}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Environment & Camera Lock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Environment */}
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1.5">
              <span className="font-bold text-gray-300 text-xs">Environment & Atmospheric Lock</span>
              <p className="text-[11px] text-gray-300">{env?.name}: {env?.description}</p>
              {env?.atmospheric_conditions?.length > 0 && (
                <div className="text-[10px] text-gray-400">
                  <span className="text-gray-500">Atmosphere:</span> {env.atmospheric_conditions.join(', ')}
                </div>
              )}
              {env?.visibility_conditions?.length > 0 && (
                <div className="text-[10px] text-gray-400">
                  <span className="text-gray-500">Visibility:</span> {env.visibility_conditions.join(', ')}
                </div>
              )}
            </div>

            {/* Camera & Cinematography Guidance */}
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1.5">
              <span className="font-bold text-gray-300 text-xs">Camera Guidance (from JSON)</span>
              {packet.camera?.preferred_views?.length > 0 && (
                <div className="text-[11px] text-gray-300">
                  <span className="text-gray-500">Preferred Views:</span> {packet.camera.preferred_views.join(', ')}
                </div>
              )}
              {packet.camera?.safe_shot_scales?.length > 0 && (
                <div className="text-[11px] text-gray-300">
                  <span className="text-gray-500">Safe Scales:</span> {packet.camera.safe_shot_scales.join(', ')}
                </div>
              )}
              {packet.camera?.preferred_camera_movements?.length > 0 && (
                <div className="text-[11px] text-blue-300">
                  <span className="text-gray-500">Movement:</span> {packet.camera.preferred_camera_movements.join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Negative Constraints Resolved */}
          {totalNegatives > 0 && (
            <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-red-400 text-xs">
                <ShieldAlert size={13} />
                <span>Resolved Negative Constraints ({totalNegatives})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(packet.negative_constraints || {}).map(([cat, list]) => {
                  if (!Array.isArray(list) || list.length === 0) return null;
                  return list.map((item, idx) => (
                    <span key={`${cat}-${idx}`} className="text-[10px] px-2 py-0.5 rounded bg-red-900/30 text-red-300 border border-red-800/40">
                      <span className="text-red-400/70 font-mono uppercase text-[9px] mr-1">[{cat}]</span>
                      {item}
                    </span>
                  ));
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
