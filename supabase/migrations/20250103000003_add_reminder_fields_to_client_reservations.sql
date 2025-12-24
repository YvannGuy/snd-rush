-- Migration: Ajout des colonnes pour les relances paiement et rappels événement (Phase C)
-- Date: 2025-01-03
-- Objectif: Automatiser les relances paiement et rappels événement

-- Colonnes pour relances paiement (C1)
ALTER TABLE client_reservations
  ADD COLUMN IF NOT EXISTS reminder_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reminder_at timestamptz;

-- Colonnes pour rappels événement (C2)
ALTER TABLE client_reservations
  ADD COLUMN IF NOT EXISTS reminder_j1_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_h3_sent_at timestamptz;

-- Index pour améliorer les performances des requêtes de relance
CREATE INDEX IF NOT EXISTS idx_client_reservations_reminder_payment 
  ON client_reservations(status, reminder_count, created_at, last_reminder_at) 
  WHERE status = 'AWAITING_PAYMENT' AND reminder_count < 2;

CREATE INDEX IF NOT EXISTS idx_client_reservations_reminder_event 
  ON client_reservations(status, start_at, reminder_j1_sent_at, reminder_h3_sent_at) 
  WHERE status IN ('PAID', 'CONFIRMED') AND start_at IS NOT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN client_reservations.reminder_count IS 'Nombre de relances paiement envoyées (max 2)';
COMMENT ON COLUMN client_reservations.last_reminder_at IS 'Date de la dernière relance paiement envoyée';
COMMENT ON COLUMN client_reservations.reminder_j1_sent_at IS 'Date d''envoi du rappel J-1 (24h avant événement)';
COMMENT ON COLUMN client_reservations.reminder_h3_sent_at IS 'Date d''envoi du rappel H-3 (3h avant événement)';
