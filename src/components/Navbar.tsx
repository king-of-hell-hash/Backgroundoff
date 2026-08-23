import React from 'react';
import { Sparkles, ImagePlus, ShieldCheck, Zap, Download, WifiOff, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  hasImage: boolean;
  onReset: () => void;
  isInstallable?: boolean;
  onInstall?: () => void;
  onOpenPwaModal?: () => void;
  isOnline?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  hasImage,
  onReset,
  isInstallable = false,
  onInstall,
  onOpenPwaModal,
  isOnline = true,
}) => {
  return (
    <header className="w-full bg-white/90 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-40 shadow-xs transition-colors wco-draggable select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none group wco-non-draggable"
          onClick={hasImage ? onReset : undefined}
          id="app-brand-header"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white ring-1 ring-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Background<span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">Off</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50/90 text-indigo-700 border border-indigo-200/70 uppercase">
                PWA Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Free Progressive Web App AI Background Remover
            </p>
          </div>
        </div>

        {/* Badges & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 wco-non-draggable">
          {/* Offline warning indicator */}
          {!isOnline && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold animate-pulse">
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              <span>Offline Mode</span>
            </span>
          )}

          {/* Privacy Badge */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/80 text-emerald-700 border border-emerald-200/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% In-Browser
            </span>
          </div>

          {/* PWA Capabilities Status Button */}
          <button
            onClick={onOpenPwaModal}
            id="pwa-status-pill-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-indigo-700 bg-indigo-50/90 hover:bg-indigo-100/80 border border-indigo-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Inspect PWA Manifest, Service Worker, and Advanced Web Capabilities"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">PWA Verified</span>
            <span className="sm:hidden">PWA</span>
          </button>

          {/* Install App Button (When install prompt is ready or fallback) */}
          {isInstallable && onInstall && (
            <button
              onClick={onInstall}
              id="install-pwa-nav-btn"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-sm shadow-indigo-600/25 active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Install App</span>
            </button>
          )}

          {/* Reset / New Image Button */}
          {hasImage && (
            <button
              onClick={onReset}
              id="nav-new-image-btn"
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200/90 active:bg-slate-300 border border-slate-200/80 active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              <ImagePlus className="w-4 h-4 text-indigo-600" />
              <span>New Image</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
