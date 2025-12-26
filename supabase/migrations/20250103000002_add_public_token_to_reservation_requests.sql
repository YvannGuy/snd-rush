-- Migration: Ajout des colonnes pour le token public de suivi (V1.5)
-- Date: 2025-01-03
-- Objectif: Permettre un suivi public sécurisé des demandes de réservation sans compte

-- Ajouter les colonnes pour le token public
ALTER TABLE reservation_requests
  ADD COLUMN IF NOT EXISTS public_token_hash text,
  ADD COLUMN IF NOT EXISTS public_token_expires_at timestamptz;

-- Index pour améliorer les performances des requêtes de validation
CREATE INDEX IF NOT EXISTS idx_reservation_requests_token_hash 
  ON reservation_requests(public_token_hash) 
  WHERE public_token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reservation_requests_token_expires 
  ON reservation_requests(public_token_expires_at) 
  WHERE public_token_expires_at IS NOT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN reservation_requests.public_token_hash IS 'Hash SHA256 du token public pour accès sécurisé au suivi sans compte';
COMMENT ON COLUMN reservation_requests.public_token_expires_at IS 'Date d''expiration du token public (généralement 7 jours après création)';


