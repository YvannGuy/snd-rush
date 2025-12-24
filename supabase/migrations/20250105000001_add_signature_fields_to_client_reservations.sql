-- Migration: Ajout des champs de signature dans client_reservations
-- Date: 2025-01-05
-- Objectif: Permettre la signature de contrats pour les client_reservations

-- Ajouter les colonnes de signature (nullable pour compatibilité)
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS client_signature text;

ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS client_signed_at timestamptz;

-- Créer un index sur client_signed_at pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_client_reservations_client_signed_at 
ON client_reservations(client_signed_at);

-- Commentaires pour documentation
COMMENT ON COLUMN client_reservations.client_signature IS 'Signature du client (nom complet) pour le contrat de location';
COMMENT ON COLUMN client_reservations.client_signed_at IS 'Date et heure de signature du contrat par le client';
