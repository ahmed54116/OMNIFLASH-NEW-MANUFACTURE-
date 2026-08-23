import React, { useState } from 'react';
import { Zap, ShieldCheck, TrendingDown, Cpu, ChevronDown, ChevronUp, Layers, CheckCircle } from 'lucide-react';
import { ManufacturingReferenceIndex } from '../types';

interface TokenOptimizationHUDProps {
  manufacturingJson?: string;
  compiledReference?: ManufacturingReferenceIndex | null;
  clipCount: number;
  className?: string;
}

export const TokenOptimizationHUD: React.FC<TokenOptimizationHUDProps> = ({
  manufacturingJson,
  compiledReference,
  clipCount,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasManufacturing = manufacturingJson && manufacturingJson.trim().length > 0;
  const isCompiled = !!compiledReference;

  if (!hasManufacturing) return null;

  // Calculate token estimates
  // Approx 4 characters per token
  const rawJsonTokens = Math.round((manufacturingJson.length || 0) / 4);
  const packetAvgTokens = 450; // Average compact scene packet size
  const standardSystemTokens = 650;
  
  // Total tokens per batch without compiler (raw JSON injected every time)
  const unoptimizedPerBatch = rawJsonTokens + standardSystemTokens;
  // Total tokens per batch with compiler (only scene packet injected)
  const optimizedPerBatch = packetAvgTokens + standardSystemTokens;
  
  // Savings per batch
  const savedPerBatch = Math.max(0, unoptimizedPerBatch - optimizedPerBatch);
  const reductionPercentage = Math.round((savedPerBatch / Math.max(1, unoptimizedPerBatch)) * 100);

  // Total project savings (assuming batch size of 2)
  const batchCount = Math.max(1, Math.ceil((clipCount || 10) / 2));
  const totalTokensSaved = isCompiled ? savedPerBatch * batchCount : 0;

  return (
    <div className={`bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-800/40 rounded-xl overflow-hidden shadow-lg transition-all ${className}`}>
      {/* Main HUD Bar */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 flex items-center justify-center">
            <Zap size={16} className="animate-pulse text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-white tracking-wide uppercase">
                Token Optimization Engine
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isCompiled 
                  ? 'bg-emerald-900/60 text-emerald-300 border-emerald-600/50'
                  : 'bg-yellow-900/60 text-yellow-300 border-yellow-600/50'
              }`}>
                {isCompiled ? '✓ PRE-COMPILED (ACTIVE)' : 'RAW INJECTION (COMPILE RECOMMENDED)'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              {isCompiled 
                ? `Injecting compact scene packets (~${packetAvgTokens} tok) instead of raw JSON (~${rawJsonTokens.toLocaleString()} tok).`
                : `Compile your Manufacturing JSON above to save ~${reductionPercentage}% tokens per prompt call.`}
            </p>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-black text-emerald-400 font-mono">
              {isCompiled ? `~${totalTokensSaved.toLocaleString()} Tokens Saved` : `${reductionPercentage}% Potential Savings`}
            </div>
            <div className="text-[10px] text-gray-400">
              {isCompiled ? `${reductionPercentage}% context reduction per call` : 'Compile reference to activate'}
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Toggle Token Math Details"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Breakdown */}
      {isExpanded && (
        <div className="p-4 bg-slate-950/80 border-t border-emerald-900/30 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Raw Payload */}
            <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg space-y-1">
              <span className="text-[11px] font-bold text-red-400 uppercase">Without Compiler</span>
              <div className="text-base font-bold text-red-300 font-mono">
                ~{unoptimizedPerBatch.toLocaleString()} tok / batch
              </div>
              <p className="text-[10px] text-gray-400">
                Entire 50KB Manufacturing JSON sent on every single API request.
              </p>
            </div>

            {/* Compiled Payload */}
            <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 uppercase">With Scene Resolver</span>
              <div className="text-base font-bold text-emerald-300 font-mono">
                ~{optimizedPerBatch.toLocaleString()} tok / batch
              </div>
              <p className="text-[10px] text-gray-400">
                Only the matched beat & stage packet is injected per call.
              </p>
            </div>

            {/* Efficiency Gain */}
            <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-lg space-y-1">
              <span className="text-[11px] font-bold text-blue-400 uppercase">Efficiency Gain</span>
              <div className="text-base font-bold text-blue-300 font-mono">
                {reductionPercentage}% reduction
              </div>
              <p className="text-[10px] text-gray-400">
                Faster latency, zero model context confusion, zero prompt truncation.
              </p>
            </div>
          </div>

          <div className="text-[11px] text-gray-400 flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <span>
              Google Gemini system instructions are cached at the API layer, reducing latency to 1–2 seconds per batch.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
