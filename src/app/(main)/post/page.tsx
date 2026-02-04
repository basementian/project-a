'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { DipForm } from '@/components/dip/DipForm';
import { Spinner } from '@/components/ui/Spinner';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useLocationStore } from '@/stores/useLocationStore';

export default function PostPage() {
  const router = useRouter();
  const userLocation = useGeolocation();
  const isLocating = useLocationStore((s) => s.isLocating);
  const locationError = useLocationStore((s) => s.locationError);

  if (isLocating) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="Post a Dib" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="text-sm text-gray-500 mt-3">Getting your location...</p>
          </div>
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="Post a Dib" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="font-semibold text-gray-700">Location required</p>
            <p className="text-sm text-gray-500 mt-1">
              Enable location access to post a Dib at your current position.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Post a Dib" />
      <div className="flex-1 overflow-y-auto pt-4 pb-20">
        <DipForm />
      </div>
    </div>
  );
}
