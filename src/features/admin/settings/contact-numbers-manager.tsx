'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useToast } from '@/features/admin/ui/toast';
import { supabaseBrowser } from '@/lib/supabase/browser';
import type { Database } from '@/lib/supabase/database.types';
import { z } from 'zod';

type ContactNumber = Database['public']['Tables']['contact_numbers']['Row'];
type FormValues = {
  label_ar: string;
  label_en: string;
  number: string;
  sort_order: number;
  is_whatsapp: boolean;
  is_active: boolean;
};
type LoadState = 'loading' | 'error' | 'ready';

const schema = z.object({
  label_ar: z.string().trim().min(1, 'required'),
  label_en: z.string().trim().min(1, 'required'),
  number: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/, 'phone'),
  sort_order: z.number().int().min(0, 'order'),
  is_whatsapp: z.boolean(),
  is_active: z.boolean(),
});

const INPUT =
  'border-border bg-surface w-full rounded-md border px-3 py-2.5 text-base focus:border-navy-700 disabled:opacity-60';
const LABEL = 'mb-1 block text-sm font-bold';
const BUTTON =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const EMPTY_VALUES: FormValues = {
  label_ar: '',
  label_en: '',
  number: '',
  sort_order: 0,
  is_whatsapp: false,
  is_active: true,
};

