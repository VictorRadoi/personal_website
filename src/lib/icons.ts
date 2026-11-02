/**
 * Icon names available to Icon.astro (files in src/icons/<name>.svg, design-system §8).
 * Line icons: 20px grid, 1.75px stroke, round caps, currentColor. Brand glyphs (apple, github,
 * google-play, linkedin, appgallery = Huawei mark) come from Simple Icons (CC0 1.0); follow each
 * brand's usage rules. Never put style="" in an icon file (CSP). Add the name here when adding a file.
 */
export const ICON_NAMES = [
  'mail',
  'whatsapp',
  'calendar',
  'linkedin',
  'github',
  'apple',
  'google-play',
  'appgallery',
  'globe',
  'copy',
  'check',
  'arrow-right',
  'arrow-up-right',
  'arrow-down',
  'close',
  'menu',
  'scan',
  'arrow-left',
  // brief builder: feature cards (f-*) and napkin-sketch tools (t-*), drawn on the same 20px grid
  'f-key',
  'f-users',
  'f-sliders',
  'f-card',
  'f-store',
  'f-bell',
  'f-chat',
  'f-pin',
  'f-camera',
  'f-offline',
  'f-watch',
  'f-chip',
  'f-chart',
  'f-plug',
  'f-upload',
  'f-server',
  't-pen',
  't-eraser',
  't-rect',
  't-arrow',
  't-text',
  't-phone',
  't-undo',
  't-trash',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

/** Icon for a platform chip kind. */
export function platformIcon(kind: 'ios' | 'android' | 'huawei' | 'web' | 'organizer'): IconName {
  switch (kind) {
    case 'ios':
      return 'apple';
    case 'android':
      return 'google-play';
    case 'huawei':
      return 'appgallery';
    case 'web':
      return 'globe';
    case 'organizer':
      return 'scan';
  }
}
