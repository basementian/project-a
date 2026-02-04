'use client';

import { useEffect } from 'react';
import { useLocationStore } from '@/stores/useLocationStore';
import { getCurrentPosition, watchPosition, stopWatching } from '@/services/location';

export function useGeolocation() {
  const { setLocation, setError, setLocating, userLocation } = useLocationStore();

  useEffect(() => {
    setLocating(true);
    let watchId: number | undefined;

    getCurrentPosition()
      .then((loc) => {
        setLocation(loc);
        watchId = watchPosition((newLoc) => setLocation(newLoc));
      })
      .catch((err) => setError(err.message));

    return () => {
      if (watchId !== undefined) stopWatching(watchId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return userLocation;
}
