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
          .select('role, pro_status, pro_type, pro_usage')
          .eq('user_id', user.id)
          .maybeSingle(); // Utiliser maybeSingle() au lieu de single() pour éviter les erreurs 400

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (normal)
          console.error('Erreur vérification rôle pro:', error);
        }

        const role = profile?.role?.toLowerCase();
        const status = profile?.pro_status?.toLowerCase();
        
        // Vérifier si l'utilisateur a réellement rempli le formulaire de demande
        // Une demande n'est considérée comme "pending" que si pro_type et pro_usage sont remplis
        const hasFilledForm = profile?.pro_type && profile?.pro_usage;
        
        // isPro = role === 'pro' && pro_status === 'active'
        const isProRole = role === 'pro' && status === 'active';
        
        setIsPro(isProRole);
        
        // Ne considérer le statut comme "pending" que si le formulaire a été rempli
        // Sinon, considérer comme null (pas de demande)
        if (status === 'pending' && !hasFilledForm) {
          setProStatus(null);
        } else {
          setProStatus(status as 'pending' | 'active' | 'blocked' | null);
        }
        
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
