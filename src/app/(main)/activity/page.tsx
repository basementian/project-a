'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { DipStatusBadge } from '@/components/dip/DipStatusBadge';
import { CountdownTimer } from '@/components/dip/CountdownTimer';
import { useAuthStore } from '@/stores/useAuthStore';
import { getUserActiveDip, getUserClaimedDip, getUserDipHistory } from '@/services/dips';
import { formatPrice } from '@/lib/utils';
import { DIP_TYPE_LABELS, DIP_TYPE_ICONS } from '@/types/dip';
import type { Dip } from '@/types/dip';

export default function ActivityPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [activeDip, setActiveDip] = useState<Dip | null>(null);
  const [claimedDip, setClaimedDip] = useState<Dip | null>(null);
  const [history, setHistory] = useState<Dip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      getUserActiveDip(user.id),
      getUserClaimedDip(user.id),
      getUserDipHistory(user.id),
    ])
      .then(([active, claimed, hist]) => {
        setActiveDip(active);
        setClaimedDip(claimed);
        setHistory(hist);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="Activity" />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  const currentDip = activeDip || claimedDip;

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Activity" />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-6">
        {/* Current dip */}
        {currentDip ? (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Current</h2>
            <Card
              onClick={() => router.push(`/dip/${currentDip.id}`)}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{DIP_TYPE_ICONS[currentDip.type]}</span>
                  <div>
                    <p className="font-semibold">{DIP_TYPE_LABELS[currentDip.type]}</p>
                    <p className="text-sm text-gray-500">{formatPrice(currentDip.price)}</p>
                  </div>
                </div>
                <DipStatusBadge status={currentDip.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Time remaining</span>
                <CountdownTimer targetDate={currentDip.available_until} size="sm" />
              </div>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No active Dibs</p>
            <p className="text-sm text-gray-400 mt-1">
              Post a Dib or claim one nearby.
            </p>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">History</h2>
            <div className="space-y-2">
              {history.map((dip) => (
                <Card
                  key={dip.id}
                  onClick={() => router.push(`/dip/${dip.id}`)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{DIP_TYPE_ICONS[dip.type]}</span>
                    <div>
                      <p className="font-medium text-sm">{DIP_TYPE_LABELS[dip.type]}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(dip.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatPrice(dip.price)}</p>
                    <DipStatusBadge status={dip.status} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
