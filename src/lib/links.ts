/** Contact hrefs built from src/config.ts (never hardcode these in components). */
import { BOOKING_URL, EMAIL, EMAIL_SUBJECT, GITHUB_URL, LINKEDIN_URL, TELEPHONE, WHATSAPP } from '../config';

export function mailtoHref(subject: string = EMAIL_SUBJECT): string {
  return `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`;
}

/** WhatsApp click-to-chat, optionally with a prefilled message (copy.md cta.whatsappPrefill). */
export function whatsappHref(prefill?: string): string {
  return prefill ? `${WHATSAPP.url}?text=${encodeURIComponent(prefill)}` : WHATSAPP.url;
}

/** Cal.com 30-minute call. Always rendered with target="_blank" rel="noopener". */
export function bookingHref(): string {
  return BOOKING_URL;
}

export function telHref(): string {
  return `tel:${TELEPHONE}`;
}

export const linkedinHref = (): string => LINKEDIN_URL;
export const githubHref = (): string => GITHUB_URL;

/** True for http(s) links to another origin and for mailto/tel. */
export function isExternal(href: string): boolean {
  return /^(https?:)?\/\//.test(href) || /^(mailto|tel):/.test(href);
}

/** rel/target pair for links that open a new tab. */
export const NEW_TAB = { target: '_blank', rel: 'noopener' } as const;
