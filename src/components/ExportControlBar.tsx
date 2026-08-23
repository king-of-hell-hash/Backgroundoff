import React, { useState } from 'react';
import { Download, Copy, RefreshCw, Check, Sparkles, FileText, Layers, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExportFormat, ExportQuality, BackgroundSettings, SubjectAdjustments } from '../types';
import { exportRenderedBlob, triggerFileDownload, copyCutoutToClipboard, calculateTargetDimensions } from '../utils/exportUtils';

interface ExportControlBarProps {
  cutoutBlob: Blob;
  originalImageElement?: HTMLImageElement;
  bgSettings: BackgroundSettings;
  adjustments: SubjectAdjustments;
  origWidth: number;
  origHeight: number;
  onReset: () => void;
}

export const ExportControlBar: React.FC<ExportControlBarProps> = ({
  cutoutBlob,
  originalImageElement,
  bgSettings,
  adjustments,
  origWidth,
  origHeight,
  onReset,
}) => {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState<ExportQuality>('original');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  const targetDim = calculateTargetDimensions(origWidth, origHeight, quality);

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      const { blob, filename } = await exportRenderedBlob({
        cutoutBlob,
        originalImageElement,
        bgSettings,
        adjustments,
        format,
        quality,
      });

      triggerFileDownload(blob, filename);

      // Trigger pleasant confetti explosion
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B'],
        });
      } catch {
        // confetti fallback
      }
    } catch (err) {
      console.error('Export download failed:', err);
      alert('Failed to export image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyClipboard = async () => {
    const success = await copyCutoutToClipboard(cutoutBlob);
    if (success) {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    } else {
      alert('Your browser does not support direct image copying. Please use the Download button instead.');
    }
  };

  return (
    <div className="w-full bg-white/95 backdrop-blur-sm rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-lg shadow-slate-200/50 mb-8 transition-all" id="export-control-bar">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        {/* Left: Format & Quality Selectors */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5">
          {/* Format Selector (PNG / JPG / WebP) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Export Format</span>
            </label>
            <div className="inline-flex rounded-2xl bg-slate-100/90 p-1 border border-slate-200/80 shadow-2xs" id="export-format-selector">
              <button
                type="button"
                id="format-btn-png"
                onClick={() => setFormat('png')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  format === 'png'
                    ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-black/5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>PNG</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700">
                  Alpha
                </span>
              </button>

              <button
                type="button"
                id="format-btn-jpg"
                onClick={() => setFormat('jpg')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  format === 'jpg'
                    ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-black/5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>JPG</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700">
                  Fill
                </span>
              </button>

              <button
                type="button"
                id="format-btn-webp"
                onClick={() => setFormat('webp')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  format === 'webp'
                    ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-black/5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>WebP</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700">
                  Small
                </span>
              </button>
            </div>
          </div>

          {/* Quality / Resolution Selector (Standard / HD / Original) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Resolution Quality</span>
            </label>
            <div className="inline-flex rounded-2xl bg-slate-100/90 p-1 border border-slate-200/80 shadow-2xs" id="export-quality-selector">
              <button
                type="button"
                id="quality-btn-standard"
                onClick={() => setQuality('standard')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  quality === 'standard'
                    ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-black/5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Standard (~1024px)
              </button>

              <button
                type="button"
                id="quality-btn-hd"
                onClick={() => setQuality('hd')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  quality === 'hd'
                    ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-black/5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                HD (2048px)
              </button>

              <button
                type="button"
                id="quality-btn-original"
                onClick={() => setQuality('original')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                  quality === 'original'
                    ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-black/5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Original Max</span>
              </button>
            </div>
          </div>

          {/* Dimension indicator badge */}
          <div className="hidden xl:flex flex-col justify-end text-xs text-slate-500 font-mono pb-1 pl-2">
            <span className="font-bold text-slate-800">{targetDim.width} × {targetDim.height} px</span>
            <span className="text-[11px] text-slate-400">
              {format === 'png' ? 'Transparent Lossless' : format === 'jpg' ? 'Solid Color Fill' : 'Compressed WebP'}
            </span>
          </div>
        </div>

        {/* Right: Download + Copy + Try Another Image Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Copy to Clipboard */}
          <button
            type="button"
            id="copy-clipboard-btn"
            onClick={handleCopyClipboard}
            className="flex items-center gap-2 px-4 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/90 active:bg-slate-300 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200/80 transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Copy transparent PNG to clipboard"
          >
            {copiedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-indigo-600" />
                <span>Copy Cutout</span>
              </>
            )}
          </button>

          {/* Primary Download Button */}
          <button
            type="button"
            id="download-export-btn"
            onClick={handleDownload}
            disabled={isExporting}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-sm shadow-md shadow-indigo-600/30 hover:shadow-lg hover:shadow-indigo-600/40 transition-all active:scale-95 cursor-pointer disabled:opacity-50 ring-1 ring-indigo-500/20"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : `Download ${format.toUpperCase()}`}</span>
          </button>

          {/* Try Another Image / Reset Button */}
          <button
            type="button"
            id="reset-try-another-btn"
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-600 font-semibold text-xs sm:text-sm border border-slate-200/80 transition-all active:scale-95 cursor-pointer"
            title="Upload a different photo"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Try Another</span>
            <span className="sm:hidden">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
