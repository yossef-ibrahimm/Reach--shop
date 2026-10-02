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
import type { Tables } from '@/lib/supabase/database.types';

type TrustKind = 'certificates' | 'projects';
type CertificateRow = Tables<'certificates'>;
type ProjectRow = Tables<'projects'>;
type TrustRow = {
  id: string;
  title_ar: string;
  title_en: string;
  issuer_ar: string | null;
  issuer_en: string | null;
  issued_at: string | null;
  description_ar: string | null;
  description_en: string | null;
  image_url: string | null;
  storage_path: string | null;
  sort_order: number;
  is_active: boolean;
};
type FormValues = {
  title_ar: string;
  title_en: string;
  issuer_ar: string;
  issuer_en: string;
  issued_at: string;
  description_ar: string;
  description_en: string;
  sort_order: number;
  is_active: boolean;
};

type Props = { kind: TrustKind };

function makeSchema(messages: { required: string; title: string; sortOrder: string }) {
  return z.object({
    title_ar: z.string().trim().min(2, messages.title),
    title_en: z.string().trim().min(2, messages.title),
    issuer_ar: z.string().trim(),
    issuer_en: z.string().trim(),
    issued_at: z.string(),
    description_ar: z.string().trim(),
    description_en: z.string().trim(),
    sort_order: z.number().int().min(0, messages.sortOrder),
    is_active: z.boolean(),
  }).refine((value) => !value.issued_at || /^\d{4}-\d{2}-\d{2}$/.test(value.issued_at), {
    path: ['issued_at'], message: messages.required,
  });
}

const EMPTY_FORM: FormValues = {
  title_ar: '', title_en: '', issuer_ar: '', issuer_en: '', issued_at: '',
  description_ar: '', description_en: '', sort_order: 0, is_active: true,
};

