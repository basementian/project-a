'use client';

import { useState, useCallback } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useProximityCheck } from '@/hooks/useProximityCheck';
import { useLocationStore } from '@/stores/useLocationStore';
import { formatPrice, formatDistance } from '@/lib/utils';
import { stripePromise } from '@/lib/stripe-client';
import {
  createPaymentIntent,
  type PaymentIntentResult,
} from '@/services/payments';
import { claimDip } from '@/services/dips';
import { PLATFORM_FEE_PERCENT } from '@/lib/constants';
import type { Dip } from '@/types/dip';

interface ClaimButtonProps {
  dip: Dip;
  onClaimed: (dip: Dip) => void;
}

function PaymentForm({
  dip,
  paymentInfo,
  onSuccess,
  onError,
}: {
  dip: Dip;
  paymentInfo: PaymentIntentResult;
  onSuccess: (dip: Dip) => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const userLocation = useLocationStore((s) => s.userLocation);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !userLocation) return;

    setProcessing(true);
    try {
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        onError(stripeError.message ?? 'Payment failed');
        return;
      }

      // Payment succeeded — claim the dip server-side
      const claimed = await claimDip(
        dip.id,
        userLocation.lat,
        userLocation.lng
      );
      onSuccess(claimed);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Access price</span>
          <span className="font-semibold">{formatPrice(dip.price)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">
            Platform fee ({PLATFORM_FEE_PERCENT}%)
          </span>
          <span className="text-gray-500">
            {formatPrice(paymentInfo.platformFee)}
          </span>
        </div>
        <div className="border-t pt-1 flex justify-between text-sm font-bold">
          <span>Total</span>
          <span>{formatPrice(dip.price)}</span>
        </div>
      </div>

      <PaymentElement />

      <Button
        type="submit"
        fullWidth
        loading={processing}
        disabled={!stripe || !elements}
      >
        Pay {formatPrice(dip.price)}
      </Button>
    </form>
  );
}

export function ClaimButton({ dip, onClaimed }: ClaimButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentIntentResult | null>(
    null
  );
  const { isNearby, distance } = useProximityCheck(dip.location);

  const handleInitiatePayment = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const intent = await createPaymentIntent(dip.price, dip.id);
      setPaymentInfo(intent);
      setShowPayment(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to start payment'
      );
    } finally {
      setLoading(false);
    }
  }, [dip.price, dip.id]);

  const handlePaymentSuccess = useCallback(
    (claimed: Dip) => {
      setShowPayment(false);
      setPaymentInfo(null);
      onClaimed(claimed);
    },
    [onClaimed]
  );

  const handlePaymentError = useCallback((msg: string) => {
    setError(msg);
  }, []);

  if (!isNearby) {
    return (
      <div className="space-y-1">
        <Button fullWidth disabled variant="secondary">
          Too far away
        </Button>
        {distance !== null && (
          <p className="text-xs text-center text-gray-400">
            Get within 200m to claim ({formatDistance(distance)} away)
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <Button fullWidth loading={loading} onClick={handleInitiatePayment}>
          Claim access &mdash; {formatPrice(dip.price)}
        </Button>
        {error && (
          <p className="text-sm text-dip-danger text-center">{error}</p>
        )}
      </div>

      <BottomSheet
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        snapHeight="70vh"
      >
        {paymentInfo && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-center">Complete Payment</h3>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: paymentInfo.clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#6366F1',
                    borderRadius: '12px',
                  },
                },
              }}
            >
              <PaymentForm
                dip={dip}
                paymentInfo={paymentInfo}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
