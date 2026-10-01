import { useLocale, useTranslations } from 'next-intl';
import NextLink from 'next/link';
import { Link } from '@/lib/i18n/navigation';

export default function HomePage() {
  const t = useTranslations('home');
  const locale = useLocale();
  const otherLocale = locale === 'ar' ? 'en' : 'ar';

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-6 px-6 py-16">
      <span className="bg-fire-50 text-fire-700 rounded-full px-3 py-1 text-xs font-bold">
        {t('localeLabel')}: <span className="phone">{locale}</span>
      </span>
      <h1 className="text-3xl font-bold sm:text-4xl">{t('heading')}</h1>
      <p className="text-muted">{t('body')}</p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/"
          locale={otherLocale}
          className="bg-primary hover:bg-primary-hover rounded-md px-5 py-3 text-sm font-bold text-white transition-colors"
        >
          {t('switchLanguage')}
        </Link>
        <NextLink
          href="/admin/"
          className="border-border bg-surface hover:bg-surface-alt rounded-md border px-5 py-3 text-sm font-bold transition-colors"
        >
          {t('adminLink')}
        </NextLink>
      </div>
    </main>
  );
}
