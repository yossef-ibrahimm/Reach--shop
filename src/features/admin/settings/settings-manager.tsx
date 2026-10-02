'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/features/admin/ui/toast';
import { supabaseBrowser } from '@/lib/supabase/browser';
import type { Tables } from '@/lib/supabase/database.types';

type SettingRow = Tables<'site_settings'>;
type ContactRow = Tables<'contact_numbers'>;
type SocialRow = Tables<'social_links'>;
type ContactForm = Omit<ContactRow, 'id'> & { id?: string };
type SocialForm = Omit<SocialRow, 'id'> & { id?: string };

const CORE_SETTING_KEYS = new Set([
  'company_name', 'tagline', 'hours', 'address', 'email', 'map_url', 'hero_eyebrow', 'hero_title', 'hero_lead',
  'about_story', 'about_vision', 'why_1_title', 'why_1_body', 'why_2_title', 'why_2_body', 'why_3_title', 'why_3_body',
]);
const SOCIAL_PLATFORMS = ['facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'x'] as const;

function contactSchema(messages: { required: string; label: string; phone: string; sort: string }) {
  return z.object({
    id: z.string().uuid().optional(),
    label_ar: z.string().trim().min(2, messages.label),
    label_en: z.string().trim().min(2, messages.label),
    number: z.string().trim().regex(/^\+[1-9]\d{1,14}$/, messages.phone),
    is_whatsapp: z.boolean(),
    sort_order: z.number().int().min(0, messages.sort),
    is_active: z.boolean(),
  });
}

function socialSchema(messages: { platform: string; url: string; sort: string }) {
  return z.object({
    id: z.string().uuid().optional(),
    platform: z.string().trim().min(2, messages.platform).regex(/^[a-z][a-z0-9_-]*$/, messages.platform),
    url: z.url(messages.url),
    sort_order: z.number().int().min(0, messages.sort),
    is_active: z.boolean(),
  });
}

function SiteSettingsSection() {
  const t = useTranslations('admin.settings');
  const toast = useToast();
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [newKey, setNewKey] = useState('');
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabaseBrowser().from('site_settings').select('*').order('key');
    if (error || !data) return setStatus('error');
    setRows(data);
    setStatus('ready');
  }, []);

  useEffect(() => {
    async function initialLoad() { await load(); }
    void initialLoad();
  }, [load]);

  const save = async () => {
    const schema = z.array(z.object({
      key: z.string().regex(/^[a-z][a-z0-9_]*$/, t('errors.key')),
      value_ar: z.string().trim().min(1, t('errors.translation')).max(6000),
      value_en: z.string().trim().min(1, t('errors.translation')).max(6000),
    }));
    const result = schema.safeParse(rows.map((row) => ({ ...row, value_ar: row.value_ar ?? '', value_en: row.value_en ?? '' })));
    if (!result.success) {
      toast(t('errors.translation'), 'error');
      return;
    }
    const { error } = await supabaseBrowser().from('site_settings').upsert(result.data);
    if (error) {
      toast(t('errors.save'), 'error');
      return;
    }
    toast(t('toasts.settingsSaved'));
    await load();
  };

  const addRow = () => {
    const key = newKey.trim();
    if (!/^[a-z][a-z0-9_]*$/.test(key) || rows.some((row) => row.key === key)) {
      toast(t('errors.key'), 'error');
      return;
    }
    setRows((current) => [...current, { key, value_ar: '', value_en: '' }].sort((a, b) => a.key.localeCompare(b.key)));
    setNewKey('');
  };

  const deleteRow = async (key: string) => {
    if (CORE_SETTING_KEYS.has(key)) {
      toast(t('errors.protectedSetting'), 'error');
      return;
    }
    const { error } = await supabaseBrowser().from('site_settings').delete().eq('key', key);
    if (error) {
      toast(t('errors.delete'), 'error');
      return;
    }
    setPendingDeleteKey(null);
    toast(t('toasts.settingDeleted'));
    await load();
  };

  const update = (key: string, field: 'value_ar' | 'value_en', value: string) => {
    setRows((current) => current.map((row) => row.key === key ? { ...row, [field]: value } : row));
  };
  const control = 'border-border bg-surface w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-navy-700';
  const button = 'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <section className="border-border bg-surface flex flex-col gap-4 rounded-lg border p-4 shadow-sm sm:p-5" aria-labelledby="site-settings-title">
      <div>
        <h2 id="site-settings-title" className="text-lg font-extrabold">{t('site.title')}</h2>
        <p className="text-muted mt-1 text-sm">{t('site.hint')}</p>
      </div>
      {status === 'loading' ? <p role="status" className="text-muted text-sm">{t('loading')}</p> : status === 'error' ? (
        <div><p role="alert" className="text-fire-700 text-sm font-bold">{t('errors.load')}</p><button type="button" onClick={() => void load()} className={`${button} mt-2`}>{t('actions.retry')}</button></div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <input className={`${control} max-w-xs font-mono`} dir="ltr" value={newKey} onChange={(event) => setNewKey(event.target.value)} placeholder={t('site.keyPlaceholder')} aria-label={t('site.keyPlaceholder')} />
            <button type="button" onClick={addRow} className={`${button} border-border border`}><Plus aria-hidden="true" className="size-4" />{t('actions.addSetting')}</button>
          </div>
          <div className="flex flex-col gap-3">
            {rows.map((row) => (
              <div key={row.key} className="border-border grid gap-3 rounded-md border p-3 sm:grid-cols-[10rem_1fr_1fr_auto]">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-xs font-bold" dir="ltr">{row.key}</span>
                  {CORE_SETTING_KEYS.has(row.key) ? <span className="text-muted text-[11px]">{t('site.requiredKey')}</span> : pendingDeleteKey === row.key ? (
                    <div className="flex gap-1"><button type="button" onClick={() => void deleteRow(row.key)} className={`${button} bg-fire-50 text-fire-700`}>{t('actions.confirm')}</button><button type="button" onClick={() => setPendingDeleteKey(null)} className={`${button} border-border border`}>{t('actions.cancel')}</button></div>
                  ) : <button type="button" onClick={() => setPendingDeleteKey(row.key)} className={`${button} text-fire-700 justify-start px-0`}><Trash2 aria-hidden="true" className="size-4" />{t('actions.deleteShort')}</button>}
                </div>
                <label className="text-sm font-bold">{t('fields.valueAr')}<textarea className={`${control} mt-1 min-h-20`} value={row.value_ar ?? ''} onChange={(event) => update(row.key, 'value_ar', event.target.value)} /></label>
                <label className="text-sm font-bold">{t('fields.valueEn')}<textarea className={`${control} mt-1 min-h-20`} dir="ltr" value={row.value_en ?? ''} onChange={(event) => update(row.key, 'value_en', event.target.value)} /></label>
                {!CORE_SETTING_KEYS.has(row.key) && pendingDeleteKey !== row.key && <span aria-hidden="true" className="hidden sm:block" />}
              </div>
            ))}
          </div>
          <div><button type="button" onClick={() => void save()} className={`${button} bg-primary hover:bg-primary-hover text-white`}><Save aria-hidden="true" className="size-4" />{t('actions.saveSettings')}</button></div>
        </>
      )}
    </section>
  );
}

