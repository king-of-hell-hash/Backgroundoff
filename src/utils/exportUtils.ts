import { ExportFormat, ExportQuality, BackgroundSettings, SubjectAdjustments } from '../types';
import { loadImageElement } from './backgroundRemoval';

export interface RenderExportOptions {
  cutoutBlob: Blob;
  originalImageElement?: HTMLImageElement;
  bgSettings: BackgroundSettings;
  adjustments: SubjectAdjustments;
  format: ExportFormat;
  quality: ExportQuality;
}

/**
 * Calculates target width and height based on quality tier.
 */
export function calculateTargetDimensions(
  origWidth: number,
  origHeight: number,
  quality: ExportQuality
): { width: number; height: number; scale: number } {
  let maxDimension = Infinity;

  if (quality === 'standard') {
    maxDimension = 1024;
  } else if (quality === 'hd') {
    maxDimension = 2048;
  } else {
    // Original: full resolution
    return { width: origWidth, height: origHeight, scale: 1.0 };
  }

  const currentMax = Math.max(origWidth, origHeight);
  if (currentMax <= maxDimension) {
    return { width: origWidth, height: origHeight, scale: 1.0 };
  }

  const scale = maxDimension / currentMax;
  return {
    width: Math.round(origWidth * scale),
    height: Math.round(origHeight * scale),
    scale,
  };
}

/**
 * Renders the final composition onto an HTMLCanvasElement with high quality smoothing.
 */
export async function renderFinalCanvas(options: RenderExportOptions): Promise<HTMLCanvasElement> {
  const { cutoutBlob, originalImageElement, bgSettings, adjustments, format, quality } = options;

  const cutoutImg = await loadImageElement(cutoutBlob);
  const origW = cutoutImg.naturalWidth || cutoutImg.width;
  const origH = cutoutImg.naturalHeight || cutoutImg.height;

  const { width: targetW, height: targetH } = calculateTargetDimensions(origW, origH, quality);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { alpha: format !== 'jpg' });
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Draw Background
  if (format === 'jpg') {
    // JPG does not support transparency. If background is 'transparent', default to white or selected solidColor
    const fill = bgSettings.type === 'solid' ? bgSettings.solidColor : (bgSettings.type === 'transparent' ? '#FFFFFF' : null);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, targetW, targetH);
    }
  }

  if (bgSettings.type === 'solid' && format !== 'jpg') {
    ctx.fillStyle = bgSettings.solidColor;
    ctx.fillRect(0, 0, targetW, targetH);
  } else if (bgSettings.type === 'gradient') {
    // Draw gradient
    if (bgSettings.gradientId === 'studio-light') {
      const grad = ctx.createRadialGradient(targetW / 2, targetH / 2, targetW * 0.1, targetW / 2, targetH / 2, targetW * 0.7);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(1, '#CBD5E1');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, targetW, targetH);
    } else if (bgSettings.gradientId === 'sunset-glow') {
      const grad = ctx.createLinearGradient(0, 0, targetW, targetH);
      grad.addColorStop(0, '#F43F5E');
      grad.addColorStop(1, '#FB923C');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, targetW, targetH);
    } else if (bgSettings.gradientId === 'deep-space') {
      const grad = ctx.createLinearGradient(0, 0, targetW, targetH);
      grad.addColorStop(0, '#1E293B');
      grad.addColorStop(1, '#0F172A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, targetW, targetH);
    } else if (bgSettings.gradientId === 'ocean-breeze') {
      const grad = ctx.createLinearGradient(0, 0, targetW, targetH);
      grad.addColorStop(0, '#A5F3FC');
      grad.addColorStop(0.5, '#93C5FD');
      grad.addColorStop(1, '#C4B5FD');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, targetW, targetH);
    } else if (bgSettings.gradientId === 'minty-fresh') {
      const grad = ctx.createLinearGradient(0, 0, targetW, targetH);
      grad.addColorStop(0, '#A7F3D0');
      grad.addColorStop(1, '#3B82F6');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, targetW, targetH);
    } else if (bgSettings.gradientId === 'soft-pastel') {
      const grad = ctx.createLinearGradient(0, 0, targetW, targetH);
      grad.addColorStop(0, '#FBCFE8');
      grad.addColorStop(0.5, '#FED7AA');
      grad.addColorStop(1, '#FEF08A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, targetW, targetH);
    } else if (bgSettings.gradientId === 'neon-cyber') {
      const grad = ctx.createLinearGradient(0, 0, targetW, targetH);
      grad.addColorStop(0, '#4F46E5');
      grad.addColorStop(1, '#EC4899');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, targetW, targetH);
    } else {
      const grad = ctx.createLinearGradient(0, 0, targetW, targetH);
      grad.addColorStop(0, '#E7E5E4');
      grad.addColorStop(1, '#D6D3D1');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, targetW, targetH);
    }
  } else if (bgSettings.type === 'blur' && originalImageElement) {
    ctx.save();
    ctx.filter = `blur(${bgSettings.blurAmount || 16}px) brightness(0.95)`;
    // draw slightly enlarged to avoid blur border artifacts
    const bleed = 30;
    ctx.drawImage(originalImageElement, -bleed, -bleed, targetW + bleed * 2, targetH + bleed * 2);
    ctx.restore();
  } else if ((bgSettings.type === 'custom_image' || bgSettings.type === 'ai_generated') && bgSettings.customImageUrl) {
    try {
      const customBgImg = await loadImageElement(bgSettings.customImageUrl);
      // Cover fit
      const bgRatio = customBgImg.width / customBgImg.height;
      const targetRatio = targetW / targetH;
      let dw = targetW;
      let dh = targetH;
      let dx = 0;
      let dy = 0;
      if (bgRatio > targetRatio) {
        dw = targetH * bgRatio;
        dx = (targetW - dw) / 2;
      } else {
        dh = targetW / bgRatio;
        dy = (targetH - dh) / 2;
      }
      ctx.drawImage(customBgImg, dx, dy, dw, dh);
    } catch {
      // ignore
    }
  }

  // 2. Draw Subject Drop Shadow if enabled
  if (adjustments.dropShadow) {
    ctx.save();
    ctx.shadowColor = `rgba(0, 0, 0, ${adjustments.shadowOpacity || 0.4})`;
    ctx.shadowBlur = (adjustments.shadowBlur || 24) * (targetW / origW);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = (adjustments.shadowOffsetY || 16) * (targetH / origH);
    ctx.drawImage(cutoutImg, 0, 0, targetW, targetH);
    ctx.restore();
  }

  // 3. Draw Cutout Subject with adjustments
  ctx.save();
  const filters: string[] = [];
  if (adjustments.brightness !== 100) filters.push(`brightness(${adjustments.brightness}%)`);
  if (adjustments.contrast !== 100) filters.push(`contrast(${adjustments.contrast}%)`);
  if (adjustments.saturation !== 100) filters.push(`saturate(${adjustments.saturation}%)`);
  if (filters.length > 0) {
    ctx.filter = filters.join(' ');
  }

  ctx.drawImage(cutoutImg, 0, 0, targetW, targetH);
  ctx.restore();

  return canvas;
}

