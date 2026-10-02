'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLookups } from '@/features/admin/products/use-lookups';
import { useToast } from '@/features/admin/ui/toast';
import { supabaseBrowser } from '@/lib/supabase/browser';
import type { Json, Tables } from '@/lib/supabase/database.types';

type SpecRow = Tables<'spec_definitions'>;
type OptionRow = { value: string; label_ar: string; label_en: string };
type FormValues = {
  category_id: string;
  key: string;
  label_ar: string;
  label_en: string;
  unit: string;
  value_type: 'number' | 'text' | 'select';
  options: OptionRow[];
  is_filterable: boolean;
  sort_order: number;
};

function parseOptions(value: Json | null): OptionRow[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const option = entry as Record<string, Json | undefined>;
    if (
      typeof option.value !== 'string' ||
      typeof option.label_ar !== 'string' ||
      typeof option.label_en !== 'string'
    ) return [];
    return [{ value: option.value, label_ar: option.label_ar, label_en: option.label_en }];
  });
}

function makeSchema(messages: {
  required: string;
  key: string;
  label: string;
  option: string;
  sortOrder: string;
}) {
  return z.object({
    category_id: z.string().uuid(messages.required),
    key: z.string().trim().min(1, messages.required).regex(/^[a-z][a-z0-9_]*$/, messages.key),
    label_ar: z.string().trim().min(2, messages.label),
    label_en: z.string().trim().min(2, messages.label),
    unit: z.string().trim(),
    value_type: z.enum(['number', 'text', 'select']),
    options: z.array(z.object({
      value: z.string().trim().min(1, messages.option),
      label_ar: z.string().trim().min(1, messages.option),
      label_en: z.string().trim().min(1, messages.option),
    })),
    is_filterable: z.boolean(),
    sort_order: z.number().int().min(0, messages.sortOrder),
  }).superRefine((value, ctx) => {
    if (value.value_type === 'select' && value.options.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: messages.option });
    }
  });
}

const EMPTY_FORM: FormValues = {
  category_id: '', key: '', label_ar: '', label_en: '', unit: '',
  value_type: 'text', options: [], is_filterable: false, sort_order: 0,
};

