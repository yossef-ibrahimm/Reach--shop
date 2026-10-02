'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ExternalLink, LoaderCircle, Upload } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';

type PublishState = 'idle' | 'triggering' | 'triggered' | 'error';

const actionsUrl = 'https://github.com/yossef-ibrahimm/Reach--shop/actions';

export function PublishChangesButton() {
  const t = useTranslations('admin.deploy');
  const [state, setState] = useState<PublishState>('idle');

  const publish = async () => {
    setState('triggering');
    try {
      const { error } = await supabaseBrowser().functions.invoke('trigger-deploy', {
        body: {},
      });
      setState(error ? 'error' : 'triggered');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void publish()}
        disabled={state === 'triggering'}
        className="bg-primary hover:bg-primary-hover inline-flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm font-bold text-white transition-colors disabled:cursor-wait disabled:opacity-70"
      >
        {state === 'triggering' ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Upload aria-hidden="true" className="size-4" />
        )}
        {state === 'triggering' ? t('triggering') : t('button')}
      </button>
      {state === 'triggered' && (
        <a
          href={actionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold text-blue-700 underline underline-offset-2"
        >
          {t('triggered')} <ExternalLink aria-hidden="true" className="ms-1 inline size-3.5" />
        </a>
      )}
      {state === 'error' && (
        <p role="alert" className="text-fire-700 text-sm">
          {t('error')}
        </p>
      )}
      {state === 'idle' && <p className="text-muted text-xs">{t('hint')}</p>}
    </div>
  );
}
