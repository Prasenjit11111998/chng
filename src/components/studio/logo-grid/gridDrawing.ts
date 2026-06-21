// ─── Logo Grid Designer — Grid Drawing Engine ─────────────────────────────────
// Pure functions: canvas 2D drawing + SVG element generation.
// No React dependencies. Fully testable in isolation.

import type { GridType, CanvasFilter } from './types';
import { FILTER_BACKGROUNDS } from './types';

// ── Helpers ─────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function setCtxStroke(ctx: CanvasRenderingContext2D, color: string, alpha: number, width = 1) {
  ctx.strokeStyle = hexToRgba(color, alpha);
  ctx.lineWidth = width;
}

// ── Canvas background ────────────────────────────────────────────────────────

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  filter: CanvasFilter
) {
  ctx.clearRect(0, 0, w, h);
  if (filter === 'transparent') return;
  ctx.fillStyle = FILTER_BACKGROUNDS[filter];
  ctx.fillRect(0, 0, w, h);
}

// ── Logo image ───────────────────────────────────────────────────────────────

export interface LogoDrawParams {
  img: HTMLImageElement;
  scale: number;
  cx: number;
  cy: number;
  rotation: number; // degrees
  canvasW: number;
  canvasH: number;
  filter: CanvasFilter;
}

export function drawLogoImage(ctx: CanvasRenderingContext2D, p: LogoDrawParams) {
  const { img, scale, cx, cy, rotation, filter } = p;

  // Use crisp pixel rendering for pixel-perfect logos
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const natW = img.naturalWidth  || img.width;
  const natH = img.naturalHeight || img.height;

  // Fit logo into 60% of the smaller canvas dimension as base size
  const base = Math.min(p.canvasW, p.canvasH) * 0.55;
  const aspect = natW / natH;
  let drawW: number, drawH: number;
  if (aspect >= 1) {
    drawW = base * scale;
    drawH = (base / aspect) * scale;
  } else {
    drawH = base * scale;
    drawW = base * aspect * scale;
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotation * Math.PI) / 180);

  // Apply monochrome desaturation for 'mono' filter
  if (filter === 'mono') {
    ctx.filter = 'grayscale(100%)';
  }

  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.filter = 'none';
  ctx.restore();

  return { drawW, drawH };
}

// ── Clearspace box ───────────────────────────────────────────────────────────

export function drawClearspace(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  logoW: number,
  logoH: number,
  multiplier: number,
  color: string,
  opacity: number
) {
  const pad = Math.max(logoW, logoH) * 0.1 * multiplier * 3;
  const bx = cx - logoW / 2 - pad;
  const by = cy - logoH / 2 - pad;
  const bw = logoW + pad * 2;
  const bh = logoH + pad * 2;

  ctx.save();
  ctx.strokeStyle = hexToRgba(color, opacity);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(bx, by, bw, bh);

  // Corner labels
  ctx.font = `500 11px 'Geist Mono', monospace`;
  ctx.fillStyle = hexToRgba(color, opacity * 0.85);
  ctx.fillText(`${multiplier}x`, bx + 4, by - 4);

  ctx.setLineDash([]);
  ctx.restore();
}

// ── Axis labels ──────────────────────────────────────────────────────────────

export function drawLabels(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  gridType: GridType,
  color: string,
  opacity: number
) {
  ctx.save();
  ctx.font = `600 10px 'Geist Mono', monospace`;
  ctx.fillStyle = hexToRgba(color, opacity * 0.6);
  ctx.textAlign = 'right';

  const labels: string[] = {
    thirds: ['⅓', '⅔', '⅓', '⅔'],
    golden: ['φ', '1/φ'],
    'golden-spiral': ['φ spiral'],
    fibonacci: ['Fib'],
    radii: ['r', '2r', '3r'],
    baseline: ['unit'],
    custom: [],
  }[gridType] ?? [];

  if (labels.length && gridType === 'thirds') {
    ctx.fillText('⅓', w / 3 - 4, 14);
    ctx.fillText('⅔', (w / 3) * 2 - 4, 14);
  }
  if (labels.length && gridType === 'golden') {
    ctx.fillText('φ', w * 0.618 - 4, 14);
  }

  ctx.restore();
}

