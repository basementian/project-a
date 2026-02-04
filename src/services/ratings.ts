import { createClient } from '@/lib/supabase/client';
import type { Rating } from '@/types/user';

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function submitRating(
  dipId: string,
  ratedId: string,
  score: number
): Promise<Rating> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('ratings')
    .insert({
      dip_id: dipId,
      rater_id: user.id,
      rated_id: ratedId,
      score,
    } as any)
    .select()
    .single();

  if (error) throw error;

  // Update profile average
  await (supabase as any).rpc('update_user_rating', { target_user_id: ratedId });

  return data as Rating;
}

export async function getUserRatings(userId: string): Promise<Rating[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('ratings')
    .select('*')
    .eq('rated_id', userId)
    .order('created_at', { ascending: false });
  return (data ?? []) as Rating[];
}
