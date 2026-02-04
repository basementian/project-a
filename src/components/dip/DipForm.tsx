'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useLocationStore } from '@/stores/useLocationStore';
import { createDip } from '@/services/dips';
import { formatPrice, formatDuration } from '@/lib/utils';
import {
  DIP_TYPE_LABELS,
  DIP_TYPE_ICONS,
  ACCESS_METHOD_LABELS,
} from '@/types/dip';
import type { DipType, AccessMethod, CreateDipPayload } from '@/types/dip';
import {
  MAX_DIP_DURATION_HOURS,
  MIN_DIP_DURATION_MINUTES,
  DIP_DURATION_STEP_MINUTES,
  PLATFORM_FEE_PERCENT,
} from '@/lib/constants';

const allTypes: DipType[] = ['seat', 'desk', 'queue', 'charger', 'other'];
const allMethods: AccessMethod[] = ['code', 'qr', 'physical_handoff', 'meet_confirm'];

export function DipForm() {
  const router = useRouter();
  const userLocation = useLocationStore((s) => s.userLocation);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [type, setType] = useState<DipType | null>(null);
  const [durationMin, setDurationMin] = useState(60);
  const [priceDollars, setPriceDollars] = useState('');
  const [accessMethod, setAccessMethod] = useState<AccessMethod>('meet_confirm');
  const [accessInstructions, setAccessInstructions] = useState('');
  const [rules, setRules] = useState('');

  const priceInCents = Math.round(parseFloat(priceDollars || '0') * 100);
  const maxDurationMin = MAX_DIP_DURATION_HOURS * 60;

  const canProceed = () => {
    switch (step) {
      case 0: return type !== null;
      case 1: return durationMin >= MIN_DIP_DURATION_MINUTES && priceInCents > 0;
      case 2: return accessMethod !== null;
      case 3: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!userLocation || !type) return;
    setLoading(true);
    setError('');

    const availableUntil = new Date(Date.now() + durationMin * 60 * 1000).toISOString();
    const payload: CreateDipPayload = {
      type,
      lat: userLocation.lat,
      lng: userLocation.lng,
      available_until: availableUntil,
      price: priceInCents,
      access_method: accessMethod,
      access_instructions: accessInstructions || undefined,
      rules: rules || undefined,
    };

    try {
      await createDip(payload);
      router.push('/activity');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Progress */}
      <div className="flex gap-1 px-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-dip-primary' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      <div className="flex-1 px-4">
        {/* Step 0: Type */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">What are you sharing?</h2>
              <p className="text-sm text-gray-500 mt-1">Select the type of access</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {allTypes.map((t) => (
                <Card
                  key={t}
                  active={type === t}
                  onClick={() => setType(t)}
                  className="flex flex-col items-center gap-2 py-6"
                >
                  <span className="text-3xl">{DIP_TYPE_ICONS[t]}</span>
                  <span className="text-sm font-medium">{DIP_TYPE_LABELS[t]}</span>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Duration & Price */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Set details</h2>
              <p className="text-sm text-gray-500 mt-1">How long and how much?</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Available for: {formatDuration(durationMin)}
              </label>
              <input
                type="range"
                min={MIN_DIP_DURATION_MINUTES}
                max={maxDurationMin}
                step={DIP_DURATION_STEP_MINUTES}
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className="w-full accent-dip-primary"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{formatDuration(MIN_DIP_DURATION_MINUTES)}</span>
                <span>{formatDuration(maxDurationMin)}</span>
              </div>
            </div>

            <Input
              label="Price"
              type="number"
              placeholder="0.00"
              value={priceDollars}
              onChange={(e) => setPriceDollars(e.target.value)}
              helper={priceInCents > 0 ? `Claimer pays ${formatPrice(priceInCents)}` : undefined}
            />
          </div>
        )}

        {/* Step 2: Access Method */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">How will they access it?</h2>
              <p className="text-sm text-gray-500 mt-1">Choose the handoff method</p>
            </div>
            <div className="space-y-2">
              {allMethods.map((m) => (
                <Card
                  key={m}
                  active={accessMethod === m}
                  onClick={() => setAccessMethod(m)}
                  className="flex items-center gap-3"
                >
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center border-gray-300">
                    {accessMethod === m && (
                      <div className="w-2 h-2 rounded-full bg-dip-primary" />
                    )}
                  </div>
                  <span className="font-medium">{ACCESS_METHOD_LABELS[m]}</span>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Instructions & Rules */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Final details</h2>
              <p className="text-sm text-gray-500 mt-1">Add instructions for the claimer</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Access instructions (shown after claim)
              </label>
              <textarea
                value={accessInstructions}
                onChange={(e) => setAccessInstructions(e.target.value)}
                placeholder="e.g., Code is 4521, parking spot #12 on level 2"
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-dip-primary focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Rules (optional, shown before claim)
              </label>
              <textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="e.g., Please keep the area clean"
                rows={2}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-dip-primary focus:border-transparent"
              />
            </div>

            {/* Review summary */}
            <Card className="bg-gray-50">
              <h3 className="font-semibold mb-2">Review</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-500">Type:</span> {type && DIP_TYPE_LABELS[type]}</p>
                <p><span className="text-gray-500">Duration:</span> {formatDuration(durationMin)}</p>
                <p><span className="text-gray-500">Price:</span> {formatPrice(priceInCents)}</p>
                <p><span className="text-gray-500">You earn:</span> {formatPrice(Math.round(priceInCents * (1 - PLATFORM_FEE_PERCENT / 100)))} <span className="text-xs text-gray-400">(after {PLATFORM_FEE_PERCENT}% fee)</span></p>
                <p><span className="text-gray-500">Access:</span> {ACCESS_METHOD_LABELS[accessMethod]}</p>
                <p><span className="text-gray-500">Location:</span> Current position</p>
              </div>
            </Card>
          </div>
        )}

        {error && <p className="text-sm text-dip-danger mt-4">{error}</p>}
      </div>

      {/* Navigation buttons */}
      <div className="sticky bottom-0 p-4 bg-white border-t border-gray-100 flex gap-3">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep(step - 1)} className="flex-1">
            Back
          </Button>
        )}
        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex-1"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            loading={loading}
            className="flex-1"
          >
            Post Dib
          </Button>
        )}
      </div>
    </div>
  );
}
