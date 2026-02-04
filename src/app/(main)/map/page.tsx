'use client';

import { useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { FilterBar } from '@/components/map/FilterBar';
import { DipPreviewCard } from '@/components/map/DipPreviewCard';
import { Spinner } from '@/components/ui/Spinner';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useRealtimeDips } from '@/hooks/useRealtimeDips';
import { useDipStore } from '@/stores/useDipStore';
import { useLocationStore } from '@/stores/useLocationStore';
import { useFilterStore } from '@/stores/useFilterStore';
import { fetchNearbyDips } from '@/services/dips';
import { distanceBetween } from '@/services/location';
import type { Dip } from '@/types/dip';

const MapView = dynamic(
  () => import('@/components/map/MapView').then((m) => ({ default: m.MapView })),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div> }
);

export default function MapPage() {
  const userLocation = useGeolocation();
  useRealtimeDips();

  const { nearbyDips, selectedDip, setSelectedDip, setNearbyDips, setLoading, isLoading } = useDipStore();
  const locationError = useLocationStore((s) => s.locationError);
  const { maxDistance, maxPrice, minTimeRemaining, selectedTypes } = useFilterStore();

  // Fetch dips when location available
  useEffect(() => {
    if (!userLocation) return;
    setLoading(true);
    fetchNearbyDips(userLocation.lat, userLocation.lng, maxDistance)
      .then((dips) => setNearbyDips(dips))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userLocation, maxDistance, setNearbyDips, setLoading]);

  const handleDipSelect = useCallback((dip: Dip) => {
    setSelectedDip(dip);
  }, [setSelectedDip]);

  const handleMapMove = useCallback((lat: number, lng: number) => {
    fetchNearbyDips(lat, lng, maxDistance)
      .then((dips) => setNearbyDips(dips))
      .catch(() => {});
  }, [maxDistance, setNearbyDips]);

  // Client-side filtering
  const filteredDips = nearbyDips.filter((dip) => {
    if (selectedTypes.length > 0 && !selectedTypes.includes(dip.type)) return false;
    if (maxPrice && dip.price > maxPrice) return false;
    if (minTimeRemaining) {
      const remaining = new Date(dip.available_until).getTime() - Date.now();
      if (remaining < minTimeRemaining * 60 * 1000) return false;
    }
    if (userLocation) {
      const dist = distanceBetween(userLocation, dip.location);
      if (dist > maxDistance) return false;
    }
    return true;
  });

  // Override store with filtered for map
  useEffect(() => {
    // We don't overwrite the store — filtering is done in render
  }, [filteredDips]);

  return (
    <div className="relative h-full">
      {/* Filter bar */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <FilterBar />
      </div>

      {/* Map */}
      {locationError ? (
        <div className="flex flex-col items-center justify-center h-full px-6 text-center">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Location required</h2>
          <p className="text-sm text-gray-500">Enable location access to find nearby Dibs.</p>
        </div>
      ) : (
        <MapView onDipSelect={handleDipSelect} onMapMove={handleMapMove} />
      )}

      {/* Empty state overlay */}
      {!isLoading && !locationError && filteredDips.length === 0 && userLocation && (
        <div className="absolute bottom-24 left-4 right-4 z-10 bg-white rounded-xl p-4 shadow-lg border border-gray-100 text-center">
          <p className="font-semibold text-gray-700">No Dibs nearby</p>
          <p className="text-sm text-gray-500 mt-1">
            Be the first to post access in your area.
          </p>
        </div>
      )}

      {/* Preview card bottom sheet */}
      <BottomSheet
        isOpen={!!selectedDip}
        onClose={() => setSelectedDip(null)}
        snapHeight="40vh"
      >
        {selectedDip && <DipPreviewCard dip={selectedDip} />}
      </BottomSheet>
    </div>
  );
}
