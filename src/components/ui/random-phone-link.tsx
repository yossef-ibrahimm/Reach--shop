'use client';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { useRandomPhoneNumber } from '@/lib/use-random-phone-number';
import { telLink } from '@/lib/whatsapp';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> & {
  numbers: readonly string[];
  numberClassName?: string;
  children?: ReactNode;
};

export function RandomPhoneLink({ numbers, numberClassName, children, ...props }: Props) {
  const number = useRandomPhoneNumber(numbers);
  if (!number) return null;

  return (
    <a {...props} href={telLink(number)} dir="ltr">
      {children}
      <span className={numberClassName ?? 'phone'}>{number}</span>
    </a>
  );
}
