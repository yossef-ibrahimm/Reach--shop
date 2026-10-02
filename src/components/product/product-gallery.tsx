'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { categoryGlyph } from '@/components/ui/category-icons';
import { Lightbox, type LightboxImage } from '@/components/ui/lightbox';
import type { CardImage } from '@/lib/products/types';

type Props = {
  images: CardImage[];
  locale: string;
  productName: string;
  categorySlug: string;
};

/** Gallery with thumbnails + zoom/lightbox (PROJECT_SPEC §6.4). */
export function ProductGallery({ images, locale, productName, categorySlug }: Props) {
  const t = useTranslations('product');
  const [current, setCurrent] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const lightboxImages: LightboxImage[] = images.map((image) => ({
    src: image.url,
    alt: (locale === 'en' ? image.alt_en : image.alt_ar) ?? productName,
  }));

  const active = images[current] ?? null;

  return (
    <div>
      <div className="border-border bg-surface relative aspect-[4/3] overflow-hidden rounded-lg border shadow-sm">
        {active ? (
          <button
            type="button"
            onClick={() => setOpenIndex(current)}
            className="flex h-full w-full items-center justify-center p-6"
            aria-label={t('galleryLabel')}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, unoptimized remote storage URLs */}
            <img
              src={active.thumb_url ?? active.url}
              alt={(locale === 'en' ? active.alt_en : active.alt_ar) ?? productName}
              width={800}
              height={600}
              className="max-h-full max-w-full object-contain"
            />
          </button>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-slate-200">
            {categoryGlyph(categorySlug, { className: 'h-20 w-20', strokeWidth: 1 })}
            <ImageOff aria-hidden="true" className="h-5 w-5 text-slate-200" />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={t('galleryLabel')}>
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`${t('galleryLabel')} ${index + 1}`}
                aria-current={index === current}
                className={cn(
                  'border-border bg-surface flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border p-1 transition-colors',
                  index === current && 'border-fire-600 ring-fire-600 ring-1',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- static export, unoptimized remote storage URLs */}
                <img
                  src={image.thumb_url ?? image.url}
                  alt=""
                  loading="lazy"
                  width={64}
                  height={64}
                  className="h-full w-full object-contain"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Lightbox
        images={lightboxImages}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
    </div>
  );
}