/**
 * Exports final composition as a Blob based on format and quality.
 */
export async function exportRenderedBlob(options: RenderExportOptions): Promise<{ blob: Blob; mimeType: string; filename: string }> {
  const canvas = await renderFinalCanvas(options);
  const mimeMap: Record<ExportFormat, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    webp: 'image/webp',
  };
  const mimeType = mimeMap[options.format];
  const compressionQuality = options.format === 'png' ? undefined : 0.92;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate export file blob'));
          return;
        }
        const ext = options.format === 'jpg' ? 'jpg' : options.format;
        const filename = `backgroundoff-${Date.now()}.${ext}`;
        resolve({ blob, mimeType, filename });
      },
      mimeType,
      compressionQuality
    );
  });
}

/**
 * Triggers native browser download.
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Copies the transparent PNG cutout directly to the user's system clipboard.
 */
export async function copyCutoutToClipboard(cutoutBlob: Blob): Promise<boolean> {
  try {
    if (!navigator.clipboard || !window.ClipboardItem) {
      return false;
    }
    // Ensure blob is image/png
    let pngBlob = cutoutBlob;
    if (cutoutBlob.type !== 'image/png') {
      const img = await loadImageElement(cutoutBlob);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        pngBlob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b || cutoutBlob), 'image/png'));
      }
    }

    const item = new ClipboardItem({ 'image/png': pngBlob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    console.warn('Clipboard write error:', err);
    return false;
  }
}

/**
 * Format bytes to readable string (e.g. 1.2 MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
