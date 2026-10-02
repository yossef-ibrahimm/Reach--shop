import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';

/**
 * Localized 404 for URLs inside a valid `/ar/…` or `/en/…` prefix.
 * Unmatched URLs without a locale hit `app/global-not-found.tsx` instead.
 */
export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <main
      id="main-content"
      className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center"
    >
      <p className="text-fire-600 font-mono text-5xl font-bold">404</p>
      <h1 className="mt-4 text-2xl font-bold lg:text-3xl">{t('title')}</h1>
      <p className="text-muted mt-3 max-w-md">{t('body')}</p>
      <Link
        href="/"
        className="bg-primary hover:bg-primary-hover mt-8 inline-flex h-12 items-center rounded-md px-6 font-bold text-white transition-colors"
      >
        {t('backHome')}
      </Link>
    </main>
  );
}
