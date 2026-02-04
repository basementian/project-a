import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PLATFORM_FEE_PERCENT } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, dipId } = await request.json();

    if (!amount || amount <= 0 || !dipId) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Verify the dip exists, is active, and price matches
    const { data: dipData, error: dipError } = await supabase
      .from('dips')
      .select('*')
      .eq('id', dipId)
      .single();

    const dip = dipData as { id: string; price: number; status: string; owner_id: string } | null;

    if (dipError || !dip) {
      return NextResponse.json({ error: 'Dib not found' }, { status: 404 });
    }
    if (dip.status !== 'active') {
      return NextResponse.json({ error: 'Dib is not available' }, { status: 400 });
    }
    if (dip.price !== amount) {
      return NextResponse.json({ error: 'Price mismatch' }, { status: 400 });
    }
    if (dip.owner_id === user.id) {
      return NextResponse.json({ error: 'Cannot claim own dip' }, { status: 400 });
    }

    const platformFee = Math.round(amount * (PLATFORM_FEE_PERCENT / 100));

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        dip_id: dipId,
        claimer_id: user.id,
        owner_id: dip.owner_id,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      platformFee,
    });
  } catch (err) {
    console.error('Payment error:', err);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
