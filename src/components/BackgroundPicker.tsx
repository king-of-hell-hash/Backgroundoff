import React, { useRef, useState } from 'react';
import {
  Palette,
  Check,
  Sparkles,
  Upload,
  Eye,
  Sliders,
  Wand2,
  RefreshCw,
  AlertCircle,
  Clock,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import { BackgroundSettings, SubjectAdjustments, AiBackdropItem } from '../types';
import { SOLID_COLOR_PRESETS, GRADIENT_PRESETS, SCENIC_BACKDROPS } from '../data/backgroundPresets';
import { generateAiBackdrop } from '../utils/geminiApi';

interface BackgroundPickerProps {
  bgSettings: BackgroundSettings;
  onBgSettingsChange: (settings: BackgroundSettings) => void;
  adjustments: SubjectAdjustments;
  onAdjustmentsChange: (adjustments: SubjectAdjustments) => void;
}

const AI_PRESET_PROMPTS = [
  {
    label: 'Studio',
    prompt: 'Minimalist photography studio with soft warm rim lighting, smooth concrete floor, and clean subtle shadow depth',
    icon: '✨',
  },
  {
    label: 'Nature',
    prompt: 'Lush tropical botanical garden with gentle golden sunlight filtering through monstera and palm foliage',
    icon: '🌿',
  },
  {
    label: 'Urban',
    prompt: 'Modern city street sidewalk at twilight with aesthetic blurred bokeh background and warm evening lights',
    icon: '🏙️',
  },
  {
    label: 'Abstract gradient',
    prompt: 'Luxurious fluid 3D pastel mesh gradient with soft diffused lighting, ethereal curves, and smooth texture',
    icon: '🎨',
  },
  {
    label: 'Office',
    prompt: 'Sleek contemporary executive office with floor-to-ceiling glass windows and panoramic skyline view',
    icon: '💼',
  },
  {
    label: 'Luxury Podium',
    prompt: 'Dark polished marble exhibition podium stage with dramatic studio spotlight and subtle gold reflections',
    icon: '💎',
  },
  {
    label: 'Cyberpunk Neon',
    prompt: 'Futuristic sci-fi alleyway with vibrant neon violet and cyan reflections on glossy wet pavement',
    icon: '⚡',
  },
  {
    label: 'Golden Hour Beach',
    prompt: 'Scenic tropical beach shoreline with soft golden sand, calm turquoise ocean waves, and warm sunset glow',
    icon: '🌅',
  },
];

export const BackgroundPicker: React.FC<BackgroundPickerProps> = ({
  bgSettings,
  onBgSettingsChange,
  adjustments,
  onAdjustmentsChange,
}) => {
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  // AI Generation State
  const [aiPromptInput, setAiPromptInput] = useState<string>(bgSettings.aiPrompt || '');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiLoadingMessage, setAiLoadingMessage] = useState<string>('Creating your backdrop...');
  const [aiError, setAiError] = useState<string | null>(null);

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      onBgSettingsChange({
        ...bgSettings,
        type: 'custom_image',
        customImageUrl: url,
      });
    }
  };

  const handleGenerateBackdrop = async (promptToUse?: string) => {
    const prompt = (promptToUse || aiPromptInput).trim();
    if (!prompt) {
      setAiError('Please enter a description for the backdrop or pick a preset.');
      return;
    }

    try {
      setIsAiGenerating(true);
      setAiError(null);
      setAiLoadingMessage('Creating your backdrop with Gemini AI...');

      // Subtle step progression message
      const timer1 = setTimeout(() => {
        setAiLoadingMessage('Synthesizing lighting and depth...');
      }, 1500);
      const timer2 = setTimeout(() => {
        setAiLoadingMessage('Rendering high-resolution details...');
      }, 3500);

      const result = await generateAiBackdrop(prompt);
      clearTimeout(timer1);
      clearTimeout(timer2);

      const newItem: AiBackdropItem = {
        id: `ai-${Date.now()}`,
        url: result.imageUrl,
        prompt: prompt,
        timestamp: Date.now(),
      };

      const existingHistory = bgSettings.aiBackdropHistory || [];
      // Keep up to 4 recent backdrops in history
      const updatedHistory = [newItem, ...existingHistory.filter((item) => item.url !== result.imageUrl)].slice(0, 4);

      onBgSettingsChange({
        ...bgSettings,
        type: 'ai_generated',
        customImageUrl: result.imageUrl,
        aiPrompt: prompt,
        aiBackdropHistory: updatedHistory,
      });
    } catch (err: any) {
      console.error('AI backdrop generation error:', err);
      setAiError(err?.message || 'Unable to generate backdrop. Please try rephrasing your prompt.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSelectHistoryBackdrop = (item: AiBackdropItem) => {
    onBgSettingsChange({
      ...bgSettings,
      type: 'ai_generated',
      customImageUrl: item.url,
      aiPrompt: item.prompt,
    });
    setAiPromptInput(item.prompt);
  };

  return (
    <div className="w-full bg-white/90 backdrop-blur-sm rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm mb-6 transition-all" id="background-picker-panel">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Customize Background & Effects</h4>
            <p className="text-[11px] text-slate-500 font-medium sm:hidden">
              Preview on different backdrops
            </p>
          </div>
        </div>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Preview cutout on transparent, solid, gradient, custom, or AI-generated backdrops
        </span>
      </div>

      {/* Category Tabs: Transparent / Color / Gradient / Blur / Image / Generate with AI */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Transparent */}
        <button
          id="bg-tab-transparent"
          onClick={() => onBgSettingsChange({ ...bgSettings, type: 'transparent' })}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            bgSettings.type === 'transparent'
              ? 'bg-indigo-50/80 text-indigo-700 border-indigo-200 shadow-2xs ring-1 ring-indigo-500/10'
              : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
          }`}
        >
          <div className="w-3.5 h-3.5 rounded border border-slate-300 bg-[linear-gradient(45deg,#ccc_25%,transparent_25%),linear-gradient(-45deg,#ccc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ccc_75%)] bg-[size:6px_6px]" />
          <span>Transparent (PNG)</span>
        </button>

        {/* Solid Color */}
        <button
          id="bg-tab-solid"
          onClick={() => onBgSettingsChange({ ...bgSettings, type: 'solid' })}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            bgSettings.type === 'solid'
              ? 'bg-indigo-50/80 text-indigo-700 border-indigo-200 shadow-2xs ring-1 ring-indigo-500/10'
              : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
          }`}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border border-slate-300" />
          <span>Solid Color</span>
        </button>

        {/* Gradients */}
        <button
          id="bg-tab-gradient"
          onClick={() => onBgSettingsChange({ ...bgSettings, type: 'gradient' })}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            bgSettings.type === 'gradient'
              ? 'bg-indigo-50/80 text-indigo-700 border-indigo-200 shadow-2xs ring-1 ring-indigo-500/10'
              : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Studio Gradients</span>
        </button>

        {/* Blur Original */}
        <button
          id="bg-tab-blur"
          onClick={() => onBgSettingsChange({ ...bgSettings, type: 'blur' })}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            bgSettings.type === 'blur'
              ? 'bg-indigo-50/80 text-indigo-700 border-indigo-200 shadow-2xs ring-1 ring-indigo-500/10'
              : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-cyan-600" />
          <span>Blur Background</span>
        </button>

        {/* Custom Backdrop */}
        <button
          id="bg-tab-custom-image"
          onClick={() => onBgSettingsChange({ ...bgSettings, type: 'custom_image' })}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            bgSettings.type === 'custom_image'
              ? 'bg-indigo-50/80 text-indigo-700 border-indigo-200 shadow-2xs ring-1 ring-indigo-500/10'
              : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
          }`}
        >
          <Upload className="w-3.5 h-3.5 text-emerald-600" />
          <span>Custom Backdrop</span>
        </button>

        {/* Generate with AI */}
        <button
          id="bg-tab-ai-generated"
          onClick={() => onBgSettingsChange({ ...bgSettings, type: 'ai_generated' })}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            bgSettings.type === 'ai_generated'
              ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-300 shadow-2xs ring-2 ring-indigo-500/20'
              : 'bg-gradient-to-r from-indigo-50/40 to-purple-50/40 text-indigo-700/80 border-indigo-200/80 hover:border-indigo-300'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          <span>Generate with AI</span>
          <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-[9px] font-extrabold text-white tracking-wide uppercase">
            AI
          </span>
        </button>
      </div>

      {/* Sub-controls based on selected background */}
      {bgSettings.type === 'transparent' && (
        <div className="flex items-center gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 text-xs">
          <span className="font-semibold text-slate-700">Checkerboard grid preview:</span>
          <button
            onClick={() => onBgSettingsChange({ ...bgSettings, checkerboardTheme: 'light' })}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              bgSettings.checkerboardTheme === 'light' ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Light Grid
          </button>
          <button
            onClick={() => onBgSettingsChange({ ...bgSettings, checkerboardTheme: 'dark' })}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              bgSettings.checkerboardTheme === 'dark' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Dark Grid
          </button>
        </div>
      )}

      {bgSettings.type === 'solid' && (
        <div className="flex flex-wrap items-center gap-2.5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60">
          {/* Custom Color Input */}
          <div className="flex items-center gap-2 mr-2">
            <input
              type="color"
              value={bgSettings.solidColor}
              onChange={(e) => onBgSettingsChange({ ...bgSettings, solidColor: e.target.value })}
              className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0 overflow-hidden bg-transparent shadow-2xs"
              title="Pick custom color"
              id="bg-custom-color-picker"
            />
            <input
              type="text"
              value={bgSettings.solidColor.toUpperCase()}
              onChange={(e) => onBgSettingsChange({ ...bgSettings, solidColor: e.target.value })}
              className="w-20 px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 bg-white"
              maxLength={7}
            />
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            {SOLID_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onBgSettingsChange({ ...bgSettings, solidColor: preset.hex })}
                title={preset.name}
                className="w-7 h-7 rounded-full border border-slate-300/80 relative flex items-center justify-center transition-transform hover:scale-110 shadow-2xs cursor-pointer"
                style={{ backgroundColor: preset.hex }}
              >
                {bgSettings.solidColor.toLowerCase() === preset.hex.toLowerCase() && (
                  <Check className={`w-3.5 h-3.5 ${preset.hex === '#FFFFFF' || preset.hex.startsWith('#F') || preset.hex.startsWith('#D') || preset.hex.startsWith('#E') ? 'text-slate-900' : 'text-white'}`} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {bgSettings.type === 'gradient' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60">
          {GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onBgSettingsChange({ ...bgSettings, gradientId: preset.id })}
              className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-bold text-slate-700 transition-all cursor-pointer ${
                bgSettings.gradientId === preset.id
                  ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-white shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div
                className="w-7 h-7 rounded-lg border border-slate-300/80 shrink-0 shadow-2xs"
                style={{ background: preset.css }}
              />
              <span className="truncate">{preset.name}</span>
            </button>
          ))}
        </div>
      )}

      {bgSettings.type === 'blur' && (
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center gap-4 text-xs">
          <span className="font-semibold text-slate-700 whitespace-nowrap">Blur Amount:</span>
          <input
            type="range"
            min={4}
            max={32}
            value={bgSettings.blurAmount || 16}
            onChange={(e) => onBgSettingsChange({ ...bgSettings, blurAmount: Number(e.target.value) })}
            className="w-full accent-indigo-600"
          />
          <span className="font-mono text-slate-500 w-8 text-right font-bold">{bgSettings.blurAmount || 16}px</span>
        </div>
      )}

      {/* Custom Backdrop Sub-Panel (with prompt option to jump to AI) */}
      {bgSettings.type === 'custom_image' && (
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <input
                ref={bgFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCustomBgUpload}
              />
              <button
                onClick={() => bgFileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Custom Photo Backdrop</span>
              </button>
            </div>

            {/* Option to jump to Generate with AI */}
            <button
              onClick={() => onBgSettingsChange({ ...bgSettings, type: 'ai_generated' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Or Generate with AI</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {SCENIC_BACKDROPS.map((backdrop) => (
              <button
                key={backdrop.id}
                onClick={() => onBgSettingsChange({ ...bgSettings, customImageUrl: backdrop.url })}
                className={`relative rounded-xl overflow-hidden border transition-all aspect-video cursor-pointer ${
                  bgSettings.customImageUrl === backdrop.url
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <img
                  src={backdrop.url}
                  alt={backdrop.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs text-white text-[9px] font-semibold p-1 text-center truncate">
                  {backdrop.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI-Generated Custom Backdrop Sub-Panel */}
      {bgSettings.type === 'ai_generated' && (
        <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50 rounded-2xl border border-indigo-200/80 shadow-2xs animate-fade-in" id="ai-backdrop-generator-panel">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                <Wand2 className="w-3.5 h-3.5" />
              </div>
              <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                Generate Custom AI Backdrop
              </h5>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Powered by Gemini & Imagen 3
            </span>
          </div>

          {/* Prompt Input Field & Submit Action */}
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1">
              <input
                id="ai-backdrop-prompt-input"
                type="text"
                value={aiPromptInput}
                onChange={(e) => {
                  setAiPromptInput(e.target.value);
                  if (aiError) setAiError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isAiGenerating) {
                    handleGenerateBackdrop();
                  }
                }}
                disabled={isAiGenerating}
                placeholder="e.g. cozy coffee shop interior, minimalist studio with soft pink lighting, outdoor beach at golden hour"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-indigo-200/80 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 transition-all shadow-2xs"
              />
              {aiPromptInput && !isAiGenerating && (
                <button
                  onClick={() => setAiPromptInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>

            <button
              id="ai-generate-backdrop-btn"
              onClick={() => handleGenerateBackdrop()}
              disabled={isAiGenerating || !aiPromptInput.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer shrink-0"
            >
              {isAiGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Generate Backdrop</span>
                </>
              )}
            </button>
          </div>

          {/* Preset Prompts Chips */}
          <div className="mb-4">
            <div className="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <span>Quick Prompt Presets:</span>
              <span className="text-slate-400 font-normal">(one-tap selection)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AI_PRESET_PROMPTS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setAiPromptInput(preset.prompt);
                    handleGenerateBackdrop(preset.prompt);
                  }}
                  disabled={isAiGenerating}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-indigo-100 text-[11px] font-medium text-slate-700 hover:text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                  title={preset.prompt}
                >
                  <span>{preset.icon}</span>
                  <span className="font-semibold">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Loading State Banner */}
          {isAiGenerating && (
            <div className="p-3.5 rounded-xl bg-white border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between gap-3 shadow-sm mb-3 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
                <div>
                  <div className="font-bold">{aiLoadingMessage}</div>
                  <div className="text-[11px] text-indigo-600">Generating scene lighting and atmosphere</div>
                </div>
              </div>
              <div className="w-16 h-1.5 rounded-full bg-indigo-100 overflow-hidden">
                <div className="w-full h-full bg-indigo-600 rounded-full animate-pulse" />
              </div>
            </div>
          )}

          {/* Error Banner */}
          {aiError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start justify-between gap-3 shadow-2xs mb-3 animate-fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Generation Failed: </span>
                  <span>{aiError}</span>
                </div>
              </div>
              <button
                onClick={() => handleGenerateBackdrop()}
                className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold text-[11px] hover:bg-red-700 transition-colors shrink-0 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Active Generated Backdrop & History Strip */}
          {bgSettings.customImageUrl && bgSettings.type === 'ai_generated' && !isAiGenerating && (
            <div className="pt-3 border-t border-indigo-100/80">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-700">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                  <span className="font-bold">Active AI Backdrop:</span>
                  <span className="text-slate-500 italic max-w-xs truncate">
                    "{bgSettings.aiPrompt || 'Generated Scene'}"
                  </span>
                </div>
                {/* Try Again / Regenerate Button */}
                <button
                  onClick={() => handleGenerateBackdrop()}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  title="Generate a new variation with the same prompt"
                >
                  <RefreshCw className="w-3 h-3 text-indigo-600" />
                  <span>Try Again / Regenerate</span>
                </button>
              </div>

              {/* Recent History Thumbnail Strip */}
              {bgSettings.aiBackdropHistory && bgSettings.aiBackdropHistory.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Recent Generated Variations:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {bgSettings.aiBackdropHistory.map((item, index) => {
                      const isActive = bgSettings.customImageUrl === item.url;
                      return (
                        <button
                          key={item.id || index}
                          onClick={() => handleSelectHistoryBackdrop(item)}
                          className={`group relative rounded-xl overflow-hidden border aspect-video transition-all cursor-pointer ${
                            isActive
                              ? 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-md scale-[1.02]'
                              : 'border-slate-200 hover:border-indigo-300 opacity-80 hover:opacity-100'
                          }`}
                          title={`Switch to: ${item.prompt}`}
                        >
                          <img
                            src={item.url}
                            alt={item.prompt}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-1.5">
                            <span className="text-white text-[9px] font-medium truncate w-full">
                              {item.prompt}
                            </span>
                          </div>
                          {isActive && (
                            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Effects & Enhancements Bar (Drop Shadow for products + Subject adjustments) */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Drop shadow toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={adjustments.dropShadow}
              onChange={(e) => onAdjustmentsChange({ ...adjustments, dropShadow: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
            />
            <span className="font-semibold text-slate-800">Add Natural Soft Drop Shadow</span>
          </label>

          {adjustments.dropShadow && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <span className="text-slate-500 font-medium">Opacity:</span>
              <input
                type="range"
                min={0.1}
                max={0.8}
                step={0.05}
                value={adjustments.shadowOpacity}
                onChange={(e) => onAdjustmentsChange({ ...adjustments, shadowOpacity: Number(e.target.value) })}
                className="w-20 accent-indigo-600"
              />
            </div>
          )}
        </div>

        {/* Quick subject tuning */}
        <div className="flex items-center gap-3 text-slate-500">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex items-center gap-1.5">
            <span className="font-medium">Brightness:</span>
            <input
              type="range"
              min={70}
              max={130}
              value={adjustments.brightness}
              onChange={(e) => onAdjustmentsChange({ ...adjustments, brightness: Number(e.target.value) })}
              className="w-16 accent-indigo-600"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium">Contrast:</span>
            <input
              type="range"
              min={70}
              max={130}
              value={adjustments.contrast}
              onChange={(e) => onAdjustmentsChange({ ...adjustments, contrast: Number(e.target.value) })}
              className="w-16 accent-indigo-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
