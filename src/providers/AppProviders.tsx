'use client';

import { useEffect, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import type { UserProfile } from '@/types/user';

export function AppProviders({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUser(profile as unknown as UserProfile);
        } else {
          // Profile might not exist yet (race with trigger) — create a minimal one
          setUser({
            id: user.id,
            phone_verified: false,
            average_rating: 0,
            total_ratings: 0,
            created_at: new Date().toISOString(),
          });
        }
      } else {
        setUser(null);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser(
          profile
            ? (profile as unknown as UserProfile)
            : {
                id: session.user.id,
                phone_verified: false,
                average_rating: 0,
                total_ratings: 0,
                created_at: new Date().toISOString(),
              }
        );
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return <>{children}</>;
}
