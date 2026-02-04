import { createClient } from '@/lib/supabase/client';
import type { Dip, CreateDipPayload } from '@/types/dip';

/* eslint-disable @typescript-eslint/no-explicit-any */

function rowToDip(row: any): Dip {
  return {
    id: row.id,
    type: row.type,
    location: {
      lat: row.lat ?? 0,
      lng: row.lng ?? 0,
    },
    available_until: row.available_until,
    price: row.price,
    access_method: row.access_method,
    rules: row.rules ?? undefined,
    status: row.status,
    owner_id: row.owner_id,
    claimer_id: row.claimer_id ?? undefined,
    access_instructions: row.access_instructions ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    completed_at: row.completed_at ?? undefined,
  };
}

export async function fetchNearbyDips(
  lat: number,
  lng: number,
  radiusMeters = 2000
): Promise<Dip[]> {
  const supabase = createClient();
  const { data, error } = await (supabase as any).rpc('nearby_dips', {
    user_lat: lat,
    user_lng: lng,
    radius_meters: radiusMeters,
  });
  if (error) throw error;
  return (data ?? []).map((r: any) => rowToDip(r));
}

export async function fetchDipById(id: string): Promise<Dip | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('dips')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  const dip = rowToDip(data);

  // Auto-expire if past available_until and still active
  if (dip.status === 'active' && new Date(dip.available_until) <= new Date()) {
    const { data: updated } = await supabase
      .from('dips')
      .update({ status: 'expired' } as any)
      .eq('id', id)
      .eq('status', 'active')
      .select()
      .single();
    if (updated) return { ...rowToDip(updated), status: 'expired' };
    return { ...dip, status: 'expired' };
  }

  return dip;
}

export async function createDip(payload: CreateDipPayload): Promise<Dip> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('dips')
    .insert({
      type: payload.type,
      location: `POINT(${payload.lng} ${payload.lat})`,
      available_until: payload.available_until,
      price: payload.price,
      access_method: payload.access_method,
      rules: payload.rules ?? null,
      access_instructions: payload.access_instructions ?? null,
      owner_id: user.id,
      status: 'active',
    } as any)
    .select()
    .single();

  if (error) throw error;
  return rowToDip(data);
}

export async function claimDip(
  dipId: string,
  userLat: number,
  userLng: number
): Promise<Dip> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await (supabase as any).rpc('claim_dip', {
    p_dip_id: dipId,
    p_user_lat: userLat,
    p_user_lng: userLng,
  });

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error('Claim failed');
  return rowToDip(data[0]);
}

export async function completeDip(dipId: string): Promise<Dip> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('dips')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    } as any)
    .eq('id', dipId)
    .select()
    .single();

  if (error) throw error;
  return rowToDip(data);
}

export async function cancelDip(dipId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('dips').delete().eq('id', dipId);
  if (error) throw error;
}

export async function getUserActiveDip(userId: string): Promise<Dip | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('dips')
    .select('*')
    .eq('owner_id', userId)
    .in('status', ['active', 'claimed'])
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const dip = rowToDip(data);

  // Auto-expire if active and past time
  if (dip.status === 'active' && new Date(dip.available_until) <= new Date()) {
    await supabase
      .from('dips')
      .update({ status: 'expired' } as any)
      .eq('id', dip.id)
      .eq('status', 'active');
    return null;
  }

  return dip;
}

export async function getUserClaimedDip(userId: string): Promise<Dip | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('dips')
    .select('*')
    .eq('claimer_id', userId)
    .eq('status', 'claimed')
    .limit(1)
    .maybeSingle();
  return data ? rowToDip(data) : null;
}

export async function getUserDipHistory(userId: string): Promise<Dip[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('dips')
    .select('*')
    .or(`owner_id.eq.${userId},claimer_id.eq.${userId}`)
    .in('status', ['completed', 'expired'])
    .order('created_at', { ascending: false })
    .limit(20);
  return (data ?? []).map((r: any) => rowToDip(r));
}
