import React from 'react';
import { ShieldCheck, Zap, Download, Layers, Camera, Palette } from 'lucide-react';

export const FeaturesFooter: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200/80 bg-slate-50/70 backdrop-blur-xs mt-20 py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-bold mb-3 shadow-2xs">
            <Zap className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
            <span>Browser-Native AI Technology</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
            Engineered for Precision, Speed & Absolute Privacy
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            High precision neural segmentation powered entirely by WebAssembly — zero servers, zero telemetry.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {/* Feature 1: Privacy First */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white/90 border border-slate-200/80 shadow-sm flex flex-col gap-3 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1.5">100% Client-Side Privacy</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Your photos never leave your device. All neural network inference is computed locally on your device via WebAssembly.
              </p>
            </div>
          </div>

          {/* Feature 2: High Resolution */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white/90 border border-slate-200/80 shadow-sm flex flex-col gap-3 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1.5">Standard, HD & Max Tiers</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Export ultra-crisp results from quick web previews up to full source native resolution with fine hair strand isolation.
              </p>
            </div>
          </div>

          {/* Feature 3: Multi-Format Export */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white/90 border border-slate-200/80 shadow-sm flex flex-col gap-3 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1.5">PNG, JPG & WebP Exports</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Save transparent PNG cutouts, solid white or colored JPGs for Amazon/Shopify listings, or high-efficiency WebP images.
              </p>
            </div>
          </div>

          {/* Feature 4: Progressive Web App */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white/90 border border-slate-200/80 shadow-sm flex flex-col gap-3 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 shadow-2xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1.5">Installable PWA & Offline</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Install as a native desktop or mobile app with File Handlers, Web Share Target, Window Controls Overlay, and offline cache.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="text-center text-xs text-slate-400 flex flex-wrap items-center justify-center gap-4 border-t border-slate-200/60 pt-6">
          <span className="font-semibold text-slate-500">BackgroundOff</span>
          <span>•</span>
          <span>Instant In-Browser Neural Cutout Tool</span>
          <span>•</span>
          <span className="text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            WASM Engine Online
          </span>
        </div>
      </div>
    </footer>
  );
};
