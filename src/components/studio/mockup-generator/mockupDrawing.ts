import { MockupDevice } from './types';

// ── Impeccable Devices Database ──────────────────────────────────────────────

export const DEVICES: Record<string, MockupDevice> = {
  'floating-glass': {
    id: 'floating-glass',
    name: 'Floating Glass Card',
    description: 'Minimal floating screen on any background',
    frameW: 2400,
    frameH: 1600,
    screenX: 40, 
    screenY: 40,
    screenW: 2320,
    screenH: 1520,
    screenRadius: 32 
  },
  'safari-window': {
    id: 'safari-window',
    name: 'Safari Browser',
    description: 'macOS browser window with chrome UI',
    frameW: 2400,
    frameH: 1600,
    screenX: 0,
    screenY: 100, 
    screenW: 2400,
    screenH: 1500,
    screenRadius: 0 
  },
  'clay-phone': {
    id: 'clay-phone',
    name: 'Clay Mobile',
    description: 'Soft graphite phone for mobile UI shots',
    frameW: 1000,
    frameH: 2000,
    screenX: 45,
    screenY: 45,
    screenW: 910,
    screenH: 1910,
    screenRadius: 110
  }
};

// ── Premium Editorial Background Palettes ────────────────────────────────────

export const PALETTES: Record<string, { name: string, colors: [string, string, string] }> = {
  'studio-sand': { name: 'Studio Sand', colors: ['#DEDCD6', '#EAE8E3', '#CDCBC4'] },
  'terracotta': { name: 'Terracotta', colors: ['#C47A6B', '#D28F81', '#A35D4F'] },
  'deep-space': { name: 'Deep Space', colors: ['#12141A', '#1C1F28', '#0A0C11'] },
  'sage-mist': { name: 'Sage Mist', colors: ['#9EAFA0', '#B0C2B2', '#869888'] },
  'transparent': { name: 'Transparent', colors: ['transparent', 'transparent', 'transparent'] }
};

// ── Drawing Engine ────────────────────────────────────────────────────────────

// Helper: draw rounded rect
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Draws the high-end Apple mesh background.
 */
export function drawPremiumBackground(
  ctx: CanvasRenderingContext2D, 
  w: number, 
  h: number, 
  paletteId: string,
  customBgImg: HTMLImageElement | null = null,
  fitMode: 'cover' | 'contain' | 'tile' = 'cover'
) {
  // If we have a custom photo, draw it according to fitMode
  if (customBgImg) {
    // Fill with black first so 'contain' doesn't look transparent
    ctx.fillStyle = '#0d0d0f';
    ctx.fillRect(0, 0, w, h);

    if (fitMode === 'tile') {
      const pattern = ctx.createPattern(customBgImg, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, w, h);
      }
    } else {
      const imgRatio = customBgImg.width / customBgImg.height;
      const canvasRatio = w / h;
      let iw = w, ih = h, ix = 0, iy = 0;

      if (fitMode === 'cover') {
        if (imgRatio > canvasRatio) {
          ih = h; iw = customBgImg.width * (h / customBgImg.height);
          ix = (w - iw) / 2;
        } else {
          iw = w; ih = customBgImg.height * (w / customBgImg.width);
          iy = (h - ih) / 2;
        }
      } else if (fitMode === 'contain') {
        if (imgRatio > canvasRatio) {
          iw = w; ih = customBgImg.height * (w / customBgImg.width);
          iy = (h - ih) / 2;
        } else {
          ih = h; iw = customBgImg.width * (h / customBgImg.height);
          ix = (w - iw) / 2;
        }
      }
      ctx.drawImage(customBgImg, ix, iy, iw, ih);
    }
    return;
  }

  // Fallback to palette mesh background
  if (paletteId === 'transparent') {
    ctx.clearRect(0, 0, w, h);
    return;
  }

  const p = PALETTES[paletteId] || PALETTES['studio-sand'];
  
  // Base fill
  ctx.fillStyle = p.colors[0];
  ctx.fillRect(0, 0, w, h);

  // Soft mesh gradient 1
  const rad1 = ctx.createRadialGradient(w * 0.2, h * 0.2, 0, w * 0.2, h * 0.2, w * 0.8);
  rad1.addColorStop(0, p.colors[1] + 'CC');
  rad1.addColorStop(1, 'transparent');
  ctx.fillStyle = rad1;
  ctx.fillRect(0, 0, w, h);

  // Soft mesh gradient 2
  const rad2 = ctx.createRadialGradient(w * 0.8, h * 0.9, 0, w * 0.8, h * 0.9, w * 0.8);
  rad2.addColorStop(0, p.colors[2] + 'CC');
  rad2.addColorStop(1, 'transparent');
  ctx.fillStyle = rad2;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Draws ultra-premium, multi-layered drop shadows.
 */
