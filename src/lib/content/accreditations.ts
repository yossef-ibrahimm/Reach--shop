import { basePath } from '@/lib/env';

/**
 * Accreditation & Recognition assets shown on the About page.
 *
 * These two documents ship as optimized WebP files in `public/images/` rather
 * than as `certificates` rows in Supabase Storage: they are part of the build,
 * so they always exist at build time, are served from the site's own origin
 * (no remote requests) and honour `NEXT_PUBLIC_BASE_PATH` like every other
 * static asset. The untouched originals stay in `docs/source-assets/`.
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

/** Photo of the company representative receiving the recognition certificate. */
export const ACCREDITATION_CEREMONY: AccreditationAsset = {
  src: `${basePath}/images/aiac-certificate-ceremony.webp`,
  width: 1600,
  height: 949,
};
