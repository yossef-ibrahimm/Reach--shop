/**
 * Build-time environment values shared by server and client code.
 * NEXT_PUBLIC_* vars are inlined at build time, so this works in both bundles.
 */

/** Sub-path the site is served from ("" or "/repo-name"), without a trailing slash. */
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
export const basePath: string = rawBasePath.length > 1 ? rawBasePath.replace(/\/+$/, '') : '';

/** Canonical public URL (no trailing slash) — used from Phase 6 (SEO). */
export const siteUrl: string = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/+$/, '');
