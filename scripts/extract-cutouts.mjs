/**
 * Matte the garment off its studio backdrop.
 *
 * The renders ship on an opaque cyclorama, which means the figure can only
 * ever sit in a light rectangle. Cutting it out frees it to float on the void,
 * be layered behind and in front of type, and take parallax — which is the
 * whole basis of the hero.
 *
 * Why this separation is clean rather than hopeful: the garment measures
 * roughly 10–40 luminance and the backdrop 205–230, so there is a ~165-wide
 * empty band between subject and background. A soft ramp across the middle of
 * that band gives antialiased edges without guessing.
 *
 * Two things a naive threshold gets wrong, both handled here:
 *
 * 1. **The print would be erased.** The chest wordmark and thigh crest are
 *    printed in silver — lighter than the cut-off — so a pure luminance test
 *    deletes exactly the branding the garment exists to carry. Brightness
 *    alone cannot distinguish "light backdrop" from "light print on black
 *    cloth", so the test is topological instead: true backdrop is the region
 *    connected to the frame edge. The print is enclosed by garment, so a flood
 *    fill inwards from the border never reaches it.
 *
 * 2. **Colour decontamination.** An antialiased edge pixel is a blend of black
 *    garment and light backdrop; keeping it grey and merely lowering its alpha
 *    leaves a pale halo — the tell of a bad cutout. Observed colour is
 *    `a*F + (1-a)*B`, so with the local background B sampled per row we solve
 *    for the true foreground F and recover a genuinely black edge.
 *
 * Run: node scripts/extract-cutouts.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "src", "assets", "products");

/** Fully opaque at or below this luminance, fully clear at or above the other. */
const SOLID_BELOW = 95;
const CLEAR_ABOVE = 165;

const TARGETS = [
  "millionaire-set/front.jpg",
  "millionaire-set/three-quarter.jpg",
  "millionaire-set/side.jpg",
  "millionaire-set/back.jpg",
  "arcx-mfta/back.jpg",
];

const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

async function cutout(relativePath) {
  const source = join(SRC, relativePath);
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const out = Buffer.alloc(width * height * 4);

  // Sample the backdrop per row from the outer columns. The cyclorama is
  // vignetted top-to-bottom, so one global background value would leave a
  // gradient of haloing down the edges of the figure.
  const rowBackground = new Float64Array(height);
  for (let y = 0; y < height; y++) {
    let sum = 0;
    let n = 0;
    for (const x of [2, 3, 4, width - 5, width - 4, width - 3]) {
      const i = (y * width + x) * channels;
      sum += luminance(data[i], data[i + 1], data[i + 2]);
      n++;
    }
    rowBackground[y] = sum / n;
  }

  // Provisional alpha from brightness alone: 1 where dark, 0 where light.
  const rawAlpha = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      rawAlpha[y * width + x] =
        1 -
        smoothstep(
          SOLID_BELOW,
          CLEAR_ABOVE,
          luminance(data[i], data[i + 1], data[i + 2]),
        );
    }
  }

  /*
   * Flood fill the real backdrop inwards from the frame edge.
   *
   * Only pixels reachable from the border may become transparent. The silver
   * chest print is light enough to look like backdrop, but it is walled in by
   * opaque garment, so the fill never arrives and it stays solid.
   *
   * The fill is permitted through anything not already near-solid (< 0.9), so
   * it creeps right up to the antialiased edge and stops — it cannot leak
   * through a soft edge into the interior, because the interior is 1.0.
   */
  const isBackdrop = new Uint8Array(width * height);
  const stack = [];
  const consider = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (isBackdrop[p] || rawAlpha[p] >= 0.9) return;
    isBackdrop[p] = 1;
    stack.push(p);
  };

  for (let x = 0; x < width; x++) {
    consider(x, 0);
    consider(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    consider(0, y);
    consider(width - 1, y);
  }

  while (stack.length > 0) {
    const p = stack.pop();
    const x = p % width;
    const y = (p - x) / width;
    consider(x + 1, y);
    consider(x - 1, y);
    consider(x, y + 1);
    consider(x, y - 1);
  }

  let opaquePixels = 0;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    const bg = rowBackground[y];

    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const i = p * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Anything the fill could not reach is subject, whatever its brightness.
      const alpha = isBackdrop[p] ? rawAlpha[p] : 1;

      const o = p * 4;
      if (alpha <= 0.004) {
        out[o] = 0;
        out[o + 1] = 0;
        out[o + 2] = 0;
        out[o + 3] = 0;
        continue;
      }

      // Decontaminate only along the matted edge. Interior pixels are the real
      // garment — running the solve on them would darken the silver print.
      const solve = (channel) =>
        alpha >= 1
          ? channel
          : alpha > 0.12
            ? Math.max(0, Math.min(255, (channel - (1 - alpha) * bg) / alpha))
            : 0;

      out[o] = solve(r);
      out[o + 1] = solve(g);
      out[o + 2] = solve(b);
      out[o + 3] = Math.round(alpha * 255);

      if (alpha > 0.5) {
        opaquePixels++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const destination = source.replace(/\.jpg$/, "-cutout.png");
  await mkdir(dirname(destination), { recursive: true });

  const png = await sharp(out, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();

  await writeFile(destination, png);

  return {
    file: relativePath.replace(/\.jpg$/, "-cutout.png"),
    coverage: `${((opaquePixels / (width * height)) * 100).toFixed(1)}%`,
    // Subject bounds as fractions of the frame — used to position and scale
    // the figure precisely rather than by eye.
    bounds: {
      top: +(minY / height).toFixed(3),
      bottom: +(maxY / height).toFixed(3),
      left: +(minX / width).toFixed(3),
      right: +(maxX / width).toFixed(3),
    },
    kB: +(png.length / 1024).toFixed(1),
  };
}

const report = [];
for (const target of TARGETS) {
  report.push(await cutout(target));
}
console.log(JSON.stringify(report, null, 2));
