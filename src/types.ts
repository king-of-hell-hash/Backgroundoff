export type ProcessingState = 'idle' | 'loading_model' | 'processing' | 'completed' | 'error';

export type ViewMode = 'slider' | 'side-by-side' | 'cutout-only' | 'original-only';

export type ExportFormat = 'png' | 'jpg' | 'webp';

export type ExportQuality = 'standard' | 'hd' | 'original';

export interface ImageMetadata {
  file?: File;
  name: string;
  originalUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export type BackgroundType = 'transparent' | 'solid' | 'gradient' | 'blur' | 'custom_image' | 'ai_generated';

export interface AiBackdropItem {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export interface BackgroundSettings {
  type: BackgroundType;
  solidColor: string;
  gradientId: string;
  blurAmount: number;
  customImageUrl?: string;
  checkerboardTheme: 'light' | 'dark';
  aiPrompt?: string;
  aiBackdropHistory?: AiBackdropItem[];
}

export interface SubjectAdjustments {
  brightness: number; // 100 default
  contrast: number; // 100 default
  saturation: number; // 100 default
  feather: number; // 0 to 10 px
  dropShadow: boolean;
  shadowBlur: number;
  shadowOpacity: number;
  shadowOffsetY: number;
  shadowColor: string;
}

export interface SampleImage {
  id: string;
  name: string;
  category: 'Portrait' | 'Product' | 'Animal' | 'Object';
  thumbnailUrl: string;
  fullUrl: string;
  width: number;
  height: number;
}
