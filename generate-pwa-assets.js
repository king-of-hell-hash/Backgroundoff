import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(len, 0);
  const body = Buffer.concat([typeBuf, data]);
  const crc = crc32(body);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([lenBuf, body, crcBuf]);
}

function createPNG(width, height, drawFn) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Scanlines
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    scanlines[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      scanlines[pixelOffset] = r;
      scanlines[pixelOffset + 1] = g;
      scanlines[pixelOffset + 2] = b;
      scanlines[pixelOffset + 3] = a;
    }
  }

  const idatData = zlib.deflateSync(scanlines);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Ensure public directories
const publicDir = path.resolve('public');
const iconsDir = path.resolve('public/icons');
const screenshotsDir = path.resolve('public/screenshots');
const widgetsDir = path.resolve('public/widgets');

[publicDir, iconsDir, screenshotsDir, widgetsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 1. Icon Drawing function (Indigo-to-blue gradient rounded badge with wand / cutout symbol)
function drawAppIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const r = w / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Gradient colors: indigo #4f46e5 to cyan #06b6d4
  const t = (x + y) / (w + h);
  const bgR = Math.round(79 * (1 - t) + 6 * t);
  const bgG = Math.round(70 * (1 - t) + 182 * t);
  const bgB = Math.round(229 * (1 - t) + 212 * t);

  if (isMaskable) {
    // Full bleed background with rounded safe zone
    return [bgR, bgG, bgB, 255];
  }

  // Rounded squircle / rounded rect for standard icon
  const cornerRadius = w * 0.22;
  const halfW = w * 0.46;
  const qx = Math.max(Math.abs(dx) - (halfW - cornerRadius), 0);
  const qy = Math.max(Math.abs(dy) - (halfW - cornerRadius), 0);
  const cornerDist = Math.sqrt(qx * qx + qy * qy);

  if (cornerDist > cornerRadius) {
    // Transparent outside
    return [0, 0, 0, 0];
  }

  // Inside badge: Draw Sparkles / Cutout scissors / Wand icon in clean white
  const nx = (x - cx) / (w * 0.35);
  const ny = (y - cy) / (w * 0.35);

  // 4-pointed star / sparkle formula: (|nx|^0.6 + |ny|^0.6) <= 1
  const sparkleDist = Math.pow(Math.abs(nx), 0.65) + Math.pow(Math.abs(ny), 0.65);
  if (sparkleDist <= 1.0) {
    return [255, 255, 255, 255];
  }

  // Secondary mini sparkle
  const mx = (x - (cx + w * 0.2)) / (w * 0.12);
  const my = (y - (cy - h * 0.2)) / (w * 0.12);
  const miniSparkle = Math.pow(Math.abs(mx), 0.65) + Math.pow(Math.abs(my), 0.65);
  if (miniSparkle <= 1.0) {
    return [255, 255, 255, 240];
  }

  return [bgR, bgG, bgB, 255];
}

// 2. Shortcut Icons
function drawShortcutIcon(type) {
  return (x, y, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const dx = x - cx;
    const dy = y - cy;
    const cornerRadius = w * 0.2;
    const halfW = w * 0.44;
    const qx = Math.max(Math.abs(dx) - (halfW - cornerRadius), 0);
    const qy = Math.max(Math.abs(dy) - (halfW - cornerRadius), 0);
    if (Math.sqrt(qx * qx + qy * qy) > cornerRadius) return [0, 0, 0, 0];

    // Background
    let bg = [79, 70, 229, 255]; // Indigo
    if (type === 'sample') bg = [16, 185, 129, 255]; // Emerald
    if (type === 'editor') bg = [14, 165, 233, 255]; // Sky

    // Simple geometric inner symbol
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (type === 'upload' && Math.abs(dx) < w * 0.15 && dy > -h * 0.15 && dy < h * 0.15) {
      return [255, 255, 255, 255];
    }
    if (dist < w * 0.22) {
      return [255, 255, 255, 255];
    }
    return bg;
  };
}

// Generate icon sizes
const iconSizes = [96, 128, 192, 256, 384, 512];
iconSizes.forEach((size) => {
  const standardPNG = createPNG(size, size, (x, y, w, h) => drawAppIcon(x, y, w, h, false));
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), standardPNG);

  const maskablePNG = createPNG(size, size, (x, y, w, h) => drawAppIcon(x, y, w, h, true));
  fs.writeFileSync(path.join(iconsDir, `icon-maskable-${size}x${size}.png`), maskablePNG);
});

// Shortcuts
const shortcuts = ['upload', 'sample', 'editor'];
shortcuts.forEach((type) => {
  const png = createPNG(192, 192, drawShortcutIcon(type));
  fs.writeFileSync(path.join(iconsDir, `shortcut-${type}.png`), png);
});

// Apple touch icon (180x180)
const appleIcon = createPNG(180, 180, (x, y, w, h) => drawAppIcon(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), appleIcon);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);
fs.writeFileSync(path.join(publicDir, 'favicon.png'), createPNG(64, 64, (x, y, w, h) => drawAppIcon(x, y, w, h, false)));

// Screenshots for PWABuilder & Store listing
// 1. Desktop 1280x720
const desktopScreenshot = createPNG(1280, 720, (x, y, w, h) => {
  // Slate background with preview card
  if (y < 60) return [255, 255, 255, 255]; // Header
  if (x > 150 && x < 1130 && y > 100 && y < 650) {
    if (x > 640) return [240, 243, 246, 255]; // Split right
    return [224, 231, 255, 255]; // Split left
  }
  return [248, 250, 252, 255];
});
fs.writeFileSync(path.join(screenshotsDir, 'screenshot-desktop.png'), desktopScreenshot);

// 2. Mobile 750x1334
const mobileScreenshot = createPNG(750, 1334, (x, y, w, h) => {
  if (y < 100) return [255, 255, 255, 255];
  if (x > 50 && x < 700 && y > 150 && y < 1000) {
    return [238, 242, 255, 255];
  }
  return [248, 250, 252, 255];
});
fs.writeFileSync(path.join(screenshotsDir, 'screenshot-mobile.png'), mobileScreenshot);

// 3. Widget screenshot 600x400
const widgetScreenshot = createPNG(600, 400, (x, y, w, h) => {
  if (x > 40 && x < 560 && y > 40 && y < 360) {
    const t = (x + y) / 1000;
    return [Math.round(79 * (1 - t) + 6 * t), Math.round(70 * (1 - t) + 182 * t), Math.round(229 * (1 - t) + 212 * t), 255];
  }
  return [248, 250, 252, 255];
});
fs.writeFileSync(path.join(screenshotsDir, 'widget-screenshot.png'), widgetScreenshot);

console.log('✅ Successfully generated all PWA icons, screenshots, and assets!');
