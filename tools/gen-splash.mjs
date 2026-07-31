/* Generate iOS PWA launch images (apple-touch-startup-image) as solid app-background PNGs, so the
   home-screen app shows the dark-teal background instead of a black flash while it loads.
   iOS ignores the manifest background_color for the launch screen and matches these by media query
   at EXACT device pixel sizes. Solid color → compresses to ~1KB each. Run: node tools/gen-splash.mjs */
import fs from "fs";
import zlib from "zlib";

const BG = [0x0b, 0x1f, 0x23]; // --shell / body background (#0b1f23)
const OUT = "assets/splash";

// iPhone portrait sizes: [cssWidth, cssHeight, dpr] → pixel w×h. Covers SE..16 Pro Max.
const DEVICES = [
  [375, 667, 2], [375, 812, 3], [390, 844, 3], [393, 852, 3], [402, 874, 3],
  [414, 736, 3], [414, 896, 2], [414, 896, 3], [428, 926, 3], [430, 932, 3],
  [440, 956, 3], [320, 568, 2],
];

const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const body = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body)); return Buffer.concat([len, body, crc]); }
function solidPNG(w, h, [r, g, b]) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  const row = Buffer.alloc(1 + w * 3); for (let x = 0; x < w; x++) { row[1 + x * 3] = r; row[2 + x * 3] = g; row[3 + x * 3] = b; }
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

fs.mkdirSync(OUT, { recursive: true });
const links = [];
const seen = new Set();
for (const [dw, dh, dpr] of DEVICES) {
  const w = dw * dpr, h = dh * dpr, key = `${w}x${h}`;
  if (!seen.has(key)) { fs.writeFileSync(`${OUT}/splash-${key}.png`, solidPNG(w, h, BG)); seen.add(key); }
  links.push(`<link rel="apple-touch-startup-image" media="(device-width: ${dw}px) and (device-height: ${dh}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)" href="/splash/splash-${key}.png" />`);
}
fs.writeFileSync(`${OUT}/_links.html`, links.join("\n") + "\n");
console.log(`✓ ${seen.size} splash images in ${OUT}/ + ${links.length} link tags in ${OUT}/_links.html`);
