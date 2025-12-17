'use client';

import { useEffect, useState } from 'react';
import { useUser } from './useUser';
import { supabase } from '@/lib/supabase';

export function usePro() {
  const { user, loading: userLoading } = useUser();
  const [isPro, setIsPro] = useState(false);
  const [proStatus, setProStatus] = useState<'pending' | 'active' | 'blocked' | null>(null);
  const [checkingPro, setCheckingPro] = useState(true);

  useEffect(() => {
    const checkProRole = async () => {
      if (!user?.id || !supabase) {
        setIsPro(false);
        setProStatus(null);
        setCheckingPro(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role, pro_status')
          .eq('user_id', user.id)
          .maybeSingle(); // Utiliser maybeSingle() au lieu de single() pour éviter les erreurs 400

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (normal)
          console.error('Erreur vérification rôle pro:', error);
        }

        const role = profile?.role?.toLowerCase();
        const status = profile?.pro_status?.toLowerCase();
        
        // isPro = role === 'pro' && pro_status === 'active'
        const isProRole = role === 'pro' && status === 'active';
        
        setIsPro(isProRole);
        setProStatus(status as 'pending' | 'active' | 'blocked' | null);
        setCheckingPro(false);
      } catch (error) {
        console.error('Erreur vérification rôle pro:', error);
        setIsPro(false);
        setProStatus(null);
        setCheckingPro(false);
      }
    };

    if (!userLoading) {
      checkProRole();
    }
  }, [user, userLoading]);

  return { isPro, proStatus, checkingPro: checkingPro || userLoading };
}
