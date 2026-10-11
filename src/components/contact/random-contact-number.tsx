'use client';

import { Phone } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { WhatsAppLink } from '@/components/ui/whatsapp-link';
import { useRandomPhoneNumber } from '@/lib/use-random-phone-number';
import { telLink } from '@/lib/whatsapp';

type Props = {
  numbers: readonly string[];
  whatsappNumbers: string[];
  showWhatsApp: boolean;
  message: string;
  salesLabel: string;
  callLabel: string;
  whatsappLabel: string;
};

export function RandomContactNumber({
  numbers,
  whatsappNumbers,
  showWhatsApp,
  message,
  salesLabel,
  callLabel,
  whatsappLabel,
}: Props) {
  const number = useRandomPhoneNumber(numbers);
  if (!number) return null;

  return (
    <li className="bg-surface-alt flex flex-wrap items-center gap-3 rounded-md px-4 py-3">
      <span className="font-semibold">{salesLabel}</span>
      <a
        href={telLink(number)}
        dir="ltr"
        className="phone text-fire-700 inline-block py-1 font-bold"
      >
        {number}
      </a>
      <span className="ms-auto flex gap-2">
        <a
          href={telLink(number)}
          className="border-border bg-surface inline-flex h-11 items-center gap-1.5 rounded-md border px-3 text-xs font-bold transition-colors hover:bg-white"
        >
          <Phone aria-hidden="true" className="h-3.5 w-3.5" />
          {callLabel}
        </a>
        {showWhatsApp && whatsappNumbers.length > 0 && (
          <WhatsAppLink
            numbers={whatsappNumbers}
            message={message}
            className="bg-whatsapp hover:bg-navy-950 inline-flex h-11 items-center gap-1.5 rounded-md px-3 text-xs font-bold text-white transition-colors"
          >
            <FaWhatsapp aria-hidden="true" className="h-3.5 w-3.5" />
            {whatsappLabel}
          </WhatsAppLink>
        )}
      </span>
    </li>
  );
}
