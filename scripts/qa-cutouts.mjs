/**
 * Visual QA sheet for the mattes.
 *
 * Composites each cutout over the void ground it will actually sit on, and
 * over magenta. Magenta is the standard halo test: any backdrop left clinging
 * to an antialiased edge shows up instantly as a pale fringe against it, where
 * on black it would hide.
 *
 * Run: node scripts/qa-cutouts.mjs
 */
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "src", "assets", "products");
const OUT = join(root, ".qa");

const FILES = [
  "millionaire-set/front-cutout.png",
  "millionaire-set/three-quarter-cutout.png",
  "millionaire-set/side-cutout.png",
];

const TILE = 340;

async function sheet(background, name) {
  const tiles = await Promise.all(
    FILES.map((file) =>
      sharp(join(SRC, file))
        .resize(TILE, TILE, { fit: "contain", background })
        .toBuffer(),
    ),
  );

  await sharp({
    create: {
      width: TILE * FILES.length,
      height: TILE,
      channels: 4,
      background,
    },
  })
    .composite(tiles.map((input, i) => ({ input, left: i * TILE, top: 0 })))
    .png()
    .toFile(join(OUT, name));
}

// A tight crop of one edge, magnified — halos are a few pixels wide and
// invisible at full-frame scale.
async function edgeDetail() {
  const image = sharp(join(SRC, "millionaire-set/front-cutout.png"));
  const flattened = await image
    .clone()
    .flatten({ background: { r: 255, g: 0, b: 255 } })
    .extract({ left: 400, top: 240, width: 240, height: 140 })
    .resize(720, 420, { kernel: "nearest" })
    .png()
    .toBuffer();
  await sharp(flattened).toFile(join(OUT, "edge-detail-magenta.png"));
}

await sharp({ create: { width: 8, height: 8, channels: 4, background: "#000" } })
  .png()
  .toFile(join(OUT, ".keep.png"))
  .catch(async () => {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(OUT, { recursive: true });
  });

const { mkdir } = await import("node:fs/promises");
await mkdir(OUT, { recursive: true });

await sheet({ r: 8, g: 8, b: 10, alpha: 1 }, "on-void.png");
await sheet({ r: 255, g: 0, b: 255, alpha: 1 }, "on-magenta.png");
await edgeDetail();

console.log("QA sheets written to .qa/");
