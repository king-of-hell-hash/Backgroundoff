import React from 'react';
import { Loader2, Sparkles, Shield, Cpu } from 'lucide-react';

interface ProcessingIndicatorProps {
  stepText: string;
  percentage: number;
  onCancel?: () => void;
}

export const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({
  stepText,
  percentage,
  onCancel,
}) => {
  return (
    <div className="w-full max-w-md mx-auto p-8 sm:p-10 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-2xl shadow-indigo-500/10 text-center my-12 animate-fade-in" id="processing-indicator-container">
      {/* Animated Glowing Ring */}
      <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#F1F5F9"
            strokeWidth="7"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#4F46E5"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={264}
            strokeDashoffset={264 - (264 * Math.max(5, percentage)) / 100}
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Center percentage */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {percentage}%
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400">
            Processing
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-indigo-600 font-bold text-base mb-1.5">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Erasing Background</span>
      </div>

      <p className="text-xs text-slate-500 font-medium mb-6 min-h-[20px] max-w-xs mx-auto">
        {stepText || 'Analyzing pixels and segmenting foreground...'}
      </p>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 mb-6 overflow-hidden border border-slate-200/50">
        <div
          className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-500 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Local compute info */}
      <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-200/60 mb-4">
        <span className="flex items-center gap-1.5 font-medium">
          <Cpu className="w-3.5 h-3.5 text-indigo-500" />
          WebAssembly Neural Engine
        </span>
        <span>•</span>
        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
          <Shield className="w-3.5 h-3.5" />
          100% In-Browser
        </span>
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-slate-600 font-semibold underline cursor-pointer"
        >
          Cancel Operation
        </button>
      )}
    </div>
  );
};
