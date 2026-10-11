'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Search, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { supabaseErrorKind } from '@/lib/supabase/error-kind';
import type { Database } from '@/lib/supabase/database.types';

type ContractorRequest = Database['public']['Tables']['contractor_requests']['Row'];

const PAGE_SIZE = 50;

async function fetchContractorRequests(offset: number) {
  const { data, error, count } = await supabaseBrowser()
    .from('contractor_requests')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('id', { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);
  if (error) throw error;
  if (!data) throw new Error('No contractor requests were returned');
  return { data, count };
}

export function ContractorRequestsManager() {
  const t = useTranslations('admin.requests');
  const [requests, setRequests] = useState<ContractorRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [failedOffset, setFailedOffset] = useState<number | null>(null);
  const [loadErrorKind, setLoadErrorKind] = useState<ReturnType<typeof supabaseErrorKind> | null>(
    null,
  );
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteErrorId, setDeleteErrorId] = useState<string | null>(null);

  const loadPage = useCallback(async (offset: number, append: boolean) => {
    setLoading(true);
    setFailedOffset(null);
    setLoadErrorKind(null);
    try {
      const { data, count } = await fetchContractorRequests(offset);

      setRequests((current) => (append ? [...current, ...data] : data));
      setTotal(count ?? offset + data.length);
      setHasMore(count !== null ? offset + data.length < count : data.length === PAGE_SIZE);
    } catch (error) {
      console.error('[admin contractor requests] load failed', error);
      setFailedOffset(offset);
      setLoadErrorKind(supabaseErrorKind(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialPage() {
      try {
        const { data, count } = await fetchContractorRequests(0);
        if (!active) return;
        setLoadErrorKind(null);
        setRequests(data);
        setTotal(count ?? data.length);
        setHasMore(count !== null ? data.length < count : data.length === PAGE_SIZE);
      } catch (error) {
        console.error('[admin contractor requests] load failed', error);
        if (active) {
          setFailedOffset(0);
          setLoadErrorKind(supabaseErrorKind(error));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadInitialPage();
    return () => {
      active = false;
    };
  }, []);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return requests;
    return requests.filter((request) =>
      [request.name, request.company, request.phone, request.project]
        .join(' ')
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [requests, search]);

  const deleteRequest = async (request: ContractorRequest) => {
    if (!window.confirm(t('confirmDelete', { name: request.name }))) return;
    setDeletingId(request.id);
    setDeleteErrorId(null);

    try {
      const { error } = await supabaseBrowser()
        .from('contractor_requests')
        .delete()
        .eq('id', request.id)
        .select('id')
        .single();
      if (error) throw error;
      setRequests((current) => current.filter((item) => item.id !== request.id));
      setTotal((current) => Math.max(0, current - 1));
    } catch (error) {
      console.error('[admin contractor requests] delete failed', error);
      setDeleteErrorId(request.id);
    } finally {
      setDeletingId(null);
    }
  };

  const buildingTypes: Record<string, string> = {
    commercial: t('buildingTypes.commercial'),
    administrative: t('buildingTypes.administrative'),
    industrial: t('buildingTypes.industrial'),
    healthcare: t('buildingTypes.healthcare'),
    residential: t('buildingTypes.residential'),
    education: t('buildingTypes.education'),
    other: t('buildingTypes.other'),
  };
  const systems: Record<string, string> = {
    conventional: t('systems.conventional'),
    addressable: t('systems.addressable'),
    unsure: t('systems.unsure'),
  };
  const tiers: Record<string, string> = {
    premium: t('tiers.premium'),
    economy: t('tiers.economy'),
    open: t('tiers.open'),
  };

  const dateFormatter = new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Cairo',
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{t('title')}</h1>
          <p className="text-muted mt-1 text-sm">{t('total', { count: total })}</p>
        </div>
        <label className="border-border bg-surface flex min-h-11 w-full max-w-md items-center gap-2 rounded-md border px-3">
          <Search aria-hidden="true" className="text-muted size-4 shrink-0" />
          <span className="sr-only">{t('searchLabel')}</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('search')}
            className="min-w-0 flex-1 bg-transparent text-base outline-none"
          />
        </label>
      </div>

      {loading && requests.length === 0 && (
        <p role="status" className="text-muted flex items-center gap-2 py-8 text-sm font-bold">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          {t('loading')}
        </p>
      )}

      {failedOffset !== null && (
        <div
          role="alert"
          className="bg-fire-50 text-fire-700 flex flex-wrap items-center justify-between gap-3 rounded-md p-4 text-sm font-bold"
        >
          <span>
            {loadErrorKind === 'network'
              ? t('loadErrors.network')
              : loadErrorKind === 'missingTable'
                ? t('loadErrors.setup')
                : loadErrorKind === 'permission'
                  ? t('loadErrors.permission')
                  : t('loadFailed')}
          </span>
          <button
            type="button"
            onClick={() => void loadPage(failedOffset, failedOffset > 0)}
            className="underline underline-offset-4"
          >
            {t('retry')}
          </button>
        </div>
      )}

      {!loading && failedOffset === null && total === 0 && (
        <p className="border-border bg-surface rounded-md border p-6 text-sm font-bold">
          {t('empty')}
        </p>
      )}

      {filteredRequests.length > 0 && (
        <ul className="grid grid-cols-1 gap-4">
          {filteredRequests.map((request) => (
            <li
              key={request.id}
              className="border-border bg-surface rounded-md border p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold">{request.name}</h2>
                  <p className="text-muted mt-1 text-sm">{request.company}</p>
                </div>
                <div className="flex items-center gap-3">
                  <time className="text-muted text-xs" dateTime={request.created_at} dir="ltr">
                    {dateFormatter.format(new Date(request.created_at))}
                  </time>
                  <button
                    type="button"
                    disabled={deletingId === request.id}
                    onClick={() => void deleteRequest(request)}
                    aria-label={t('delete', { name: request.name })}
                    className="text-fire-700 hover:bg-fire-50 inline-flex size-11 items-center justify-center rounded-md transition-colors disabled:opacity-60"
                  >
                    {deletingId === request.id ? (
                      <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                    ) : (
                      <Trash2 aria-hidden="true" className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-muted font-bold">{t('fields.phone')}</dt>
                  <dd className="mt-1">
                    <a
                      href={`tel:${request.phone.replace(/[^\d+]/g, '')}`}
                      dir="ltr"
                      className="phone font-semibold"
                    >
                      {request.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted font-bold">{t('fields.project')}</dt>
                  <dd className="mt-1">{request.project}</dd>
                </div>
                <div>
                  <dt className="text-muted font-bold">{t('fields.buildingType')}</dt>
                  <dd className="mt-1">{buildingTypes[request.building_type] ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted font-bold">{t('fields.area')}</dt>
                  <dd className="mt-1" dir="ltr">
                    {request.area} {t('areaUnit')}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted font-bold">{t('fields.system')}</dt>
                  <dd className="mt-1">{systems[request.system] ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted font-bold">{t('fields.tier')}</dt>
                  <dd className="mt-1">{tiers[request.tier] ?? '—'}</dd>
                </div>
                {request.drawing_name && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <dt className="text-muted font-bold">{t('fields.drawing')}</dt>
                    <dd className="mt-1 break-all">{request.drawing_name}</dd>
                    <p className="text-muted mt-1 text-xs">{t('drawingNotUploaded')}</p>
                  </div>
                )}
              </dl>
              {deleteErrorId === request.id && (
                <p role="alert" className="text-fire-700 mt-3 text-sm font-bold">
                  {t('deleteFailed')}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {search && filteredRequests.length === 0 && requests.length > 0 && (
        <p className="border-border bg-surface rounded-md border p-6 text-sm font-bold">
          {t('noSearchResults')}
        </p>
      )}

      {hasMore && failedOffset === null && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void loadPage(requests.length, true)}
          className="border-border bg-surface hover:bg-surface-alt inline-flex min-h-11 items-center justify-center gap-2 self-center rounded-md border px-5 text-sm font-bold transition-colors disabled:opacity-60"
        >
          {loading && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          {loading ? t('loadingMore') : t('loadMore')}
        </button>
      )}
    </div>
  );
}
