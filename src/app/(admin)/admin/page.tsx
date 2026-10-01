import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <main className="flex flex-col items-start justify-center gap-4">
      <span className="bg-fire-50 text-fire-700 rounded-full px-3 py-1 text-xs font-bold">
        noindex · رُبط الأدمن بـ RLS
      </span>
      <h1 className="text-3xl font-bold">لوحة التحكم</h1>
      <p className="text-muted">
        هيكل أولي (المرحلة ٠). تُبنى شاشات الدخول وإدارة المنتجات في المرحلة ٣.
      </p>
      <Link
        href="/"
        className="border-border bg-surface hover:bg-surface-alt rounded-md border px-5 py-3 text-sm font-bold transition-colors"
      >
        العودة إلى الموقع
      </Link>
    </main>
  );
}
