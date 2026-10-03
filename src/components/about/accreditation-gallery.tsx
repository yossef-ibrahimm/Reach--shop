'use client';

import { useState } from 'react';
import { BadgeCheck, Maximize2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Lightbox, type LightboxImage } from '@/components/ui/lightbox';
import { ACCREDITATION_CERTIFICATE } from '@/lib/content/accreditations';

/**
 * Accreditation & Recognition visual: the HST authorized-distributor
 * certificate in a refined document frame. Click/tap opens an accessible
 * lightbox (focus trap, focus restore to the trigger, Esc, caption inside).
 */
export function AccreditationGallery() {
  const t = useTranslations('about.accreditation');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const certificate: LightboxImage = {
    src: ACCREDITATION_CERTIFICATE.src,
    alt: t('certificate.alt'),
    caption: t('certificate.caption'),
  };

  return (
    <div className="relative isolate p-3 sm:p-5 lg:p-8">
      {/* Offset backing panel — the depth layer behind the document frame. */}
      <div
        aria-hidden="true"
        className="border-border bg-surface-alt absolute inset-y-8 start-10 end-3 -z-10 rounded-xl border"
      />

      <figure className="border-border bg-surface relative rounded-lg border p-3 shadow-md sm:p-4 lg:p-5">
        <button
          type="button"
          onClick={() => setOpenIndex(0)}
          aria-label={t('zoomLabel', { name: t('certificate.caption') })}
          className="group border-border bg-white block w-full cursor-zoom-in overflow-hidden rounded-md border transition-shadow duration-150 hover:shadow-md"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- static export + local public/ asset; next/image does not add basePath to string srcs */}
          <img
            src={certificate.src}
            alt={certificate.alt}
            width={ACCREDITATION_CERTIFICATE.width}
            height={ACCREDITATION_CERTIFICATE.height}
            loading="lazy"
            decoding="async"
            className="w-full"
          />
          <span
            aria-hidden="true"
            className="bg-navy-950/70 text-inverse absolute end-2 bottom-2 rounded-full p-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            <Maximize2 className="h-4 w-4" strokeWidth={1.75} />
          </span>
        </button>
        <figcaption className="text-muted mt-3 flex items-start gap-2 px-1 text-sm leading-relaxed">
          <BadgeCheck aria-hidden="true" className="text-fire-600 mt-0.5 h-4 w-4 shrink-0" />
          {t('certificate.caption')}
        </figcaption>
      </figure>

      <Lightbox
        images={[certificate]}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
        label={t('lightboxLabel')}
      />
    </div>
  );
}