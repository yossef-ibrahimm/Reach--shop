'use client';

import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';

export type LightboxImage = { src: string; alt: string; caption?: string };

type Props = {
  images: LightboxImage[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  /** Dialog label; defaults to the product-gallery wording. */
  label?: string;
};

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusablesIn(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
}

/**
 * Fullscreen gallery/lightbox: keyboard navigation, focus trap, focus restore
 * to the trigger and a body scroll lock while open.
 */
export function Lightbox({ images, index, onClose, onIndexChange, label }: Props) {
  const t = useTranslations('product');
  const locale = useLocale();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = index !== null && index >= 0 && index < images.length;
  const image = open ? images[index] : null;
  const captionId = 'lightbox-caption';

  /* Open/close lifecycle only — must not re-run while paging inside the gallery. */
  useEffect(() => {
    if (!open) return;

    const active = document.activeElement;
    triggerRef.current = active instanceof HTMLElement ? active : null;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    closeRef.current?.focus();

    return () => {
      body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
      triggerRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const current = index ?? 0;
    /* Arrows follow the visual reading direction, so they swap in RTL. */
    const isRtl = locale === 'ar';
    const forwardKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
    const backKey = isRtl ? 'ArrowRight' : 'ArrowLeft';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (images.length > 1 && (event.key === forwardKey || event.key === backKey)) {
        event.preventDefault();
        const delta = event.key === forwardKey ? 1 : -1;
        onIndexChange((current + delta + images.length) % images.length);
        return;
      }

      if (event.key !== 'Tab') return;
      const items = focusablesIn(dialogRef.current);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || !dialogRef.current?.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialogRef.current?.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, index, images.length, onClose, onIndexChange, locale]);

  if (!open || !image) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={label ?? t('galleryLabel')}
      aria-describedby={image.caption ? captionId : undefined}
      className="bg-navy-950/92 fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={t('lightboxClose')}
        className="absolute end-4 top-4 z-10 rounded-md bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
      >
        <X aria-hidden="true" className="h-6 w-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onIndexChange((index - 1 + images.length) % images.length);
            }}
            aria-label={t('lightboxPrev')}
            className="absolute start-3 z-10 rounded-md bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:start-6"
          >
            <ChevronLeft aria-hidden="true" className="h-6 w-6 rtl:rotate-180" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onIndexChange((index + 1) % images.length);
            }}
            aria-label={t('lightboxNext')}
            className="absolute end-3 z-10 rounded-md bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:end-6"
          >
            <ChevronRight aria-hidden="true" className="h-6 w-6 rtl:rotate-180" />
          </button>
        </>
      )}

      <figure
        className="flex max-w-full flex-col items-center gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, unoptimized remote storage URLs */}
        <img
          src={image.src}
          alt={image.alt}
          decoding="async"
          className={cn('max-h-[78vh] max-w-[92vw] rounded-lg object-contain shadow-lg')}
        />
        {image.caption && (
          <figcaption id={captionId} className="max-w-2xl text-center text-sm text-slate-300">
            {image.caption}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