function drawPremiumShadows(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.save();
  
  // Layer 1: Ambient Occlusion (wide, very soft, dark but low opacity)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 120;
  ctx.shadowOffsetY = 60;
  ctx.fillStyle = 'black';
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();

  // Layer 2: Mid Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;
  roundRect(ctx, x + 20, y + 20, w - 40, h - 20, r);
  ctx.fill();

  // Layer 3: Contact Shadow (tight, crisp, high opacity underneath)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, x + 10, y + 5, w - 20, h - 5, r);
  ctx.fill();
  
  ctx.restore();
}

/**
 * Draws the impeccable glass glare overlay.
 */
function drawGlassGlare(ctx: CanvasRenderingContext2D, dx: number, dy: number, dw: number, dh: number, device: MockupDevice) {
  ctx.save();
  
  // Clip to the screen bounds
  roundRect(ctx, dx + device.screenX, dy + device.screenY, device.screenW, device.screenH, device.screenRadius);
  ctx.clip();

  // Draw a diagonal polygon for the glare
  ctx.beginPath();
  ctx.moveTo(dx + device.screenX - dw, dy + device.screenY + dh * 0.6);
  ctx.lineTo(dx + device.screenX + dw * 1.5, dy + device.screenY - dh * 0.5);
  ctx.lineTo(dx + device.screenX + dw * 1.5, dy + device.screenY + dh * 2);
  ctx.lineTo(dx + device.screenX - dw, dy + device.screenY + dh * 2);
  ctx.closePath();

  // Create a subtle white gradient for the glare
  const grad = ctx.createLinearGradient(
    dx + device.screenX, dy + device.screenY,
    dx + device.screenX + dw, dy + device.screenY + dh
  );
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.01)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

  ctx.fillStyle = grad;
  ctx.fill();
  
  ctx.restore();
}

/**
 * Main procedural drawing engine for the 6 Award-Winning Mockup Styles
 */
