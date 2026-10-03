import { basePath } from '@/lib/env';

/**
 * Company logo used in the site header, footer and admin chrome.
 *
 * The logo ships as an optimized WebP file in `public/images/` rather than as a
 * `site_settings` row in Supabase Storage: it is part of the build, so it always
 * exists at build time, is served from the site's own origin (no remote requests)
 * and honours `NEXT_PUBLIC_BASE_PATH` like every other static asset. The
 * untouched original stays in `docs/source-assets/logo.jpg`.
 *
 * This mirrors `accreditations.ts`. See D-059 for the reasoning and the path back
 * to a database-driven logo.
 */
export type SiteLogoAsset = {
  /** basePath-aware URL, safe for `next/image` under `output: 'export'`. */
  readonly src: string;
  /** Intrinsic pixel size of the source file, used to reserve the box (no CLS). */
  readonly width: number;
  /** Intrinsic pixel size of the source file, used to reserve the box (no CLS). */
  readonly height: number;
};

/** Company logo, converted from `docs/source-assets/logo.jpg`. */
export const SITE_LOGO: SiteLogoAsset = {
  src: `${basePath}/images/logo.webp`,
  width: 471,
  height: 512,
};