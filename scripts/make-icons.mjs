// Generates simple roadmap icons (three connected nodes on a purple tile) as PNGs.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};

function icon(size) {
  const px = new Uint8Array(size * size * 4);
  const s = size / 128;
  const set = (x, y, [r, g, b, a]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px.set([r, g, b, a], i);
  };
  const bg = [109, 109, 255, 255];
  const fg = [255, 255, 255, 255];
  const radius = 26 * s;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = Math.max(radius - x, 0, x - (size - 1 - radius));
      const dy = Math.max(radius - y, 0, y - (size - 1 - radius));
      if (dx * dx + dy * dy <= radius * radius) set(x, y, bg);
    }
  const line = (x1, y1, x2, y2, w) => {
    const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) * s * 2);
    for (let t = 0; t <= steps; t++) {
      const cx = (x1 + ((x2 - x1) * t) / steps) * s;
      const cy = (y1 + ((y2 - y1) * t) / steps) * s;
      for (let y = -w * s; y <= w * s; y++)
        for (let x = -w * s; x <= w * s; x++)
          if (x * x + y * y <= w * s * w * s) set(Math.round(cx + x), Math.round(cy + y), fg);
    }
  };
  const box = (cx, cy, w, h) => {
    for (let y = (cy - h / 2) * s; y <= (cy + h / 2) * s; y++)
      for (let x = (cx - w / 2) * s; x <= (cx + w / 2) * s; x++) set(Math.round(x), Math.round(y), fg);
  };
  line(64, 34, 38, 92, 5);
  line(64, 34, 90, 92, 5);
  box(64, 34, 44, 24);
  box(38, 92, 40, 24);
  box(90, 92, 40, 24);

  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    Buffer.from(px.buffer, y * size * 4, size * 4).copy(raw, y * (size * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [16, 32, 48, 128]) writeFileSync(`public/icon/${size}.png`, icon(size));