function ContactNumbersSection() {
  const t = useTranslations('admin.settings');
  const toast = useToast();
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const schema = useMemo(() => contactSchema({ required: t('errors.required'), label: t('errors.label'), phone: t('errors.phone'), sort: t('errors.sortOrder') }), [t]);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactForm>({
    resolver: zodResolver(schema),
    defaultValues: { label_ar: '', label_en: '', number: '', is_whatsapp: false, sort_order: 0, is_active: true },
  });

  const load = useCallback(async () => {
    const { data, error } = await supabaseBrowser().from('contact_numbers').select('*').order('sort_order');
    if (error || !data) return setStatus('error');
    setRows(data);
    setStatus('ready');
  }, []);
  useEffect(() => { async function initialLoad() { await load(); } void initialLoad(); }, [load]);

  const openNew = () => reset({ label_ar: '', label_en: '', number: '', is_whatsapp: false, sort_order: rows.length * 10, is_active: true });
  const edit = (row: ContactRow) => reset({ ...row });
  const submit = async (values: ContactForm) => {
    if (values.id && rows.find((row) => row.id === values.id)?.is_whatsapp && rows.find((row) => row.id === values.id)?.is_active && (!values.is_whatsapp || !values.is_active)) {
      const remaining = rows.some((row) => row.id !== values.id && row.is_whatsapp && row.is_active);
      if (!remaining) { toast(t('errors.lastWhatsapp'), 'error'); return; }
    }
    const { id, ...payload } = values;
    const result = id
      ? await supabaseBrowser().from('contact_numbers').update(payload).eq('id', id)
      : await supabaseBrowser().from('contact_numbers').insert(payload);
    if (result.error) { toast(t('errors.save'), 'error'); return; }
    toast(t('toasts.contactSaved'));
    openNew();
    await load();
  };
  const toggleActive = async (row: ContactRow) => {
    if (row.is_active && row.is_whatsapp && !rows.some((other) => other.id !== row.id && other.is_active && other.is_whatsapp)) {
      toast(t('errors.lastWhatsapp'), 'error'); return;
    }
    const { error } = await supabaseBrowser().from('contact_numbers').update({ is_active: !row.is_active }).eq('id', row.id);
    if (error) { toast(t('errors.save'), 'error'); return; }
    await load();
  };
  const deleteRow = async (row: ContactRow) => {
    if (row.is_active && row.is_whatsapp && !rows.some((other) => other.id !== row.id && other.is_active && other.is_whatsapp)) {
      toast(t('errors.lastWhatsapp'), 'error'); return;
    }
    const { error } = await supabaseBrowser().from('contact_numbers').delete().eq('id', row.id);
    if (error) { toast(t('errors.delete'), 'error'); return; }
    setPendingDeleteId(null); toast(t('toasts.contactDeleted')); await load();
  };

  const control = 'border-border bg-surface w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-navy-700';
  const button = 'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <section className="border-border bg-surface flex flex-col gap-4 rounded-lg border p-4 shadow-sm sm:p-5" aria-labelledby="contacts-title">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="contacts-title" className="text-lg font-extrabold">{t('contacts.title')}</h2><p className="text-muted mt-1 text-sm">{t('contacts.hint')}</p></div><button type="button" onClick={openNew} className={`${button} border-border border`}><Plus aria-hidden="true" className="size-4" />{t('actions.addContact')}</button></div>
      <form onSubmit={handleSubmit(submit)} className="grid gap-3 rounded-md bg-surface-alt p-3 sm:grid-cols-2">
        <label className="text-sm font-bold">{t('fields.labelAr')}<input className={`${control} mt-1`} {...register('label_ar')} />{errors.label_ar && <span role="alert" className="text-fire-700 mt-1 block text-xs">{errors.label_ar.message}</span>}</label>
        <label className="text-sm font-bold">{t('fields.labelEn')}<input dir="ltr" className={`${control} mt-1`} {...register('label_en')} />{errors.label_en && <span role="alert" className="text-fire-700 mt-1 block text-xs">{errors.label_en.message}</span>}</label>
        <label className="text-sm font-bold">{t('fields.phone')}<input dir="ltr" inputMode="tel" placeholder="+201012345678" className={`${control} mt-1`} {...register('number')} />{errors.number && <span role="alert" className="text-fire-700 mt-1 block text-xs">{errors.number.message}</span>}</label>
        <label className="text-sm font-bold">{t('fields.sortOrder')}<input type="number" min="0" className={`${control} mt-1`} {...register('sort_order', { valueAsNumber: true })} />{errors.sort_order && <span role="alert" className="text-fire-700 mt-1 block text-xs">{errors.sort_order.message}</span>}</label>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" className="size-4 accent-fire-600" {...register('is_whatsapp')} />{t('fields.whatsapp')}</label>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" className="size-4 accent-fire-600" {...register('is_active')} />{t('fields.active')}</label>
        <div className="flex gap-2 sm:col-span-2"><button type="submit" disabled={isSubmitting} className={`${button} bg-primary hover:bg-primary-hover text-white`}>{isSubmitting ? t('actions.saving') : t('actions.save')}</button><button type="button" onClick={openNew} className={`${button} border-border border`}>{t('actions.clearForm')}</button></div>
      </form>
      {status === 'loading' ? <p role="status" className="text-muted text-sm">{t('loading')}</p> : status === 'error' ? <div><p role="alert" className="text-fire-700 text-sm">{t('errors.load')}</p><button type="button" onClick={() => void load()} className={`${button} mt-2`}>{t('actions.retry')}</button></div> : (
        <div className="flex flex-col gap-2">{rows.map((row) => (
          <div key={row.id} className="border-border flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
            <div><p className="font-bold">{row.label_ar} <span className="text-muted text-xs" dir="ltr">({row.label_en})</span></p><p className="text-muted mt-1 text-xs" dir="ltr">{row.number} · {row.is_whatsapp ? t('badges.whatsapp') : t('badges.phone')} · {row.is_active ? t('badges.active') : t('badges.inactive')}</p></div>
            {pendingDeleteId === row.id ? <div className="flex gap-1"><button type="button" onClick={() => void deleteRow(row)} className={`${button} bg-fire-50 text-fire-700`}>{t('actions.confirm')}</button><button type="button" onClick={() => setPendingDeleteId(null)} className={`${button} border-border border`}>{t('actions.cancel')}</button></div> : (
              <div className="flex flex-wrap gap-1"><button type="button" onClick={() => edit(row)} className={`${button} hover:bg-surface-alt`}><Pencil aria-hidden="true" className="size-4" />{t('actions.editShort')}</button><button type="button" onClick={() => void toggleActive(row)} className={`${button} border-border border`}>{row.is_active ? t('actions.deactivate') : t('actions.activate')}</button><button type="button" onClick={() => setPendingDeleteId(row.id)} className={`${button} text-fire-700`}><Trash2 aria-hidden="true" className="size-4" />{t('actions.deleteShort')}</button></div>
            )}
          </div>
        ))}</div>
      )}
    </section>
  );
}

