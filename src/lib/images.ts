/**
 * Image pipeline helpers (design-system §10.5): every image goes through <Picture> with
 * formats avif + webp and widths [w, 2w], never wider than the original.
 */
import type { ImageMetadata } from 'astro';

export const PICTURE_FORMATS = ['avif', 'webp'] as const;

/**
 * Read image metadata WITHOUT marking the original as used. Astro wraps imported images in a proxy:
 * reading e.g. `src.width` flags the original as referenced and it gets copied to dist (megabytes of
 * PNG). The proxy's `clone` property returns a plain copy and does not flag it. Always read
 * width/height through this helper in components.
 */
export function imageMeta(src: ImageMetadata): ImageMetadata {
  return (src as ImageMetadata & { clone?: ImageMetadata }).clone ?? src;
}

/** [w, 2w] clamped to the original width (Astro would otherwise upscale or warn). */
export function pictureWidths(src: ImageMetadata, displayWidth: number): number[] {
  const { width } = imageMeta(src);
  const widths = [displayWidth, displayWidth * 2].filter((w) => w <= width);
  return widths.length ? widths : [width];
}

/** sizes attribute for a fixed-width object that may shrink to the viewport on small screens. */
export function pictureSizes(displayWidth: number): string {
  return `(max-width: ${displayWidth + 40}px) calc(100vw - 40px), ${displayWidth}px`;
}

/** Width of the enlarged image used by the loupe and lightbox (data-zoom-src). */
export function zoomWidth(src: ImageMetadata): number {
  return Math.min(imageMeta(src).width, 1200);
}
