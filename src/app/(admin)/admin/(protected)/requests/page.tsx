import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ContractorRequestsManager } from '@/features/admin/requests/contractor-requests-manager';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.meta');
  return { title: t('requests') };
}

export default function AdminRequestsPage() {
  return <ContractorRequestsManager />;
}
