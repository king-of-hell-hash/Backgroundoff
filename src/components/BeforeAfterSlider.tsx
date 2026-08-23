import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Columns, SplitSquareVertical, Eye, Image as ImageIcon, ZoomIn, ZoomOut, Maximize2, MoveHorizontal } from 'lucide-react';
import { ViewMode, BackgroundSettings, SubjectAdjustments } from '../types';

interface BeforeAfterSliderProps {
  originalUrl: string;
  cutoutUrl: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  bgSettings: BackgroundSettings;
  adjustments: SubjectAdjustments;
  imageWidth: number;
  imageHeight: number;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  originalUrl,
  cutoutUrl,
  viewMode,
  onViewModeChange,
  bgSettings,
  adjustments,
  imageWidth,
  imageHeight,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = fit, 1.5, 2
  const containerRef = useRef<HTMLDivElement>(null);

  // Background styling logic
  const getBackgroundStyle = (): React.CSSProperties => {
    if (bgSettings.type === 'transparent') {
      return {
        backgroundImage: bgSettings.checkerboardTheme === 'light'
          ? 'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)'
          : 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
        backgroundSize: '24px 24px',
        backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
        backgroundColor: bgSettings.checkerboardTheme === 'light' ? '#ffffff' : '#0f172a',
      };
    }
    if (bgSettings.type === 'solid') {
      return { backgroundColor: bgSettings.solidColor };
    }
    if (bgSettings.type === 'gradient') {
      if (bgSettings.gradientId === 'sunset-glow') {
        return { background: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)' };
      }
      if (bgSettings.gradientId === 'deep-space') {
        return { background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' };
      }
      if (bgSettings.gradientId === 'ocean-breeze') {
        return { background: 'linear-gradient(135deg, #a5f3fc 0%, #93c5fd 50%, #c4b5fd 100%)' };
      }
      if (bgSettings.gradientId === 'minty-fresh') {
        return { background: 'linear-gradient(135deg, #a7f3d0 0%, #3b82f6 100%)' };
      }
      if (bgSettings.gradientId === 'soft-pastel') {
        return { background: 'linear-gradient(135deg, #fbcfe8 0%, #fed7aa 50%, #fef08a 100%)' };
      }
      if (bgSettings.gradientId === 'neon-cyber') {
        return { background: 'linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)' };
      }
      return { background: 'radial-gradient(circle at center, #ffffff 0%, #cbd5e1 100%)' };
    }
    if ((bgSettings.type === 'custom_image' || bgSettings.type === 'ai_generated') && bgSettings.customImageUrl) {
      return {
        backgroundImage: `url(${bgSettings.customImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return {};
  };

  const getSubjectFilter = () => {
    const filters: string[] = [];
    if (adjustments.brightness !== 100) filters.push(`brightness(${adjustments.brightness}%)`);
    if (adjustments.contrast !== 100) filters.push(`contrast(${adjustments.contrast}%)`);
    if (adjustments.saturation !== 100) filters.push(`saturate(${adjustments.saturation}%)`);
    return filters.length > 0 ? filters.join(' ') : undefined;
  };

  const getSubjectDropShadow = () => {
    if (!adjustments.dropShadow) return undefined;
    return `drop-shadow(0px ${adjustments.shadowOffsetY || 16}px ${adjustments.shadowBlur || 24}px rgba(0, 0, 0, ${adjustments.shadowOpacity || 0.4}))`;
  };

  const handlePointerMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handleMouseDown = () => setIsDragging(true);

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMove = (e: MouseEvent) => {
      if (isDragging) handlePointerMove(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) handlePointerMove(e.touches[0].clientX);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handlePointerMove]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top View Selector & Zoom Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-4 px-1">
        {/* View Mode Pills */}
        <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-2xs" id="view-mode-tabs">
          <button
            id="view-mode-slider"
            onClick={() => onViewModeChange('slider')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'slider'
                ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-black/5 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Before / After Slider</span>
          </button>

          <button
            id="view-mode-side-by-side"
            onClick={() => onViewModeChange('side-by-side')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'side-by-side'
                ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-black/5 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side by Side</span>
          </button>

          <button
            id="view-mode-cutout"
            onClick={() => onViewModeChange('cutout-only')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'cutout-only'
                ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-black/5 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Cutout Only</span>
          </button>

          <button
            id="view-mode-original"
            onClick={() => onViewModeChange('original-only')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'original-only'
                ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-black/5 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Original</span>
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2.5 text-xs text-slate-600">
          <span className="text-slate-500 font-mono text-[11px] bg-slate-100 px-2 py-1 rounded-md border border-slate-200/60">
            {imageWidth} × {imageHeight} px
          </span>
          <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200/80 p-0.5 shadow-2xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
              className="p-1.5 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Zoom out"
              id="zoom-out-btn"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] font-bold text-slate-700 select-none">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
              className="p-1.5 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Zoom in"
              id="zoom-in-btn"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoomLevel !== 1 && (
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1.5 hover:text-indigo-600 text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Reset zoom to fit"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Workspace Display Card */}
      <div className="w-full relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-lg shadow-slate-200/40 bg-slate-100/70 backdrop-blur-xs p-3 sm:p-5 flex items-center justify-center">
        <div className="w-full max-h-[68vh] overflow-auto flex items-center justify-center rounded-2xl">
          {/* Mode 1: Interactive Before / After Slider */}
          {viewMode === 'slider' && (
            <div
              ref={containerRef}
              id="before-after-slider-box"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
              className="relative select-none cursor-ew-resize rounded-2xl overflow-hidden shadow-md transition-transform duration-100 max-w-full"
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
            >
              {/* Layer 1: Background + Cutout Result (Right/Bottom layer) */}
              <div
                className="relative overflow-hidden"
                style={getBackgroundStyle()}
              >
                {/* Blur backdrop layer if blur mode */}
                {bgSettings.type === 'blur' && (
                  <img
                    src={originalUrl}
                    alt="Blurred background"
                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-lg brightness-90"
                    referrerPolicy="no-referrer"
                  />
                )}
                {/* Foreground cutout subject */}
                <img
                  src={cutoutUrl}
                  alt="Transparent Cutout"
                  className="block max-h-[60vh] max-w-full w-auto object-contain pointer-events-none relative z-10"
                  style={{
                    filter: getSubjectFilter(),
                    ...(adjustments.dropShadow ? { filter: `${getSubjectFilter() || ''} ${getSubjectDropShadow()}`.trim() } : {}),
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Layer 2: Original Image (Clipped to slider position) */}
              <div
                className="absolute inset-y-0 left-0 overflow-hidden z-20 pointer-events-none"
                style={{ width: `${sliderPos}%` }}
              >
                <img
                  src={originalUrl}
                  alt="Original Reference"
                  className="block max-h-[60vh] max-w-none w-auto object-contain"
                  style={{
                    // Lock width and height to match container dimensions
                    height: containerRef.current?.clientHeight || '100%',
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Slider Divider Line + Handle */}
              <div
                className="absolute inset-y-0 z-30 pointer-events-none flex items-center justify-center"
                style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
              >
                {/* Vertical line */}
                <div className="w-0.5 h-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]" />

                {/* Draggable Badge Handle */}
                <div className="absolute w-9 h-9 rounded-full bg-white text-indigo-600 shadow-xl border border-slate-200/90 flex items-center justify-center pointer-events-auto hover:scale-110 active:scale-95 transition-transform cursor-ew-resize ring-2 ring-indigo-500/20">
                  <MoveHorizontal className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>

              {/* Floating badges (Original vs Removed) */}
              <span className="absolute bottom-3 left-3 z-25 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase pointer-events-none shadow-sm">
                Original
              </span>
              <span className="absolute bottom-3 right-3 z-25 px-3 py-1 rounded-lg bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase pointer-events-none shadow-sm">
                Background Off
              </span>
            </div>
          )}

          {/* Mode 2: Side-by-Side View */}
          {viewMode === 'side-by-side' && (
            <div
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl transition-transform duration-100"
              id="side-by-side-view"
            >
              {/* Original card */}
              <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-white flex flex-col items-center justify-center p-3 relative shadow-xs">
                <span className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-lg bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider">
                  Original
                </span>
                <img
                  src={originalUrl}
                  alt="Original"
                  className="max-h-[50vh] max-w-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Cutout card */}
              <div
                className="rounded-2xl overflow-hidden border border-slate-200/80 flex flex-col items-center justify-center p-3 relative shadow-xs"
                style={getBackgroundStyle()}
              >
                <span className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-lg bg-indigo-600/90 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider">
                  Background Removed
                </span>
                {bgSettings.type === 'blur' && (
                  <img
                    src={originalUrl}
                    alt="Blurred background"
                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-lg brightness-90"
                    referrerPolicy="no-referrer"
                  />
                )}
                <img
                  src={cutoutUrl}
                  alt="Cutout"
                  className="max-h-[50vh] max-w-full object-contain relative z-10"
                  style={{
                    filter: getSubjectFilter(),
                    ...(adjustments.dropShadow ? { filter: `${getSubjectFilter() || ''} ${getSubjectDropShadow()}`.trim() } : {}),
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          )}

          {/* Mode 3: Cutout Only */}
          {viewMode === 'cutout-only' && (
            <div
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
              className="relative rounded-2xl overflow-hidden shadow-md transition-transform duration-100 max-w-full flex items-center justify-center"
            >
              <div className="relative overflow-hidden rounded-2xl" style={getBackgroundStyle()}>
                {bgSettings.type === 'blur' && (
                  <img
                    src={originalUrl}
                    alt="Blurred background"
                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-lg brightness-90"
                    referrerPolicy="no-referrer"
                  />
                )}
                <img
                  src={cutoutUrl}
                  alt="Cutout only"
                  className="max-h-[60vh] max-w-full object-contain relative z-10"
                  style={{
                    filter: getSubjectFilter(),
                    ...(adjustments.dropShadow ? { filter: `${getSubjectFilter() || ''} ${getSubjectDropShadow()}`.trim() } : {}),
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          )}

          {/* Mode 4: Original Only */}
          {viewMode === 'original-only' && (
            <div
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
              className="relative rounded-2xl overflow-hidden shadow-md transition-transform duration-100 max-w-full flex items-center justify-center bg-white p-3 border border-slate-200/80"
            >
              <img
                src={originalUrl}
                alt="Original only"
                className="max-h-[60vh] max-w-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
