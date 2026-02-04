'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface TopBarProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
}

export function TopBar({ title, showBack = false, rightAction, className }: TopBarProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex items-center justify-between h-14 px-4 bg-white/95 backdrop-blur-sm border-b border-gray-100',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="touch-target flex items-center justify-center -ml-2"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>
      {rightAction && <div>{rightAction}</div>}
    </header>
  );
}
