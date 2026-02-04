'use client';

import { useMemo } from 'react';
import { useLocationStore } from '@/stores/useLocationStore';
import { distanceBetween } from '@/services/location';
import { CLAIM_PROXIMITY_METERS } from '@/lib/constants';
import type { DipLocation } from '@/types/dip';

export function useProximityCheck(targetLocation: DipLocation | null) {
  const userLocation = useLocationStore((s) => s.userLocation);

  return useMemo(() => {
    if (!userLocation || !targetLocation) {
      return { isNearby: false, distance: null };
    }
    const distance = distanceBetween(userLocation, targetLocation);
    return {
      isNearby: distance <= CLAIM_PROXIMITY_METERS,
      distance: Math.round(distance),
    };
  }, [userLocation, targetLocation]);
}
