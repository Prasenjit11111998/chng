/**
 * Canvas 2D 4-Point Perspective Image Warper
 * Warps a 2D image (screenshot) to fit perfectly within an arbitrary 4-point polygon (screen in photo)
 * using triangular subdivision and affine transforms.
 */

interface Point {
  x: number;
  y: number;
}

/**
 * Draws an image warped to fit the given 4 corners.
 * Points must be ordered: TopLeft, TopRight, BottomRight, BottomLeft.
 */
export function drawImageWithPerspective(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | HTMLCanvasElement,
  corners: [Point, Point, Point, Point],
  subdivisions: number = 20
) {
  const [tl, tr, br, bl] = corners;

  // We slice the image into a grid of triangles to fake perspective via affine transforms
  const dw = image.width / subdivisions;
  const dh = image.height / subdivisions;

  for (let y = 0; y < subdivisions; y++) {
    for (let x = 0; x < subdivisions; x++) {
      // Texture coordinates (UVs) relative to 0..1
      const u1 = x / subdivisions;
      const v1 = y / subdivisions;
      const u2 = (x + 1) / subdivisions;
      const v2 = (y + 1) / subdivisions;

      // Map UVs to the 4-point polygon using bilinear interpolation
      const p1 = bilerp(tl, tr, bl, br, u1, v1);
      const p2 = bilerp(tl, tr, bl, br, u2, v1);
      const p3 = bilerp(tl, tr, bl, br, u1, v2);
      const p4 = bilerp(tl, tr, bl, br, u2, v2);

      // Source image coordinates
      const sx1 = x * dw, sy1 = y * dh;
      const sx2 = (x + 1) * dw, sy2 = (y + 1) * dh;

      // Draw top triangle
      drawTriangle(
        ctx, image,
        p1, p2, p3,
        { x: sx1, y: sy1 }, { x: sx2, y: sy1 }, { x: sx1, y: sy2 }
      );

      // Draw bottom triangle
      drawTriangle(
        ctx, image,
        p4, p3, p2,
        { x: sx2, y: sy2 }, { x: sx1, y: sy2 }, { x: sx2, y: sy1 }
      );
    }
  }
}

/**
 * Bilinear interpolation for a 4-point polygon.
 */
function bilerp(tl: Point, tr: Point, bl: Point, br: Point, u: number, v: number): Point {
  // Linear interpolation along top and bottom edges
  const topX = tl.x + (tr.x - tl.x) * u;
  const topY = tl.y + (tr.y - tl.y) * u;
  
  const botX = bl.x + (br.x - bl.x) * u;
  const botY = bl.y + (br.y - bl.y) * u;

  // Linear interpolation between the top and bottom edge points
  return {
    x: topX + (botX - topX) * v,
    y: topY + (botY - topY) * v
  };
}

/**
 * Computes the affine transform matrix to map one triangle to another.
 */
function getTransform(src: [Point, Point, Point], dst: [Point, Point, Point]) {
  const [s0, s1, s2] = src;
  const [d0, d1, d2] = dst;

  const denom = s0.x * (s2.y - s1.y) - s1.x * s2.y + s2.x * s1.y + (s1.x - s2.x) * s0.y;
  if (denom === 0) return null;

  const a = -(s0.y * (d2.x - d1.x) - s1.y * d2.x + s2.y * d1.x + (s1.y - s2.y) * d0.x) / denom;
  const b = (s0.y * (d2.y - d1.y) - s1.y * d2.y + s2.y * d1.y + (s1.y - s2.y) * d0.y) / denom;
  const c = (s0.x * (d2.x - d1.x) - s1.x * d2.x + s2.x * d1.x + (s1.x - s2.x) * d0.x) / denom;
  const d = -(s0.x * (d2.y - d1.y) - s1.x * d2.y + s2.x * d1.y + (s1.x - s2.x) * d0.y) / denom;
  const e = (s0.x * (s2.y * d1.x - s1.y * d2.x) + s0.y * (s1.x * d2.x - s2.x * d1.x) + (s2.x * s1.y - s1.x * s2.y) * d0.x) / denom;
  const f = (s0.x * (s2.y * d1.y - s1.y * d2.y) + s0.y * (s1.x * d2.y - s2.x * d1.y) + (s2.x * s1.y - s1.x * s2.y) * d0.y) / denom;

  return [a, b, c, d, e, f];
}

/**
 * Maps a source triangle from the image onto a destination triangle on the canvas.
 */
function drawTriangle(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | HTMLCanvasElement,
  dp0: Point, dp1: Point, dp2: Point,
  sp0: Point, sp1: Point, sp2: Point
) {
  const transform = getTransform([sp0, sp1, sp2], [dp0, dp1, dp2]);
  if (!transform) return;

  ctx.save();
  // Clip to the destination triangle
  ctx.beginPath();
  ctx.moveTo(dp0.x, dp0.y);
  ctx.lineTo(dp1.x, dp1.y);
  ctx.lineTo(dp2.x, dp2.y);
  ctx.closePath();
  ctx.clip();

  // Apply affine transform and draw image
  ctx.transform(transform[0], transform[1], transform[2], transform[3], transform[4], transform[5]);
  
  // A small overlap overlap to prevent antialiasing seams between triangles
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}
