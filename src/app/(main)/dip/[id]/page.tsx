'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { StarRating } from '@/components/ui/StarRating';
import { CountdownTimer } from '@/components/dip/CountdownTimer';
import { DipStatusBadge } from '@/components/dip/DipStatusBadge';
import { AccessInstructions } from '@/components/dip/AccessInstructions';
import { ClaimButton } from '@/components/dip/ClaimButton';
import { useAuthStore } from '@/stores/useAuthStore';
import { useGeolocation } from '@/hooks/useGeolocation';
import { fetchDipById, completeDip } from '@/services/dips';
import { submitRating } from '@/services/ratings';
import { formatPrice } from '@/lib/utils';
import { DIP_TYPE_LABELS, DIP_TYPE_ICONS, ACCESS_METHOD_LABELS } from '@/types/dip';
import type { Dip } from '@/types/dip';

export default function DipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dipId = params.id as string;
  const user = useAuthStore((s) => s.user);
  useGeolocation();

  const [dip, setDip] = useState<Dip | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => {
    fetchDipById(dipId)
      .then((d) => setDip(d))
      .finally(() => setLoading(false));
  }, [dipId]);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="Dib" showBack />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!dip) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="Dib" showBack />
        <div className="flex-1 flex items-center justify-center px-6 text-center">
          <div>
            <p className="font-semibold text-gray-700">Dib not found</p>
            <p className="text-sm text-gray-500 mt-1">It may have expired or been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === dip.owner_id;
  const isClaimer = user?.id === dip.claimer_id;

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const updated = await completeDip(dip.id);
      setDip(updated);
    } finally {
      setCompleting(false);
    }
  };

  const handleRate = async () => {
    if (!dip || rating === 0) return;
    const targetId = isOwner ? dip.claimer_id : dip.owner_id;
    if (!targetId) return;
    try {
      await submitRating(dip.id, targetId, rating);
      setRated(true);
    } catch {
      // Rating may have already been submitted
    }
  };

  const handleReport = async () => {
    if (!user) return;
    try {
      await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dipId: dip.id,
          reason: 'User reported an issue',
        }),
      });
      setReportSent(true);
    } catch {}
  };

  const handleClaimed = (updated: Dip) => {
    setDip(updated);
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar title={DIP_TYPE_LABELS[dip.type]} showBack />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{DIP_TYPE_ICONS[dip.type]}</span>
            <div>
              <h2 className="text-xl font-bold">{DIP_TYPE_LABELS[dip.type]}</h2>
              <p className="text-sm text-gray-500">{ACCESS_METHOD_LABELS[dip.access_method]}</p>
            </div>
          </div>
          <DipStatusBadge status={dip.status} />
        </div>

        {/* Price & Time */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Price</p>
              <p className="text-2xl font-bold text-dip-primary">{formatPrice(dip.price)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Time remaining</p>
              <CountdownTimer targetDate={dip.available_until} size="lg" />
            </div>
          </div>
        </Card>

        {/* Rules */}
        {dip.rules && (
          <Card>
            <p className="text-sm font-medium text-gray-500 mb-1">Rules</p>
            <p className="text-sm text-gray-700">{dip.rules}</p>
          </Card>
        )}

        {/* Access instructions - only for claimer after claiming */}
        {isClaimer && dip.status === 'claimed' && (
          <AccessInstructions
            accessMethod={dip.access_method}
            instructions={dip.access_instructions}
          />
        )}

        {/* Completion flow */}
        {dip.status === 'completed' && !rated && (isOwner || isClaimer) && (
          <Card>
            <h3 className="font-semibold mb-3">Rate this exchange</h3>
            <div className="flex flex-col items-center gap-3">
              <StarRating value={rating} onChange={setRating} size="lg" />
              <Button
                fullWidth
                disabled={rating === 0}
                onClick={handleRate}
              >
                Submit rating
              </Button>
            </div>
          </Card>
        )}

        {rated && (
          <Card className="bg-emerald-50 border-emerald-200">
            <p className="text-center text-emerald-700 font-medium">Rating submitted. Thanks!</p>
          </Card>
        )}

        {/* Report button */}
        {(isClaimer || isOwner) && dip.status !== 'completed' && (
          <div className="pt-2">
            {reportSent ? (
              <p className="text-sm text-center text-gray-500">Report received. Our team will review it.</p>
            ) : (
              <button
                onClick={handleReport}
                className="w-full text-sm text-gray-400 hover:text-dip-danger transition-colors py-2"
              >
                Report issue
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom action area */}
      <div className="sticky bottom-16 p-4 bg-white border-t border-gray-100">
        {/* Viewer: can claim */}
        {dip.status === 'active' && !isOwner && (
          <ClaimButton dip={dip} onClaimed={handleClaimed} />
        )}

        {/* Owner viewing active dip */}
        {dip.status === 'active' && isOwner && (
          <Badge variant="info" className="w-full justify-center py-2 text-sm">
            Waiting for someone to claim...
          </Badge>
        )}

        {/* Claimer: mark done */}
        {dip.status === 'claimed' && isClaimer && (
          <Button fullWidth loading={completing} onClick={handleComplete}>
            I&apos;m done
          </Button>
        )}

        {/* Owner: confirm access free */}
        {dip.status === 'claimed' && isOwner && (
          <Button fullWidth loading={completing} onClick={handleComplete}>
            Access free
          </Button>
        )}

        {/* Completed */}
        {dip.status === 'completed' && (
          <Button fullWidth variant="secondary" onClick={() => router.push('/map')}>
            Back to map
          </Button>
        )}
      </div>
    </div>
  );
}
