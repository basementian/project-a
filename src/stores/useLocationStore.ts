import { create } from 'zustand';
import type { DipLocation } from '@/types/dip';

interface LocationState {
  userLocation: DipLocation | null;
  locationError: string | null;
  isLocating: boolean;
  setLocation: (loc: DipLocation) => void;
  setError: (error: string) => void;
  setLocating: (locating: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  userLocation: null,
  locationError: null,
  isLocating: false,
  setLocation: (userLocation) => set({ userLocation, locationError: null, isLocating: false }),
  setError: (locationError) => set({ locationError, isLocating: false }),
  setLocating: (isLocating) => set({ isLocating }),
}));
