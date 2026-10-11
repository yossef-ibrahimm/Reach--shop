'use client';

import type { AnchorHTMLAttributes } from 'react';
import { waLink, randomWhatsAppNumber } from '@/lib/whatsapp';

type Props = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href' | 'target' | 'rel' | 'onClick'
> & {
  numbers: string[];
  message: string;
};

export function WhatsAppLink({ numbers, message, ...props }: Props) {
  const fallbackNumber = numbers[0];
  if (!fallbackNumber) return null;

  return (
    <a
      {...props}
      href={waLink(fallbackNumber, message)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        const number = randomWhatsAppNumber(numbers);
        if (number) event.currentTarget.href = waLink(number, message);
      }}
    />
  );
}
