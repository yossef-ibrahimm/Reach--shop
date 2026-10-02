import { ArrowRight, BadgeCheck, Headset, Trophy } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { AccreditationGallery } from '@/components/about/accreditation-gallery';
import { SectionHeading } from '@/components/ui/section-heading';
import { Link } from '@/lib/i18n/navigation';

/**
 * "Accreditation & Recognition" — the About page's primary trust signal
 * (PROJECT_SPEC §6.5). Server-rendered so the copy is in the static HTML;
 * only the visual block hydrates for the lightbox.
 */
export async function AccreditationSection() {
  const t = await getTranslations('about.accreditation');
  const tn = await getTranslations('nav');
  const tc = await getTranslations('common');

  const trustPoints = [
    {
      id: 'official',
      Icon: BadgeCheck,
      title: t('trust.official.title'),
      body: t('trust.official.body'),
    },
    {
      id: 'recognition',
      Icon: Trophy,
      title: t('trust.recognition.title'),
      body: t('trust.recognition.body'),
    },
    {
      id: 'support',
      Icon: Headset,
      title: t('trust.support.title'),
      body: t('trust.support.body'),
    },
  ];

  return (
    <section aria-labelledby="accreditation-title" className="mt-16">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="reveal-up order-2 lg:order-1">
          <SectionHeading id="accreditation-title" eyebrow={t('eyebrow')} title={t('title')} />
          <p className="text-muted mt-5 max-w-xl text-lg leading-relaxed text-pretty">
            {t('lead')}
          </p>

          <ul className="mt-8 grid list-none gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {trustPoints.map(({ id, Icon, title, body }) => (
              <li
                key={id}
                className="border-border bg-surface rounded-lg border p-5 shadow-sm transition-shadow hover:shadow-md lg:flex lg:items-start lg:gap-4 lg:p-4"
              >
                <span className="bg-fire-50 text-fire-700 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="lg:pt-0.5">
                  <h3 className="mt-4 font-bold lg:mt-0">{title}</h3>
                  <p className="text-muted mt-1.5 text-sm leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/contact/"
              className="bg-primary hover:bg-primary-hover shadow-fire-600/25 inline-flex h-12 items-center justify-center gap-2 rounded-md px-7 font-bold text-white shadow-lg transition-all motion-safe:hover:-translate-y-0.5"
            >
              {tn('contact')}
              <ArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <Link
              href="/products/"
              className="border-border bg-surface hover:bg-surface-alt inline-flex h-12 items-center justify-center gap-2 rounded-md border px-7 font-bold transition-colors"
            >
              {tc('browseProducts')}
            </Link>
          </div>
        </div>

        <div className="reveal-up order-1 lg:order-2">
          <AccreditationGallery />
        </div>
      </div>
    </section>
  );
}
