'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Award, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useToast } from '@/features/admin/ui/toast';
import { MAX_IMAGE_BYTES } from '@/features/admin/media/image-compress';
import { publicUrl, removeObjects } from '@/features/admin/media/storage';
import { supabaseBrowser } from '@/lib/supabase/browser';
import type { Database } from '@/lib/supabase/database.types';
import { z } from 'zod';

type Certificate = Database['public']['Tables']['certificates']['Row'];
type FormValues = {
  title_ar: string;
  title_en: string;
  issuer_ar: string;
  issuer_en: string;
  issued_at: string;
  sort_order: number;
  is_active: boolean;
};
type LoadState = 'loading' | 'error' | 'ready';
type ImageError = 'required' | 'type' | 'size' | null;

const schema = z.object({
  title_ar: z.string().trim().min(2, 'required'),
  title_en: z.string().trim().min(2, 'required'),
  issuer_ar: z.string(),
  issuer_en: z.string(),
  issued_at: z.string().refine((value) => value === '' || !Number.isNaN(Date.parse(value)), 'date'),
  sort_order: z.number().int().min(0, 'order'),
  is_active: z.boolean(),
});

const INPUT =
  'border-border bg-surface w-full rounded-md border px-3 py-2.5 text-base focus:border-navy-700 disabled:opacity-60';
const LABEL = 'mb-1 block text-sm font-bold';
const BUTTON =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60';
const ACCEPTED_IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/png'];
const EMPTY_VALUES: FormValues = {
  title_ar: '',
  title_en: '',
  issuer_ar: '',
  issuer_en: '',
  issued_at: '',
  sort_order: 0,
  is_active: true,
};

