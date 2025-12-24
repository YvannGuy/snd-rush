-- Migration: Ajout des champs pour le paiement en 3 temps (Phase suivante)
-- Date: 2025-01-04
-- Objectif: Gérer acompte, solde J-5, caution J-2 avec dates et statuts

-- Ajouter le nouveau statut AWAITING_BALANCE pour les réservations en attente de solde
ALTER TABLE client_reservations
  DROP CONSTRAINT IF EXISTS client_reservations_status_check;

ALTER TABLE client_reservations
  ADD CONSTRAINT client_reservations_status_check 
  CHECK (status IN ('AWAITING_PAYMENT', 'AWAITING_BALANCE', 'PAID', 'CONFIRMED', 'CANCELLED'));

-- Ajouter balance_due_at (date à laquelle le solde doit être payé, calculée J-5 avant l'événement)
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS balance_due_at timestamptz;

-- Ajouter deposit_paid_at (date de paiement de l'acompte)
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS deposit_paid_at timestamptz;

-- Ajouter balance_paid_at (date de paiement du solde)
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS balance_paid_at timestamptz;

-- Ajouter deposit_requested_at (date à laquelle la caution doit être demandée, calculée J-2 avant l'événement)
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS deposit_requested_at timestamptz;

-- Ajouter balance_amount (montant du solde restant à payer)
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS balance_amount numeric DEFAULT 0 CHECK (balance_amount >= 0);

-- Ajouter deposit_session_id (ID de session Stripe pour la caution)
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS deposit_session_id text;

-- Ajouter balance_session_id (ID de session Stripe pour le solde)
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS balance_session_id text;

-- Ajouter balance_reminder_count (nombre de relances pour le solde, max 2)
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS balance_reminder_count integer DEFAULT 0 CHECK (balance_reminder_count >= 0 AND balance_reminder_count <= 2);

-- Ajouter deposit_reminder_sent (booléen pour savoir si le rappel caution a été envoyé)
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS deposit_reminder_sent boolean DEFAULT false;

-- Ajouter event_reminder_j1_sent (booléen pour savoir si le rappel J-1 a été envoyé)
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS event_reminder_j1_sent boolean DEFAULT false;

-- Ajouter event_reminder_h3_sent (booléen pour savoir si le rappel H-3 a été envoyé)
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS event_reminder_h3_sent boolean DEFAULT false;

-- Index pour les requêtes d'automatisation
CREATE INDEX IF NOT EXISTS idx_client_reservations_balance_due_at ON client_reservations(balance_due_at) WHERE balance_due_at IS NOT NULL AND balance_paid_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_client_reservations_deposit_requested_at ON client_reservations(deposit_requested_at) WHERE deposit_requested_at IS NOT NULL AND deposit_paid_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_client_reservations_start_at ON client_reservations(start_at) WHERE start_at IS NOT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN client_reservations.balance_due_at IS 'Date à laquelle le solde doit être payé (J-5 avant l\'événement)';
COMMENT ON COLUMN client_reservations.deposit_paid_at IS 'Date de paiement de l\'acompte (30%)';
COMMENT ON COLUMN client_reservations.balance_paid_at IS 'Date de paiement du solde restant';
COMMENT ON COLUMN client_reservations.deposit_requested_at IS 'Date à laquelle la caution doit être demandée (J-2 avant l\'événement)';
COMMENT ON COLUMN client_reservations.balance_amount IS 'Montant du solde restant à payer (price_total - acompte)';
COMMENT ON COLUMN client_reservations.deposit_session_id IS 'ID de session Stripe pour le paiement de la caution';
COMMENT ON COLUMN client_reservations.balance_session_id IS 'ID de session Stripe pour le paiement du solde';
COMMENT ON COLUMN client_reservations.balance_reminder_count IS 'Nombre de relances envoyées pour le solde (max 2)';
COMMENT ON COLUMN client_reservations.deposit_reminder_sent IS 'Indique si le rappel caution a été envoyé';
COMMENT ON COLUMN client_reservations.event_reminder_j1_sent IS 'Indique si le rappel événement J-1 a été envoyé';
COMMENT ON COLUMN client_reservations.event_reminder_h3_sent IS 'Indique si le rappel événement H-3 a été envoyé';
