'use client';

import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/utils';
import { DIP_EXPIRY_WARNING_MINUTES } from '@/lib/constants';

interface CountdownTimerProps {
  targetDate: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CountdownTimer({ targetDate, size = 'md' }: CountdownTimerProps) {
  const { hours, minutes, seconds, expired, total } = useCountdown(targetDate);
  const isWarning = total < DIP_EXPIRY_WARNING_MINUTES * 60 * 1000 && !expired;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (expired) {
    return (
      <span className={cn('font-mono font-bold text-dip-danger', size === 'lg' && 'text-2xl', size === 'md' && 'text-lg')}>
        Expired
      </span>
    );
  }

  return (
    <span
      className={cn(
        'font-mono font-bold tabular-nums',
        isWarning ? 'text-dip-danger animate-pulse-soft' : 'text-gray-900',
        size === 'lg' && 'text-2xl',
        size === 'md' && 'text-lg',
        size === 'sm' && 'text-sm'
      )}
    >
      {hours > 0 && `${pad(hours)}:`}{pad(minutes)}:{pad(seconds)}
    </span>
  );
}
