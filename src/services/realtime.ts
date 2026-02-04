import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function subscribeToDips(
  onInsert: (dip: Record<string, unknown>) => void,
  onUpdate: (dip: Record<string, unknown>) => void,
  onDelete: (oldDip: Record<string, unknown>) => void
): RealtimeChannel {
  const supabase = createClient();

  const channel = supabase
    .channel('dips-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'dips' },
      (payload) => onInsert(payload.new as Record<string, unknown>)
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'dips' },
      (payload) => onUpdate(payload.new as Record<string, unknown>)
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'dips' },
      (payload) => onDelete(payload.old as Record<string, unknown>)
    )
    .subscribe();

  return channel;
}

export function unsubscribe(channel: RealtimeChannel): void {
  const supabase = createClient();
  supabase.removeChannel(channel);
}