// ── Grid drawing functions ───────────────────────────────────────────────────

export function drawThirdsGrid(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  color: string, opacity: number
) {
  ctx.save();
  setCtxStroke(ctx, color, opacity, 1);
  ctx.beginPath();
  // Vertical thirds
  ctx.moveTo(w / 3, 0); ctx.lineTo(w / 3, h);
  ctx.moveTo((w / 3) * 2, 0); ctx.lineTo((w / 3) * 2, h);
  // Horizontal thirds
  ctx.moveTo(0, h / 3); ctx.lineTo(w, h / 3);
  ctx.moveTo(0, (h / 3) * 2); ctx.lineTo(w, (h / 3) * 2);
  ctx.stroke();

  // Power-point intersection dots
  const pts = [
    [w / 3, h / 3], [(w / 3) * 2, h / 3],
    [w / 3, (h / 3) * 2], [(w / 3) * 2, (h / 3) * 2],
  ];
  pts.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(color, opacity * 0.8);
    ctx.fill();
  });

  ctx.restore();
}

export function drawGoldenGrid(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  color: string, opacity: number
) {
  const phi = 1.61803398875;
  ctx.save();
  setCtxStroke(ctx, color, opacity, 1);
  ctx.beginPath();

  // Vertical phi split
  const vx1 = w / phi;
  const vx2 = w - w / phi;
  ctx.moveTo(vx1, 0); ctx.lineTo(vx1, h);
  ctx.moveTo(vx2, 0); ctx.lineTo(vx2, h);

  // Horizontal phi split
  const hy1 = h / phi;
  const hy2 = h - h / phi;
  ctx.moveTo(0, hy1); ctx.lineTo(w, hy1);
  ctx.moveTo(0, hy2); ctx.lineTo(w, hy2);

  ctx.stroke();

  // Diagonal guide lines (golden rectangle diagonals)
  ctx.save();
  setCtxStroke(ctx, color, opacity * 0.35, 0.75);
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(w, h);
  ctx.moveTo(w, 0); ctx.lineTo(0, h);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  ctx.restore();
}

