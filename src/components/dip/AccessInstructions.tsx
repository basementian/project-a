'use client';

import { Card } from '@/components/ui/Card';
import { ACCESS_METHOD_LABELS } from '@/types/dip';
import type { AccessMethod } from '@/types/dip';

interface AccessInstructionsProps {
  accessMethod: AccessMethod;
  instructions?: string;
}

export function AccessInstructions({ accessMethod, instructions }: AccessInstructionsProps) {
  return (
    <Card className="border-dip-primary bg-indigo-50/50">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-dip-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <h3 className="font-semibold text-dip-primary">Access Unlocked</h3>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 uppercase">
            {ACCESS_METHOD_LABELS[accessMethod]}
          </p>
          {instructions ? (
            <p className="text-base text-gray-900 font-medium">{instructions}</p>
          ) : (
            <p className="text-sm text-gray-500">No additional instructions provided.</p>
          )}
        </div>
      </div>
    </Card>
  );
}
