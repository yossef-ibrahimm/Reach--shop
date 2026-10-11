'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { randomPhoneNumber } from '@/lib/whatsapp';

const subscribe = () => () => {};

export function useRandomPhoneNumber(numbers: readonly string[]): string | null {
  const clientNumber = useMemo(() => randomPhoneNumber(numbers), [numbers]);
  const getSnapshot = () => clientNumber;
  const getServerSnapshot = () => numbers[0] ?? null;
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
