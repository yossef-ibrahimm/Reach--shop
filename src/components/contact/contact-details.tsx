import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FaFacebookF, FaInstagram, FaLink, FaYoutube } from 'react-icons/fa6';
import type { IconType } from 'react-icons';
import type { SiteData } from '@/lib/supabase/queries';
import { setting, whatsappNumbers } from '@/lib/supabase/queries';
import { RandomContactNumber } from '@/components/contact/random-contact-number';
const SOCIAL_ICONS: Record<string, IconType> = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  youtube: FaYoutube,
};

type Props = {
  site: SiteData;
  locale: string;
  /** Localized `common.waGreeting` template used to prefill WhatsApp links. */
  greeting: string;
};

/**
 * Contact block shared by the Contact and About pages (PROJECT_SPEC §6.5/§6.6):
 * phone numbers with call + WhatsApp actions, email, address + map, hours, socials.
 */
export function ContactDetails({ site, locale, greeting }: Props) {
  const t = useTranslations();
  const address = setting(site, 'address', locale);
  const hours = setting(site, 'hours', locale);
  const mapUrl = setting(site, 'map_url', locale);
  const email = setting(site, 'email', locale);
  const message = greeting;
  const waNumbers = whatsappNumbers(site);
  const contactNumbers = site.phones.map((phone) => phone.number);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {site.phones.length > 0 && (
        <section className="border-border bg-surface rounded-md border p-5 shadow-sm sm:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <Phone aria-hidden="true" className="text-fire-600 h-4 w-4" strokeWidth={1.75} />
            {t('contact.numbersTitle')}
          </h2>
          <ul className="space-y-3">
            {site.phones.map((phone) => (
              <RandomContactNumber
                key={phone.id}
                numbers={contactNumbers}
                whatsappNumbers={waNumbers}
                showWhatsApp={phone.is_whatsapp}
                message={message}
                salesLabel={t('common.sales')}
                callLabel={t('common.call')}
                whatsappLabel={t('common.whatsapp')}
              />
            ))}
          </ul>
        </section>
      )}

      {email && (
        <section className="border-border bg-surface rounded-md border p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <Mail aria-hidden="true" className="text-fire-600 h-4 w-4" strokeWidth={1.75} />
            {t('contact.emailTitle')}
          </h2>
          <a
            href={`mailto:${email}`}
            className="hover:text-fire-600 inline-block py-1 font-medium transition-colors"
            dir="ltr"
          >
            {email}
          </a>
        </section>
      )}

      {hours && (
        <section className="border-border bg-surface rounded-md border p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <Clock aria-hidden="true" className="text-fire-600 h-4 w-4" strokeWidth={1.75} />
            {t('contact.hoursTitle')}
          </h2>
          <p className="font-medium">{hours}</p>
        </section>
      )}

      {address && (
        <section className="border-border bg-surface rounded-md border p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <MapPin aria-hidden="true" className="text-fire-600 h-4 w-4" strokeWidth={1.75} />
            {t('contact.addressTitle')}
          </h2>
          <p className="font-medium">{address}</p>
          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fire-700 hover:text-fire-600 mt-2 inline-block py-1 text-sm font-bold transition-colors"
            >
              {t('common.mapLink')}
            </a>
          )}
        </section>
      )}

      {site.socials.length > 0 && (
        <section className="border-border bg-surface rounded-md border p-5 shadow-sm">
          <h2 className="mb-3 font-bold">{t('contact.socialsTitle')}</h2>
          <ul className="flex gap-3">
            {site.socials.map((social) => {
              const Icon = SOCIAL_ICONS[social.platform] ?? FaLink;
              return (
                <li key={social.id}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.platform}
                    className="border-border hover:bg-surface-alt flex h-11 w-11 items-center justify-center rounded-md border transition-colors"
                  >
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
