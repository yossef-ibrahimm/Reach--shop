import type { Metadata } from 'next';
import { fontVariables } from '@/lib/fonts';
import '@/app/globals.css';

/** Root layout for the `/` entry point: a static redirect to the default locale. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function RedirectRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={fontVariables}>
      <body className="bg-paper flex min-h-screen items-center justify-center px-6 text-center">
        {children}
      </body>
    </html>
  );
}
