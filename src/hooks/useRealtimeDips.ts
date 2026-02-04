'use client';

import { useEffect } from 'react';
import { subscribeToDips, unsubscribe } from '@/services/realtime';
import { useDipStore } from '@/stores/useDipStore';
import type { Dip } from '@/types/dip';

function rawToDip(raw: Record<string, unknown>): Dip {
  return {
    id: raw.id as string,
    type: raw.type as Dip['type'],
    location: {
      lat: (raw.lat as number) ?? 0,
      lng: (raw.lng as number) ?? 0,
    },
    available_until: raw.available_until as string,
    price: raw.price as number,
    access_method: raw.access_method as Dip['access_method'],
    rules: (raw.rules as string) ?? undefined,
    status: raw.status as Dip['status'],
    owner_id: raw.owner_id as string,
    claimer_id: (raw.claimer_id as string) ?? undefined,
    access_instructions: (raw.access_instructions as string) ?? undefined,
    created_at: raw.created_at as string,
    updated_at: raw.updated_at as string,
    completed_at: (raw.completed_at as string) ?? undefined,
  };
}

export function useRealtimeDips() {
  const { addDip, updateDip, removeDip } = useDipStore();

  useEffect(() => {
    const channel = subscribeToDips(
      (newRaw) => addDip(rawToDip(newRaw)),
      (updatedRaw) => {
        const dip = rawToDip(updatedRaw);
        if (dip.status === 'active') {
          updateDip(dip);
        } else {
          removeDip(dip.id);
        }
      },
      (oldRaw) => removeDip(oldRaw.id as string)
    );

    return () => unsubscribe(channel);
  }, [addDip, updateDip, removeDip]);
}
