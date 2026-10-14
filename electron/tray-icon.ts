import { nativeImage, type NativeImage } from 'electron';

/** Small orange dot drawn in code, so no image asset is needed for the tray. */
export function createTrayIcon(): NativeImage {
  const size = 32;
  const buffer = Buffer.alloc(size * size * 4);
  const center = (size - 1) / 2;
  const radius = size / 2 - 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const distance = Math.hypot(x - center, y - center);
      const alpha = Math.max(0, Math.min(1, radius - distance + 0.5));
      const i = (y * size + x) * 4;
      // BGRA
      buffer[i] = 0x59;
      buffer[i + 1] = 0x7a;
      buffer[i + 2] = 0xff;
      buffer[i + 3] = Math.round(alpha * 255);
    }
  }
  return nativeImage.createFromBitmap(buffer, { width: size, height: size }).resize({ width: 16, height: 16 });
}
