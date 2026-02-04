export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  platformFee: number;
}

export async function createPaymentIntent(
  amount: number,
  dipId: string
): Promise<PaymentIntentResult> {
  const res = await fetch('/api/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, dipId }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Payment failed');
  }

  return res.json();
}
