'use client';

import { ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/cn';
import type { Json } from '@/lib/supabase/database.types';
import type { ProductCardData, SpecDefinition } from '@/lib/products/types';
import { AvailabilityBadge } from './availability-badge';
import { categoryGlyph } from './category-icons';

/**
 * Short mono spec line for the card (D-038): first 3 values (plus units),
 * language-neutral like technical codes — full labels live in the specs table.
 */
function specLine(product: ProductCardData, defs: SpecDefinition[]): string | null {
  const specs = product.specs;
  if (!specs || typeof specs !== 'object' || Array.isArray(specs)) return null;

  const defMap = new Map(defs.map((def) => [def.key, def]));
  const entries = Object.entries(specs as Record<string, Json>).map(([key, value], index) => ({
    key,
    value,
    index,
    def: defMap.get(key),
  }));
  entries.sort(
    (a, b) => (a.def?.sort_order ?? 999) - (b.def?.sort_order ?? 999) || a.index - b.index,
  );

  const parts: string[] = [];
  for (const entry of entries) {
    if (entry.value === null || typeof entry.value === 'object') continue;
    const unit = entry.def?.unit ? ` ${entry.def.unit}` : '';
    parts.push(`${String(entry.value)}${unit}`);
    if (parts.length === 3) break;
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

type Props = {
  product: ProductCardData;
  specDefs?: SpecDefinition[];
};

export function ProductCard({ product, specDefs = [] }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const name = locale === 'en' ? product.name_en : product.name_ar;
  const brandName = product.brand
    ? locale === 'en'
      ? product.brand.name_en
      : product.brand.name_ar
    : null;
  const line = specLine(product, specDefs);
  const cover = product.images[0];

  return (
    <Link
      href={`/products/${product.slug}/`}
      aria-label={t('common.viewProduct', { name })}
      className="group relative flex h-full flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1.5 hover:border-fire-600/30 hover:shadow-lg"
    >
      <span
        aria-hidden="true"
        className="bg-primary absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100"
      />
      <div className="border-border bg-gradient-to-br from-slate-50 via-white to-slate-100 flex aspect-[4/3] items-center justify-center border-b p-4">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- static export, unoptimized remote storage URLs
          <img
            src={cover.thumb_url ?? cover.url}
            alt={(locale === 'en' ? cover.alt_en : cover.alt_ar) ?? name}
            loading="lazy"
            width={400}
            height={300}
            className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="text-slate-200">
            {categoryGlyph(product.category?.slug ?? '', {
              className: 'h-14 w-14',
              strokeWidth: 1.25,
            })}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        {brandName && (
          <span className="bg-slate-100 text-slate-700 w-fit rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] uppercase">
            {brandName}
          </span>
        )}
        <h3 className={cn('text-lg leading-snug font-bold text-slate-900', 'line-clamp-2 min-h-[2.8em]')}>
          {name}
        </h3>
        {line && <p className="phone truncate text-[11px] font-medium text-slate-600">{line}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <AvailabilityBadge availability={product.availability} />
          <span className="bg-slate-100 text-slate-700 inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors group-hover:bg-fire-50 group-hover:text-fire-600">
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 ltr:rotate-0 rtl:rotate-180"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
