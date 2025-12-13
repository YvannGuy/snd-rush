-- Migration pour corriger les politiques RLS de etat_lieux
-- Date: 2025-12-13
-- Description: Mise à jour des politiques RLS pour utiliser user_profiles.role au lieu de user_capsules

-- Supprimer l'ancienne politique basée sur user_capsules
DROP POLICY IF EXISTS "Admins can manage etat_lieux" ON public.etat_lieux;

-- Créer une nouvelle politique basée sur user_profiles.role
CREATE POLICY "Admins can manage etat_lieux"
  ON public.etat_lieux
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- La politique pour les utilisateurs reste inchangée
-- (elle utilise déjà reservations.user_id qui est correct)
