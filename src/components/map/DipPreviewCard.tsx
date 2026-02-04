'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCountdown } from '@/hooks/useCountdown';
import { useProximityCheck } from '@/hooks/useProximityCheck';
import { formatPrice, formatDistance, formatTimeRemaining } from '@/lib/utils';
import { DIP_TYPE_LABELS, DIP_TYPE_ICONS, ACCESS_METHOD_LABELS } from '@/types/dip';
import type { Dip } from '@/types/dip';

interface DipPreviewCardProps {
  dip: Dip;
}

export function DipPreviewCard({ dip }: DipPreviewCardProps) {
  const router = useRouter();
  const countdown = useCountdown(dip.available_until);
  const { isNearby, distance } = useProximityCheck(dip.location);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{DIP_TYPE_ICONS[dip.type]}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{DIP_TYPE_LABELS[dip.type]}</h3>
            <p className="text-sm text-gray-500">{ACCESS_METHOD_LABELS[dip.access_method]}</p>
          </div>
        </div>
        <span className="text-xl font-bold text-dip-primary">{formatPrice(dip.price)}</span>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <Badge variant={countdown.expired ? 'danger' : countdown.total < 600000 ? 'warning' : 'success'}>
          {countdown.expired ? 'Expired' : formatTimeRemaining(countdown.total)}
        </Badge>
        {distance !== null && (
          <span className="text-gray-500">{formatDistance(distance)} away</span>
        )}
      </div>

      {dip.rules && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">{dip.rules}</p>
      )}

      <Button
        fullWidth
        onClick={() => router.push(`/dip/${dip.id}`)}
      >
        {isNearby ? 'Claim access' : 'View details'}
      </Button>

      {!isNearby && distance !== null && (
        <p className="text-xs text-center text-gray-400">
          Get within 200m to claim ({formatDistance(distance)} away)
        </p>
      )}
    </div>
  );
}
