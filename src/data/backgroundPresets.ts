export interface GradientPreset {
  id: string;
  name: string;
  css: string;
}

export const SOLID_COLOR_PRESETS = [
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Off White', hex: '#F8FAFC' },
  { name: 'Warm Cream', hex: '#FDFBF7' },
  { name: 'Studio Gray', hex: '#E2E8F0' },
  { name: 'Slate Gray', hex: '#64748B' },
  { name: 'Midnight', hex: '#0F172A' },
  { name: 'Pure Black', hex: '#000000' },
  { name: 'Vibrant Red', hex: '#EF4444' },
  { name: 'Electric Coral', hex: '#F97316' },
  { name: 'Sunflower Yellow', hex: '#EAB308' },
  { name: 'Emerald Green', hex: '#10B981' },
  { name: 'Cyan Sky', hex: '#06B6D4' },
  { name: 'Royal Blue', hex: '#3B82F6' },
  { name: 'Violet Glow', hex: '#8B5CF6' },
  { name: 'Bubblegum Pink', hex: '#EC4899' },
  { name: 'Pastel Mint', hex: '#D1FAE5' },
  { name: 'Pastel Lavender', hex: '#EDE9FE' },
  { name: 'Pastel Peach', hex: '#FFEDD5' },
];

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: 'studio-light',
    name: 'Studio Spotlight',
    css: 'radial-gradient(circle at center, #ffffff 0%, #e2e8f0 100%)',
  },
  {
    id: 'soft-pastel',
    name: 'Soft Sunrise',
    css: 'linear-gradient(135deg, #fbcfe8 0%, #fed7aa 50%, #fef08a 100%)',
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    css: 'linear-gradient(135deg, #a5f3fc 0%, #93c5fd 50%, #c4b5fd 100%)',
  },
  {
    id: 'minty-fresh',
    name: 'Mint Fresh',
    css: 'linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 50%, #3b82f6 100%)',
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    css: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
  },
  {
    id: 'deep-space',
    name: 'Deep Studio',
    css: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  },
  {
    id: 'neon-cyber',
    name: 'Cyber Aura',
    css: 'linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)',
  },
  {
    id: 'neutral-aesthetic',
    name: 'Aesthetic Warm',
    css: 'linear-gradient(135deg, #e7e5e4 0%, #d6d3d1 100%)',
  }
];

export const SCENIC_BACKDROPS = [
  {
    id: 'backdrop-minimal-room',
    name: 'Minimalist Interior',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'backdrop-nature-forest',
    name: 'Botanical Plants',
    url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'backdrop-city-cafe',
    name: 'Cozy Cafe Blur',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'backdrop-wood-table',
    name: 'Oak Wood Surface',
    url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'backdrop-marble-podium',
    name: 'Marble Podium',
    url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
  }
];
