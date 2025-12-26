-- Migration: Fonction atomique pour créer hold et réservation sans race condition
-- Date: 2025-01-06
-- Objectif: Éviter le double-booking avec pg_advisory_xact_lock et création atomique

-- Fonction PostgreSQL atomique pour créer un hold et une réservation de manière thread-safe
-- Utilise pg_advisory_xact_lock pour sérialiser les vérifications de chevauchement par pack/jour
CREATE OR REPLACE FUNCTION create_hold_for_checkout(
  p_pack_key text,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_customer_email text,
  p_price_total numeric,
  p_deposit_amount numeric,
  p_balance_amount numeric DEFAULT 0,
  p_address text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_final_items jsonb DEFAULT NULL,
  p_source text DEFAULT 'direct_solution',
  p_chat_context jsonb DEFAULT NULL,
  p_contact_phone text DEFAULT NULL,
  p_contact_email text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_reservation_id uuid;
  v_hold_id uuid;
  v_lock_key bigint;
  v_expires_at timestamptz;
  v_overlap_hold boolean := false;
  v_overlap_reservation boolean := false;
BEGIN
  -- Validation des paramètres
  IF p_pack_key NOT IN ('conference', 'soiree', 'mariage') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'INVALID_PACK_KEY');
  END IF;

  IF p_end_at <= p_start_at THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'INVALID_DATES');
  END IF;

  IF p_price_total < 0 OR p_deposit_amount < 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'INVALID_PRICE');
  END IF;

  -- Générer une clé de lock unique basée sur pack_key + jour(start_at)
  -- Cela permet de sérialiser les vérifications pour le même pack le même jour
  -- sans bloquer les autres packs ou jours
  v_lock_key := hashtext(p_pack_key || date_trunc('day', p_start_at)::text);

  -- Acquérir le lock transactionnel (libéré automatiquement à la fin de la transaction)
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Vérifier les chevauchements avec les holds actifs
  SELECT EXISTS(
    SELECT 1 FROM reservation_holds
    WHERE pack_key = p_pack_key
      AND status = 'ACTIVE'
      AND expires_at > now()
      AND start_at < p_end_at
      AND end_at > p_start_at
  ) INTO v_overlap_hold;

  IF v_overlap_hold THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'SLOT_HELD');
  END IF;

  -- Vérifier les chevauchements avec les réservations bloquantes
  -- IMPORTANT: AWAITING_PAYMENT ne bloque PAS la disponibilité
  SELECT EXISTS(
    SELECT 1 FROM client_reservations
    WHERE pack_key = p_pack_key
      AND status IN ('AWAITING_BALANCE', 'PAID', 'CONFIRMED')
      AND start_at IS NOT NULL
      AND end_at IS NOT NULL
      AND start_at < p_end_at
      AND end_at > p_start_at
  ) INTO v_overlap_reservation;

  IF v_overlap_reservation THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'SLOT_BOOKED');
  END IF;

  -- Calculer l'expiration du hold (10 minutes)
  v_expires_at := now() + interval '10 minutes';

  -- Créer la réservation avec status AWAITING_PAYMENT (ne bloque pas la disponibilité)
  INSERT INTO client_reservations (
    pack_key,
    status,
    start_at,
    end_at,
    customer_email,
    price_total,
    deposit_amount,
    balance_amount,
    address,
    notes,
    final_items,
    source,
    chat_context
  ) VALUES (
    p_pack_key,
    'AWAITING_PAYMENT',
    p_start_at,
    p_end_at,
    p_customer_email,
    p_price_total,
    p_deposit_amount,
    p_balance_amount,
    p_address,
    p_notes,
    p_final_items,
    p_source,
    p_chat_context
  )
  RETURNING id INTO v_reservation_id;

  -- Créer le hold lié à la réservation
  INSERT INTO reservation_holds (
    pack_key,
    start_at,
    end_at,
    expires_at,
    status,
    reservation_id,
    contact_phone,
    contact_email,
    source
  ) VALUES (
    p_pack_key,
    p_start_at,
    p_end_at,
    v_expires_at,
    'ACTIVE',
    v_reservation_id,
    p_contact_phone,
    p_contact_email,
    p_source
  )
  RETURNING id INTO v_hold_id;

  -- Retourner le succès avec les IDs
  RETURN jsonb_build_object(
    'ok', true,
    'hold_id', v_hold_id,
    'reservation_id', v_reservation_id,
    'expires_at', v_expires_at
  );

EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, retourner l'erreur
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'DATABASE_ERROR',
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Commentaire pour documentation
COMMENT ON FUNCTION create_hold_for_checkout IS 'Fonction atomique pour créer un hold et une réservation sans race condition. Utilise pg_advisory_xact_lock pour sérialiser les vérifications de chevauchement.';

-- Index pour améliorer les performances des vérifications de chevauchement
CREATE INDEX IF NOT EXISTS idx_reservation_holds_overlap_check 
  ON reservation_holds(pack_key, start_at, end_at) 
  WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_reservation_holds_expires_check 
  ON reservation_holds(expires_at) 
  WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_client_reservations_overlap_check 
  ON client_reservations(pack_key, start_at, end_at) 
  WHERE status IN ('AWAITING_BALANCE', 'PAID', 'CONFIRMED') 
    AND start_at IS NOT NULL 
    AND end_at IS NOT NULL;
