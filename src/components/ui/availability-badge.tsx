'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';

const STYLES: Record<string, string> = {
  in_stock: 'bg-green-600/12 text-green-600',
  limited: 'bg-amber-500/12 text-amber-700',
  on_request: 'bg-blue-600/12 text-blue-600',
};

const KNOWN = new Set(['in_stock', 'limited', 'on_request']);

export function AvailabilityBadge({ availability }: { availability: string }) {
  const t = useTranslations('availability');
  const key = KNOWN.has(availability) ? availability : 'on_request';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
        STYLES[key],
      )}
    >
      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-current" />
      {t(key as 'in_stock' | 'limited' | 'on_request')}
    </span>
  );
}