function SocialLinksSection() {
  const t = useTranslations('admin.settings');
  const toast = useToast();
  const [rows, setRows] = useState<SocialRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const schema = useMemo(() => socialSchema({ platform: t('errors.platform'), url: t('errors.url'), sort: t('errors.sortOrder') }), [t]);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SocialForm>({
    resolver: zodResolver(schema), defaultValues: { platform: 'facebook', url: '', sort_order: 0, is_active: true },
  });
  const load = useCallback(async () => {
    const { data, error } = await supabaseBrowser().from('social_links').select('*').order('sort_order');
    if (error || !data) return setStatus('error');
    setRows(data); setStatus('ready');
  }, []);
  useEffect(() => { async function initialLoad() { await load(); } void initialLoad(); }, [load]);
  const submit = async (values: SocialForm) => {
    const { id, ...payload } = values;
    const result = id
      ? await supabaseBrowser().from('social_links').update(payload).eq('id', id)
      : await supabaseBrowser().from('social_links').insert(payload);
    if (result.error) { toast(t('errors.save'), 'error'); return; }
    toast(t('toasts.socialSaved')); reset({ platform: 'facebook', url: '', sort_order: rows.length * 10, is_active: true }); await load();
  };
  const toggle = async (row: SocialRow) => {
    const { error } = await supabaseBrowser().from('social_links').update({ is_active: !row.is_active }).eq('id', row.id);
    if (error) { toast(t('errors.save'), 'error'); return; } await load();
  };
  const deleteRow = async (row: SocialRow) => {
    const { error } = await supabaseBrowser().from('social_links').delete().eq('id', row.id);
    if (error) { toast(t('errors.delete'), 'error'); return; } setPendingDeleteId(null); toast(t('toasts.socialDeleted')); await load();
  };
  const control = 'border-border bg-surface w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-navy-700';
  const button = 'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60';
  return (
    <section className="border-border bg-surface flex flex-col gap-4 rounded-lg border p-4 shadow-sm sm:p-5" aria-labelledby="social-title">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="social-title" className="text-lg font-extrabold">{t('socials.title')}</h2><p className="text-muted mt-1 text-sm">{t('socials.hint')}</p></div><button type="button" onClick={() => reset({ platform: 'facebook', url: '', sort_order: rows.length * 10, is_active: true })} className={`${button} border-border border`}><Plus aria-hidden="true" className="size-4" />{t('actions.addSocial')}</button></div>
      <form onSubmit={handleSubmit(submit)} className="grid gap-3 rounded-md bg-surface-alt p-3 sm:grid-cols-2">
        <label className="text-sm font-bold">{t('fields.platform')}<input list="social-platform-options" className={`${control} mt-1`} dir="ltr" {...register('platform')} />{errors.platform && <span role="alert" className="text-fire-700 mt-1 block text-xs">{errors.platform.message}</span>}<datalist id="social-platform-options">{SOCIAL_PLATFORMS.map((platform) => <option key={platform} value={platform} />)}</datalist></label>
        <label className="text-sm font-bold">{t('fields.url')}<input type="url" dir="ltr" className={`${control} mt-1`} {...register('url')} />{errors.url && <span role="alert" className="text-fire-700 mt-1 block text-xs">{errors.url.message}</span>}</label>
        <label className="text-sm font-bold">{t('fields.sortOrder')}<input type="number" min="0" className={`${control} mt-1`} {...register('sort_order', { valueAsNumber: true })} />{errors.sort_order && <span role="alert" className="text-fire-700 mt-1 block text-xs">{errors.sort_order.message}</span>}</label>
        <label className="flex items-center gap-2 self-end text-sm font-bold"><input type="checkbox" className="size-4 accent-fire-600" {...register('is_active')} />{t('fields.active')}</label>
        <div className="flex gap-2 sm:col-span-2"><button type="submit" disabled={isSubmitting} className={`${button} bg-primary hover:bg-primary-hover text-white`}>{isSubmitting ? t('actions.saving') : t('actions.save')}</button><button type="button" onClick={() => reset({ platform: 'facebook', url: '', sort_order: rows.length * 10, is_active: true })} className={`${button} border-border border`}>{t('actions.clearForm')}</button></div>
      </form>
      {status === 'loading' ? <p role="status" className="text-muted text-sm">{t('loading')}</p> : status === 'error' ? <div><p role="alert" className="text-fire-700 text-sm">{t('errors.load')}</p><button type="button" onClick={() => void load()} className={`${button} mt-2`}>{t('actions.retry')}</button></div> : (
        <div className="flex flex-col gap-2">{rows.map((row) => (
          <div key={row.id} className="border-border flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
            <div><p className="font-bold" dir="ltr">{row.platform}</p><a className="text-muted mt-1 block break-all text-xs underline" href={row.url} target="_blank" rel="noopener noreferrer" dir="ltr">{row.url}</a></div>
            {pendingDeleteId === row.id ? <div className="flex gap-1"><button type="button" onClick={() => void deleteRow(row)} className={`${button} bg-fire-50 text-fire-700`}>{t('actions.confirm')}</button><button type="button" onClick={() => setPendingDeleteId(null)} className={`${button} border-border border`}>{t('actions.cancel')}</button></div> : (
              <div className="flex flex-wrap gap-1"><button type="button" onClick={() => reset({ id: row.id, platform: row.platform, url: row.url, sort_order: row.sort_order, is_active: row.is_active })} className={`${button} hover:bg-surface-alt`}><Pencil aria-hidden="true" className="size-4" />{t('actions.editShort')}</button><button type="button" onClick={() => void toggle(row)} className={`${button} border-border border`}>{row.is_active ? t('actions.deactivate') : t('actions.activate')}</button><button type="button" onClick={() => setPendingDeleteId(row.id)} className={`${button} text-fire-700`}><Trash2 aria-hidden="true" className="size-4" />{t('actions.deleteShort')}</button></div>
            )}
          </div>
        ))}</div>
      )}
    </section>
  );
}

export function SettingsManager() {
  const t = useTranslations('admin.settings');
  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-2xl font-extrabold">{t('title')}</h1><p className="text-muted mt-1 text-sm">{t('intro')}</p></div>
      <SiteSettingsSection />
      <ContactNumbersSection />
      <SocialLinksSection />
    </div>
  );
}
