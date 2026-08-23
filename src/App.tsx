/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { DropzoneSection } from './components/DropzoneSection';
import { ProcessingIndicator } from './components/ProcessingIndicator';
import { BeforeAfterSlider } from './components/BeforeAfterSlider';
import { BackgroundPicker } from './components/BackgroundPicker';
import { ExportControlBar } from './components/ExportControlBar';
import { TouchupModal } from './components/TouchupModal';
import { FeaturesFooter } from './components/FeaturesFooter';
import { PwaCapabilitiesModal } from './components/PwaCapabilitiesModal';
import { GeminiHelpChat } from './components/GeminiHelpChat';
import {
  ImageMetadata,
  ProcessingState,
  ViewMode,
  BackgroundSettings,
  SubjectAdjustments,
} from './types';
import { processBackgroundRemoval, loadImageElement } from './utils/backgroundRemoval';
import {
  registerServiceWorker,
  initFileHandlers,
  checkShareTargetPayload,
  checkUrlParameters,
  setupInstallPrompt,
  triggerInstall,
  sendLocalNotification,
} from './utils/pwaManager';
import { Sparkles, AlertCircle, RefreshCw, Edit3, ArrowLeft, Download, ShieldCheck } from 'lucide-react';

export default function App() {
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [originalImageElement, setOriginalImageElement] = useState<HTMLImageElement | null>(null);
  const [cutoutBlob, setCutoutBlob] = useState<Blob | null>(null);
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);

  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [stepText, setStepText] = useState<string>('Initializing...');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('slider');
  const [isTouchupOpen, setIsTouchupOpen] = useState<boolean>(false);

  // PWA State
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isNoteMode, setIsNoteMode] = useState<boolean>(false);

  // Background Customization State
  const [bgSettings, setBgSettings] = useState<BackgroundSettings>({
    type: 'transparent',
    solidColor: '#FFFFFF',
    gradientId: 'studio-light',
    blurAmount: 16,
    checkerboardTheme: 'light',
  });

  // Subject Adjustments State
  const [adjustments, setAdjustments] = useState<SubjectAdjustments>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    feather: 0,
    dropShadow: false,
    shadowBlur: 24,
    shadowOpacity: 0.4,
    shadowOffsetY: 16,
    shadowColor: '#000000',
  });

  // Clean up object URLs on unmount or reset
  const cleanupUrls = useCallback(() => {
    if (metadata?.originalUrl && metadata.originalUrl.startsWith('blob:')) {
      URL.revokeObjectURL(metadata.originalUrl);
    }
    if (cutoutUrl && cutoutUrl.startsWith('blob:')) {
      URL.revokeObjectURL(cutoutUrl);
    }
  }, [metadata, cutoutUrl]);

  const handleReset = () => {
    cleanupUrls();
    setMetadata(null);
    setOriginalImageElement(null);
    setCutoutBlob(null);
    setCutoutUrl(null);
    setProcessingState('idle');
    setErrorMessage(null);
    setProgressPercent(0);
    setStepText('');
    setBgSettings({
      type: 'transparent',
      solidColor: '#FFFFFF',
      gradientId: 'studio-light',
      blurAmount: 16,
      checkerboardTheme: 'light',
    });
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      feather: 0,
      dropShadow: false,
      shadowBlur: 24,
      shadowOpacity: 0.4,
      shadowOffsetY: 16,
      shadowColor: '#000000',
    });
  };

  const handleImageSelected = useCallback(async (source: File | Blob, name: string) => {
    try {
      cleanupUrls();
      setErrorMessage(null);
      setProcessingState('loading_model');
      setProgressPercent(10);
      setStepText('Reading image file...');

      const originalUrl = URL.createObjectURL(source);
      const imgElement = await loadImageElement(originalUrl);
      setOriginalImageElement(imgElement);

      const meta: ImageMetadata = {
        file: source instanceof File ? source : undefined,
        name: name || 'image.png',
        originalUrl,
        width: imgElement.naturalWidth || imgElement.width,
        height: imgElement.naturalHeight || imgElement.height,
        sizeBytes: source.size || 0,
      };
      setMetadata(meta);

      setProcessingState('processing');
      setStepText('Loading neural network model...');
      setProgressPercent(25);

      // Perform background removal
      const blob = await processBackgroundRemoval(source, (step, pct) => {
        setStepText(step);
        setProgressPercent(pct);
      });

      const cutUrl = URL.createObjectURL(blob);
      setCutoutBlob(blob);
      setCutoutUrl(cutUrl);
      setProcessingState('completed');
      setProgressPercent(100);

      // Send local notification if permitted
      sendLocalNotification(
        'Background Removed!',
        `Finished isolating subject for ${meta.name} successfully.`
      );
    } catch (err: any) {
      console.error('Background removal failed:', err);
      setProcessingState('error');
      setErrorMessage(
        err?.message || 'Unable to remove background. Please try another image or format.'
      );
    }
  }, [cleanupUrls]);

  // Initialize PWA features (Service Worker, File Handlers, Web Share Target, Protocol Handlers)
  useEffect(() => {
    // 1. Register Service Worker
    registerServiceWorker();

    // 2. Setup install prompt handler
    setupInstallPrompt((installable) => {
      setIsInstallable(installable);
    });

    // 3. Setup File Handlers launchQueue
    initFileHandlers(handleImageSelected);

    // 4. Check for Web Share Target incoming files
    checkShareTargetPayload(handleImageSelected);

    // 5. Check URL parameters for protocol handler links, note shortcuts, etc.
    checkUrlParameters(handleImageSelected);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('note') === '1') {
      setIsNoteMode(true);
    }

    // 6. Online/offline connectivity listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleImageSelected]);

  const handleSaveTouchup = (newBlob: Blob) => {
    if (cutoutUrl && cutoutUrl.startsWith('blob:')) {
      URL.revokeObjectURL(cutoutUrl);
    }
    const newUrl = URL.createObjectURL(newBlob);
    setCutoutBlob(newBlob);
    setCutoutUrl(newUrl);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        hasImage={!!metadata && processingState === 'completed'}
        onReset={handleReset}
        isInstallable={isInstallable}
        onInstall={triggerInstall}
        onOpenPwaModal={() => setIsPwaModalOpen(true)}
        isOnline={isOnline}
      />

      {/* Note Taking Mode Alert (if launched via OS new-note shortcut) */}
      {isNoteMode && processingState === 'idle' && (
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4">
          <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Note Taking Mode: Paste from clipboard (<kbd className="bg-white px-1.5 py-0.5 rounded border border-indigo-200">Ctrl+V</kbd> / <kbd className="bg-white px-1.5 py-0.5 rounded border border-indigo-200">⌘V</kbd>) or drop an image for instant cutout into your notes.
              </span>
            </div>
            <button
              onClick={() => setIsNoteMode(false)}
              className="text-xs text-indigo-700 underline hover:text-indigo-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* State 1: Idle (Upload Dropzone & Methods) */}
        {processingState === 'idle' && (
          <DropzoneSection
            onImageSelected={handleImageSelected}
            isLoading={false}
          />
        )}

        {/* State 2 & 3: Loading / Processing AI Inference */}
        {(processingState === 'loading_model' || processingState === 'processing') && (
          <div className="py-12 flex flex-col items-center justify-center">
            <ProcessingIndicator
              stepText={stepText}
              percentage={progressPercent}
              onCancel={handleReset}
            />
          </div>
        )}

        {/* State 4: Error State */}
        {processingState === 'error' && (
          <div className="max-w-lg mx-auto p-8 rounded-3xl bg-white border border-red-200 shadow-xl text-center my-12 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Processing Error</h3>
            <p className="text-sm text-slate-600 mb-6">
              {errorMessage || 'Failed to process this image.'}
            </p>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Another Photo</span>
            </button>
          </div>
        )}

        {/* State 5: Completed (Interactive Result Workspace) */}
        {processingState === 'completed' && metadata && cutoutUrl && cutoutBlob && (
          <div className="w-full animate-fade-in">
            {/* Action Sub-Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-all shadow-2xs cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-500" />
                  <span>Upload Another</span>
                </button>
                <div className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">{metadata.name}</span>
                  <span className="mx-1.5">•</span>
                  <span>{metadata.width} × {metadata.height} px</span>
                </div>
              </div>

              {/* Touch-up button */}
              <div className="flex items-center gap-2">
                <button
                  id="touchup-brush-btn"
                  onClick={() => setIsTouchupOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 text-xs sm:text-sm font-semibold transition-all shadow-2xs cursor-pointer"
                  title="Manually erase extra artifacts or restore subject parts"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Manual Touch-Up Brush</span>
                </button>
              </div>
            </div>

            {/* Live Before / After Comparison Slider */}
            <div className="mb-6">
              <BeforeAfterSlider
                originalUrl={metadata.originalUrl}
                cutoutUrl={cutoutUrl}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                bgSettings={bgSettings}
                adjustments={adjustments}
                imageWidth={metadata.width}
                imageHeight={metadata.height}
              />
            </div>

            {/* Background Customizer & Effects Panel */}
            <BackgroundPicker
              bgSettings={bgSettings}
              onBgSettingsChange={setBgSettings}
              adjustments={adjustments}
              onAdjustmentsChange={setAdjustments}
            />

            {/* Export & Resolution Download Bar */}
            <ExportControlBar
              cutoutBlob={cutoutBlob}
              originalImageElement={originalImageElement || undefined}
              bgSettings={bgSettings}
              adjustments={adjustments}
              origWidth={metadata.width}
              origHeight={metadata.height}
              onReset={handleReset}
            />
          </div>
        )}
      </main>

      {/* Manual Touch-Up Modal */}
      {metadata && cutoutBlob && (
        <TouchupModal
          isOpen={isTouchupOpen}
          onClose={() => setIsTouchupOpen(false)}
          originalUrl={metadata.originalUrl}
          cutoutBlob={cutoutBlob}
          onSaveCutout={handleSaveTouchup}
        />
      )}

      {/* PWA Capabilities & Verification Modal */}
      <PwaCapabilitiesModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
        isInstallable={isInstallable}
      />

      {/* Floating Gemini AI Help Chatbot */}
      <GeminiHelpChat
        onOpenTouchup={() => {
          if (metadata && cutoutBlob) {
            setIsTouchupOpen(true);
          }
        }}
        onSelectAiBackdropTab={() => {
          setBgSettings((prev) => ({ ...prev, type: 'ai_generated' }));
          const el = document.getElementById('background-picker-panel');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* Footer */}
      <FeaturesFooter />
    </div>
  );
}
