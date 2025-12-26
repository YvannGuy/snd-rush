-- Migration: Création des tables pour le système de demandes de réservation
-- Date: 2025-01-01

-- Table: reservation_requests
-- Stocke les demandes de réservation initiales depuis les packs publics
CREATE TABLE IF NOT EXISTS reservation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_key text NOT NULL CHECK (pack_key IN ('conference', 'soiree', 'mariage')),
  status text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'PENDING_REVIEW', 'APPROVED', 'ADJUSTED', 'REJECTED')),
  customer_email text NOT NULL,
  customer_phone text,
  customer_name text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: client_reservations
-- Stocke les réservations créées après validation/adjustement admin
CREATE TABLE IF NOT EXISTS client_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES reservation_requests(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email text NOT NULL,
  pack_key text NOT NULL CHECK (pack_key IN ('conference', 'soiree', 'mariage')),
  status text NOT NULL DEFAULT 'AWAITING_PAYMENT' CHECK (status IN ('AWAITING_PAYMENT', 'PAID', 'CONFIRMED', 'CANCELLED')),
  price_total numeric NOT NULL CHECK (price_total >= 0),
  deposit_amount numeric NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  start_at timestamptz,
  end_at timestamptz,
  address text,
  notes text,
  stripe_session_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_reservation_requests_status ON reservation_requests(status);
CREATE INDEX IF NOT EXISTS idx_reservation_requests_customer_email ON reservation_requests(customer_email);
CREATE INDEX IF NOT EXISTS idx_reservation_requests_created_at ON reservation_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_reservations_user_id ON client_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_client_reservations_customer_email ON client_reservations(customer_email);
CREATE INDEX IF NOT EXISTS idx_client_reservations_status ON client_reservations(status);
CREATE INDEX IF NOT EXISTS idx_client_reservations_request_id ON client_reservations(request_id);
CREATE INDEX IF NOT EXISTS idx_client_reservations_stripe_session_id ON client_reservations(stripe_session_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reservation_requests_updated_at
  BEFORE UPDATE ON reservation_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_reservations_updated_at
  BEFORE UPDATE ON client_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies pour reservation_requests
-- Les inserts sont gérés uniquement via API routes (service role)
-- Les utilisateurs ne peuvent pas voir les demandes des autres
ALTER TABLE reservation_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres demandes (via email)
CREATE POLICY "Users can view their own reservation requests"
  ON reservation_requests
  FOR SELECT
  USING (auth.email() = customer_email);

-- RLS Policies pour client_reservations
ALTER TABLE client_reservations ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres réservations (via user_id ou email)
CREATE POLICY "Users can view their own client reservations"
  ON client_reservations
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR auth.email() = customer_email
  );

-- Policy: Les utilisateurs ne peuvent pas modifier leurs réservations (seul le serveur peut)
-- Les modifications sont gérées uniquement via API routes avec service role

-- Note: Les admins peuvent voir toutes les données via les API routes qui utilisent supabaseAdmin (service role)



