import type { Metadata } from 'next';
import { fontVariables } from '@/lib/fonts';
import '@/app/globals.css';

/**
 * Admin root layout (PROJECT_SPEC §7): Arabic RTL UI, noindex.
 * Security is Supabase RLS — hiding the route is not security.
 */
export const metadata: Metadata = {
  title: { default: 'الإدارة', template: '%s · الإدارة' },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={fontVariables}>
      <body className="bg-paper min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-16">
          {children}
        </div>
      </body>
    </html>
  );
}