export function TrustContentManager({ kind }: Props) {
  const t = useTranslations('admin.trust');
  const toast = useToast();
  const [rows, setRows] = useState<TrustRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [editing, setEditing] = useState<TrustRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [imageFile, setImageFile] = useState<Blob | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const schema = useMemo(() => makeSchema({ required: t('errors.required'), title: t('errors.title'), sortOrder: t('errors.sortOrder') }), [t]);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema), defaultValues: EMPTY_FORM,
  });
  const title = kind === 'certificates' ? t('certificates.title') : t('projects.title');

  const load = useCallback(async () => {
    if (kind === 'certificates') {
      const { data, error } = await supabaseBrowser().from('certificates').select('*').order('sort_order');
      if (error || !data) return setStatus('error');
      setRows(data.map((row: CertificateRow) => ({ ...row, description_ar: null, description_en: null })));
    } else {
      const { data, error } = await supabaseBrowser().from('projects').select('*').order('sort_order');
      if (error || !data) return setStatus('error');
      setRows(data.map((row: ProjectRow) => ({ ...row, issuer_ar: null, issuer_en: null, issued_at: null })));
    }
    setStatus('ready');
  }, [kind]);

  useEffect(() => {
    async function initialLoad() { await load(); }
    void initialLoad();
  }, [load]);

  const openNew = () => {
    setEditing(null); setImageFile(null); setRemoveImage(false);
    reset({ ...EMPTY_FORM, sort_order: rows.length * 10 });
    setFormOpen(true);
  };
  const openEdit = (row: TrustRow) => {
    setEditing(row); setImageFile(null); setRemoveImage(false);
    reset({
      title_ar: row.title_ar, title_en: row.title_en,
      issuer_ar: row.issuer_ar ?? '', issuer_en: row.issuer_en ?? '', issued_at: row.issued_at ?? '',
      description_ar: row.description_ar ?? '', description_en: row.description_en ?? '',
      sort_order: row.sort_order, is_active: row.is_active,
    });
    setFormOpen(true);
  };
  const closeForm = () => { setFormOpen(false); setEditing(null); setImageFile(null); setRemoveImage(false); };

  const submit = async (values: FormValues) => {
    const oldPath = editing?.storage_path ?? (editing?.image_url ? storagePathFromPublicUrl(editing.image_url, SITE_ASSETS_BUCKET) : null);
    let uploaded: { path: string; url: string } | null = null;
    try {
      if (imageFile) uploaded = await uploadSiteAsset(imageFile, kind);
      const imageUrl = uploaded?.url ?? (removeImage ? null : (editing?.image_url ?? null));
      const storagePath = uploaded?.path ?? (removeImage ? null : (editing?.storage_path ?? oldPath));
      if (kind === 'certificates' && (!imageUrl || !storagePath)) {
        toast(t('errors.certificateImageRequired'), 'error');
        return;
      }

      let error: { message: string } | null = null;
      if (kind === 'certificates') {
        const payload = {
          title_ar: values.title_ar, title_en: values.title_en,
          issuer_ar: values.issuer_ar || null, issuer_en: values.issuer_en || null,
          issued_at: values.issued_at || null, image_url: imageUrl as string,
          storage_path: storagePath as string, sort_order: values.sort_order, is_active: values.is_active,
        };
        const result = editing
          ? await supabaseBrowser().from('certificates').update(payload).eq('id', editing.id)
          : await supabaseBrowser().from('certificates').insert(payload);
        error = result.error;
      } else {
        const payload = {
          title_ar: values.title_ar, title_en: values.title_en,
          description_ar: values.description_ar || null, description_en: values.description_en || null,
          image_url: imageUrl, storage_path: storagePath,
          sort_order: values.sort_order, is_active: values.is_active,
        };
        const result = editing
          ? await supabaseBrowser().from('projects').update(payload).eq('id', editing.id)
          : await supabaseBrowser().from('projects').insert(payload);
        error = result.error;
      }
      if (error) throw error;

      if (oldPath && (uploaded || removeImage)) {
        const failed = await removeObjects(SITE_ASSETS_BUCKET, [oldPath]);
        if (failed > 0) toast(t('toasts.oldAssetCleanupFailed'), 'error');
      }
      toast(editing ? t('toasts.saved') : t('toasts.created'));
      closeForm();
      await load();
    } catch {
      if (uploaded) await removeObjects(SITE_ASSETS_BUCKET, [uploaded.path]);
      toast(t('errors.save'), 'error');
    }
  };

  const toggleActive = async (row: TrustRow) => {
    const result = kind === 'certificates'
      ? await supabaseBrowser().from('certificates').update({ is_active: !row.is_active }).eq('id', row.id)
      : await supabaseBrowser().from('projects').update({ is_active: !row.is_active }).eq('id', row.id);
    if (result.error) { toast(t('errors.save'), 'error'); return; }
    toast(t('toasts.statusChanged')); await load();
  };

  const deleteRow = async (row: TrustRow) => {
    const result = kind === 'certificates'
      ? await supabaseBrowser().from('certificates').delete().eq('id', row.id)
      : await supabaseBrowser().from('projects').delete().eq('id', row.id);
    if (result.error) { toast(t('errors.delete'), 'error'); return; }
    if (row.storage_path && (await removeObjects(SITE_ASSETS_BUCKET, [row.storage_path])) > 0) {
      toast(t('toasts.deletedAssetCleanupFailed'), 'error');
    } else {
      toast(t('toasts.deleted'));
    }
    setPendingDeleteId(null); await load();
  };

  const control = 'border-border bg-surface w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-navy-700';
  const button = 'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-extrabold">{title}</h1><p className="text-muted mt-1 text-sm">{kind === 'certificates' ? t('certificates.hint') : t('projects.hint')}</p></div><button type="button" onClick={openNew} className={`${button} bg-primary hover:bg-primary-hover text-white`}><Plus aria-hidden="true" className="size-4" />{t('actions.add')}</button></div>

      {formOpen && (
        <section className="border-border bg-surface rounded-lg border p-4 shadow-sm sm:p-5" aria-labelledby="trust-form-title">
          <h2 id="trust-form-title" className="mb-4 text-lg font-extrabold">{editing ? t('actions.edit') : t('actions.add')}</h2>
          <form onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold">{t('fields.titleAr')}<input className={`${control} mt-1`} {...register('title_ar')} />{errors.title_ar && <span role="alert" className="text-fire-700 mt-1 block text-xs">{errors.title_ar.message}</span>}</label>
            <label className="text-sm font-bold">{t('fields.titleEn')}<input dir="ltr" className={`${control} mt-1`} {...register('title_en')} />{errors.title_en && <span role="alert" className="text-fire-700 mt-1 block text-xs">{errors.title_en.message}</span>}</label>
            {kind === 'certificates' ? (
              <>
                <label className="text-sm font-bold">{t('fields.issuerAr')}<input className={`${control} mt-1`} {...register('issuer_ar')} /></label>
                <label className="text-sm font-bold">{t('fields.issuerEn')}<input dir="ltr" className={`${control} mt-1`} {...register('issuer_en')} /></label>
                <label className="text-sm font-bold">{t('fields.issuedAt')}<input type="date" className={`${control} mt-1`} {...register('issued_at')} />{errors.issued_at && <span role="alert" className="text-fire-700 mt-1 block text-xs">{errors.issued_at.message}</span>}</label>
              </>
            ) : (
              <>
                <label className="text-sm font-bold sm:col-span-2">{t('fields.descriptionAr')}<textarea className={`${control} mt-1 min-h-20`} {...register('description_ar')} /></label>
                <label className="text-sm font-bold sm:col-span-2">{t('fields.descriptionEn')}<textarea dir="ltr" className={`${control} mt-1 min-h-20`} {...register('description_en')} /></label>
              </>
            )}
            <label className="text-sm font-bold">{t('fields.sortOrder')}<input type="number" min="0" className={`${control} mt-1`} {...register('sort_order', { valueAsNumber: true })} />{errors.sort_order && <span role="alert" className="text-fire-700 mt-1 block text-xs">{errors.sort_order.message}</span>}</label>
            <label className="flex items-center gap-2 self-end text-sm font-bold"><input type="checkbox" className="size-4 accent-fire-600" {...register('is_active')} />{t('fields.active')}</label>
            <div className="sm:col-span-2">
              <AssetImageField
                key={editing?.id ?? 'new-trust-item'}
                currentUrl={editing?.image_url ?? null}
                file={imageFile}
                removeCurrent={removeImage}
                onFileChange={setImageFile}
                onRemoveCurrentChange={setRemoveImage}
                messages={{ choose: t('image.choose'), hint: kind === 'certificates' ? t('image.certificateHint') : t('image.projectHint'), pending: t('image.pending'), removePending: t('image.cancelPending'), removeCurrent: t('image.removeCurrent'), undoRemove: t('image.undoRemove'), empty: t('image.empty'), imageType: t('image.errors.type'), imageTooBig: t('image.errors.size'), imageDecode: t('image.errors.decode'), webpUnsupported: t('image.errors.webp') }}
                disabled={isSubmitting}
              />
              {kind === 'certificates' && !editing && <p className="text-muted mt-1 text-xs">{t('image.certificateRequired')}</p>}
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-2"><button type="submit" disabled={isSubmitting} className={`${button} bg-primary hover:bg-primary-hover text-white`}>{isSubmitting ? t('actions.saving') : t('actions.save')}</button><button type="button" disabled={isSubmitting} onClick={closeForm} className={`${button} border-border border`}>{t('actions.cancel')}</button></div>
          </form>
        </section>
      )}

      {status === 'loading' ? <p role="status" className="text-muted py-10 text-center text-sm font-bold">{t('loading')}</p> : status === 'error' ? <div className="border-fire-600/30 bg-fire-50 rounded-md border p-4 text-sm"><p role="alert" className="text-fire-700 font-bold">{t('errors.load')}</p><button type="button" onClick={() => void load()} className={`${button} mt-2`}>{t('actions.retry')}</button></div> : rows.length === 0 ? <p className="text-muted border-border rounded-md border border-dashed p-8 text-center text-sm font-bold">{t('empty')}</p> : (
        <div className="border-border bg-surface overflow-x-auto rounded-lg border shadow-sm">
          <table className="w-full min-w-[48rem] border-collapse text-start text-sm"><thead className="bg-surface-alt text-muted"><tr><th className="p-3 text-start font-bold">{t('columns.image')}</th><th className="p-3 text-start font-bold">{t('columns.title')}</th><th className="p-3 text-start font-bold">{t('columns.status')}</th><th className="p-3 text-start font-bold">{t('columns.sortOrder')}</th><th className="p-3 text-start font-bold">{t('columns.actions')}</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id} className="border-border border-t">
              <td className="p-3">{row.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- Supabase public asset URL in static export.
                <img src={row.image_url} alt="" className="size-14 rounded border object-contain p-1" />
              ) : <span className="text-muted">—</span>}</td>
              <td className="p-3"><span className="block font-bold">{row.title_ar}</span><span dir="ltr" className="text-muted mt-0.5 block text-xs">{row.title_en}</span>{kind === 'certificates' && row.issuer_ar && <span className="text-muted mt-1 block text-xs">{row.issuer_ar}</span>}</td>
              <td className="p-3">{row.is_active ? t('badges.active') : t('badges.inactive')}</td><td className="p-3">{row.sort_order}</td>
              <td className="p-3">{pendingDeleteId === row.id ? <div className="flex gap-1"><button type="button" onClick={() => void deleteRow(row)} className={`${button} bg-fire-50 text-fire-700`}>{t('actions.confirm')}</button><button type="button" onClick={() => setPendingDeleteId(null)} className={`${button} border-border border`}>{t('actions.cancel')}</button></div> : <div className="flex flex-wrap gap-1"><button type="button" onClick={() => openEdit(row)} className={`${button} hover:bg-surface-alt`}><Pencil aria-hidden="true" className="size-4" />{t('actions.editShort')}</button><button type="button" onClick={() => void toggleActive(row)} className={`${button} border-border border`}>{row.is_active ? t('actions.deactivate') : t('actions.activate')}</button><button type="button" onClick={() => setPendingDeleteId(row.id)} className={`${button} text-fire-700`}><Trash2 aria-hidden="true" className="size-4" />{t('actions.deleteShort')}</button></div>}</td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
