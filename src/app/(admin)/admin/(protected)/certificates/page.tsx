import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CertificatesManager } from '@/features/admin/certificates/certificates-manager';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.meta');
  return { title: t('certificates') };
}

export default function AdminCertificatesPage() {
  return <CertificatesManager />;
}
