'use client';

import { useFilterStore } from '@/stores/useFilterStore';
import { DIP_TYPE_LABELS, DIP_TYPE_ICONS } from '@/types/dip';
import type { DipType } from '@/types/dip';
import { cn } from '@/lib/utils';

const allTypes: DipType[] = ['seat', 'desk', 'queue', 'charger', 'other'];

export function FilterBar() {
  const { selectedTypes, toggleType } = useFilterStore();

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
      {allTypes.map((type) => {
        const isActive = selectedTypes.includes(type);
        return (
          <button
            key={type}
            onClick={() => toggleType(type)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors touch-target',
              isActive
                ? 'bg-dip-primary text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            )}
          >
            <span>{DIP_TYPE_ICONS[type]}</span>
            <span>{DIP_TYPE_LABELS[type]}</span>
          </button>
        );
      })}
    </div>
  );
}
