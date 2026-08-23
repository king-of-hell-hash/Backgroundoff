import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Paintbrush, Undo, RotateCcw, Check, X, ZoomIn, ZoomOut } from 'lucide-react';
import { loadImageElement } from '../utils/backgroundRemoval';

interface TouchupModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalUrl: string;
  cutoutBlob: Blob;
  onSaveCutout: (newBlob: Blob) => void;
}

export const TouchupModal: React.FC<TouchupModalProps> = ({
  isOpen,
  onClose,
  originalUrl,
  cutoutBlob,
  onSaveCutout,
}) => {
  const [tool, setTool] = useState<'erase' | 'restore'>('erase');
  const [brushSize, setBrushSize] = useState<number>(24);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const origImgRef = useRef<HTMLImageElement | null>(null);
  const cutoutImgRef = useRef<HTMLImageElement | null>(null);
  const historyRef = useRef<ImageData[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const initCanvas = async () => {
      const [origImg, cutImg] = await Promise.all([
        loadImageElement(originalUrl),
        loadImageElement(cutoutBlob),
      ]);
      if (!isMounted) return;

      origImgRef.current = origImg;
      cutoutImgRef.current = cutImg;

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = cutImg.naturalWidth || cutImg.width;
      canvas.height = cutImg.naturalHeight || cutImg.height;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(cutImg, 0, 0);

      // Save initial state
      historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
    };

    initCanvas();
    return () => {
      isMounted = false;
    };
  }, [isOpen, originalUrl, cutoutBlob]);

  if (!isOpen) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    drawOnCanvas(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      drawOnCanvas(e);
    }
  };

  const handlePointerUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });
      if (canvas && ctx) {
        historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        if (historyRef.current.length > 15) historyRef.current.shift();
      }
    }
  };

  const drawOnCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.save();
    if (tool === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Restore from original image
      if (origImgRef.current) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(origImgRef.current, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    }
    ctx.restore();
  };

  const handleUndo = () => {
    if (historyRef.current.length > 1) {
      historyRef.current.pop(); // remove current
      const prevState = historyRef.current[historyRef.current.length - 1];
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && prevState) {
        ctx.putImageData(prevState, 0, 0);
      }
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) {
        onSaveCutout(blob);
        onClose();
      }
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200/80">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Eraser className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Touch-Up Cutout Edges</h3>
              <p className="text-[11px] text-slate-500">Fine-tune pixels with manual precision eraser and restore brush</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTool('erase')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                tool === 'erase' 
                  ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-500/20' 
                  : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Erase Background</span>
            </button>
            <button
              onClick={() => setTool('restore')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                tool === 'restore' 
                  ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-500/20' 
                  : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span>Restore Subject</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-semibold">Brush Size:</span>
            <input
              type="range"
              min={6}
              max={64}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24 accent-indigo-600"
            />
            <span className="font-mono text-slate-700 font-bold w-6">{brushSize}px</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyRef.current.length <= 1}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-40 shadow-2xs cursor-pointer"
            >
              <Undo className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          </div>
        </div>

        {/* Canvas Workspace */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-100">
          <div
            className="rounded-2xl overflow-hidden shadow-xl border border-slate-300"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)',
              backgroundSize: '16px 16px',
              backgroundColor: '#ffffff',
            }}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="max-h-[55vh] max-w-full block cursor-crosshair touch-none"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200/80 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium hidden sm:block">
            {tool === 'erase' ? '💡 Click and drag over leftover background to erase.' : '💡 Click and drag over clipped areas to restore original pixels.'}
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
