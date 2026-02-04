import { create } from 'zustand';
import type { Dip } from '@/types/dip';

interface DipState {
  nearbyDips: Dip[];
  selectedDip: Dip | null;
  userActiveDip: Dip | null;
  isLoading: boolean;
  setNearbyDips: (dips: Dip[]) => void;
  addDip: (dip: Dip) => void;
  updateDip: (dip: Dip) => void;
  removeDip: (id: string) => void;
  setSelectedDip: (dip: Dip | null) => void;
  setUserActiveDip: (dip: Dip | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useDipStore = create<DipState>((set) => ({
  nearbyDips: [],
  selectedDip: null,
  userActiveDip: null,
  isLoading: false,
  setNearbyDips: (nearbyDips) => set({ nearbyDips }),
  addDip: (dip) =>
    set((s) => ({ nearbyDips: [...s.nearbyDips, dip] })),
  updateDip: (dip) =>
    set((s) => ({
      nearbyDips: s.nearbyDips.map((d) => (d.id === dip.id ? dip : d)),
      selectedDip: s.selectedDip?.id === dip.id ? dip : s.selectedDip,
      userActiveDip: s.userActiveDip?.id === dip.id ? dip : s.userActiveDip,
    })),
  removeDip: (id) =>
    set((s) => ({
      nearbyDips: s.nearbyDips.filter((d) => d.id !== id),
      selectedDip: s.selectedDip?.id === id ? null : s.selectedDip,
    })),
  setSelectedDip: (selectedDip) => set({ selectedDip }),
  setUserActiveDip: (userActiveDip) => set({ userActiveDip }),
  setLoading: (isLoading) => set({ isLoading }),
}));