export function drawGoldenSpiral(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  color: string, opacity: number
) {
  ctx.save();

  /*
   * FIXED: inscribe the largest φ:1 golden rectangle into the canvas.
   *
   * Problem with raw w×h: if the canvas is square (or nearly square),
   * Math.min(w,h) = w = h so the first peel consumes the entire canvas
   * and only ONE arc is drawn.
   *
   * Solution: always work inside a φ:1 sub-rectangle that is centred
   * inside the canvas. The spiral then has the correct proportions
   * regardless of the canvas size or aspect ratio.
   */

  const phi = 1.61803398875;

  // Determine the inscribed golden rectangle
  let gW: number, gH: number;
  if (w / h >= phi) {
    // Canvas is wider-than-golden — fit by height
    gH = h;
    gW = h * phi;
  } else {
    // Canvas is narrower-than-golden (incl. square, portrait) — fit by width
    gW = w;
    gH = w / phi;
  }

  const ox = (w - gW) / 2; // horizontal offset to centre the rectangle
  const oy = (h - gH) / 2; // vertical offset to centre the rectangle

  // Translate so (0,0) is the top-left of the golden rectangle
  ctx.translate(ox, oy);

  const MAX = 10;

  // ── 1. Faint borders (outer golden rect + nested squares) ────────────────
  ctx.save();
  setCtxStroke(ctx, color, opacity * 0.18, 0.5);
  ctx.strokeRect(0, 0, gW, gH); // outer golden rectangle

  let brx = 0, bry = 0, brw = gW, brh = gH;
  for (let i = 0; i < MAX; i++) {
    const sq = Math.min(brw, brh);
    if (sq < 2) break;
    let sqX = brx, sqY = bry;
    switch (i % 4) {
      case 0: sqX = brx;             sqY = bry;             brx += sq; brw -= sq; break;
      case 1: sqX = brx;             sqY = bry + brh - sq;  brh -= sq;            break;
      case 2: sqX = brx + brw - sq;  sqY = bry;             brw -= sq;            break;
      case 3: sqX = brx;             sqY = bry;             bry += sq; brh -= sq; break;
    }
    ctx.strokeRect(sqX, sqY, sq, sq);
  }
  ctx.restore();

  // ── 2. Spiral arcs ───────────────────────────────────────────────────────
  setCtxStroke(ctx, color, opacity, 1.5);

  let rx = 0, ry = 0, rw = gW, rh = gH;
  for (let i = 0; i < MAX; i++) {
    const sq = Math.min(rw, rh);
    if (sq < 2) break;

    let cx: number, cy2: number, startA: number, endA: number, acw: boolean;

    switch (i % 4) {
      case 0: // left peel — pivot = bottom-left of square
        cx = rx;      cy2 = ry + sq;
        startA = -Math.PI / 2; endA = 0;        acw = false;
        rx += sq; rw -= sq;
        break;
      case 1: // bottom peel — pivot = top-left of square
        cx = rx;      cy2 = ry + rh - sq;
        startA =  Math.PI / 2; endA = 0;        acw = true;
        rh -= sq;
        break;
      case 2: // right peel — pivot = top-right of square
        cx = rx + rw; cy2 = ry;
        startA =  Math.PI / 2; endA = Math.PI;  acw = false;
        rw -= sq;
        break;
      case 3: // top peel — pivot = bottom-right of square
        cx = rx + rw; cy2 = ry + sq;
        startA = -Math.PI / 2; endA = Math.PI;  acw = true;
        ry += sq; rh -= sq;
        break;
      default: continue;
    }

    ctx.beginPath();
    ctx.arc(cx, cy2, sq, startA, endA, acw);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawFibonacciGrid(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  color: string, opacity: number
) {
  /*
   * CORRECT Fibonacci spiral layout.
   * Uses 8 squares of Fibonacci sizes arranged in the standard pinwheel:
   *   fib[7]=21, fib[6]=13 → total rectangle 34×21 (same peel direction as golden)
   * Scaled to fit the canvas and centred.
   *
   * The peel direction cycles exactly as golden spiral (left→bottom→right→top).
   * Arc parameters are identical to golden spiral — only the step sizes differ
   * (integer Fibonacci values vs irrational φ-multiples).
   */

  const fibs = [1, 1, 2, 3, 5, 8, 13, 21, 34];
  const N = 8; // number of squares to draw

  // Total bounding rectangle of the N-square Fibonacci tiling
  const totalW = fibs[N];     // 34
  const totalH = fibs[N - 1]; // 21

  // Scale uniformly to fit canvas, then centre
  const scale = Math.min(w / totalW, h / totalH);
  const ox = (w - totalW * scale) / 2;
  const oy = (h - totalH * scale) / 2;

  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);

  const lineW = 1 / scale; // keep lines 1px regardless of scale

  // ── 1. Rectangle borders ─────────────────────────────────────────────────
  ctx.save();
  setCtxStroke(ctx, color, opacity * 0.18, lineW * 0.5);
  ctx.strokeRect(0, 0, totalW, totalH);

  let brx = 0, bry = 0, brw = totalW, brh = totalH;
  for (let i = 0; i < N; i++) {
    const sq = Math.min(brw, brh);
    if (sq < 1) break;
    let sqX = brx, sqY = bry;
    switch (i % 4) {
      case 0: sqX = brx;             sqY = bry;             brx += sq; brw -= sq; break;
      case 1: sqX = brx;             sqY = bry + brh - sq;  brh -= sq;            break;
      case 2: sqX = brx + brw - sq;  sqY = bry;             brw -= sq;            break;
      case 3: sqX = brx;             sqY = bry;             bry += sq; brh -= sq; break;
    }
    ctx.strokeRect(sqX, sqY, sq, sq);
  }
  ctx.restore();

  // ── 2. Spiral arcs (same pivot logic as golden spiral) ───────────────────
  setCtxStroke(ctx, color, opacity, lineW * 1.5);

  let rx = 0, ry = 0, rw = totalW, rh = totalH;
  for (let i = 0; i < N; i++) {
    const sq = Math.min(rw, rh);
    if (sq < 1) break;

    let cx: number, cy2: number, startA: number, endA: number, acw: boolean;

    switch (i % 4) {
      case 0:
        cx = rx;      cy2 = ry + sq;
        startA = -Math.PI / 2; endA = 0;        acw = false;
        rx += sq; rw -= sq;
        break;
      case 1:
        cx = rx;      cy2 = ry + rh - sq;
        startA =  Math.PI / 2; endA = 0;        acw = true;
        rh -= sq;
        break;
      case 2:
        cx = rx + rw; cy2 = ry;
        startA =  Math.PI / 2; endA = Math.PI;  acw = false;
        rw -= sq;
        break;
      case 3:
        cx = rx + rw; cy2 = ry + sq;
        startA = -Math.PI / 2; endA = Math.PI;  acw = true;
        ry += sq; rh -= sq;
        break;
      default: continue;
    }

    ctx.beginPath();
    ctx.arc(cx, cy2, sq, startA, endA, acw);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawRadiiGrid(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  cx: number, cy: number,
  color: string, opacity: number
) {
  const maxR = Math.sqrt(cx * cx + cy * cy);
  const rings = 6;

  ctx.save();

  // Concentric circles
  for (let i = 1; i <= rings; i++) {
    const r = (maxR / rings) * i;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    const alpha = opacity * (1 - (i - 1) / (rings + 1));
    setCtxStroke(ctx, color, alpha, i === 1 ? 1.5 : 1);
    ctx.stroke();
  }

  // Radial lines (8 axes)
  setCtxStroke(ctx, color, opacity * 0.4, 0.75);
  ctx.setLineDash([4, 6]);
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Centre dot
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = hexToRgba(color, opacity);
  ctx.fill();

  ctx.restore();
}

export function drawBaselineGrid(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  color: string, opacity: number,
  unit = 40
) {
  ctx.save();

  // Horizontal baselines (major + minor)
  let y = unit;
  while (y < h) {
    const isMajor = Math.round(y / unit) % 4 === 0;
    setCtxStroke(ctx, color, isMajor ? opacity * 0.5 : opacity * 0.2, isMajor ? 1 : 0.5);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    y += unit;
  }

  // Vertical columns
  let x = unit;
  while (x < w) {
    setCtxStroke(ctx, color, opacity * 0.12, 0.5);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
    x += unit;
  }

  ctx.restore();
}

export function drawCustomGrid(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  color: string, opacity: number,
  cols: number, rows: number
) {
  ctx.save();
  setCtxStroke(ctx, color, opacity, 1);
  ctx.beginPath();

  for (let i = 1; i < cols; i++) {
    const x = (w / cols) * i;
    ctx.moveTo(x, 0); ctx.lineTo(x, h);
  }
  for (let i = 1; i < rows; i++) {
    const y = (h / rows) * i;
    ctx.moveTo(0, y); ctx.lineTo(w, y);
  }
  ctx.stroke();
  ctx.restore();
}

// ── Master grid dispatcher ───────────────────────────────────────────────────

export interface GridDrawOptions {
  type: GridType;
  color: string;
  opacity: number;
  canvasW: number;
  canvasH: number;
  logoCx: number;
  logoCy: number;
  customCols?: number;
  customRows?: number;
}

export function drawGrid(ctx: CanvasRenderingContext2D, opts: GridDrawOptions) {
  const { type, color, opacity, canvasW: w, canvasH: h, logoCx: cx, logoCy: cy } = opts;

  switch (type) {
    case 'thirds':        drawThirdsGrid(ctx, w, h, color, opacity); break;
    case 'golden':        drawGoldenGrid(ctx, w, h, color, opacity); break;
    case 'golden-spiral': drawGoldenSpiral(ctx, w, h, color, opacity); break;
    case 'fibonacci':     drawFibonacciGrid(ctx, w, h, color, opacity); break;
    case 'radii':         drawRadiiGrid(ctx, w, h, cx, cy, color, opacity); break;
    case 'baseline':      drawBaselineGrid(ctx, w, h, color, opacity, Math.round(w / 20)); break;
    case 'custom':        drawCustomGrid(ctx, w, h, color, opacity, opts.customCols ?? 6, opts.customRows ?? 6); break;
  }
}

// ── SVG export ───────────────────────────────────────────────────────────────

export function generateSVG(params: {
  w: number;
  h: number;
  filter: CanvasFilter;
  gridType: GridType;
  gridColor: string;
  gridOpacity: number;
  logoSrc: string | null;
  logoCx: number;
  logoCy: number;
  logoDrawW: number;
  logoDrawH: number;
  logoRotation: number;
  showClearspace: boolean;
  clearspaceMultiplier: number;
  customCols: number;
  customRows: number;
}): string {
  const { w, h, filter, gridType, gridColor, gridOpacity, logoSrc,
    logoCx, logoCy, logoDrawW, logoDrawH, logoRotation,
    showClearspace, clearspaceMultiplier, customCols, customRows } = params;

  const bg = filter !== 'transparent' ? FILTER_BACKGROUNDS[filter] : 'none';
  const rgba = (hex: string, a: number) => {
    const c = hex.replace('#', '');
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  };
  const strokeAttr = (a: number, w2 = 1) =>
    `stroke="${rgba(gridColor, gridOpacity * a)}" stroke-width="${w2}" fill="none"`;

  let gridSvg = '';
  const phi = 1.61803398875;

  switch (gridType) {
    case 'thirds': {
      const x1 = w / 3, x2 = (w / 3) * 2;
      const y1 = h / 3, y2 = (h / 3) * 2;
      gridSvg = `
        <line x1="${x1}" y1="0" x2="${x1}" y2="${h}" ${strokeAttr(1)} />
        <line x1="${x2}" y1="0" x2="${x2}" y2="${h}" ${strokeAttr(1)} />
        <line x1="0" y1="${y1}" x2="${w}" y2="${y1}" ${strokeAttr(1)} />
        <line x1="0" y1="${y2}" x2="${w}" y2="${y2}" ${strokeAttr(1)} />
        ${[[x1,y1],[x2,y1],[x1,y2],[x2,y2]].map(([px,py]) =>
          `<circle cx="${px}" cy="${py}" r="4" fill="${rgba(gridColor, gridOpacity*0.8)}" />`
        ).join('')}`;
      break;
    }
    case 'golden': {
      const vx1 = w / phi, vx2 = w - w / phi;
      const hy1 = h / phi, hy2 = h - h / phi;
      gridSvg = `
        <line x1="${vx1}" y1="0" x2="${vx1}" y2="${h}" ${strokeAttr(1)} />
        <line x1="${vx2}" y1="0" x2="${vx2}" y2="${h}" ${strokeAttr(1)} />
        <line x1="0" y1="${hy1}" x2="${w}" y2="${hy1}" ${strokeAttr(1)} />
        <line x1="0" y1="${hy2}" x2="${w}" y2="${hy2}" ${strokeAttr(1)} />
        <line x1="0" y1="0" x2="${w}" y2="${h}" ${strokeAttr(0.3, 0.75)} stroke-dasharray="4 6" />
        <line x1="${w}" y1="0" x2="0" y2="${h}" ${strokeAttr(0.3, 0.75)} stroke-dasharray="4 6" />`;
      break;
    }
    case 'radii': {
      const maxR = Math.sqrt(logoCx * logoCx + logoCy * logoCy);
      const rings = 6;
      gridSvg = Array.from({ length: rings }, (_, i) => {
        const r = (maxR / rings) * (i + 1);
        const a = gridOpacity * (1 - i / (rings + 1));
        return `<circle cx="${logoCx}" cy="${logoCy}" r="${r}" ${strokeAttr(a)} />`;
      }).join('') + Array.from({ length: 8 }, (_, i) => {
        const angle = (Math.PI / 4) * i;
        const ex = logoCx + Math.cos(angle) * maxR;
        const ey = logoCy + Math.sin(angle) * maxR;
        return `<line x1="${logoCx}" y1="${logoCy}" x2="${ex}" y2="${ey}" ${strokeAttr(0.4, 0.75)} stroke-dasharray="4 6" />`;
      }).join('');
      break;
    }
    case 'baseline': {
      const unit = Math.round(w / 20);
      let lines = '';
      for (let y = unit; y < h; y += unit) {
        const isMajor = Math.round(y / unit) % 4 === 0;
        const a = isMajor ? 0.5 : 0.2;
        const sw = isMajor ? 1 : 0.5;
        lines += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" ${strokeAttr(a, sw)} />`;
      }
      for (let x = unit; x < w; x += unit) {
        lines += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" ${strokeAttr(0.12, 0.5)} />`;
      }
      gridSvg = lines;
      break;
    }
    case 'custom': {
      let lines = '';
      for (let i = 1; i < customCols; i++) {
        const x = (w / customCols) * i;
        lines += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" ${strokeAttr(1)} />`;
      }
      for (let i = 1; i < customRows; i++) {
        const y2 = (h / customRows) * i;
        lines += `<line x1="0" y1="${y2}" x2="${w}" y2="${y2}" ${strokeAttr(1)} />`;
      }
      gridSvg = lines;
      break;
    }
    default:
      gridSvg = `<!-- ${gridType} grid: canvas rendering only -->`;
  }

  // Clearspace rect
  let clearspaceSvg = '';
  if (showClearspace && logoDrawW > 0) {
    const pad = Math.max(logoDrawW, logoDrawH) * 0.1 * clearspaceMultiplier * 3;
    const bx = logoCx - logoDrawW / 2 - pad;
    const by = logoCy - logoDrawH / 2 - pad;
    const bw = logoDrawW + pad * 2;
    const bh2 = logoDrawH + pad * 2;
    clearspaceSvg = `
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh2}"
        stroke="${rgba(gridColor, gridOpacity)}" stroke-width="1.5"
        stroke-dasharray="6 4" fill="none" />
      <text x="${bx + 4}" y="${by - 4}"
        font-family="'Geist Mono', monospace" font-size="11" font-weight="500"
        fill="${rgba(gridColor, gridOpacity * 0.85)}">${clearspaceMultiplier}x</text>`;
  }

  // Logo image embed
  let logoSvg = '';
  if (logoSrc) {
    const transform = `translate(${logoCx} ${logoCy}) rotate(${logoRotation})`;
    logoSvg = `<image href="${logoSrc}"
      x="${-logoDrawW / 2}" y="${-logoDrawH / 2}"
      width="${logoDrawW}" height="${logoDrawH}"
      transform="${transform}"
      preserveAspectRatio="xMidYMid meet"
      image-rendering="high-quality" />`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${bg !== 'none' ? `<rect width="${w}" height="${h}" fill="${bg}" />` : ''}
  <g id="logo">${logoSvg}</g>
  <g id="grid">${gridSvg}</g>
  <g id="clearspace">${clearspaceSvg}</g>
</svg>`;
}
