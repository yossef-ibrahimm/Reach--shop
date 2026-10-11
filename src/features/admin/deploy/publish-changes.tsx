'use client';

import { useState } from 'react';
import { Loader2, Rocket } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { supabaseBrowser } from '@/lib/supabase/browser';

type PublishState =
  | { status: 'idle' }
  | { status: 'publishing' }
  | { status: 'triggered' }
  | { status: 'error'; message: string };

export function PublishChanges() {
  const t = useTranslations('admin.dashboard.publish');
  const [state, setState] = useState<PublishState>({ status: 'idle' });

  const publish = async () => {
    setState({ status: 'publishing' });

    try {
      const { error } = await supabaseBrowser().functions.invoke('trigger-deploy', {
        body: {},
      });

      if (error) {
        setState({ status: 'error', message: error.message });
        return;
      }

      setState({ status: 'triggered' });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : t('unknownError'),
      });
    }
  };

  return (
    <section
      aria-labelledby="publish-changes-heading"
      className="border-border bg-surface flex flex-col gap-3 rounded-md border p-4 shadow-sm"
    >
      <div>
        <h2 id="publish-changes-heading" className="font-bold">
          {t('title')}
        </h2>
        <p className="text-muted mt-1 text-sm">{t('description')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void publish()}
          disabled={state.status === 'publishing'}
          className="bg-primary hover:bg-primary-hover inline-flex min-h-11 items-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold text-white transition-colors disabled:cursor-wait disabled:opacity-60"
        >
          {state.status === 'publishing' ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Rocket aria-hidden="true" className="size-4" />
          )}
          {state.status === 'publishing' ? t('working') : t('button')}
        </button>

        {state.status === 'triggered' && (
          <p role="status" className="text-sm font-bold text-green-700">
            {t('success')}
          </p>
        )}

        {state.status === 'error' && (
          <p role="alert" className="text-fire-700 text-sm font-bold">
            {t('error', { message: state.message })}
          </p>
        )}
      </div>
    </section>
  );
}
