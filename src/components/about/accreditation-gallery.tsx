'use client';

import { useState } from 'react';
import { Award, BadgeCheck, Maximize2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Lightbox, type LightboxImage } from '@/components/ui/lightbox';
import { cn } from '@/lib/cn';
import {
  ACCREDITATION_CERTIFICATE,
  ACCREDITATION_CEREMONY,
  type AccreditationAsset,
} from '@/lib/content/accreditations';

type ZoomImageProps = {
  image: LightboxImage;
  asset: AccreditationAsset;
  label: string;
  onOpen: () => void;
  /** Class for the <img> itself (crop + fit). */
  imgClassName?: string;
};

/** Click/tap-to-enlarge trigger. Not overflow-hidden so the focus ring is visible. */
function ZoomImage({ image, asset, label, onOpen, imgClassName }: ZoomImageProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      className="group border-border block w-full cursor-zoom-in overflow-hidden rounded-md border bg-white transition-shadow duration-150 hover:shadow-md"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static export + local public/ asset; next/image does not add basePath to string srcs */}
      <img
        src={image.src}
        alt={image.alt}
        width={asset.width}
        height={asset.height}
        loading="lazy"
        decoding="async"
        className={cn('w-full', imgClassName)}
      />
      <span
        aria-hidden="true"
        className="bg-navy-950/70 text-inverse absolute end-2 bottom-2 rounded-full p-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        <Maximize2 className="h-4 w-4" strokeWidth={1.75} />
      </span>
    </button>
  );
}

/**
 * Accreditation & Recognition visuals: the HST distributor certificate in a
 * document frame, with the award-ceremony photo as a smaller overlapping card.
 */
export function AccreditationGallery() {
  const t = useTranslations('about.accreditation');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const certificate: LightboxImage = {
    src: ACCREDITATION_CERTIFICATE.src,
    alt: t('certificate.alt'),
    caption: t('certificate.caption'),
  };
  const ceremony: LightboxImage = {
    src: ACCREDITATION_CEREMONY.src,
    alt: t('ceremony.alt'),
    caption: t('ceremony.caption'),
  };

  return (
    <div className="relative isolate p-3 sm:p-5 lg:p-8">
      {/* Offset backing panel — the depth layer behind the document frame. */}
      <div
        aria-hidden="true"
        className="border-border bg-surface-alt absolute inset-y-8 start-10 end-3 -z-10 rounded-xl border"
      />

      <figure className="border-border bg-surface relative rounded-lg border p-3 shadow-md sm:p-4 lg:p-5">
        <ZoomImage
          image={certificate}
          asset={ACCREDITATION_CERTIFICATE}
          label={t('zoomLabel', { name: t('certificate.caption') })}
          onOpen={() => setOpenIndex(0)}
        />
        <figcaption className="text-muted mt-3 flex items-start gap-2 px-1 text-sm leading-relaxed">
          <BadgeCheck aria-hidden="true" className="text-fire-600 mt-0.5 h-4 w-4 shrink-0" />
          {t('certificate.caption')}
        </figcaption>
      </figure>

      <figure className="border-border bg-surface relative z-10 ms-5 -mt-8 w-[62%] rounded-lg border p-2.5 shadow-lg sm:ms-10 sm:-mt-12 sm:w-[56%]">
        <div className="aspect-[3/2]">
          <ZoomImage
            image={ceremony}
            asset={ACCREDITATION_CEREMONY}
            label={t('zoomLabel', { name: t('ceremony.caption') })}
            onOpen={() => setOpenIndex(1)}
            imgClassName="h-full w-full object-cover object-[50%_35%]"
          />
        </div>
        <figcaption className="text-muted mt-2.5 flex items-start gap-2 px-1 text-xs leading-relaxed">
          <Award aria-hidden="true" className="text-fire-600 mt-0.5 h-4 w-4 shrink-0" />
          {t('ceremony.caption')}
        </figcaption>
      </figure>

      <Lightbox
        images={[certificate, ceremony]}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
        label={t('lightboxLabel')}
      />
    </div>
  );
}
