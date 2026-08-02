/**
 * One-off analysis: recover the true colour of the garment print.
 *
 * Averaging a region is useless here — the type is hairline on black, so the
 * mean is dominated by garment. Instead we take the brightest percentile of
 * pixels inside the print region, which is the ink itself.
 *
 * Run: node scripts/sample-print-colour.mjs
 */
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "_source", "references");

const REGIONS = [
  {
    file: "f90fbe5a-2702-401e-b33a-73fcfb3a0266.jfif",
    label: "front — serif MILLIONAIRE chest print",
    box: { left: 400, top: 275, width: 220, height: 50 },
  },
  {
    file: "f90fbe5a-2702-401e-b33a-73fcfb3a0266.jfif",
    label: "front — M crest on thigh",
    box: { left: 565, top: 580, width: 70, height: 70 },
  },
  {
    file: "f990ba5b-fb8b-4645-a919-fe45691215e5.jfif",
    label: "three-quarter — grotesque chest print",
    box: { left: 395, top: 285, width: 170, height: 45 },
  },
  {
    file: "28d675ae-3d69-469c-99bd-182760615302.jfif",
    label: "back — NO RISK script",
    box: { left: 455, top: 330, width: 165, height: 60 },
  },
  {
    file: "0e2fe456-5802-45df-936c-a3e9f5ed3a07.jfif",
    label: "back — ARCX MFTA overline",
    box: { left: 515, top: 288, width: 145, height: 22 },
  },
];

/** Mean of the top `pct` of pixels by luminance — i.e. the ink, not the cloth. */
function brightestMean(data, channels, pct) {
  const pixels = [];
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    pixels.push({ r, g, b, lum: 0.2126 * r + 0.7152 * g + 0.0722 * b });
  }
  pixels.sort((a, b) => b.lum - a.lum);
  const take = Math.max(1, Math.round(pixels.length * pct));
  const slice = pixels.slice(0, take);
  const avg = slice.reduce(
    (acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }),
    { r: 0, g: 0, b: 0 },
  );
  const hex = (n) =>
    Math.round(n / take)
      .toString(16)
      .padStart(2, "0");
  return {
    hex: `#${hex(avg.r)}${hex(avg.g)}${hex(avg.b)}`,
    rgb: [Math.round(avg.r / take), Math.round(avg.g / take), Math.round(avg.b / take)],
  };
}

for (const region of REGIONS) {
  const image = sharp(await readFile(join(SRC, region.file)));
  const { data, info } = await image
    .extract(region.box)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const top2 = brightestMean(data, info.channels, 0.02);
  const top10 = brightestMean(data, info.channels, 0.1);
  // Positive => warm (red above blue). Near zero => neutral grey.
  const warmth = (top10.rgb[0] ?? 0) - (top10.rgb[2] ?? 0);

  console.log(
    `${region.label}\n  brightest 2%:  ${top2.hex}\n  brightest 10%: ${top10.hex}   warmth(R-B): ${warmth > 0 ? "+" : ""}${warmth}\n`,
  );
}
