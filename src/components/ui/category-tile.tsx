'use client';

import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { categoryGlyph } from './category-icons';

type Props = {
  slug: string;
  name: string;
  count: number;
};

/** Category tile with its real published-product count (DESIGN.md §6). */
export function CategoryTile({ slug, name, count }: Props) {
  const t = useTranslations();

  return (
    <Link
      href={`/products/?category=${encodeURIComponent(slug)}`}
      className="border-border bg-surface hover:border-fire-600/40 group flex items-center gap-3 rounded-md border p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="bg-navy-900 flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-white">
        {categoryGlyph(slug, { className: 'h-6 w-6', strokeWidth: 1.75 })}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-text block truncate font-semibold">{name}</span>
        <span className="text-muted block text-sm">{t('common.results', { count })}</span>
      </span>
      <ArrowRight
        aria-hidden="true"
        className="group-hover:text-fire-600 h-5 w-5 shrink-0 text-slate-400 transition-colors rtl:rotate-180"
      />
    </Link>
  );
}