export function drawImpeccableDevice(
  ctx: CanvasRenderingContext2D,
  device: MockupDevice,
  dx: number,
  dy: number,
  scale: number,
  userImg: HTMLImageElement | null,
  showShadows: boolean,
  showGlare: boolean,
  options: { glassCornerRadius?: number } = {}
) {
  const fw = device.frameW * scale;
  const fh = device.frameH * scale;

  ctx.save();
  ctx.translate(dx, dy);
  ctx.scale(scale, scale);

  // ── 1. Shadows ──
  if (showShadows) {
    if (device.id === 'clay-phone') {
       // Super soft massive shadow for clay objects
       drawPremiumShadows(ctx, 0, 0, device.frameW, device.frameH, 140);
    } else {
       let shadowRadius = 40;
       if (device.id === 'safari-window') shadowRadius = 24;
       drawPremiumShadows(ctx, 0, 0, device.frameW, device.frameH, shadowRadius);
    }
  }

  // ── 2. Hardware / Chassis ──
  
  if (device.id === 'floating-glass') {
    const r = options.glassCornerRadius ?? 40;
    // Translucent frosted glass effect behind the image
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    roundRect(ctx, 0, 0, device.frameW, device.frameH, r);
    ctx.fill();
    
    // 1px Solid Semi-Transparent Rim Light
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.stroke();

    // Subtle Inner Dark Rim
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    roundRect(ctx, 2, 2, device.frameW - 4, device.frameH - 4, Math.max(0, r - 2));
    ctx.stroke();

  } else if (device.id === 'clay-phone') {
    
    // Helper to draw a sleek clay phone silhouette
    const drawClaySilhouette = (cx: number, cy: number, cw: number, ch: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      
      // Clay Body (Minimalist Graphite)
      const clayBody = ctx.createLinearGradient(0, 0, cw, ch);
      clayBody.addColorStop(0, '#3A3A3D');
      clayBody.addColorStop(1, '#252528');
      ctx.fillStyle = clayBody;
      roundRect(ctx, 0, 0, cw, ch, 110);
      ctx.fill();

      // Inner Bevel (Rim Light)
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.stroke();
      
      // Inner screen bezel
      ctx.fillStyle = '#0F0F11';
      roundRect(ctx, 20, 20, cw - 40, ch - 40, 96);
      ctx.fill();
      
      ctx.restore();
    };

    drawClaySilhouette(0, 0, device.frameW, device.frameH);

  } else if (device.id === 'safari-window') {
    // Window Frame
    ctx.fillStyle = '#FFFFFF'; 
    roundRect(ctx, 0, 0, device.frameW, device.frameH, 24);
    ctx.fill();
    
    // Bottom screen area clipping block
    ctx.fillStyle = '#F4F5F5';
    ctx.fillRect(0, 100, device.frameW, device.frameH - 100);

    // Traffic Lights
    ctx.beginPath(); ctx.arc(40, 50, 12, 0, Math.PI * 2); ctx.fillStyle = '#FF5F56'; ctx.fill(); 
    ctx.beginPath(); ctx.arc(80, 50, 12, 0, Math.PI * 2); ctx.fillStyle = '#FFBD2E'; ctx.fill(); 
    ctx.beginPath(); ctx.arc(120, 50, 12, 0, Math.PI * 2); ctx.fillStyle = '#27C93F'; ctx.fill(); 

    // Address Bar
    ctx.fillStyle = '#F1F1F1';
    roundRect(ctx, device.frameW / 2 - 300, 25, 600, 50, 12);
    ctx.fill();
    
    ctx.fillStyle = '#8B8B8B';
    ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔒  design.chng.com', device.frameW / 2, 50);

    // Separator line
    ctx.fillStyle = '#E5E5E5';
    ctx.fillRect(0, 99, device.frameW, 1);
  }

  // ── 3. Image Masking & Drawing ──

  const drawMaskedImage = (
    img: HTMLImageElement | null, 
    x: number, y: number, w: number, h: number, r: number,
    offsetY: number = 0
  ) => {
    ctx.save();
    roundRect(ctx, x, y, w, h, r);
    ctx.clip();

    if (img) {
      const imgRatio = img.width / img.height;
      const screenRatio = w / h;
      
      let iw = w, ih = h, ix = x, iy = y;

      if (imgRatio > screenRatio) {
        ih = h;
        iw = img.width * (h / img.height);
        ix = x + (w - iw) / 2;
      } else {
        iw = w;
        ih = img.height * (w / img.width);
        iy = y + offsetY; 
      }
      ctx.drawImage(img, ix, iy, iw, ih);
    } else {
      ctx.fillStyle = '#111';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#222';
      ctx.font = '500 48px -apple-system';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Your Design', x + w/2, y + h/2);
    }
    ctx.restore();
  };

  const drawDynamicIsland = (cx: number, cy: number, cw: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#000000';
    roundRect(ctx, cw / 2 - 160, 60, 320, 85, 42);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cw / 2 + 100, 102, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#1A1D24';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cw / 2 + 100, 102, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#132840';
    ctx.fill();
    ctx.restore();
  };

  // Standard single screen
  const screenR = device.id === 'floating-glass'
    ? (options.glassCornerRadius ?? 32)
    : device.screenRadius;
  drawMaskedImage(userImg, device.screenX, device.screenY, device.screenW, device.screenH, screenR);
  if (device.id === 'clay-phone') {
     drawDynamicIsland(0, 0, device.frameW);
  }


  // ── 4. Glare Overlay ──
  if (showGlare) {
    ctx.restore();
    drawGlassGlare(ctx, dx, dy, fw, fh, {
      ...device,
      screenX: device.screenX * scale,
      screenY: device.screenY * scale,
      screenW: device.screenW * scale,
      screenH: device.screenH * scale,
      screenRadius: device.screenRadius * scale
    });
    ctx.save();
  }

  ctx.restore();
}
