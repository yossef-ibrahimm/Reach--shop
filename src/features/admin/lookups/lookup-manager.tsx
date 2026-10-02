'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AssetImageField } from '@/features/admin/media/asset-image-field';
import { SITE_ASSETS_BUCKET, removeObjects, storagePathFromPublicUrl, uploadSiteAsset } from '@/features/admin/media/storage';
import { useToast } from '@/features/admin/ui/toast';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { SLUG_PATTERN } from '@/features/admin/products/product-schema';
import type { Tables } from '@/lib/supabase/database.types';

type LookupKind = 'categories' | 'brands' | 'series';
type ProductReference = Pick<Tables<'products'>, 'category_id' | 'brand_id' | 'series_id'>;
type LookupRow = {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  sort_order: number;
  logo_url: string | null;
  productCount: number;
};
type FormValues = { name_ar: string; name_en: string; slug: string; sort_order: number };

type Props = { kind: LookupKind };

export function LookupManager({ kind }: Props) {
  const t = useTranslations('admin.lookups');
  const toast = useToast();
  const [rows, setRows] = useState<LookupRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [editing, setEditing] = useState<LookupRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<Blob | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        name_ar: z.string().trim().min(2, t('errors.name')),
        name_en: z.string().trim().min(2, t('errors.name')),
        slug: z.string().trim().min(1, t('errors.slug')).regex(SLUG_PATTERN, t('errors.slugPattern')),
        sort_order: z.number().int().min(0, t('errors.sortOrder')),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name_ar: '', name_en: '', slug: '', sort_order: 0 },
  });

  const title = kind === 'categories' ? t('titles.categories') : kind === 'brands' ? t('titles.brands') : t('titles.series');
  const kindLabel = kind === 'categories' ? t('singular.category') : kind === 'brands' ? t('singular.brand') : t('singular.series');

  const load = useCallback(async () => {
    const supabase = supabaseBrowser();
    const refsResult = await supabase.from('products').select('category_id,brand_id,series_id');
    if (refsResult.error || !refsResult.data) {
      setStatus('error');
      return;
    }

    const counts = new Map<string, number>();
    for (const product of refsResult.data as ProductReference[]) {
      const id = kind === 'categories' ? product.category_id : kind === 'brands' ? product.brand_id : product.series_id;
      if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    if (kind === 'categories') {
      const { data, error } = await supabase.from('categories').select('*').order('sort_order').order('name_ar');
      if (error || !data) return setStatus('error');
      setRows(data.map((row) => ({ ...row, logo_url: null, productCount: counts.get(row.id) ?? 0 })));
    } else if (kind === 'brands') {
      const { data, error } = await supabase.from('brands').select('*').order('sort_order').order('name_ar');
      if (error || !data) return setStatus('error');
      setRows(data.map((row) => ({ ...row, productCount: counts.get(row.id) ?? 0 })));
    } else {
      const { data, error } = await supabase.from('series').select('*').order('name_ar');
      if (error || !data) return setStatus('error');
      setRows(data.map((row) => ({ ...row, sort_order: 0, logo_url: null, productCount: counts.get(row.id) ?? 0 })));
    }
    setStatus('ready');
  }, [kind]);

  useEffect(() => {
    async function initialLoad() {
      await load();
    }
    void initialLoad();
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setLogoFile(null);
    setRemoveLogo(false);
    reset({ name_ar: '', name_en: '', slug: '', sort_order: rows.length * 10 });
    setFormOpen(true);
  };

  const openEdit = (row: LookupRow) => {
    setEditing(row);
    setLogoFile(null);
    setRemoveLogo(false);
    reset({ name_ar: row.name_ar, name_en: row.name_en, slug: row.slug, sort_order: row.sort_order });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setLogoFile(null);
    setRemoveLogo(false);
  };

  const onSubmit = async (values: FormValues) => {
    const supabase = supabaseBrowser();
    const previousLogoPath = editing?.logo_url ? storagePathFromPublicUrl(editing.logo_url, SITE_ASSETS_BUCKET) : null;
    let uploaded: { path: string; url: string } | null = null;

    try {
      if (kind === 'brands' && logoFile) uploaded = await uploadSiteAsset(logoFile, 'brand-logos');
      const logoUrl = uploaded?.url ?? (removeLogo ? null : (editing?.logo_url ?? null));
      let error: { message: string } | null = null;

      if (kind === 'categories') {
        const result = editing
          ? await supabase.from('categories').update({ ...values }).eq('id', editing.id)
          : await supabase.from('categories').insert({ ...values });
        error = result.error;
      } else if (kind === 'brands') {
        const payload = { ...values, logo_url: logoUrl };
        const result = editing
          ? await supabase.from('brands').update(payload).eq('id', editing.id)
          : await supabase.from('brands').insert(payload);
        error = result.error;
      } else {
        const payload = { name_ar: values.name_ar, name_en: values.name_en, slug: values.slug };
        const result = editing
          ? await supabase.from('series').update(payload).eq('id', editing.id)
          : await supabase.from('series').insert(payload);
        error = result.error;
      }

      if (error) throw error;
      if (previousLogoPath && (uploaded || removeLogo)) {
        const failed = await removeObjects(SITE_ASSETS_BUCKET, [previousLogoPath]);
        if (failed > 0) toast(t('toasts.savedLogoCleanupFailed'), 'error');
      }
      toast(editing ? t('toasts.saved') : t('toasts.created'));
      closeForm();
      await load();
    } catch {
      if (uploaded) await removeObjects(SITE_ASSETS_BUCKET, [uploaded.path]);
      toast(t('errors.save'), 'error');
    }
  };

  const deleteRow = async (row: LookupRow) => {
    if (row.productCount > 0) {
      toast(t('errors.inUse', { count: row.productCount }), 'error');
      return;
    }

    const supabase = supabaseBrowser();
    let error: { message: string } | null = null;
    if (kind === 'categories') {
      const result = await supabase.from('categories').delete().eq('id', row.id);
      error = result.error;
    } else if (kind === 'brands') {
      const result = await supabase.from('brands').delete().eq('id', row.id);
      error = result.error;
    } else {
      const result = await supabase.from('series').delete().eq('id', row.id);
      error = result.error;
    }
    if (error) {
      toast(t('errors.delete'), 'error');
      return;
    }

    if (kind === 'brands' && row.logo_url) {
      const path = storagePathFromPublicUrl(row.logo_url, SITE_ASSETS_BUCKET);
      if (path && (await removeObjects(SITE_ASSETS_BUCKET, [path])) > 0) {
        toast(t('toasts.deletedLogoCleanupFailed'), 'error');
      } else {
        toast(t('toasts.deleted'));
      }
    } else {
      toast(t('toasts.deleted'));
    }
    setPendingDeleteId(null);
    await load();
  };

  const control = 'border-border bg-surface w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-navy-700';
  const button = 'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{title}</h1>
          <p className="text-muted mt-1 text-sm">{t('intro')}</p>
        </div>
        <button type="button" onClick={openNew} className={`${button} bg-primary hover:bg-primary-hover text-white`}>
          <Plus aria-hidden="true" className="size-4" />
          {t('actions.add', { item: kindLabel })}
        </button>
      </div>

      {formOpen && (
        <section aria-labelledby="lookup-form-title" className="border-border bg-surface rounded-lg border p-4 shadow-sm sm:p-5">
          <h2 id="lookup-form-title" className="mb-4 text-lg font-extrabold">
            {editing ? t('actions.edit', { item: kindLabel }) : t('actions.add', { item: kindLabel })}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold">
              {t('fields.nameAr')}
              <input className={`${control} mt-1`} {...register('name_ar')} aria-invalid={Boolean(errors.name_ar)} />
              {errors.name_ar && <span role="alert" className="text-fire-700 mt-1 block text-xs">{errors.name_ar.message}</span>}
            </label>
            <label className="text-sm font-bold">
              {t('fields.nameEn')}
              <input className={`${control} mt-1`} {...register('name_en')} aria-invalid={Boolean(errors.name_en)} />
              {errors.name_en && <span role="alert" className="text-fire-700 mt-1 block text-xs">{errors.name_en.message}</span>}
            </label>
            <label className="text-sm font-bold">
              {t('fields.slug')}
              <input className={`${control} mt-1`} dir="ltr" {...register('slug')} aria-invalid={Boolean(errors.slug)} />
              {errors.slug && <span role="alert" className="text-fire-700 mt-1 block text-xs">{errors.slug.message}</span>}
            </label>
            {kind !== 'series' && (
              <label className="text-sm font-bold">
                {t('fields.sortOrder')}
                <input type="number" min="0" className={`${control} mt-1`} {...register('sort_order', { valueAsNumber: true })} aria-invalid={Boolean(errors.sort_order)} />
                {errors.sort_order && <span role="alert" className="text-fire-700 mt-1 block text-xs">{errors.sort_order.message}</span>}
              </label>
            )}
            {kind === 'brands' && (
              <div className="sm:col-span-2">
                <AssetImageField
                  currentUrl={editing?.logo_url ?? null}
                  file={logoFile}
                  removeCurrent={removeLogo}
                  onFileChange={setLogoFile}
                  onRemoveCurrentChange={setRemoveLogo}
                  messages={{
                    choose: t('image.choose'), hint: t('image.hint'), pending: t('image.pending'),
                    removePending: t('image.cancelPending'), removeCurrent: t('image.removeCurrent'),
                    undoRemove: t('image.undoRemove'), empty: t('image.empty'), imageType: t('image.errors.type'),
                    imageTooBig: t('image.errors.size'), imageDecode: t('image.errors.decode'),
                    webpUnsupported: t('image.errors.webp'),
                  }}
                  disabled={isSubmitting}
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button type="submit" disabled={isSubmitting} className={`${button} bg-primary hover:bg-primary-hover text-white`}>
                {isSubmitting ? t('actions.saving') : t('actions.save')}
              </button>
              <button type="button" disabled={isSubmitting} onClick={closeForm} className={`${button} border-border bg-surface border`}>
                {t('actions.cancel')}
              </button>
            </div>
          </form>
        </section>
      )}

      {status === 'loading' ? (
        <p role="status" className="text-muted py-10 text-center text-sm font-bold">{t('loading')}</p>
      ) : status === 'error' ? (
        <div className="border-fire-600/30 bg-fire-50 rounded-md border p-4 text-sm">
          <p role="alert" className="text-fire-700 font-bold">{t('errors.load')}</p>
          <button type="button" onClick={() => void load()} className={`${button} text-fire-700 mt-2`}>{t('actions.retry')}</button>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-muted border-border rounded-md border border-dashed p-8 text-center text-sm font-bold">{t('empty')}</p>
      ) : (
        <div className="border-border bg-surface overflow-x-auto rounded-lg border shadow-sm">
          <table className="w-full min-w-[42rem] border-collapse text-start text-sm">
            <thead className="bg-surface-alt text-muted">
              <tr>
                {kind === 'brands' && <th scope="col" className="p-3 font-bold">{t('columns.logo')}</th>}
                <th scope="col" className="p-3 font-bold">{t('columns.name')}</th>
                <th scope="col" className="p-3 font-bold">{t('columns.slug')}</th>
                {kind !== 'series' && <th scope="col" className="p-3 font-bold">{t('columns.sortOrder')}</th>}
                <th scope="col" className="p-3 font-bold">{t('columns.productCount')}</th>
                <th scope="col" className="p-3 font-bold">{t('columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-border border-t">
                  {kind === 'brands' && (
                    <td className="p-3">
                      {row.logo_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element -- public Supabase brand logo */
                        <img src={row.logo_url} alt="" className="size-12 rounded border object-contain p-1" />
                      ) : <span className="text-muted">—</span>}
                    </td>
                  )}
                  <td className="p-3">
                    <span className="block font-bold">{row.name_ar}</span>
                    <span className="text-muted mt-0.5 block text-xs" dir="ltr">{row.name_en}</span>
                  </td>
                  <td className="p-3 font-mono text-xs" dir="ltr">{row.slug}</td>
                  {kind !== 'series' && <td className="p-3">{row.sort_order}</td>}
                  <td className="p-3">{row.productCount}</td>
                  <td className="p-3">
                    {pendingDeleteId === row.id ? (
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-fire-700 me-1 text-xs font-bold">{t('actions.confirmDelete')}</span>
                        <button type="button" onClick={() => void deleteRow(row)} className={`${button} bg-fire-50 text-fire-700`}>{t('actions.confirm')}</button>
                        <button type="button" onClick={() => setPendingDeleteId(null)} className={`${button} border-border border`}>{t('actions.cancel')}</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => openEdit(row)} aria-label={t('actions.editLabel', { name: row.name_ar })} className={`${button} text-muted hover:bg-surface-alt`}>
                          <Pencil aria-hidden="true" className="size-4" />{t('actions.editShort')}
                        </button>
                        <button type="button" disabled={row.productCount > 0} onClick={() => setPendingDeleteId(row.id)} aria-label={t('actions.deleteLabel', { name: row.name_ar })} className={`${button} text-fire-700 hover:bg-fire-50`}>
                          <Trash2 aria-hidden="true" className="size-4" />{t('actions.deleteShort')}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-muted border-border border-t px-3 py-2 text-xs">{t('deleteHint')}</p>
        </div>
      )}

    </div>
  );
}
