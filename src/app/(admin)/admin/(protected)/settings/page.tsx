import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ContactNumbersManager } from '@/features/admin/settings/contact-numbers-manager';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.meta');
  return { title: t('contactNumbers') };
}

export default function AdminContactNumbersPage() {
  return <ContactNumbersManager />;
}
