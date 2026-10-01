import { defineRouting } from 'next-intl/routing';

/**
 * Locale routing for the public site.
 * - `ar` is the default locale (designed first, RTL).
 * - `localePrefix: 'always'` → every URL carries /ar/ or /en/.
 * - No middleware/proxy: the site is a static export (see PROJECT_SPEC §2).
 * - Locale detection is off: the URL is the single source of truth.
 */
export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  localePrefix: 'always',
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];
