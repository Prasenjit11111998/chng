export const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export const removeBackgroundMagicWand = (canvas: HTMLCanvasElement): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width, height } = canvas;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const totalPixels = width * height;
  const visited = new Uint8Array(totalPixels);
  const queue: [number, number][] = [];

  const sampleSize = Math.min(10, Math.floor(Math.min(width, height) / 4));
  let bgR = 0, bgG = 0, bgB = 0, sampleCount = 0;
  const sampleCorners = [
    { x: 0, y: 0 },
    { x: width - sampleSize, y: 0 },
    { x: 0, y: height - sampleSize },
    { x: width - sampleSize, y: height - sampleSize },
  ];
  for (const { x: cx, y: cy } of sampleCorners) {
    for (let y = cy; y < cy + sampleSize && y < height; y++) {
      for (let x = cx; x < cx + sampleSize && x < width; x++) {
        const idx = (y * width + x) * 4;
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
        sampleCount++;
      }
    }
  }
  bgR = Math.round(bgR / sampleCount);
  bgG = Math.round(bgG / sampleCount);
  bgB = Math.round(bgB / sampleCount);
  const bgThreshold = 50;

  const isBackground = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    if (data[idx + 3] < 50) return true;
    const dr = Math.abs(data[idx] - bgR);
    const dg = Math.abs(data[idx + 1] - bgG);
    const db = Math.abs(data[idx + 2] - bgB);
    return dr < bgThreshold && dg < bgThreshold && db < bgThreshold;
  };

  for (let x = 0; x < width; x++) {
    [0, height - 1].forEach(y => {
      if (isBackground(x, y)) {
        const idx = y * width + x;
        if (!visited[idx]) { visited[idx] = 1; queue.push([x, y]); }
      }
    });
  }
  for (let y = 1; y < height - 1; y++) {
    [0, width - 1].forEach(x => {
      if (isBackground(x, y)) {
        const idx = y * width + x;
        if (!visited[idx]) { visited[idx] = 1; queue.push([x, y]); }
      }
    });
  }

  let head = 0;
  while (head < queue.length) {
    const [cx, cy] = queue[head++];
    data[(cy * width + cx) * 4 + 3] = 0;
    const neighbors: [number, number][] = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nidx = ny * width + nx;
        if (!visited[nidx] && isBackground(nx, ny)) {
          visited[nidx] = 1;
          queue.push([nx, ny]);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
};

export const addWhiteOutline = (srcCanvas: HTMLCanvasElement, thickness: number): HTMLCanvasElement => {
  const { width, height } = srcCanvas;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = width + thickness * 2;
  outCanvas.height = height + thickness * 2;
  const ctx = outCanvas.getContext('2d');
  if (!ctx) return srcCanvas;

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d');
  if (maskCtx) {
    maskCtx.drawImage(srcCanvas, 0, 0);
    maskCtx.globalCompositeOperation = 'source-in';
    maskCtx.fillStyle = '#ffffff';
    maskCtx.fillRect(0, 0, width, height);
  }

  for (let angle = 0; angle < 360; angle += 15) {
    const rad = (angle * Math.PI) / 180;
    const dx = Math.round(Math.cos(rad) * thickness);
    const dy = Math.round(Math.sin(rad) * thickness);
    ctx.drawImage(maskCanvas, thickness + dx, thickness + dy);
  }

  ctx.drawImage(srcCanvas, thickness, thickness);
  return outCanvas;
};

export const segmentStickers = (
  img: HTMLImageElement,
  addBorderEnabled: boolean,
  borderSize: number,
): Promise<string[]> =>
  new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve([]);
    ctx.drawImage(img, 0, 0);

    const { width, height } = canvas;
    const checkSample = ctx.getImageData(0, 0, Math.min(width, 200), Math.min(height, 200));
    let transparentPixels = 0;
    for (let i = 3; i < checkSample.data.length; i += 4) {
      if (checkSample.data[i] === 0) transparentPixels++;
    }
    if (transparentPixels < 10) {
      removeBackgroundMagicWand(canvas);
    }

    const scale = Math.min(1.0, 600 / Math.max(width, height));
    const sw = Math.round(width * scale);
    const sh = Math.round(height * scale);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sw;
    tempCanvas.height = sh;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return resolve([canvas.toDataURL('image/png')]);
    tempCtx.drawImage(canvas, 0, 0, sw, sh);

    const imgData = tempCtx.getImageData(0, 0, sw, sh);
    const data = imgData.data;
    const totalSW = sw * sh;

    const grid = new Uint8Array(totalSW);
    for (let i = 0; i < totalSW; i++) {
      grid[i] = data[i * 4 + 3] > 15 ? 1 : 0;
    }

    // ── Phase 2: Per-pixel component labeling ──
    const labels = new Uint32Array(totalSW);
    interface Comp {
      id: number;
      minX: number; minY: number; maxX: number; maxY: number;
      pixelCount: number;
    }
    const components: Comp[] = [];
    let nextId = 1;

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const idx = y * sw + x;
        if (grid[idx] === 1 && labels[idx] === 0) {
          const segQueue: [number, number][] = [[x, y]];
          labels[idx] = nextId;
          let minX = x, maxX = x, minY = y, maxY = y;
          let head = 0;
          while (head < segQueue.length) {
            const [cx, cy] = segQueue[head++];
            if (cx < minX) minX = cx;
            if (cx > maxX) maxX = cx;
            if (cy < minY) minY = cy;
            if (cy > maxY) maxY = cy;
            const neighbors: [number, number][] = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < sw && ny >= 0 && ny < sh) {
                const nidx = ny * sw + nx;
                if (grid[nidx] === 1 && labels[nidx] === 0) {
                  labels[nidx] = nextId;
                  segQueue.push([nx, ny]);
                }
              }
            }
          }

          const pixelCount = head;
          const pad = 4;
          const origMinX = Math.max(0, Math.floor(minX / scale) - pad);
          const origMinY = Math.max(0, Math.floor(minY / scale) - pad);
          const origMaxX = Math.min(width - 1, Math.ceil(maxX / scale) + pad);
          const origMaxY = Math.min(height - 1, Math.ceil(maxY / scale) + pad);

          if (origMaxX - origMinX + 1 >= 20 && origMaxY - origMinY + 1 >= 20) {
            components.push({ id: nextId, minX: origMinX, minY: origMinY, maxX: origMaxX, maxY: origMaxY, pixelCount });
          }
          nextId++;
        }
      }
    }

    // ── Phase 3: Erosion-based watershed splitting ──
    for (const comp of components) {
      if (comp.pixelCount < 50) continue;

      const mask = new Uint8Array(totalSW);
      for (let i = 0; i < totalSW; i++) {
        mask[i] = labels[i] === comp.id ? 1 : 0;
      }

      const eroded = new Uint8Array(totalSW);
      for (let gy = 0; gy < sh; gy++) {
        for (let gx = 0; gx < sw; gx++) {
          const gIdx = gy * sw + gx;
          if (mask[gIdx] === 1) {
            let allOn = true;
            for (let dy = -1; dy <= 1 && allOn; dy++) {
              for (let dx = -1; dx <= 1 && allOn; dx++) {
                const nx = gx + dx, ny = gy + dy;
                if (nx >= 0 && nx < sw && ny >= 0 && ny < sh) {
                  if (mask[ny * sw + nx] === 0) allOn = false;
                }
              }
            }
            if (allOn) eroded[gIdx] = 1;
          }
        }
      }

      const erodedLabels = new Uint32Array(totalSW);
      const erodedCentroids: { cx: number; cy: number }[] = [];

      for (let gy = 0; gy < sh; gy++) {
        for (let gx = 0; gx < sw; gx++) {
          const gIdx = gy * sw + gx;
          if (eroded[gIdx] === 1 && erodedLabels[gIdx] === 0) {
            const eq: [number, number][] = [[gx, gy]];
            erodedLabels[gIdx] = erodedCentroids.length + 1;
            let sx = gx, sy = gy, cnt = 1;
            let head = 0;
            while (head < eq.length) {
              const [cx, cy] = eq[head++];
              for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
                if (nx >= 0 && nx < sw && ny >= 0 && ny < sh) {
                  const nIdx = ny * sw + nx;
                  if (eroded[nIdx] === 1 && erodedLabels[nIdx] === 0) {
                    erodedLabels[nIdx] = erodedCentroids.length + 1;
                    sx += nx; sy += ny; cnt++;
                    eq.push([nx, ny]);
                  }
                }
              }
            }
            erodedCentroids.push({ cx: sx / cnt, cy: sy / cnt });
          }
        }
      }

      if (erodedCentroids.length < 2) continue;

      for (let gy = 0; gy < sh; gy++) {
        for (let gx = 0; gx < sw; gx++) {
          const gIdx = gy * sw + gx;
          if (labels[gIdx] === comp.id && erodedLabels[gIdx] === 0) {
            let minDist = Infinity;
            let nearest = 0;
            for (let ei = 0; ei < erodedCentroids.length; ei++) {
              const dx = gx - erodedCentroids[ei].cx;
              const dy = gy - erodedCentroids[ei].cy;
              const d = dx * dx + dy * dy;
              if (d < minDist) { minDist = d; nearest = ei + 1; }
            }
            erodedLabels[gIdx] = nearest;
          }
        }
      }

      for (let i = 0; i < totalSW; i++) {
        if (erodedLabels[i] > 0) {
          labels[i] = nextId + (erodedLabels[i] - 1);
        }
      }
      nextId += erodedCentroids.length;
    }

    // ── Rebuild component list from final labels ──
    const finalComps = new Map<number, { minX: number; minY: number; maxX: number; maxY: number }>();
    for (let gy = 0; gy < sh; gy++) {
      for (let gx = 0; gx < sw; gx++) {
        const label = labels[gy * sw + gx];
        if (label > 0) {
          let c = finalComps.get(label);
          if (!c) {
            finalComps.set(label, { minX: gx, minY: gy, maxX: gx, maxY: gy });
          } else {
            if (gx < c.minX) c.minX = gx;
            if (gx > c.maxX) c.maxX = gx;
            if (gy < c.minY) c.minY = gy;
            if (gy > c.maxY) c.maxY = gy;
          }
        }
      }
    }

    const pad = 4;
    const bboxes: { origMinX: number; origMinY: number; origMaxX: number; origMaxY: number; label: number }[] = [];
    for (const [label, c] of finalComps) {
      const origMinX = Math.max(0, Math.floor(c.minX / scale) - pad);
      const origMinY = Math.max(0, Math.floor(c.minY / scale) - pad);
      const origMaxX = Math.min(width - 1, Math.ceil(c.maxX / scale) + pad);
      const origMaxY = Math.min(height - 1, Math.ceil(c.maxY / scale) + pad);
      if (origMaxX - origMinX + 1 >= 20 && origMaxY - origMinY + 1 >= 20) {
        bboxes.push({ origMinX, origMinY, origMaxX, origMaxY, label });
      }
    }

    // ── Crop with alpha mask + contour smoothing ──
    const stickerUrls: string[] = [];
    for (const { origMinX, origMinY, origMaxX, origMaxY, label } of bboxes) {
      const w = origMaxX - origMinX + 1;
      const h = origMaxY - origMinY + 1;
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = w;
      cropCanvas.height = h;
      const cropCtx = cropCanvas.getContext('2d');
      if (!cropCtx) continue;

      cropCtx.drawImage(canvas, origMinX, origMinY, w, h, 0, 0, w, h);

      const cropData = cropCtx.getImageData(0, 0, w, h);
      const cropPixels = cropData.data;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const gx = Math.round((origMinX + x) * scale);
          const gy = Math.round((origMinY + y) * scale);
          if (labels[gy * sw + gx] !== label) {
            cropPixels[(y * w + x) * 4 + 3] = 0;
          }
        }
      }

      // 3x3 box blur on alpha for smooth edges
      const alphaCopy = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let sum = 0, count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ny = y + dy, nx = x + dx;
              if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
                sum += cropPixels[(ny * w + nx) * 4 + 3];
                count++;
              }
            }
          }
          alphaCopy[y * w + x] = Math.round(sum / count);
        }
      }
      for (let i = 0; i < w * h; i++) {
        cropPixels[i * 4 + 3] = alphaCopy[i];
      }

      cropCtx.putImageData(cropData, 0, 0);

      let finalCanvas = cropCanvas;
      if (addBorderEnabled) {
        finalCanvas = addWhiteOutline(cropCanvas, borderSize);
      }
      stickerUrls.push(finalCanvas.toDataURL('image/png'));
    }

    resolve(stickerUrls.length > 0 ? stickerUrls : []);
  });

export const convertToWebP = (blob: Blob): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(blobUrl);
        return reject(new Error('no context'));
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(b => {
        URL.revokeObjectURL(blobUrl);
        if (b) resolve(b);
        else reject(new Error('blob conversion failed'));
      }, 'image/webp', 0.9);
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error('failed to load image for webp conversion'));
    };
    img.src = blobUrl;
  });
