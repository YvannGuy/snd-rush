-- Migration pour ajouter les champs de signature client aux réservations
-- À exécuter dans Supabase SQL Editor

ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS client_signature TEXT,
ADD COLUMN IF NOT EXISTS client_signed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.reservations.client_signature IS 'Signature du client (base64 ou URL)';
COMMENT ON COLUMN public.reservations.client_signed_at IS 'Date et heure de signature du contrat par le client';

