-- Migration: Index pour optimiser les requêtes admin dashboard
-- Date: 2025-01-05
-- Objectif: Améliorer les performances des recherches et filtres dans le dashboard admin

-- Index pour recherche texte sur client_reservations (si extension pg_trgm existe)
-- Note: Si l'extension n'existe pas, créer d'abord: CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_client_reservations_customer_email_trgm 
--   ON client_reservations USING gin (customer_email gin_trgm_ops);

-- CREATE INDEX IF NOT EXISTS idx_client_reservations_address_trgm 
--   ON client_reservations USING gin (address gin_trgm_ops);

-- Index pour filtres date (déjà créés normalement, mais on vérifie)
CREATE INDEX IF NOT EXISTS idx_client_reservations_start_at 
  ON client_reservations(start_at);

CREATE INDEX IF NOT EXISTS idx_client_reservations_end_at 
  ON client_reservations(end_at);

CREATE INDEX IF NOT EXISTS idx_client_reservations_created_at 
  ON client_reservations(created_at DESC);

-- Index pour automatisation (balance_due_at)
CREATE INDEX IF NOT EXISTS idx_client_reservations_balance_due 
  ON client_reservations(balance_due_at) 
  WHERE balance_due_at IS NOT NULL AND balance_paid_at IS NULL;

-- Index pour automatisation (deposit_requested_at)
CREATE INDEX IF NOT EXISTS idx_client_reservations_deposit_requested 
  ON client_reservations(deposit_requested_at) 
  WHERE deposit_requested_at IS NOT NULL AND deposit_session_id IS NULL;

-- Index pour contrats non signés
CREATE INDEX IF NOT EXISTS idx_client_reservations_contracts_unsigned 
  ON client_reservations(status, client_signature) 
  WHERE status IN ('CONFIRMED', 'AWAITING_BALANCE') 
    AND (client_signature IS NULL OR client_signature = '');

-- Index pour orders lookup
CREATE INDEX IF NOT EXISTS idx_orders_client_reservation_id 
  ON orders(client_reservation_id) 
  WHERE client_reservation_id IS NOT NULL;

-- Note: reservation_id n'existe pas dans orders (legacy via metadata uniquement)
-- Pas d'index nécessaire pour metadata fallback

CREATE INDEX IF NOT EXISTS idx_orders_created_at 
  ON orders(created_at DESC);

-- Index pour reservation_requests status
CREATE INDEX IF NOT EXISTS idx_reservation_requests_status_new 
  ON reservation_requests(status) 
  WHERE status IN ('NEW', 'PENDING_REVIEW');

-- Index pour etat_lieux status
CREATE INDEX IF NOT EXISTS idx_etat_lieux_status_review 
  ON etat_lieux(status) 
  WHERE status IN ('livraison_complete', 'reprise_complete');

-- Index pour reservations legacy (delivery_status)
CREATE INDEX IF NOT EXISTS idx_reservations_delivery_status 
  ON reservations(delivery_status) 
  WHERE delivery_status IS NOT NULL;

-- Commentaires
COMMENT ON INDEX idx_client_reservations_balance_due IS 'Index pour requête automatisation solde à payer (J-5)';
COMMENT ON INDEX idx_client_reservations_deposit_requested IS 'Index pour requête automatisation caution à demander (J-2)';
COMMENT ON INDEX idx_client_reservations_contracts_unsigned IS 'Index pour requête contrats non signés';
