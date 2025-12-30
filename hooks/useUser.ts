'use client';

import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Utiliser un identifiant unique pour éviter les conflits de timers
    const timerId = `useUser-${Date.now()}-${Math.random()}`;
    console.time(timerId);
    
    // Récupérer la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.timeEnd(timerId);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('❌ Erreur getSession:', error);
      try {
        console.timeEnd(timerId);
      } catch (e) {
        // Ignorer si le timer n'existe pas
      }
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, session, loading };
}








