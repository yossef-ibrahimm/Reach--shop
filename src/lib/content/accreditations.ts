import { basePath } from '@/lib/env';

/**
 * Accreditation & Recognition asset shown on the About page.
 *
 * The certificate ships as an optimized WebP file in `public/images/` rather
 * than as a `certificates` row in Supabase Storage: it is part of the build,
 * so it always exists at build time, is served from the site's own origin
 * (no remote requests) and honours `NEXT_PUBLIC_BASE_PATH` like every other
 * static asset. The untouched original stays in `docs/source-assets/`.
 *
 * See D-058 for the reasoning and the path back to a database-driven section.
 */
export type AccreditationAsset = {
  /** basePath-aware URL, safe for a plain `<img>` under `output: 'export'`. */
  readonly src: string;
  /** Intrinsic pixel size, emitted on the `<img>` to reserve the box (no CLS). */
  readonly width: number;
  readonly height: number;
};

/** HST "Authorized Distributor Certificate" for fire alarm systems. */
export const ACCREDITATION_CERTIFICATE: AccreditationAsset = {
  src: `${basePath}/images/hst-authorized-distributor-certificate.webp`,
  width: 810,
  height: 540,
};