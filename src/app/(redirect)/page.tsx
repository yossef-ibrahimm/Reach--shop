import { basePath } from '@/lib/env';
import { RedirectScript } from './redirect-script';

const target = `${basePath}/ar/`;

/**
 * Static entry point for `/` (PROJECT_SPEC §3).
 * Meta refresh (works without JS) + JS replace() fallback; both respect basePath.
 */
export default function RootRedirectPage() {
  return (
    <>
      <meta httpEquiv="refresh" content={`0;url=${target}`} />
      <RedirectScript target={target} />
      <div className="flex flex-col items-center gap-4">
        <p className="text-muted">جارٍ تحويلك إلى الصفحة العربية…</p>
        <p className="text-muted text-sm">Redirecting to the Arabic homepage…</p>
        <a
          href={target}
          className="bg-primary hover:bg-primary-hover rounded-md px-5 py-3 text-sm font-bold text-white transition-colors"
        >
          متابعة إلى <span className="phone">{target}</span>
        </a>
      </div>
    </>
  );
}
