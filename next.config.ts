import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

// GitHub Pages project sites are served from /repo-name ("" for a custom domain).
// basePath is applied to links and assets; Next advises basePath (not assetPrefix)
// for sub-path hosting, so assetPrefix is intentionally not set.
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const basePath = rawBasePath.length > 1 ? rawBasePath.replace(/\/+$/, '') : '';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: basePath || undefined,
  experimental: {
    // Required: the app has multiple root layouts (site / admin / root redirect),
    // so a global 404 cannot be composed from a single root layout.
    globalNotFound: true,
  },
};

export default withNextIntl(nextConfig);
