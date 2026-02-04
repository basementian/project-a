import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dipId, reason } = await request.json();

    if (!dipId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('reports').insert({
      dip_id: dipId,
      reporter_id: user.id,
      reason,
    } as any);

    if (error) {
      console.error('Report insert error:', error);
      return NextResponse.json(
        { error: 'Failed to submit report' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Report received. Our team will review it.',
    });
  } catch (err) {
    console.error('Report error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
