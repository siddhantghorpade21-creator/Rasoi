// Generates simple placeholder app icons (solid maroon square + amber bowl
// glyph) with zero image-library dependencies, using Node's built-in zlib to
// hand-roll a minimal PNG encoder. Replace public/icons/*.png with real
// artwork whenever you have a logo — see README.md.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const MAROON = [127, 29, 29];
const AMBER = [253, 230, 138];

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function drawIcon(size, maskable) {
  const pixels = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const bgR = maskable ? size * 0.5 : size * 0.22; // maskable icons need a "safe zone", so keep the fill full-bleed
  const bowlR = size * (maskable ? 0.28 : 0.3);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const inRounded = maskable ? true : roundedRectMask(x, y, size, size * 0.22);
      let color = inRounded ? MAROON : [245, 245, 244];
      const distBowl = Math.sqrt(dx * dx + (dy - size * 0.05) * (dy - size * 0.05));
      if (distBowl < bowlR && dy > -size * 0.02) color = AMBER;
      pixels[i] = color[0];
      pixels[i + 1] = color[1];
      pixels[i + 2] = color[2];
      pixels[i + 3] = 255;
    }
  }
  return pixels;
}

function roundedRectMask(x, y, w, h, r = w * 0.22) {
  const nx = x < r ? r - x : x > w - r ? x - (w - r) : 0;
  const ny = y < r ? r - y : y > h - r ? y - (h - r) : 0;
  if (nx === 0 || ny === 0) return true;
  return nx * nx + ny * ny <= r * r;
}

function encodePng(size, maskable) {
  const raw = drawIcon(size, maskable);
  const stride = size * 4;
  const withFilter = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    withFilter[y * (stride + 1)] = 0; // filter type 0 (none)
    raw.copy(withFilter, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = deflateSync(withFilter);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

writeFileSync(path.join(outDir, "icon-192.png"), encodePng(192, false));
writeFileSync(path.join(outDir, "icon-512.png"), encodePng(512, false));
writeFileSync(path.join(outDir, "icon-maskable-512.png"), encodePng(512, true));
writeFileSync(path.join(__dirname, "..", "public", "apple-touch-icon.png"), encodePng(180, false));

console.log("Wrote placeholder icons to public/icons/ (192, 512, maskable-512) and public/apple-touch-icon.png");
