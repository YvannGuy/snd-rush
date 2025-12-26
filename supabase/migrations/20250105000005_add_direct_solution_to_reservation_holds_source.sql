-- Migration: Ajout de 'direct_solution' aux valeurs autorisées pour source dans reservation_holds
-- Date: 2025-01-05
-- Objectif: Permettre l'utilisation du nouveau flow "solution clé en main" avec source='direct_solution'

-- Supprimer l'ancienne contrainte CHECK
ALTER TABLE reservation_holds 
  DROP CONSTRAINT IF EXISTS reservation_holds_source_check;

-- Recréer la contrainte avec la nouvelle valeur 'direct_solution'
ALTER TABLE reservation_holds 
  ADD CONSTRAINT reservation_holds_source_check 
  CHECK (source IN ('chat', 'pack_page', 'admin', 'direct_solution'));
