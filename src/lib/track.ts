/**
 * Build-time helpers for the analytics attribute contract (site-spec §8, §9). analytics.ts reads
 * data-track="<event>" + data-track-<param> on click (kebab → snake_case params).
 *
 *   <a {...trackAttrs('cta_click', { method: 'email', location: 'hero' })}>
 *   → data-track="cta_click" data-track-method="email" data-track-location="hero"
 */
export type TrackEvent =
  | 'cta_click'
  | 'email_copy'
  | 'outbound_click'
  | 'case_study_open'
  | 'project_scroll_depth'
  | 'section_view'
  | 'nav_click'
  | 'screenshot_zoom'
  | 'easter_egg_enter'
  | 'easter_egg_found'
  | 'cursor_pref_change'
  | 'not_found';

export type CtaMethod = 'email' | 'whatsapp' | 'booking' | 'linkedin' | 'github' | 'todo';
export type CsSource = 'venture_card' | 'case_panel' | 'service_proof' | 'next_project';
export type NavTarget = 'ventures' | 'services' | 'work' | 'contact' | 'home';

/** Data attributes to spread on a link/button. Undefined params are dropped. */
export function trackAttrs(
  event: TrackEvent,
  params: Record<string, string | number | undefined> = {},
): Record<string, string> {
  const attrs: Record<string, string> = { 'data-track': event };
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    attrs[`data-track-${key.replace(/_/g, '-')}`] = String(value);
  }
  return attrs;
}
