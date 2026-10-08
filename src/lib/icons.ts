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
