import { ArrowRight, Phone } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { FaWhatsapp } from 'react-icons/fa6';
import { CertificatesGrid } from '@/components/home/certificates-grid';
import { HeroPanel } from '@/components/home/hero-panel';
import { CategoryTile } from '@/components/ui/category-tile';
import { ProductCard } from '@/components/ui/product-card';
import { SectionHeading } from '@/components/ui/section-heading';
import { Link } from '@/lib/i18n/navigation';
import { splitHighlight } from '@/lib/text';
import {
  getBrands,
  getCertificates,
  getCategoryCounts,
  getFeaturedProducts,
  getProjects,
  getSiteData,
  getSpecDefinitions,
  setting,
  whatsappNumber,
} from '@/lib/supabase/queries';
import { telLink, waLink } from '@/lib/whatsapp';

/* Shared class strings so every button/focus state is consistent */
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950';
const sectionY = 'py-16 lg:py-24';

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations('home');
  const tc = await getTranslations('common');
  const isEn = locale === 'en';
  const pick = (ar: string | null | undefined, en: string | null | undefined) =>
    (isEn ? en : ar) ?? '';

  const [site, categoryCounts, featured, brands, certificates, projects, specDefs] =
    await Promise.all([
      getSiteData(),
      getCategoryCounts(),
      getFeaturedProducts(8),
      getBrands(),
      getCertificates(),
      getProjects(),
      getSpecDefinitions(),
    ]);

  const heroEyebrow = setting(site, 'hero_eyebrow', locale);
  const heroTitle = setting(site, 'hero_title', locale);
  const heroLead = setting(site, 'hero_lead', locale);
  const phone = site.phones[0]?.number ?? null;
  const waNumber = whatsappNumber(site);
  const whatsappUrl = waNumber ? waLink(waNumber, tc('waGreeting')) : null;

  const whyItems = [1, 2, 3]
    .map((slot) => ({
      title: setting(site, `why_${slot}_title`, locale),
      body: setting(site, `why_${slot}_body`, locale),
    }))
    .filter((item) => item.title && item.body);

  /* Real numbers from the data only (nothing invented) */
  const totalProducts = categoryCounts.reduce((sum, { count }) => sum + count, 0);
  const stats = [
    { value: totalProducts, label: t('stats.products') },
    { value: brands.length, label: t('stats.brands') },
    { value: certificates.length, label: t('stats.certificates') },
    { value: projects.length, label: t('stats.projects') },
  ].filter((s) => s.value > 0);

  const viewAllLink = (
    <Link
      href="/products/"
      className="group text-fire-700 border-fire-200 bg-fire-50 hover:bg-fire-100 focus-visible:ring-fire-600 inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      {tc('viewAll')}
      <ArrowRight
        aria-hidden="true"
        className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5 rtl:rotate-180 rtl:motion-safe:group-hover:-translate-x-0.5"
      />
    </Link>
  );

  return (
    <main id="main-content">
      {/* ───────────── Hero ───────────── */}
      <section
        aria-labelledby="hero-title"
        className="bg-navy-950 text-inverse relative isolate overflow-hidden"
      >
        {/* decorative background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_85%_0%,rgba(220,38,38,0.22),transparent_70%),radial-gradient(40%_50%_at_0%_100%,rgba(245,158,11,0.10),transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        />

        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-28">
          <div>
            {heroEyebrow && (
              <p className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-bold text-amber-500">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {heroEyebrow}
              </p>
            )}
            <h1
              id="hero-title"
              className="mt-5 text-[34px] leading-[1.25] font-extrabold tracking-[-0.03em] text-balance sm:text-[42px] lg:text-5xl"
            >
              {splitHighlight(heroTitle).map((part, index) =>
                part.em ? (
                  <em key={index} className="text-fire-600 font-extrabold not-italic">
                    {part.text}
                  </em>
                ) : (
                  <span key={index}>{part.text}</span>
                ),
              )}
            </h1>
            {heroLead && (
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-slate-300">
                {heroLead}
              </p>
            )}

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/products/"
                className={`bg-primary hover:bg-primary-hover shadow-fire-600/25 inline-flex h-12 items-center justify-center gap-2 rounded-md px-7 font-bold text-white shadow-lg transition-all motion-safe:hover:-translate-y-0.5 ${focusRing}`}
              >
                {tc('browseProducts')}
                <ArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
              </Link>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`bg-whatsapp inline-flex h-12 items-center justify-center gap-2 rounded-md px-7 font-bold text-white shadow-lg shadow-emerald-900/25 transition-all hover:brightness-90 motion-safe:hover:-translate-y-0.5 ${focusRing}`}
                >
                  <FaWhatsapp aria-hidden="true" className="h-5 w-5" />
                  {tc('askWa')}
                </a>
              )}
            </div>
          </div>
          <HeroPanel />
        </div>

        {/* Trust strip: real counts from the database */}
        {stats.length > 0 && (
          <div className="border-t border-white/10 bg-white/[0.03]">
            <dl className="container-page grid grid-cols-2 gap-y-6 py-6 sm:grid-cols-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="text-center sm:border-s sm:border-white/10 sm:first:border-s-0"
                >
                  <dt className="order-2 mt-1 text-sm text-slate-400">{s.label}</dt>
                  <dd className="text-2xl font-extrabold text-white tabular-nums lg:text-3xl">
                    {s.value}
                    <span aria-hidden="true" className="text-fire-600">
                      +
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>

      {/* ───────────── Categories ───────────── */}
      <section aria-labelledby="categories-title" className={`container-page ${sectionY}`}>
        <SectionHeading
          eyebrow={t('categoriesEyebrow')}
          title={t('categoriesTitle')}
          action={viewAllLink}
        />
        <ul className="mt-10 grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoryCounts.map(({ category, count }) => (
            <li key={category.slug} className="transition-transform motion-safe:hover:-translate-y-1">
              <CategoryTile
                slug={category.slug}
                name={pick(category.name_ar, category.name_en)}
                count={count}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────── Featured ───────────── */}
      {featured.length > 0 && (
        <section aria-labelledby="featured-title" className="bg-surface-alt">
          <div className={`container-page ${sectionY}`}>
            <SectionHeading
              eyebrow={t('featuredEyebrow')}
              title={t('featuredTitle')}
              action={viewAllLink}
            />
            <ul className="mt-10 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featured.map((product) => (
                <li key={product.id} className="h-full">
                  <ProductCard product={product} specDefs={specDefs} />
                </li>
              ))}
            </ul>
            <div className="mt-10 flex justify-center sm:hidden">{viewAllLink}</div>
          </div>
        </section>
      )}

      {/* ───────────── Brands ───────────── */}
      {brands.length > 0 && (
        <section aria-labelledby="brands-title" className={`container-page ${sectionY}`}>
          <SectionHeading eyebrow={t('brandsEyebrow')} title={t('brandsTitle')} />
          <ul className="mt-10 grid list-none grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {brands.map((brand) => {
              const name = pick(brand.name_ar, brand.name_en);
              return (
                <li key={brand.slug}>
                  <span className="border-border bg-surface hover:border-fire-200 flex h-20 items-center justify-center rounded-lg border px-4 transition-colors hover:shadow-sm">
                    {brand.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- static export, unoptimized remote storage URLs
                      <img
                        src={brand.logo_url}
                        alt={name}
                        loading="lazy"
                        width={128}
                        height={32}
                        className="max-h-9 max-w-full object-contain opacity-70 grayscale transition duration-200 hover:opacity-100 hover:grayscale-0"
                      />
                    ) : (
                      <span className="text-center font-bold">{name}</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ───────────── Why us ───────────── */}
      {whyItems.length > 0 && (
        <section aria-labelledby="why-title" className="bg-surface-alt">
          <div className={`container-page ${sectionY}`}>
            <SectionHeading eyebrow={t('whyEyebrow')} title={t('whyTitle')} />
            <ol className="mt-10 grid list-none gap-6 sm:grid-cols-3">
              {whyItems.map((item, i) => (
                <li
                  key={item.title}
                  className="border-border bg-surface relative overflow-hidden rounded-lg border p-7 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span
                    aria-hidden="true"
                    className="bg-fire-50 text-fire-700 flex h-11 w-11 items-center justify-center rounded-full text-lg font-extrabold tabular-nums"
                  >
                    {i + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                  <p className="text-muted mt-2 leading-relaxed">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ───────────── Certificates ───────────── */}
      {certificates.length > 0 && (
        <section aria-labelledby="certificates-title" className={`container-page ${sectionY}`}>
          <SectionHeading eyebrow={t('certificatesEyebrow')} title={t('certificatesTitle')} />
          <div className="mt-10">
            <CertificatesGrid certificates={certificates} locale={locale} />
          </div>
        </section>
      )}

      {/* ───────────── Projects ───────────── */}
      {projects.length > 0 && (
        <section aria-labelledby="projects-title" className="bg-surface-alt">
          <div className={`container-page ${sectionY}`}>
            <SectionHeading eyebrow={t('projectsEyebrow')} title={t('projectsTitle')} />
            <ul className="mt-10 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => {
                const title = pick(project.title_ar, project.title_en);
                const description = pick(project.description_ar, project.description_en);
                return (
                  <li
                    key={project.id}
                    className="group border-border bg-surface flex flex-col overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-lg"
                  >
                    {project.image_url && (
                      <div className="overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element -- static export, unoptimized remote storage URLs */}
                        <img
                          src={project.image_url}
                          alt={title}
                          loading="lazy"
                          width={640}
                          height={360}
                          className="aspect-video w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="flex-1 p-6">
                      <h3 className="text-lg font-bold">{title}</h3>
                      {description && (
                        <p className="text-muted mt-2 text-sm leading-relaxed">{description}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ───────────── Contact CTA ───────────── */}
      <section aria-labelledby="cta-title" className={`container-page ${sectionY}`}>
        <div className="bg-navy-950 text-inverse relative isolate overflow-hidden rounded-xl p-8 lg:p-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_80%_at_100%_0%,rgba(220,38,38,0.25),transparent_70%)]"
          />
          <div className="flex flex-wrap items-center justify-between gap-8">
            <div>
              <h2 id="cta-title" className="text-2xl font-extrabold text-balance lg:text-[32px]">
                {t('ctaTitle')}
              </h2>
              <p className="mt-3 max-w-xl text-lg leading-relaxed text-slate-300">{t('ctaBody')}</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              {phone && (
                <a
                  href={telLink(phone)}
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/25 px-6 font-bold transition-colors hover:bg-white/10 ${focusRing}`}
                >
                  <Phone aria-hidden="true" className="h-4 w-4" />
                  <span className="phone" dir="ltr">
                    {phone}
                  </span>
                </a>
              )}
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`bg-whatsapp inline-flex h-12 items-center justify-center gap-2 rounded-md px-6 font-bold text-white shadow-lg shadow-emerald-900/25 transition-all hover:brightness-90 ${focusRing}`}
                >
                  <FaWhatsapp aria-hidden="true" className="h-5 w-5" />
                  {tc('whatsapp')}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}