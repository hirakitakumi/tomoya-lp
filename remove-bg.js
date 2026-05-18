// Background removal via border flood-fill.
// Only light, low-saturation pixels that are CONNECTED to the image border
// are treated as background. This avoids punching holes in light-colored
// subjects (e.g. the beige jacket) the way a plain global threshold would.

const path = require("path");
const sharp = require("sharp");

const SRC_DIR = path.join(__dirname, "assets", "img");

const FILES = [
  { src: "fv-src-navy.png", out: "fv-navy.png" },
  { src: "fv-src-black.png", out: "fv-black.png" },
  { src: "fv-src-beige.png", out: "fv-beige.png" },
  { src: "fv-src-olive.png", out: "fv-olive.png" },
  // Product card cutouts (brochure P6)
  { src: "workwear.jpg", out: "prod-workwear.png" },
  { src: "heatstroke.jpg", out: "prod-heatstroke.png" },
  { src: "special-workwear.jpg", out: "prod-special.png" },
  { src: "safety.jpg", out: "prod-safety.png" },
  { src: "rainwear.jpg", out: "prod-rainwear.png" },
  { src: "event-blouson.jpg", out: "prod-event.png" },
  { src: "medical.jpg", out: "prod-medical.png" },
  { src: "security.jpg", out: "prod-security.png" },
];

// A pixel is a background candidate when it is bright-ish AND nearly neutral.
// The product photos sit on a soft grey vignette plus a neutral drop shadow
// that fades from ~150 up to 255. Colored jackets are protected by either
// being dark (min well below BG_MIN) or saturated (beige: sat ~65 >> SAT_MAX),
// and only border-connected pixels are ever removed.
const BG_MIN = 160;      // min(R,G,B) must be >= this
const BG_SAT_MAX = 18;   // max(R,G,B) - min(R,G,B) must be <= this
const EDGE_BLUR = 0.8;   // alpha-channel blur radius for smooth edges

(async () => {
  for (const { src, out } of FILES) {
    const { data, info } = await sharp(path.join(SRC_DIR, src))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;
    const n = width * height;

    const isCandidate = (idx) => {
      const i = idx * channels;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const min = Math.min(r, g, b);
      const max = Math.max(r, g, b);
      return min >= BG_MIN && max - min <= BG_SAT_MAX;
    };

    // BFS flood-fill from every border pixel.
    const bg = new Uint8Array(n); // 1 = background
    const stack = [];
    for (let x = 0; x < width; x++) {
      stack.push(x);                       // top row
      stack.push((height - 1) * width + x); // bottom row
    }
    for (let y = 0; y < height; y++) {
      stack.push(y * width);               // left col
      stack.push(y * width + width - 1);   // right col
    }

    while (stack.length) {
      const idx = stack.pop();
      if (bg[idx]) continue;
      if (!isCandidate(idx)) continue;
      bg[idx] = 1;
      const x = idx % width;
      const y = (idx - x) / width;
      if (x > 0) stack.push(idx - 1);
      if (x < width - 1) stack.push(idx + 1);
      if (y > 0) stack.push(idx - width);
      if (y < height - 1) stack.push(idx + width);
    }

    // Hard alpha mask, then blur it slightly for anti-aliased edges.
    const hardAlpha = Buffer.alloc(n);
    for (let i = 0; i < n; i++) hardAlpha[i] = bg[i] ? 0 : 255;

    // sharp may promote a 1-channel raw buffer to multi-channel grayscale on
    // output, so read back with resolveWithObject and stride by its channels.
    const { data: blurredAlpha, info: blurInfo } = await sharp(hardAlpha, {
      raw: { width, height, channels: 1 },
    })
      .blur(EDGE_BLUR)
      .raw()
      .toBuffer({ resolveWithObject: true });
    const aStride = blurInfo.channels;

    // Recombine original RGB with the new alpha.
    const rgba = Buffer.alloc(n * 4);
    for (let i = 0; i < n; i++) {
      const s = i * channels;
      rgba[i * 4] = data[s];
      rgba[i * 4 + 1] = data[s + 1];
      rgba[i * 4 + 2] = data[s + 2];
      rgba[i * 4 + 3] = blurredAlpha[i * aStride];
    }

    await sharp(rgba, { raw: { width, height, channels: 4 } })
      .png({ compressionLevel: 9 })
      .toFile(path.join(SRC_DIR, out));

    const removed = bg.reduce((a, v) => a + v, 0);
    console.log(
      `${src} -> ${out} (${width}x${height}, bg ${((removed / n) * 100).toFixed(1)}%)`
    );
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
