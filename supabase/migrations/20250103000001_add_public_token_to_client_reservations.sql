-- Migration: Ajout des colonnes pour le token public de checkout (V1.4)
-- Date: 2025-01-03
-- Objectif: Permettre un checkout public sécurisé sans compte via lien email

-- Ajouter les colonnes pour le token public
ALTER TABLE client_reservations
  ADD COLUMN IF NOT EXISTS public_token_hash text,
  ADD COLUMN IF NOT EXISTS public_token_expires_at timestamptz;

-- Index pour améliorer les performances des requêtes de validation
CREATE INDEX IF NOT EXISTS idx_client_reservations_token_hash 
  ON client_reservations(public_token_hash) 
  WHERE public_token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_client_reservations_token_expires 
  ON client_reservations(public_token_expires_at) 
  WHERE public_token_expires_at IS NOT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN client_reservations.public_token_hash IS 'Hash SHA256 du token public pour accès sécurisé au checkout sans compte';
COMMENT ON COLUMN client_reservations.public_token_expires_at IS 'Date d''expiration du token public (généralement 7 jours après création)';
