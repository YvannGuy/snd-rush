-- Migration: Ajout de final_validated_at dans client_reservations
-- Date: 2025-01-05
-- Objectif: Permettre de tracker quand l'admin a validé la version finale des items et prix

-- Ajouter la colonne final_validated_at (nullable pour compatibilité)
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS final_validated_at timestamptz;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_client_reservations_final_validated_at 
ON client_reservations(final_validated_at);

-- Commentaires pour documentation
COMMENT ON COLUMN client_reservations.final_validated_at IS 'Date et heure de validation finale par l''admin (items et prix définitifs)';