export function ContactNumbersManager() {
  const t = useToast();
  const [numbers, setNumbers] = useState<ContactNumber[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [editing, setEditing] = useState<ContactNumber | null>(null);
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

  const loadNumbers = useCallback(async () => {
    setLoadState('loading');
    const { data, error } = await supabaseBrowser()
      .from('contact_numbers')
      .select('*')
      .order('sort_order')
      .order('label_ar');
    if (error) {
      console.error(error);
      setLoadState('error');
      return;
    }
    setNumbers(data);
    setLoadState('ready');
  }, []);

  useEffect(() => {
    async function initialLoad() {
      await loadNumbers();
    }
    void initialLoad();
  }, [loadNumbers]);

  const startNew = () => {
    setEditing(null);
    reset(EMPTY_VALUES);
  };

  const startEdit = (number: ContactNumber) => {
    setEditing(number);
    reset({
      label_ar: number.label_ar,
      label_en: number.label_en,
      number: number.number,
      sort_order: number.sort_order,
      is_whatsapp: number.is_whatsapp,
      is_active: number.is_active,
    });
  };

  const onSubmit = handleSubmit(async (values) => {
    const supabase = supabaseBrowser();
    const payload = {
      label_ar: values.label_ar.trim(),
      label_en: values.label_en.trim(),
      number: values.number.trim(),
      sort_order: values.sort_order,
      is_whatsapp: values.is_whatsapp,
      is_active: values.is_active,
    };
    const result = editing
      ? await supabase
          .from('contact_numbers')
          .update(payload)
          .eq('id', editing.id)
          .select('id')
          .single()
      : await supabase.from('contact_numbers').insert(payload).select('id').single();

    if (result.error) {
      console.error(result.error);
      t('تعذر حفظ رقم التواصل. تحقق من صحة البيانات والاتصال ثم حاول مجددًا.', 'error');
      return;
    }

    t(editing ? 'تم تحديث رقم التواصل.' : 'تمت إضافة رقم التواصل.');
    startNew();
    await loadNumbers();
  });

  const removeNumber = async (number: ContactNumber) => {
    if (!window.confirm(`هل تريد حذف رقم «${number.label_ar}» نهائيًا؟`)) return;
    setDeletingId(number.id);
    const { error } = await supabaseBrowser()
      .from('contact_numbers')
      .delete()
      .eq('id', number.id)
      .select('id')
      .single();
    if (error) {
      console.error(error);
      t('تعذر حذف رقم التواصل. حاول مرة أخرى.', 'error');
    } else {
      t('تم حذف رقم التواصل.');
      if (editing?.id === number.id) startNew();
      await loadNumbers();
    }
    setDeletingId(null);
  };

  const fieldError = (message?: string) =>
    message ? (
      <p role="alert" className="text-fire-700 mt-1 text-xs font-bold">
        {message}
      </p>
    ) : null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">أرقام التواصل</h1>
          <p className="text-muted mt-1 text-sm">
            أضف الأرقام التي تظهر في الموقع وحدد أرقام واتساب.
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className={`${BUTTON} bg-primary hover:bg-primary-hover text-white`}
        >
          <Plus aria-hidden="true" className="size-4" />
          إضافة رقم
        </button>
      </header>

      <section className="border-border bg-surface flex flex-col gap-4 border p-4 shadow-sm">
        <h2 className="text-sm font-extrabold">{editing ? 'تعديل رقم التواصل' : 'رقم جديد'}</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label>
              <span className={LABEL}>المسمى بالعربية</span>
              <input {...register('label_ar')} className={INPUT} autoComplete="off" />
              {fieldError(errors.label_ar && 'أدخل المسمى بالعربية.')}
            </label>
            <label>
              <span className={LABEL}>المسمى بالإنجليزية</span>
              <input {...register('label_en')} className={INPUT} autoComplete="off" dir="ltr" />
              {fieldError(errors.label_en && 'أدخل المسمى بالإنجليزية.')}
            </label>
            <label>
              <span className={LABEL}>رقم الهاتف بصيغة دولية (+20…)</span>
              <input
                {...register('number')}
                className={INPUT}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                placeholder="+2010xxxxxxxx"
              />
              {fieldError(errors.number && 'استخدم صيغة E.164 مثل +201012345678.')}
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

          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <label className="inline-flex min-h-11 items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                {...register('is_whatsapp')}
                className="accent-fire-600 size-4"
              />
              يُستخدم كرقم واتساب
            </label>
            <label className="inline-flex min-h-11 items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                {...register('is_active')}
                className="accent-fire-600 size-4"
              />
              نشط ويظهر على الموقع
            </label>
          </div>

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
              {isSubmitting ? 'جارٍ الحفظ…' : editing ? 'حفظ التعديل' : 'إضافة الرقم'}
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

      <section aria-labelledby="contact-numbers-list" className="flex flex-col gap-3">
        <h2 id="contact-numbers-list" className="text-sm font-extrabold">
          الأرقام الحالية
        </h2>
        {loadState === 'loading' && (
          <p role="status" className="text-muted flex items-center gap-2 py-6 text-sm font-bold">
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            جارٍ تحميل الأرقام…
          </p>
        )}
        {loadState === 'error' && (
          <div className="bg-fire-50 text-fire-700 flex items-center justify-between gap-3 rounded-md p-3 text-sm font-bold">
            <span>تعذر تحميل أرقام التواصل.</span>
            <button type="button" onClick={() => void loadNumbers()} className="underline">
              إعادة المحاولة
            </button>
          </div>
        )}
        {loadState === 'ready' && numbers.length === 0 && (
          <p className="border-border bg-surface text-muted border p-4 text-sm font-bold">
            لا توجد أرقام مضافة حتى الآن.
          </p>
        )}
        {loadState === 'ready' && numbers.length > 0 && (
          <ul className="flex flex-col gap-3">
            {numbers.map((number) => (
              <li
                key={number.id}
                className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 border p-4 shadow-sm"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="font-bold">
                    {number.label_ar} / {number.label_en}
                  </p>
                  <p dir="ltr" className="text-muted text-start text-sm font-semibold">
                    {number.number}
                  </p>
                  <p className="text-muted text-xs font-bold">
                    {number.is_active ? 'نشط' : 'غير نشط'} ·{' '}
                    {number.is_whatsapp ? 'واتساب' : 'اتصال فقط'} · الترتيب {number.sort_order}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(number)}
                    className={`${BUTTON} border-border bg-surface hover:bg-surface-alt border`}
                    aria-label={`تعديل ${number.label_ar}`}
                  >
                    <Pencil aria-hidden="true" className="size-4" />
                    تعديل
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeNumber(number)}
                    disabled={deletingId === number.id}
                    className={`${BUTTON} bg-fire-50 text-fire-700 hover:bg-fire-600/15`}
                    aria-label={`حذف ${number.label_ar}`}
                  >
                    {deletingId === number.id ? (
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
