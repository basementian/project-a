'use client';

import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { DEFAULT_MAP_ZOOM, DEFAULT_MAP_STYLE } from '@/lib/constants';
import { useLocationStore } from '@/stores/useLocationStore';
import { useDipStore } from '@/stores/useDipStore';
import { DIP_TYPE_ICONS } from '@/types/dip';
import type { Dip } from '@/types/dip';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface MapViewProps {
  onDipSelect: (dip: Dip) => void;
  onMapMove?: (lat: number, lng: number) => void;
}

export function MapView({ onDipSelect, onMapMove }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const userMarker = useRef<mapboxgl.Marker | null>(null);

  const userLocation = useLocationStore((s) => s.userLocation);
  const nearbyDips = useDipStore((s) => s.nearbyDips);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const center = userLocation
      ? [userLocation.lng, userLocation.lat]
      : [-73.985, 40.748]; // Default: NYC

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: DEFAULT_MAP_STYLE,
      center: center as [number, number],
      zoom: DEFAULT_MAP_ZOOM,
      attributionControl: false,
    });

    map.current.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-left'
    );

    if (onMapMove) {
      map.current.on('moveend', () => {
        const center = map.current?.getCenter();
        if (center) onMapMove(center.lat, center.lng);
      });
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update user location marker
  useEffect(() => {
    if (!map.current || !userLocation) return;

    if (!userMarker.current) {
      const el = document.createElement('div');
      el.className = 'w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg';
      userMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);

      // Fly to user on first location
      map.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: DEFAULT_MAP_ZOOM,
        duration: 1000,
      });
    } else {
      userMarker.current.setLngLat([userLocation.lng, userLocation.lat]);
    }
  }, [userLocation]);

  // Render dip markers
  const renderMarkers = useCallback(() => {
    if (!map.current) return;

    const currentIds = new Set(nearbyDips.map((d) => d.id));

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add/update markers
    nearbyDips.forEach((dip) => {
      if (markersRef.current.has(dip.id)) return;

      const el = document.createElement('div');
      el.className =
        'flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md border-2 border-dip-primary text-lg cursor-pointer active:scale-95 transition-transform';
      el.textContent = DIP_TYPE_ICONS[dip.type];
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onDipSelect(dip);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([dip.location.lng, dip.location.lat])
        .addTo(map.current!);

      markersRef.current.set(dip.id, marker);
    });
  }, [nearbyDips, onDipSelect]);

  useEffect(() => {
    renderMarkers();
  }, [renderMarkers]);

  return (
    <div ref={mapContainer} className="w-full h-full" />
  );
}
