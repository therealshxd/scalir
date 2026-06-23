import type { ImageDataLike } from './types';

/** Read the EXIF orientation tag (1..8) from JPEG bytes. Returns 1 if absent. */
export function readJpegOrientation(bytes: Uint8Array): number {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return 1;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let off = 2;
  const len = bytes.length;
  while (off + 4 <= len) {
    if (bytes[off] !== 0xff) { off++; continue; }
    const marker = bytes[off + 1];
    if (marker === 0xda || marker === 0xd9) break; // start of scan / end
    const size = dv.getUint16(off + 2);
    if (marker === 0xe1) {
      const s = off + 4;
      // "Exif\0\0"
      if (bytes[s] === 0x45 && bytes[s + 1] === 0x78 && bytes[s + 2] === 0x69 && bytes[s + 3] === 0x66) {
        const tiff = s + 6;
        const little = bytes[tiff] === 0x49;
        const g16 = (o: number) => dv.getUint16(o, little);
        const g32 = (o: number) => dv.getUint32(o, little);
        const ifd0 = tiff + g32(tiff + 4);
        const count = g16(ifd0);
        for (let i = 0; i < count; i++) {
          const entry = ifd0 + 2 + i * 12;
          if (g16(entry) === 0x0112) return g16(entry + 8) || 1;
        }
      }
      return 1;
    }
    off += 2 + size;
  }
  return 1;
}

/** Apply an EXIF orientation (1..8) to pixel data, returning a new image. */
export function applyOrientation(img: ImageDataLike, o: number): ImageDataLike {
  if (o <= 1 || o > 8) return img;
  const { data, width: w, height: h } = img;
  const swap = o >= 5;
  const ow = swap ? h : w;
  const oh = swap ? w : h;
  const out = new Uint8ClampedArray(ow * oh * 4);

  // inverse maps: given output (ox,oy) -> source (sx,sy)
  const src = (ox: number, oy: number): [number, number] => {
    switch (o) {
      case 2: return [w - 1 - ox, oy];
      case 3: return [w - 1 - ox, h - 1 - oy];
      case 4: return [ox, h - 1 - oy];
      case 5: return [oy, ox];
      case 6: return [oy, h - 1 - ox];
      case 7: return [w - 1 - oy, h - 1 - ox];
      case 8: return [w - 1 - oy, ox];
      default: return [ox, oy];
    }
  };

  for (let oy = 0; oy < oh; oy++) {
    for (let ox = 0; ox < ow; ox++) {
      const [sx, sy] = src(ox, oy);
      const si = (sy * w + sx) * 4;
      const di = (oy * ow + ox) * 4;
      out[di] = data[si];
      out[di + 1] = data[si + 1];
      out[di + 2] = data[si + 2];
      out[di + 3] = data[si + 3];
    }
  }
  return { data: out, width: ow, height: oh };
}
