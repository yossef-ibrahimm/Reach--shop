'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Clock, MapPin, Menu, Phone, X } from 'lucide-react';
import Image from 'next/image';
import faviconImg from './favicon.png';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/lib/i18n/navigation';
import { cn } from '@/lib/cn';
import { FaWhatsapp } from 'react-icons/fa6';
import { WhatsAppLink } from '@/components/ui/whatsapp-link';
import { RandomPhoneLink } from '@/components/ui/random-phone-link';

type Props = {
  locale: string;
  companyName: string;
  hours: string;
  mapUrl: string;
  phones: { id: string; number: string }[];
  whatsappNumbers: string[];
  whatsappMessage: string;
};

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fire-600';

export function SiteHeader({
  locale,
  companyName,
  hours,
  mapUrl,
  phones,
  whatsappNumbers,
  whatsappMessage,
}: Props) {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const contactNumbers = useMemo(() => phones.map((phone) => phone.number), [phones]);
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileNavId = useId();
  const headerRef = useRef<HTMLElement>(null);

  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  const navItems = [
    { href: '/', label: t('home') },
    { href: '/products/', label: t('products') },
    { href: '/contractors/', label: t('contractors') },
    { href: '/about/', label: t('about') },
    { href: '/contact/', label: t('contact') },
  ];

  const isActive = (href: string) => {
    const target = href.replace(/\/+$/, '') || '/';
    return target === '/' ? cleanPath === '/' : cleanPath.startsWith(target);
  };

  const closeMenu = () => setMenuOpen(false);

  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMenuOpen(false);
  }

  // اقفل المنيو بـ Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [menuOpen]);

  const switchLocale = () => {
    const query = typeof window !== 'undefined' ? window.location.search : '';
    router.push(`${cleanPath}${query}`, { locale: locale === 'ar' ? 'en' : 'ar' });
  };

  const hasContacts = phones.length > 0;
  const hasTopBar = Boolean(hours) || hasContacts;

  return (
    <header ref={headerRef} className="sticky top-0 z-40 shadow-sm">
      {hasTopBar && (
        <div className="bg-navy-950 text-inverse">
          <div className="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-1.5 text-xs">
            {hours && (
              <span className="flex items-center gap-1.5 opacity-90">
                <Clock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                {hours}
              </span>
            )}

            {hasContacts && (
              <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {phones.map((phone) => (
                  <li key={phone.id} className="flex items-center gap-1.5">
                    <span className="text-slate-400">{tc('sales')}:</span>
                    <RandomPhoneLink
                      numbers={contactNumbers}
                      className={cn(
                        'phone inline-flex items-center gap-1.5 py-1 font-semibold transition-colors hover:text-white',
                        'focus-visible:outline-white',
                        focusRing,
                      )}
                    >
                      <Phone aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </RandomPhoneLink>
                  </li>
                ))}

                {whatsappNumbers.length > 0 && (
                  <li>
                    <WhatsAppLink
                      numbers={whatsappNumbers}
                      message={whatsappMessage}
                      className={cn(
                        'inline-flex items-center gap-1.5 py-1 font-semibold transition-colors hover:text-white',
                        'focus-visible:outline-white',
                        focusRing,
                      )}
                    >
                      <FaWhatsapp aria-hidden="true" className="h-3.5 w-3.5" />
                      {tc('whatsapp')}
                    </WhatsAppLink>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="border-border bg-surface relative border-b">
        <div className="container-page flex h-16 items-center gap-3 lg:h-[72px] lg:gap-6">
          <Link
            href="/"
            className={cn('group flex shrink-0 items-center gap-2.5 rounded-md', focusRing)}
            aria-label={companyName}
          >
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md transition-transform group-hover:scale-105">
              <Image
                src={faviconImg}
                alt=""
                width={40}
                height={40}
                unoptimized
                className="h-full w-full object-contain"
              />
            </span>
            <span className="max-w-[48vw] truncate text-lg font-extrabold sm:max-w-none">
              {companyName}
            </span>
          </Link>

          <nav aria-label={t('menu')} className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-semibold transition-colors',
                      focusRing,
                      isActive(item.href)
                        ? 'bg-fire-50 text-fire-700'
                        : 'text-muted hover:text-text hover:bg-surface-alt',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ms-auto flex items-center gap-2">
            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={tc('mapLink')}
                className={cn(
                  'border-border hover:bg-surface-alt inline-flex h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-bold transition-colors',
                  focusRing,
                )}
              >
                <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{tc('mapLink')}</span>
              </a>
            )}
            <button
              type="button"
              onClick={switchLocale}
              aria-label={t('switchLanguage')}
              className={cn(
                'border-border hover:bg-surface-alt inline-flex h-11 min-w-11 items-center justify-center rounded-md border px-3 text-sm font-bold transition-colors',
                focusRing,
              )}
            >
              <span lang={locale === 'ar' ? 'en' : 'ar'} aria-hidden="true">
                {locale === 'ar' ? 'EN' : 'ع'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls={mobileNavId}
              aria-label={menuOpen ? t('closeMenu') : t('menu')}
              className={cn(
                'border-border hover:bg-surface-alt inline-flex h-11 w-11 items-center justify-center rounded-md border transition-colors lg:hidden',
                focusRing,
              )}
            >
              {menuOpen ? (
                <X aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Menu aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            id={mobileNavId}
            aria-label={t('menu')}
            className="border-border bg-surface absolute start-0 end-0 top-full z-50 max-h-[calc(100dvh-8rem)] overflow-y-auto border-t shadow-lg lg:hidden"
          >
            <ul className="container-page flex flex-col gap-1 py-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={cn(
                      'block rounded-md px-3 py-3 font-semibold transition-colors',
                      focusRing,
                      isActive(item.href)
                        ? 'bg-fire-50 text-fire-700'
                        : 'text-muted hover:bg-surface-alt',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
