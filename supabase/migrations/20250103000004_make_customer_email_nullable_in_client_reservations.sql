-- Migration: Rendre customer_email nullable dans client_reservations (V1.3 - Instant Booking)
-- Date: 2025-01-03
-- Objectif: Permettre la création de réservations instantanées sans email (Stripe demandera l'email dans le checkout)

-- Rendre customer_email nullable
ALTER TABLE client_reservations
  ALTER COLUMN customer_email DROP NOT NULL;

-- Commentaire pour documentation
COMMENT ON COLUMN client_reservations.customer_email IS 'Email du client (peut être NULL pour instant booking, sera rempli après paiement Stripe)';