export function SpecsManager() {
  const t = useTranslations('admin.specs');
  const toast = useToast();
  const lookups = useLookups();
  const [rows, setRows] = useState<SpecRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [editing, setEditing] = useState<SpecRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const schema = useMemo(() => makeSchema({
    required: t('errors.required'), key: t('errors.key'), label: t('errors.label'),
    option: t('errors.option'), sortOrder: t('errors.sortOrder'),
  }), [t]);
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema), defaultValues: EMPTY_FORM,
  });
  const fieldArray = useFieldArray({ control, name: 'options' });
  const valueType = useWatch({ control, name: 'value_type' });

  const load = useCallback(async () => {
    const { data, error } = await supabaseBrowser()
      .from('spec_definitions').select('*').order('category_id').order('sort_order').order('key');
    if (error || !data) {
      setStatus('error');
      return;
    }
    setRows(data);
    setStatus('ready');
  }, []);

  useEffect(() => {
    async function initialLoad() { await load(); }
    void initialLoad();
  }, [load]);

  const openNew = () => {
    setEditing(null);
    reset({ ...EMPTY_FORM, category_id: lookups.state.status === 'ready' ? lookups.state.lookups.categories[0]?.id ?? '' : '', sort_order: rows.length * 10 });
    setFormOpen(true);
  };

  const openEdit = (row: SpecRow) => {
    setEditing(row);
    reset({
      category_id: row.category_id, key: row.key, label_ar: row.label_ar, label_en: row.label_en,
      unit: row.unit ?? '', value_type: row.value_type === 'number' || row.value_type === 'select' ? row.value_type : 'text', options: parseOptions(row.options),
      is_filterable: row.is_filterable, sort_order: row.sort_order,
    });
    setFormOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    const payload = {
      category_id: values.category_id,
      key: values.key,
      label_ar: values.label_ar,
      label_en: values.label_en,
      unit: values.unit || null,
      value_type: values.value_type,
      options: (values.value_type === 'select' ? values.options : null) as Json | null,
      is_filterable: values.is_filterable,
      sort_order: values.sort_order,
    };
    const supabase = supabaseBrowser();
    const result = editing
      ? await supabase.from('spec_definitions').update(payload).eq('id', editing.id)
      : await supabase.from('spec_definitions').insert(payload);
    if (result.error) {
      toast(t(result.error.code === '23505' ? 'errors.duplicateKey' : 'errors.save'), 'error');
      return;
    }
    toast(editing ? t('toasts.saved') : t('toasts.created'));
    setEditing(null);
    setFormOpen(false);
    await load();
    lookups.reload();
  };

  const deleteRow = async (row: SpecRow) => {
    const { data, error } = await supabaseBrowser()
      .from('products').select('specs').eq('category_id', row.category_id);
    if (error || !data) {
      toast(t('errors.referenceCheck'), 'error');
      return;
    }
    const referenced = data.some((product) => {
      const specs = product.specs;
      return specs !== null && typeof specs === 'object' && !Array.isArray(specs) && row.key in specs;
    });
    if (referenced) {
      toast(t('errors.inUse'), 'error');
      return;
    }
    const { error: deleteError } = await supabaseBrowser().from('spec_definitions').delete().eq('id', row.id);
    if (deleteError) {
      toast(t('errors.delete'), 'error');
      return;
    }
    toast(t('toasts.deleted'));
    setPendingDeleteId(null);
    await load();
    lookups.reload();
  };

  const controlClass = 'border-border bg-surface w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-navy-700';
  const button = 'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60';
  const categories = lookups.state.status === 'ready' ? lookups.state.lookups.categories : [];
  const categoryName = (id: string) => categories.find((category) => category.id === id)?.name_ar ?? t('unknownCategory');

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{t('title')}</h1>
          <p className="text-muted mt-1 text-sm">{t('intro')}</p>
        </div>
        <button type="button" onClick={openNew} disabled={categories.length === 0} className={`${button} bg-primary hover:bg-primary-hover text-white`}>
          <Plus aria-hidden="true" className="size-4" />{t('actions.add')}
        </button>
      </div>

      {formOpen && (
        <section className="border-border bg-surface rounded-lg border p-4 shadow-sm sm:p-5" aria-labelledby="spec-form-title">
          <h2 id="spec-form-title" className="mb-4 text-lg font-extrabold">{editing ? t('actions.edit') : t('actions.add')}</h2>
          {lookups.state.status === 'error' ? (
            <p role="alert" className="text-fire-700">{t('errors.categories')}</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold">{t('fields.category')}
                <select className={`${controlClass} mt-1`} disabled={Boolean(editing)} {...register('category_id')}>
                  <option value="">{t('fields.select')}</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name_ar}</option>)}
                </select>
                {errors.category_id && <span role="alert" className="text-fire-700 mt-1 block text-xs">{errors.category_id.message}</span>}
              </label>
              <label className="text-sm font-bold">{t('fields.key')}
                <input className={`${controlClass} mt-1 font-mono`} dir="ltr" disabled={Boolean(editing)} {...register('key')} />
                {errors.key && <span role="alert" className="text-fire-700 mt-1 block text-xs">{errors.key.message}</span>}
              </label>
              <label className="text-sm font-bold">{t('fields.labelAr')}
                <input className={`${controlClass} mt-1`} {...register('label_ar')} />
                {errors.label_ar && <span role="alert" className="text-fire-700 mt-1 block text-xs">{errors.label_ar.message}</span>}
              </label>
              <label className="text-sm font-bold">{t('fields.labelEn')}
                <input className={`${controlClass} mt-1`} dir="ltr" {...register('label_en')} />
                {errors.label_en && <span role="alert" className="text-fire-700 mt-1 block text-xs">{errors.label_en.message}</span>}
              </label>
              <label className="text-sm font-bold">{t('fields.unit')}
                <input className={`${controlClass} mt-1`} {...register('unit')} />
              </label>
              <label className="text-sm font-bold">{t('fields.type')}
                <select className={`${controlClass} mt-1`} {...register('value_type')}>
                  <option value="number">{t('types.number')}</option><option value="text">{t('types.text')}</option><option value="select">{t('types.select')}</option>
                </select>
              </label>
              <label className="text-sm font-bold">{t('fields.sortOrder')}
                <input type="number" min="0" className={`${controlClass} mt-1`} {...register('sort_order', { valueAsNumber: true })} />
                {errors.sort_order && <span role="alert" className="text-fire-700 mt-1 block text-xs">{errors.sort_order.message}</span>}
              </label>
              <label className="flex items-center gap-2 self-end text-sm font-bold">
                <input type="checkbox" className="size-4 accent-fire-600" {...register('is_filterable')} />{t('fields.filterable')}
              </label>
              {valueType === 'select' && (
                <div className="border-border flex flex-col gap-3 rounded-md border p-3 sm:col-span-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold">{t('options.title')}</h3>
                    <button type="button" onClick={() => fieldArray.append({ value: '', label_ar: '', label_en: '' })} className={`${button} border-border border`}><Plus aria-hidden="true" className="size-4" />{t('options.add')}</button>
                  </div>
                  {fieldArray.fields.length === 0 && <p className="text-muted text-xs">{t('options.empty')}</p>}
                  {fieldArray.fields.map((field, index) => (
                    <div key={field.id} className="grid items-start gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                      <input aria-label={t('options.value')} placeholder={t('options.value')} className={controlClass} dir="ltr" {...register(`options.${index}.value`)} />
                      <input aria-label={t('options.labelAr')} placeholder={t('options.labelAr')} className={controlClass} {...register(`options.${index}.label_ar`)} />
                      <input aria-label={t('options.labelEn')} placeholder={t('options.labelEn')} className={controlClass} dir="ltr" {...register(`options.${index}.label_en`)} />
                      <button type="button" aria-label={t('options.remove')} onClick={() => fieldArray.remove(index)} className={`${button} text-fire-700`}><Trash2 aria-hidden="true" className="size-4" /></button>
                    </div>
                  ))}
                  {errors.options?.message && <p role="alert" className="text-fire-700 text-xs">{errors.options.message}</p>}
                </div>
              )}
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <button type="submit" disabled={isSubmitting} className={`${button} bg-primary hover:bg-primary-hover text-white`}>{isSubmitting ? t('actions.saving') : t('actions.save')}</button>
                <button type="button" disabled={isSubmitting} onClick={() => { setFormOpen(false); setEditing(null); }} className={`${button} border-border border`}>{t('actions.cancel')}</button>
              </div>
            </form>
          )}
        </section>
      )}

      {status === 'loading' || lookups.state.status === 'loading' ? (
        <p role="status" className="text-muted py-10 text-center text-sm font-bold">{t('loading')}</p>
      ) : status === 'error' || lookups.state.status === 'error' ? (
        <div className="border-fire-600/30 bg-fire-50 rounded-md border p-4 text-sm">
          <p role="alert" className="text-fire-700 font-bold">{t('errors.load')}</p>
          <button type="button" onClick={() => void load()} className={`${button} text-fire-700 mt-2`}>{t('actions.retry')}</button>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-muted border-border rounded-md border border-dashed p-8 text-center text-sm font-bold">{t('empty')}</p>
      ) : (
        <div className="border-border bg-surface overflow-x-auto rounded-lg border shadow-sm">
          <table className="w-full min-w-[54rem] border-collapse text-start text-sm">
            <thead className="bg-surface-alt text-muted"><tr>
              <th className="p-3 text-start font-bold">{t('columns.category')}</th><th className="p-3 text-start font-bold">{t('columns.key')}</th>
              <th className="p-3 text-start font-bold">{t('columns.label')}</th><th className="p-3 text-start font-bold">{t('columns.type')}</th>
              <th className="p-3 text-start font-bold">{t('columns.filterable')}</th><th className="p-3 text-start font-bold">{t('columns.sortOrder')}</th><th className="p-3 text-start font-bold">{t('columns.actions')}</th>
            </tr></thead>
            <tbody>{rows.map((row) => (
              <tr key={row.id} className="border-border border-t">
                <td className="p-3">{categoryName(row.category_id)}</td>
                <td className="p-3 font-mono text-xs" dir="ltr">{row.key}</td>
                <td className="p-3"><span className="block font-bold">{row.label_ar}</span><span className="text-muted text-xs" dir="ltr">{row.label_en}</span></td>
                <td className="p-3">{t(`types.${row.value_type}`)}</td>
                <td className="p-3">{row.is_filterable ? t('yes') : t('no')}</td>
                <td className="p-3">{row.sort_order}</td>
                <td className="p-3">
                  {pendingDeleteId === row.id ? (
                    <div className="flex flex-wrap gap-1"><button type="button" onClick={() => void deleteRow(row)} className={`${button} bg-fire-50 text-fire-700`}>{t('actions.confirm')}</button><button type="button" onClick={() => setPendingDeleteId(null)} className={`${button} border-border border`}>{t('actions.cancel')}</button></div>
                  ) : (
                    <div className="flex gap-1"><button type="button" onClick={() => openEdit(row)} className={`${button} hover:bg-surface-alt`}>{t('actions.editShort')}</button><button type="button" onClick={() => setPendingDeleteId(row.id)} className={`${button} text-fire-700 hover:bg-fire-50`}><Trash2 aria-hidden="true" className="size-4" /></button></div>
                  )}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
