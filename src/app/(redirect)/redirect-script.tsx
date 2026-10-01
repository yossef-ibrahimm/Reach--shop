'use client';

import { useEffect } from 'react';

/** JS fallback for the static `/` redirect (meta refresh is the primary mechanism). */
export function RedirectScript({ target }: { target: string }) {
  useEffect(() => {
    window.location.replace(target);
  }, [target]);

  return null;
}
