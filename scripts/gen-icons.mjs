// Generates brand PWA icons (indigo background + QR-style finder patterns).
// No native deps — raw RGBA buffer encoded to PNG via Node's built-in zlib.
// Full-bleed background keeps the icon maskable-safe; marks stay in the safe zone.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const INDIGO = [99, 102, 241]; // #6366f1
const WHITE = [255, 255, 255];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // rows with filter byte 0
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function makeIcon(N) {
  const buf = Buffer.alloc(N * N * 4);
  const set = (x, y, [r, g, b]) => {
    if (x < 0 || y < 0 || x >= N || y >= N) return;
    const i = (y * N + x) * 4;
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
  };
  const fillRect = (x0, y0, w, h, color) => {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) set(x, y, color);
  };
  // full-bleed indigo background (maskable safe)
  fillRect(0, 0, N, N, INDIGO);
  // QR finder patterns in the central safe zone
  const m = Math.round(N * 0.16);
  const area = N - 2 * m;
  const fs = Math.round(area * 0.30);
  const corners = [
    [m, m],
    [N - m - fs, m],
    [m, N - m - fs],
  ];
  for (const [x, y] of corners) {
    const o = Math.round(fs * 0.18);
    const c = Math.round(fs * 0.36);
    fillRect(x, y, fs, fs, WHITE);
    fillRect(x + o, y + o, fs - 2 * o, fs - 2 * o, INDIGO);
    fillRect(x + c, y + c, fs - 2 * c, fs - 2 * c, WHITE);
  }
  // a few data-ish dots to read as a QR code
  const dot = Math.round(fs * 0.30);
  const dx = N - m - dot;
  const dy = N - m - dot;
  fillRect(dx, dy, dot, dot, WHITE);
  fillRect(dx - Math.round(dot * 1.6), dy, dot, dot, WHITE);
  fillRect(dx, dy - Math.round(dot * 1.6), dot, dot, WHITE);
  return encodePNG(N, N, buf);
}

mkdirSync("public", { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(`public/icon-${size}.png`, makeIcon(size));
  console.log(`wrote public/icon-${size}.png`);
}
// Apple touch icon
writeFileSync("public/apple-touch-icon.png", makeIcon(180));
console.log("wrote public/apple-touch-icon.png");
