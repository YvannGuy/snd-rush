-- Migration: Ajout des statuts CANCEL_REQUESTED et CHANGE_REQUESTED
-- Date: 2025-12-15
-- Description: 
--   - Supprime l'ancienne contrainte de statut sur la table reservations
--   - Crée une nouvelle contrainte incluant les nouveaux statuts pour les demandes d'annulation et de modification

-- Supprimer l'ancienne contrainte si elle existe
ALTER TABLE public.reservations 
DROP CONSTRAINT IF EXISTS reservations_status_check;

-- Ajouter la nouvelle contrainte avec tous les statuts autorisés
ALTER TABLE public.reservations 
ADD CONSTRAINT reservations_status_check 
CHECK (status IN (
  'PENDING',
  'CONFIRMED',
  'CONTRACT_PENDING',
  'CONTRACT_SIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCEL_REQUESTED',
  'CHANGE_REQUESTED',
  'CANCELLED',
  'CANCELED'  -- Variante pour compatibilité
));
