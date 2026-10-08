/**
 * Lightbox (design-system §12.5). OWNER: Agent B. Booted by Lightbox.astro (project pages).
 * A plain click on a[data-zoom] opens dialog#lightbox with the link's data-zoom-src (falls back to its
 * href) via showModal(); without <dialog> support the link simply opens the image. ←/→ and the
 * prev/next buttons walk the screenshots sharing its data-gallery (data-gallery-index order). Esc and
 * the close button close it (native); a click on the backdrop too. Focus returns to the link.
 * Fires screenshot_zoom { slug, image_id, method: 'lightbox' }.
 */
import { track } from './analytics';
import { refresh as refreshCursor } from './cursor';

let started = false;

export function init(): void {
  if (started) return;
  started = true;
  const doc = document;
  const dialog = doc.getElementById('lightbox') as HTMLDialogElement | null;
  const stage = dialog?.querySelector<HTMLElement>('[data-lightbox-stage]');
  if (!dialog || !stage || typeof dialog.showModal !== 'function') return;
  const prev = dialog.querySelector<HTMLButtonElement>('[data-lightbox-prev]');
  const next = dialog.querySelector<HTMLButtonElement>('[data-lightbox-next]');
  const slug = doc.querySelector<HTMLElement>('main[data-slug]')?.dataset.slug;
  const img = doc.createElement('img');
  img.decoding = 'async';
  stage.append(img);

  let list: HTMLAnchorElement[] = [];
  let index = 0;
  let opener: HTMLAnchorElement | null = null;

  const show = (i: number) => {
    index = (i + list.length) % list.length;
    const link = list[index];
    const thumb = link.querySelector('img');
    const w = thumb?.getAttribute('width');
    const h = thumb?.getAttribute('height');
    img.removeAttribute('src'); // never flash the previous image
    if (w && h) {
      img.width = +w;
      img.height = +h;
    }
    img.alt = thumb?.alt ?? '';
    img.src = link.dataset.zoomSrc || link.href;
  };

  const step = (d: number) => list.length > 1 && show(index + d);

  doc.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[data-zoom]') : null;
    if (!link || dialog.open) return;
    e.preventDefault();
    opener = link;
    const gallery = link.dataset.gallery;
    list = gallery
      ? [...doc.querySelectorAll<HTMLAnchorElement>('a[data-zoom]')]
          .filter((a) => a.dataset.gallery === gallery)
          .sort((a, b) => Number(a.dataset.galleryIndex ?? 0) - Number(b.dataset.galleryIndex ?? 0))
      : [link];
    show(Math.max(0, list.indexOf(link)));
    if (prev) prev.hidden = list.length < 2;
    if (next) next.hidden = list.length < 2;
    dialog.showModal();
    refreshCursor();
    track('screenshot_zoom', { slug, image_id: link.dataset.imageId, method: 'lightbox' });
  });

  prev?.addEventListener('click', () => step(-1));
  next?.addEventListener('click', () => step(1));
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      step(e.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  // A click on the dialog box itself (outside the image and buttons) is a click on the backdrop.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target === stage) dialog.close();
  });
  dialog.addEventListener('close', () => {
    refreshCursor();
    opener?.focus({ preventScroll: true });
    opener = null;
  });
}
