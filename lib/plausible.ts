/**
 * Plausible Analytics custom event tracking.
 * Events are only sent when Plausible is loaded (i.e. NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set).
 */

type PlausibleArgs = [string, { props?: Record<string, string | number> }?];

declare global {
  interface Window {
    plausible?: (...args: PlausibleArgs) => void;
  }
}

export function trackEvent(
  event: string,
  props?: Record<string, string | number>,
) {
  window.plausible?.(event, props ? { props } : undefined);
}
