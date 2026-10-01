import type { Metadata } from 'next';
import { basePath } from '@/lib/env';
import { fontVariables } from '@/lib/fonts';
import '@/app/globals.css';

/**
 * Global 404 (experimental `globalNotFound`) — required because the app has
 * multiple root layouts, so no single root layout can wrap a `not-found` page.
 * Bilingual on purpose: the requested locale is unknown for unmatched URLs.
 */
export const metadata: Metadata = {
  title: '404 — الصفحة غير موجودة | Page not found',
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="ar" dir="rtl" className={fontVariables}>
      <body className="bg-paper flex min-h-screen items-center justify-center px-6">
        <main className="max-w-md text-center">
          <p className="text-fire-600 font-mono text-4xl font-bold">404</p>
          <h1 className="mt-4 text-2xl font-bold">الصفحة غير موجودة</h1>
          <p className="text-muted mt-2">Page not found</p>
          <a
            href={`${basePath}/ar/`}
            className="bg-primary hover:bg-primary-hover mt-6 inline-block rounded-md px-5 py-3 text-sm font-bold text-white transition-colors"
          >
            العودة إلى الصفحة الرئيسية
          </a>
        </main>
      </body>
    </html>
  );
}
