import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(size, rgba) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const start = y * (size * 4 + 1);
    raw[start] = 0;
    rgba.copy(raw, start + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function mix(a, b, t) {
  return a.map((channel, i) => Math.round(channel + (b[i] - channel) * t));
}

function inQ(x, y, size) {
  const dx = x - (size - 1) / 2;
  const dy = y - (size - 1) / 2;
  const radius = size * 0.22;
  const thickness = size * 0.072;
  const dist = Math.hypot(dx, dy);
  if (Math.abs(dist - radius) <= thickness / 2) return true;
  const ux = Math.SQRT1_2;
  const uy = Math.SQRT1_2;
  const proj = dx * ux + dy * uy;
  const perp = Math.abs(dx * uy - dy * ux);
  return proj >= radius * 0.35 && proj <= radius * 1.38 && perp <= thickness * 0.46;
}

function render(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const samples = 3;
  const indigo = [0x4f, 0x46, 0xe5];
  const purple = [0x7c, 0x3a, 0xed];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * (size - 1));
      const bg = mix(indigo, purple, t);
      let cover = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const px = x + (sx + 0.5) / samples;
          const py = y + (sy + 0.5) / samples;
          if (inQ(px, py, size)) cover++;
        }
      }
      const alpha = cover / (samples * samples);
      const i = (y * size + x) * 4;
      rgba[i] = Math.round(bg[0] * (1 - alpha) + 255 * alpha);
      rgba[i + 1] = Math.round(bg[1] * (1 - alpha) + 255 * alpha);
      rgba[i + 2] = Math.round(bg[2] * (1 - alpha) + 255 * alpha);
      rgba[i + 3] = 255;
    }
  }
  return png(size, rgba);
}

for (const size of [192, 512]) {
  const file = new URL(`../public/icon-${size}.png`, import.meta.url);
  writeFileSync(file, render(size));
}