export function CertificatesManager() {
  const toast = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [editing, setEditing] = useState<Certificate | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState<ImageError>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_VALUES,
  });

  const loadCertificates = useCallback(async () => {
    setLoadState('loading');
    const { data, error } = await supabaseBrowser()
      .from('certificates')
      .select('*')
      .order('sort_order')
      .order('title_ar');
    if (error) {
      console.error(error);
      setLoadState('error');
      return;
    }
    setCertificates(data);
    setLoadState('ready');
  }, []);

  useEffect(() => {
    async function initialLoad() {
      await loadCertificates();
    }
    void initialLoad();
  }, [loadCertificates]);

  const startNew = () => {
    setEditing(null);
    setImage(null);
    setImageError(null);
    reset(EMPTY_VALUES);
  };

  const startEdit = (certificate: Certificate) => {
    setEditing(certificate);
    setImage(null);
    setImageError(null);
    reset({
      title_ar: certificate.title_ar,
      title_en: certificate.title_en,
      issuer_ar: certificate.issuer_ar ?? '',
      issuer_en: certificate.issuer_en ?? '',
      issued_at: certificate.issued_at ?? '',
      sort_order: certificate.sort_order,
      is_active: certificate.is_active,
    });
  };

  const onImageChange = (file: File | null) => {
    setImage(null);
    setImageError(null);
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError('type');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('size');
      return;
    }
    setImage(file);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (imageError) return;
    if (!editing && !image) {
      setImageError('required');
      return;
    }

    const supabase = supabaseBrowser();
    let uploadedPath: string | null = null;
    let imageUrl = editing?.image_url ?? '';
    let storagePath = editing?.storage_path ?? '';
    let rowSaved = false;

    try {
      if (image) {
        const extension = image.type === 'image/jpeg' ? 'jpg' : image.type.split('/')[1];
        const path = `certificates/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage
          .from('site-assets')
          .upload(path, image, { contentType: image.type, cacheControl: '31536000' });
        if (error) throw error;
        uploadedPath = path;
        imageUrl = publicUrl('site-assets', path);
        storagePath = path;
      }

      const payload = {
        title_ar: values.title_ar.trim(),
        title_en: values.title_en.trim(),
        issuer_ar: values.issuer_ar.trim() || null,
        issuer_en: values.issuer_en.trim() || null,
        issued_at: values.issued_at || null,
        sort_order: values.sort_order,
        is_active: values.is_active,
        image_url: imageUrl,
        storage_path: storagePath,
      };
      const result = editing
        ? await supabase
            .from('certificates')
            .update(payload)
            .eq('id', editing.id)
            .select('id')
            .single()
        : await supabase.from('certificates').insert(payload).select('id').single();

      if (result.error) throw result.error;
      rowSaved = true;
    } catch (error) {
      console.error(error);
      if (uploadedPath && !rowSaved) {
        try {
          const failedDeletes = await removeObjects('site-assets', [uploadedPath]);
          if (failedDeletes > 0) {
            console.error('Could not clean up uploaded certificate image:', uploadedPath);
          }
        } catch (cleanupError) {
          console.error(cleanupError);
        }
      }
      toast(
        'تعذر حفظ الشهادة. تحقق من البيانات والاتصال وصلاحية رفع الصور ثم حاول مجددًا.',
        'error',
      );
      return;
    }

    let oldImageWarning = false;
    if (editing && uploadedPath && editing.storage_path !== uploadedPath) {
      try {
        oldImageWarning = (await removeObjects('site-assets', [editing.storage_path])) > 0;
      } catch (error) {
        console.error(error);
        oldImageWarning = true;
      }
    }

    toast(
      oldImageWarning
        ? 'تم حفظ الشهادة، لكن تعذر حذف الصورة القديمة من التخزين.'
        : editing
          ? 'تم تحديث الشهادة.'
          : 'تمت إضافة الشهادة.',
      oldImageWarning ? 'error' : 'success',
    );
    startNew();
    await loadCertificates();
  });

  const removeCertificate = async (certificate: Certificate) => {
    if (!window.confirm(`هل تريد حذف شهادة «${certificate.title_ar}» وصورتها نهائيًا؟`)) return;
    setDeletingId(certificate.id);
    const { error } = await supabaseBrowser()
      .from('certificates')
      .delete()
      .eq('id', certificate.id)
      .select('id')
      .single();
    if (error) {
      console.error(error);
      toast('تعذر حذف الشهادة. حاول مرة أخرى.', 'error');
    } else {
      let failedDeletes = 0;
      try {
        failedDeletes = await removeObjects('site-assets', [certificate.storage_path]);
      } catch (error) {
        console.error(error);
        failedDeletes = 1;
      }
      toast(
        failedDeletes > 0 ? 'تم حذف الشهادة، لكن تعذر حذف صورتها من التخزين.' : 'تم حذف الشهادة.',
        failedDeletes > 0 ? 'error' : 'success',
      );
      if (editing?.id === certificate.id) startNew();
      await loadCertificates();
    }
    setDeletingId(null);
  };

  const fieldError = (message?: string) =>
    message ? (
      <p role="alert" className="text-fire-700 mt-1 text-xs font-bold">
        {message}
      </p>
    ) : null;

  const imageErrorText =
    imageError === 'required'
      ? 'الصورة مطلوبة لإضافة شهادة.'
      : imageError === 'type'
        ? 'ارفع صورة بصيغة WebP أو JPEG أو PNG.'
        : imageError === 'size'
          ? 'حجم الصورة يجب ألا يتجاوز ٥ ميجابايت.'
          : null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">الشهادات والاعتمادات</h1>
          <p className="text-muted mt-1 text-sm">أضف صور الشهادات ومعلوماتها لتظهر على الموقع.</p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className={`${BUTTON} bg-primary hover:bg-primary-hover text-white`}
        >
          <Plus aria-hidden="true" className="size-4" />
          إضافة شهادة
        </button>
      </header>

      <section className="border-border bg-surface flex flex-col gap-4 border p-4 shadow-sm">
        <h2 className="text-sm font-extrabold">{editing ? 'تعديل الشهادة' : 'شهادة جديدة'}</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label>
              <span className={LABEL}>اسم الشهادة بالعربية</span>
              <input {...register('title_ar')} className={INPUT} />
              {fieldError(errors.title_ar && 'أدخل اسم الشهادة بالعربية (حرفان على الأقل).')}
            </label>
            <label>
              <span className={LABEL}>اسم الشهادة بالإنجليزية</span>
              <input {...register('title_en')} className={INPUT} dir="ltr" />
              {fieldError(errors.title_en && 'أدخل اسم الشهادة بالإنجليزية (حرفان على الأقل).')}
            </label>
            <label>
              <span className={LABEL}>جهة الإصدار بالعربية (اختياري)</span>
              <input {...register('issuer_ar')} className={INPUT} />
            </label>
            <label>
              <span className={LABEL}>جهة الإصدار بالإنجليزية (اختياري)</span>
              <input {...register('issuer_en')} className={INPUT} dir="ltr" />
            </label>
            <label>
              <span className={LABEL}>تاريخ الإصدار (اختياري)</span>
              <input {...register('issued_at')} className={INPUT} type="date" />
              {fieldError(errors.issued_at && 'أدخل تاريخًا صحيحًا.')}
            </label>
            <label>
              <span className={LABEL}>ترتيب العرض</span>
              <input
                {...register('sort_order', { valueAsNumber: true })}
                className={INPUT}
                type="number"
                min="0"
                step="1"
              />
              {fieldError(errors.sort_order && 'أدخل رقم ترتيب صحيحًا (صفر أو أكبر).')}
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className={LABEL}>صورة الشهادة {editing ? '(اختياري عند التعديل)' : ''}</span>
            {editing && !image && (
              <span className="text-muted text-xs font-bold">
                الصورة الحالية محفوظة؛ اختر صورة لاستبدالها.
              </span>
            )}
            <input
              type="file"
              accept="image/webp,image/jpeg,image/png"
              onChange={(event) => onImageChange(event.currentTarget.files?.[0] ?? null)}
              className="text-muted file:bg-surface-alt block w-full text-sm file:me-3 file:min-h-11 file:rounded-md file:border-0 file:px-4 file:font-bold"
            />
            {image && <span className="text-muted text-xs">{image.name}</span>}
            {imageErrorText && (
              <p role="alert" className="text-fire-700 text-xs font-bold">
                {imageErrorText}
              </p>
            )}
          </label>

          <label className="inline-flex min-h-11 items-center gap-2 text-sm font-bold">
            <input type="checkbox" {...register('is_active')} className="accent-fire-600 size-4" />
            نشطة وتظهر على الموقع
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${BUTTON} bg-primary hover:bg-primary-hover text-white`}
            >
              {isSubmitting ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Save aria-hidden="true" className="size-4" />
              )}
              {isSubmitting ? 'جارٍ الحفظ…' : editing ? 'حفظ التعديل' : 'إضافة الشهادة'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={startNew}
                className={`${BUTTON} border-border bg-surface hover:bg-surface-alt border`}
              >
                <X aria-hidden="true" className="size-4" />
                إلغاء التعديل
              </button>
            )}
          </div>
        </form>
      </section>

      <section aria-labelledby="certificates-list" className="flex flex-col gap-3">
        <h2 id="certificates-list" className="text-sm font-extrabold">
          الشهادات الحالية
        </h2>
        {loadState === 'loading' && (
          <p role="status" className="text-muted flex items-center gap-2 py-6 text-sm font-bold">
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            جارٍ تحميل الشهادات…
          </p>
        )}
        {loadState === 'error' && (
          <div className="bg-fire-50 text-fire-700 flex items-center justify-between gap-3 rounded-md p-3 text-sm font-bold">
            <span>تعذر تحميل الشهادات.</span>
            <button type="button" onClick={() => void loadCertificates()} className="underline">
              إعادة المحاولة
            </button>
          </div>
        )}
        {loadState === 'ready' && certificates.length === 0 && (
          <p className="border-border bg-surface text-muted border p-4 text-sm font-bold">
            لا توجد شهادات مضافة حتى الآن.
          </p>
        )}
        {loadState === 'ready' && certificates.length > 0 && (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {certificates.map((certificate) => (
              <li
                key={certificate.id}
                className="border-border bg-surface flex flex-col gap-3 border p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- public Supabase Storage image */}
                  <img
                    src={certificate.image_url}
                    alt={certificate.title_ar}
                    width={96}
                    height={72}
                    loading="lazy"
                    className="border-border size-20 shrink-0 rounded-md border bg-white object-contain"
                  />
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="flex items-center gap-2 font-bold">
                      <Award aria-hidden="true" className="text-fire-600 size-4 shrink-0" />
                      {certificate.title_ar}
                    </p>
                    <p dir="ltr" className="text-muted text-start text-sm">
                      {certificate.title_en}
                    </p>
                    <p className="text-muted text-xs">
                      {certificate.is_active ? 'نشطة' : 'غير نشطة'}
                      {certificate.issued_at ? ` · ${certificate.issued_at}` : ''}
                      {` · الترتيب ${certificate.sort_order}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(certificate)}
                    className={`${BUTTON} border-border bg-surface hover:bg-surface-alt border`}
                  >
                    <Pencil aria-hidden="true" className="size-4" />
                    تعديل
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeCertificate(certificate)}
                    disabled={deletingId === certificate.id}
                    className={`${BUTTON} bg-fire-50 text-fire-700 hover:bg-fire-600/15`}
                  >
                    {deletingId === certificate.id ? (
                      <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                    ) : (
                      <Trash2 aria-hidden="true" className="size-4" />
                    )}
                    حذف
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
