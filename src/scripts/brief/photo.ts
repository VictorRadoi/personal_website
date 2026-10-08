/**
 * Photo of a paper sketch → JPEG, longest side ≤ 1600 px, aiming for ≤ 800 KB (the Worker accepts ≤ 2 MB).
 * import()ed on the first file pick only. No object URLs (CSP img-src has no blob:): the preview is a
 * small data: JPEG. createImageBitmap applies the photo's EXIF orientation.
 */
const MAX_SIDE = 1600;
const BUDGET = 800_000;
const HARD_LIMIT = 1_900_000;
const THUMB_W = 264;

function paper(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--card').trim() || 'white';
}

function draw(src: ImageBitmap, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const x = c.getContext('2d');
  if (!x) throw new Error('canvas');
  x.fillStyle = paper(); // transparent PNGs flatten onto paper, not black
  x.fillRect(0, 0, c.width, c.height);
  x.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

const jpeg = (c: HTMLCanvasElement, q: number) =>
  new Promise<Blob | null>((resolve) => c.toBlob(resolve, 'image/jpeg', q));

export async function shrink(file: Blob): Promise<{ blob: Blob; thumb: string }> {
  const bmp = await createImageBitmap(file);
  try {
    const long = Math.max(bmp.width, bmp.height);
    let side = Math.min(MAX_SIDE, long);
    let q = 0.84;
    let blob: Blob | null = null;
    for (let i = 0; i < 5; i++) {
      const k = side / long;
      blob = await jpeg(draw(bmp, bmp.width * k, bmp.height * k), q);
      if (blob && blob.size <= BUDGET) break;
      q = Math.max(0.55, q - 0.1);
      side = Math.round(side * 0.85);
    }
    if (!blob || blob.size > HARD_LIMIT) throw new Error('too big');
    const t = THUMB_W / bmp.width;
    const thumb = draw(bmp, THUMB_W, bmp.height * t).toDataURL('image/jpeg', 0.72);
    return { blob, thumb };
  } finally {
    bmp.close();
  }
}
