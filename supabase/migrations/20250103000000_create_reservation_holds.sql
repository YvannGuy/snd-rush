-- Migration: Création de la table reservation_holds pour le système de blocage temporaire (HOLD v1)
-- Date: 2025-01-03
-- Objectif: Éviter le double-booking lors de l'instant booking avec un blocage temporaire de 10 minutes

-- Table: reservation_holds
-- Stocke les blocages temporaires de créneaux lors de l'instant booking
CREATE TABLE IF NOT EXISTS reservation_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL, -- Date d'expiration (now() + 10 minutes)
  start_at timestamptz NOT NULL, -- Date/heure de début du créneau bloqué
  end_at timestamptz NOT NULL, -- Date/heure de fin du créneau bloqué
  pack_key text NOT NULL CHECK (pack_key IN ('conference', 'soiree', 'mariage')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CONSUMED', 'CANCELLED', 'EXPIRED')),
  reservation_id uuid REFERENCES client_reservations(id) ON DELETE SET NULL, -- Lien vers la réservation si consommé
  contact_phone text,
  contact_email text,
  source text NOT NULL DEFAULT 'chat' CHECK (source IN ('chat', 'pack_page', 'admin')),
  updated_at timestamptz DEFAULT now()
);

-- Index pour améliorer les performances des requêtes de disponibilité
-- Index sur status et expires_at pour filtrer rapidement les holds actifs et non expirés
CREATE INDEX IF NOT EXISTS idx_reservation_holds_status_expires 
  ON reservation_holds(status, expires_at) 
  WHERE status = 'ACTIVE';

-- Index sur start_at et end_at pour les vérifications de chevauchement
CREATE INDEX IF NOT EXISTS idx_reservation_holds_dates 
  ON reservation_holds(start_at, end_at);

-- Index sur pack_key pour filtrer par pack
CREATE INDEX IF NOT EXISTS idx_reservation_holds_pack_key 
  ON reservation_holds(pack_key);

-- Index sur reservation_id pour les requêtes de liaison
CREATE INDEX IF NOT EXISTS idx_reservation_holds_reservation_id 
  ON reservation_holds(reservation_id) 
  WHERE reservation_id IS NOT NULL;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_reservation_holds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER trigger_reservation_holds_updated_at
  BEFORE UPDATE ON reservation_holds
  FOR EACH ROW
  EXECUTE FUNCTION update_reservation_holds_updated_at();

-- Commentaires pour documentation
COMMENT ON TABLE reservation_holds IS 'Blocages temporaires de créneaux pour éviter le double-booking lors de l''instant booking';
COMMENT ON COLUMN reservation_holds.expires_at IS 'Date d''expiration du hold (généralement 10 minutes après création)';
COMMENT ON COLUMN reservation_holds.status IS 'ACTIVE: hold actif, CONSUMED: lié à une réservation, CANCELLED: annulé, EXPIRED: expiré';
COMMENT ON COLUMN reservation_holds.reservation_id IS 'ID de la réservation si le hold a été consommé';
