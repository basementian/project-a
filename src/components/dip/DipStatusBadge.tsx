'use client';

import { Badge } from '@/components/ui/Badge';
import type { DipStatus } from '@/types/dip';

const statusConfig: Record<DipStatus, { label: string; variant: 'success' | 'info' | 'default' | 'warning' }> = {
  active: { label: 'Active', variant: 'success' },
  claimed: { label: 'Claimed', variant: 'info' },
  expired: { label: 'Expired', variant: 'default' },
  completed: { label: 'Completed', variant: 'success' },
};

interface DipStatusBadgeProps {
  status: DipStatus;
}

export function DipStatusBadge({ status }: DipStatusBadgeProps) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
