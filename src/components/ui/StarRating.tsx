'use client';

import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' };

export function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            'touch-target flex items-center justify-center transition-transform',
            sizes[size],
            !readonly && 'active:scale-110',
            readonly && 'cursor-default'
          )}
        >
          <span className={star <= value ? 'text-amber-400' : 'text-gray-200'}>
            {star <= value ? '\u2605' : '\u2606'}
          </span>
        </button>
      ))}
    </div>
  );
}
