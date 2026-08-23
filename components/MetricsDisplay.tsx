import React from 'react';
import { ScriptMetrics } from '../types';
import { Clock, Scissors, Type } from 'lucide-react';

interface MetricsDisplayProps {
  metrics: ScriptMetrics;
}

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ metrics }) => {
  return (
    <div className="flex flex-wrap gap-4 mt-4">
      <div className="bg-[#1e293b] rounded-lg px-4 py-2 border border-gray-700 flex items-center gap-3">
        <Type size={18} className="text-blue-400" />
        <div>
          <div className="text-xs text-gray-400 uppercase font-semibold">Word Count</div>
          <div className="text-lg font-bold text-white">{metrics.wordCount}</div>
        </div>
      </div>

      <div className="bg-[#1e293b] rounded-lg px-4 py-2 border border-gray-700 flex items-center gap-3">
        <Clock size={18} className="text-green-400" />
        <div>
          <div className="text-xs text-gray-400 uppercase font-semibold">Est. Duration</div>
          <div className="text-lg font-bold text-white">{metrics.estimatedDurationMinutes.toFixed(2)} min</div>
        </div>
      </div>

      <div className="bg-[#1e293b] rounded-lg px-4 py-2 border border-gray-700 flex items-center gap-3">
        <Scissors size={18} className="text-purple-400" />
        <div>
          <div className="text-xs text-gray-400 uppercase font-semibold">Est. Clips (8s)</div>
          <div className="text-lg font-bold text-white">{metrics.estimatedClipCount}</div>
        </div>
      </div>
    </div>
  );
};