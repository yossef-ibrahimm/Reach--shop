import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import * as rootParams from 'next/root-params';
import { routing } from './routing';

/**
 * next-intl request config — works without middleware (static export).
 *
 * The locale is read from the root param `[locale]` (Next.js 16.3+ `next/root-params`),
 * which is available to any Server Component without prop drilling.
 * Routes that have no `[locale]` segment (admin, root redirect) and unknown locales
 * fall back to the default locale `ar`; the site root layout calls `notFound()` for
 * invalid locales before any page renders.
 */
export default getRequestConfig(async () => {
  const paramValue = await rootParams.locale();
  const locale = hasLocale(routing.locales, paramValue) ? paramValue : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
