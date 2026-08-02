/**
 * Normalises the raw brand renders into optimised, statically-importable assets.
 *
 * The source files are .jfif (JPEG with an extension nothing recognises) sitting
 * in _source/references. This script:
 *   1. samples the studio backdrop so the site's "bone" ground can be matched
 *      to it exactly — if the ground matches, the image edges become invisible
 *      and the garment appears to float in the page rather than sit in a box;
 *   2. rewrites each render as a clean, metadata-stripped JPEG under
 *      src/assets, where a static import gives us intrinsic dimensions and an
 *      automatic blur placeholder for free.
 *
 * Format conversion to AVIF/WebP is deliberately NOT done here — next/image
 * does it per-request at the exact sizes actually requested, which beats
 * guessing breakpoints at build time.
 *
 * Run: node scripts/prepare-assets.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "_source", "references");
const OUT = join(root, "src", "assets", "products");

/**
 * Source render -> destination, with the turnaround angle it represents.
 * Angles are approximate readings of the camera position in each render.
 */
const RENDERS = [
  {
    src: "f90fbe5a-2702-401e-b33a-73fcfb3a0266.jfif",
    out: "millionaire-set/front.jpg",
    angle: 0,
    note: "front, serif MILLIONAIRE chest print",
  },
  {
    src: "f990ba5b-fb8b-4645-a919-fe45691215e5.jfif",
    out: "millionaire-set/three-quarter.jpg",
    angle: 35,
    note: "three-quarter, grotesque MILLIONAIRE chest print",
  },
  {
    src: "0be35192-4b3b-4e17-a0d1-062a85e1948b.jfif",
    out: "millionaire-set/side.jpg",
    angle: 90,
    note: "side profile",
  },
  {
    src: "28d675ae-3d69-469c-99bd-182760615302.jfif",
    out: "millionaire-set/back.jpg",
    angle: 180,
    note: "back, EXCLUSIVE COLLECTION / No Risk No Rich",
  },
  {
    src: "0e2fe456-5802-45df-936c-a3e9f5ed3a07.jfif",
    out: "arcx-mfta/back.jpg",
    angle: 180,
    note: "back, ARCX MFTA COLLECTION script",
  },
];

/** Average a small patch and return it as hex — one stray pixel shouldn't decide a token. */
async function samplePatch(image, left, top, size = 24) {
  const { data, info } = await image
    .clone()
    .extract({ left, top, width: size, height: size })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const pixels = data.length / channels;
  let r = 0;
  let g = 0;
  let b = 0;
  for (let i = 0; i < data.length; i += channels) {
    r += data[i] ?? 0;
    g += data[i + 1] ?? 0;
    b += data[i + 2] ?? 0;
  }
  const hex = (n) =>
    Math.round(n / pixels)
      .toString(16)
      .padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

async function main() {
  const report = [];

  for (const render of RENDERS) {
    const buffer = await readFile(join(SRC, render.src));
    const image = sharp(buffer);
    const meta = await image.metadata();

    const { width = 0, height = 0 } = meta;
    const samples = {
      topLeft: await samplePatch(image, 8, 8),
      topCentre: await samplePatch(image, Math.round(width / 2) - 12, 8),
      midLeft: await samplePatch(image, 8, Math.round(height / 2) - 12),
      bottomLeft: await samplePatch(image, 8, height - 32),
    };

    const dest = join(OUT, render.out);
    await mkdir(dirname(dest), { recursive: true });

    // mozjpeg at 92 is visually lossless on these flat-black garments while
    // shedding the generator metadata the renders carry.
    const output = await image
      .clone()
      .jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toBuffer();

    await writeFile(dest, output);

    report.push({
      out: render.out,
      angle: render.angle,
      note: render.note,
      dimensions: `${width}x${height}`,
      bytes: `${(buffer.length / 1024).toFixed(1)}kB -> ${(output.length / 1024).toFixed(1)}kB`,
      samples,
    });
  }

  console.log(JSON.stringify(report, null, 2));
}

await main();
