export interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

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

  const isBackground = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    if (data[idx + 3] < 50) return true;
    return data[idx] > 210 && data[idx + 1] > 210 && data[idx + 2] > 210;
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

    removeBackgroundMagicWand(canvas);

    const { width, height } = canvas;
    const scale = Math.min(1.0, 250 / Math.max(width, height));
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

    const dilated = new Uint8Array(totalSW);
    const targetDilationPixels = 2;
    const radius = Math.max(0, Math.round(targetDilationPixels * scale));

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        if (grid[y * sw + x] === 1) {
          if (radius === 0) {
            dilated[y * sw + x] = 1;
            continue;
          }
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < sw && ny >= 0 && ny < sh) {
                if (dx * dx + dy * dy <= radius * radius) {
                  dilated[ny * sw + nx] = 1;
                }
              }
            }
          }
        }
      }
    }

    const visited = new Uint8Array(totalSW);
    const bboxes: BBox[] = [];

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const idx = y * sw + x;
        if (dilated[idx] === 1 && !visited[idx]) {
          const segQueue: [number, number][] = [[x, y]];
          visited[idx] = 1;
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
                if (dilated[nidx] === 1 && !visited[nidx]) {
                  visited[nidx] = 1;
                  segQueue.push([nx, ny]);
                }
              }
            }
          }

          const pad = 4;
          const origMinX = Math.max(0, Math.floor(minX / scale) - pad);
          const origMinY = Math.max(0, Math.floor(minY / scale) - pad);
          const origMaxX = Math.min(width - 1, Math.ceil(maxX / scale) + pad);
          const origMaxY = Math.min(height - 1, Math.ceil(maxY / scale) + pad);
          const origW = origMaxX - origMinX + 1;
          const origH = origMaxY - origMinY + 1;

          if (origW >= 20 && origH >= 20) {
            bboxes.push({ minX: origMinX, minY: origMinY, maxX: origMaxX, maxY: origMaxY });
          }
        }
      }
    }

    const stickerUrls: string[] = [];
    bboxes.forEach(box => {
      const w = box.maxX - box.minX + 1;
      const h = box.maxY - box.minY + 1;
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = w;
      cropCanvas.height = h;
      const cropCtx = cropCanvas.getContext('2d');
      if (cropCtx) {
        cropCtx.drawImage(canvas, box.minX, box.minY, w, h, 0, 0, w, h);
        let finalCanvas = cropCanvas;
        if (addBorderEnabled) {
          finalCanvas = addWhiteOutline(cropCanvas, borderSize);
        }
        stickerUrls.push(finalCanvas.toDataURL('image/png'));
      }
    });

    resolve(stickerUrls.length > 0 ? stickerUrls : [canvas.toDataURL('image/png')]);
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
