import React, { useRef, useState, useEffect } from 'react';
import { Upload, Camera, Image as ImageIcon, Sparkles, AlertCircle, FileImage, Shield } from 'lucide-react';
import { SAMPLE_IMAGES } from '../data/sampleImages';
import { SampleImage } from '../types';

interface DropzoneSectionProps {
  onImageSelected: (file: File | Blob, name: string) => void;
  isLoading: boolean;
}

export const DropzoneSection: React.FC<DropzoneSectionProps> = ({
  onImageSelected,
  isLoading,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Handle system clipboard paste (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isLoading) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileValidation(file, 'pasted-image.png');
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isLoading]);

  const handleFileValidation = (file: File, fallbackName?: string) => {
    setErrorMessage(null);

    // Validate mime type
    if (!file.type.startsWith('image/') && !file.name.match(/\.(jpg|jpeg|png|webp|avif|heic|bmp|tiff)$/i)) {
      setErrorMessage('Unsupported file format. Please upload a PNG, JPG, WEBP, or AVIF image.');
      return;
    }

    // Validate size (max 30MB)
    const maxSizeBytes = 30 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMessage('Image is too large. Please upload an image under 30MB.');
      return;
    }

    onImageSelected(file, file.name || fallbackName || 'uploaded-image.png');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileValidation(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleSampleClick = async (sample: SampleImage) => {
    if (isLoading) return;
    try {
      setErrorMessage(null);
      // Fetch sample image as blob
      const res = await fetch(sample.fullUrl);
      if (!res.ok) throw new Error('Failed to load sample image');
      const blob = await res.blob();
      onImageSelected(blob, `${sample.id}.jpg`);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to load sample image. Please try uploading your own photo.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12 relative">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Title & Tagline */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-200/70 text-indigo-700 text-xs font-semibold mb-4 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Automatic 1-Click Neural Background Eraser</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Remove Image Background <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600">
            100% Free & In Seconds
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
          Drop any photo to instantly isolate people, products, animals, and objects with sharp edge precision. 
          Processed locally in your browser for absolute privacy.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50/90 border border-red-200 text-red-700 flex items-center gap-3 text-sm animate-fade-in shadow-xs" id="upload-error-alert">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span className="flex-1 font-medium">{errorMessage}</span>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="text-xs text-red-800 font-semibold underline hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Upload Dropzone */}
      <div
        id="image-dropzone-container"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative group rounded-3xl border-2 border-dashed transition-all duration-300 p-8 sm:p-14 text-center bg-white/90 backdrop-blur-sm shadow-sm ${
          isDragOver
            ? 'border-indigo-600 bg-indigo-50/60 scale-[1.01] shadow-2xl shadow-indigo-500/15 ring-4 ring-indigo-500/10'
            : 'border-slate-300/90 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5'
        }`}
      >
        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/*"
          className="hidden"
          id="browse-file-input"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileValidation(e.target.files[0]);
            }
          }}
        />

        {/* Dedicated mobile capture input */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          id="camera-capture-input"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileValidation(e.target.files[0], 'camera-capture.jpg');
            }
          }}
        />

        {/* Dropzone Inner Icon */}
        <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-500/25 transition-all duration-300">
          <Upload className="w-9 h-9" />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
          {isDragOver ? 'Drop your image here!' : 'Drag & drop an image here'}
        </h3>
        <p className="text-sm text-slate-500 mb-7 max-w-md mx-auto">
          Paste from clipboard (<kbd className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs border border-slate-200 shadow-2xs">Ctrl+V</kbd> / <kbd className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs border border-slate-200 shadow-2xs">⌘V</kbd>) or choose an upload method:
        </p>

        {/* Input Methods: Browse File + Camera/Gallery Access */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-7">
          {/* 1. Browse / Upload Button */}
          <button
            type="button"
            id="browse-upload-button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 hover:shadow-lg hover:shadow-indigo-600/35 transition-all active:scale-95 cursor-pointer ring-1 ring-indigo-500/20"
          >
            <FileImage className="w-4 h-4" />
            <span>Choose File</span>
          </button>

          {/* 2. Direct Camera / Gallery Access on Mobile */}
          <button
            type="button"
            id="camera-capture-button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/90 active:bg-slate-300 text-slate-800 font-semibold text-sm border border-slate-200/80 transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <Camera className="w-4 h-4 text-indigo-600" />
            <span>Take Photo / Camera</span>
          </button>

          {/* 3. Photo Gallery Alternative */}
          <button
            type="button"
            id="gallery-picker-button"
            onClick={() => fileInputRef.current?.click()}
            className="sm:hidden flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/90 text-slate-800 font-semibold text-sm border border-slate-200/80"
          >
            <ImageIcon className="w-4 h-4 text-blue-600" />
            <span>Photo Gallery</span>
          </button>
        </div>

        {/* Badges / Limits */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 font-medium pt-4 border-t border-slate-100">
          <span className="flex items-center gap-1.5 text-slate-600">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            No images uploaded to cloud server
          </span>
          <span>•</span>
          <span>Formats: PNG, JPG, WEBP, AVIF</span>
          <span>•</span>
          <span>Max Size: 30MB</span>
        </div>
      </div>

      {/* Sample Images Section for Instant Testing */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-3.5 px-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            No image? Try one of these samples:
          </p>
          <span className="text-xs text-indigo-600 font-semibold">Click to test instantly</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4" id="sample-images-grid">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              id={`sample-btn-${sample.id}`}
              onClick={() => handleSampleClick(sample)}
              disabled={isLoading}
              className="group relative rounded-2xl overflow-hidden border border-slate-200/80 bg-white hover:border-indigo-400 hover:shadow-md transition-all text-left flex flex-col focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <div className="aspect-square w-full overflow-hidden bg-slate-100 relative">
                <img
                  src={sample.thumbnailUrl}
                  alt={sample.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/65 backdrop-blur-xs text-white text-[10px] font-semibold">
                  {sample.category}
                </span>
              </div>
              <div className="p-2.5 bg-white flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 truncate">{sample.name}</span>
                <Sparkles className="w-3 h-3 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
