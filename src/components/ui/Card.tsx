'use client';

import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}

export function Card({ children, className, onClick, active }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-4 shadow-sm transition-all',
        active
          ? 'border-dip-primary ring-2 ring-dip-primary/20'
          : 'border-gray-100',
        onClick && 'cursor-pointer active:scale-[0.98]',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
