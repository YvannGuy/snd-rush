'use client';

import { useEffect, useState } from 'react';
import { useUser } from './useUser';
import { supabase } from '@/lib/supabase';

export function useAdmin() {
  const { user, loading: userLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user?.id || !supabase) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      // OPTIMISATION: Vérifier d'abord user_metadata et email (instantané)
      // Cela évite les requêtes DB inutiles qui peuvent échouer
      const isAdminFromMetadata = user.user_metadata?.role?.toLowerCase() === 'admin' ||
                                   user.email?.toLowerCase() === 'yvann.guyonnet@gmail.com';
      
      if (isAdminFromMetadata) {
        setIsAdmin(true);
        setCheckingAdmin(false);
        return; // Pas besoin de requête DB si déjà admin via metadata
      }

      // Seulement si pas admin via metadata, vérifier dans user_profiles
      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle(); // Utiliser maybeSingle() au lieu de single() pour éviter les erreurs 400

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (normal)
          console.error('Erreur vérification rôle admin:', error);
        }

        const isAdminRole = profile?.role?.toLowerCase() === 'admin' || 
                           isAdminFromMetadata ||
                           user.email?.toLowerCase() === 'yvann.guyonnet@gmail.com';
        
        setIsAdmin(isAdminRole);
        setCheckingAdmin(false);
      } catch (error) {
        console.error('Erreur vérification rôle admin:', error);
        // En cas d'erreur, utiliser les métadonnées
        setIsAdmin(isAdminFromMetadata);
        setCheckingAdmin(false);
      }
    };

    if (!userLoading) {
      checkAdminRole();
    }
  }, [user, userLoading]);

  return { isAdmin, checkingAdmin: checkingAdmin || userLoading };
}
