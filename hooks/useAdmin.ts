'use client';

import { useEffect, useState } from 'react';
import { isAdminMetadataOrFallbackEmail } from '@/lib/admin-identity';
import { supabase } from '@/lib/supabase';
import { useUser } from './useUser';

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

      // OPTIMISATION: metadata / email fallback (aligné avec verifyAdmin côté API)
      const isAdminFromMetadata = isAdminMetadataOrFallbackEmail(user);

      if (isAdminFromMetadata) {
        setIsAdmin(true);
        setCheckingAdmin(false);
        return;
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

        const isAdminRole =
          profile?.role?.toLowerCase() === 'admin' || isAdminMetadataOrFallbackEmail(user);
        
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
