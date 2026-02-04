import { create } from 'zustand';
import type { DipType } from '@/types/dip';

interface FilterState {
  maxDistance: number;
  maxPrice: number | null;
  minTimeRemaining: number | null;
  selectedTypes: DipType[];
  setMaxDistance: (d: number) => void;
  setMaxPrice: (p: number | null) => void;
  setMinTimeRemaining: (m: number | null) => void;
  toggleType: (t: DipType) => void;
  resetFilters: () => void;
}

const defaults = {
  maxDistance: 2000,
  maxPrice: null as number | null,
  minTimeRemaining: null as number | null,
  selectedTypes: [] as DipType[],
};

export const useFilterStore = create<FilterState>((set) => ({
  ...defaults,
  setMaxDistance: (maxDistance) => set({ maxDistance }),
  setMaxPrice: (maxPrice) => set({ maxPrice }),
  setMinTimeRemaining: (minTimeRemaining) => set({ minTimeRemaining }),
  toggleType: (t) =>
    set((s) => ({
      selectedTypes: s.selectedTypes.includes(t)
        ? s.selectedTypes.filter((x) => x !== t)
        : [...s.selectedTypes, t],
    })),
  resetFilters: () => set(defaults),
}));
