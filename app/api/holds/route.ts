import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * POST /api/holds
 * Crée un hold (blocage temporaire) pour éviter le double-booking (HOLD v1)
 * 
 * Body:
 * {
 *   pack_key: 'conference' | 'soiree' | 'mariage',
 *   start_at: string (ISO),
 *   end_at: string (ISO),
 *   contact_phone?: string,
 *   contact_email?: string,
 *   source?: 'chat' | 'pack_page' | 'admin'
 * }
 * 
 * Retourne:
 * {
 *   hold_id: string,
 *   expires_at: string (ISO)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
    }

    const body = await req.json();
    const {
      pack_key,
      start_at,
      end_at,
      contact_phone,
      contact_email,
      source = 'chat',
    } = body;

    // Validations
    if (!pack_key || !['conference', 'soiree', 'mariage'].includes(pack_key)) {
      return NextResponse.json({ error: 'pack_key invalide' }, { status: 400 });
    }

    if (!start_at || !end_at) {
      return NextResponse.json({ error: 'start_at et end_at sont requis' }, { status: 400 });
    }

    const startAt = new Date(start_at);
    const endAt = new Date(end_at);

    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
      return NextResponse.json({ error: 'Dates invalides' }, { status: 400 });
    }

    if (endAt <= startAt) {
      return NextResponse.json({ error: 'end_at doit être après start_at' }, { status: 400 });
    }

    // HOLD v1 - Vérifier qu'il n'y a pas déjà un conflit
    // 1. Vérifier les holds actifs pour le même pack_key
    const { data: conflictingHolds, error: holdsCheckError } = await supabaseAdmin
      .from('reservation_holds')
      .select('id, start_at, end_at, expires_at')
      .eq('pack_key', pack_key)
      .eq('status', 'ACTIVE')
      .gt('expires_at', new Date().toISOString()) // Non expiré
      .lt('start_at', endAt.toISOString()) // start_at < end_at (demande)
      .gt('end_at', startAt.toISOString()); // end_at > start_at (demande)

    if (holdsCheckError) {
      console.error('[HOLD] Erreur vérification holds:', holdsCheckError);
    }

    // Si un hold actif existe déjà pour ce créneau, refuser
    if (conflictingHolds && conflictingHolds.length > 0) {
      return NextResponse.json(
        { 
          error: 'Créneau temporairement indisponible (en cours de réservation)',
          reason: 'TIME_SLOT_TAKEN',
          conflict: true,
          expires_at: conflictingHolds[0].expires_at,
        },
        { status: 409 } // Conflict
      );
    }

    // 2. Vérifier les réservations existantes dans client_reservations (statuts bloquants)
    const { data: conflictingReservations, error: reservationsCheckError } = await supabaseAdmin
      .from('client_reservations')
      .select('id, start_at, end_at, status')
      .eq('pack_key', pack_key)
      .in('status', ['AWAITING_PAYMENT', 'PAID', 'CONFIRMED'])
      .lt('start_at', endAt.toISOString()) // start_at < end_at (demande)
      .gt('end_at', startAt.toISOString()); // end_at > start_at (demande)

    if (reservationsCheckError) {
      console.error('[HOLD] Erreur vérification client_reservations:', reservationsCheckError);
    }

    // Si une réservation existe déjà pour ce créneau, refuser
    if (conflictingReservations && conflictingReservations.length > 0) {
      return NextResponse.json(
        { 
          error: 'Ce créneau est déjà réservé',
          reason: 'TIME_SLOT_TAKEN',
          conflict: true,
        },
        { status: 409 } // Conflict
      );
    }

    // 3. Vérifier l'ancienne table reservations si applicable (pour compatibilité)
    // Note: L'ancienne table utilise pack_id (numérique) mais on peut vérifier si nécessaire
    // Pour l'instant, on se concentre sur client_reservations qui utilise pack_key

    // Créer le hold avec expiration dans 10 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const { data: hold, error: createError } = await supabaseAdmin
      .from('reservation_holds')
      .insert({
        pack_key: pack_key,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'ACTIVE',
        contact_phone: contact_phone || null,
        contact_email: contact_email || null,
        source: source,
      })
      .select()
      .single();

    if (createError || !hold) {
      console.error('[HOLD] Erreur création hold:', createError);
      return NextResponse.json(
        { error: 'Erreur lors de la création du hold', details: createError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hold_id: hold.id,
      expires_at: hold.expires_at,
    });
  } catch (error) {
    console.error('[HOLD] Erreur API holds:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/holds/:id/consume
 * Consomme un hold en le liant à une réservation (HOLD v1)
 * 
 * Body:
 * {
 *   reservation_id: string (UUID)
 * }
 */
export async function PATCH(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
    }

    const url = new URL(req.url);
    const holdId = url.searchParams.get('id');

    if (!holdId) {
      return NextResponse.json({ error: 'hold_id requis' }, { status: 400 });
    }

    const body = await req.json();
    const { reservation_id } = body;

    if (!reservation_id) {
      return NextResponse.json({ error: 'reservation_id requis' }, { status: 400 });
    }

    // Mettre à jour le hold pour le marquer comme consommé
    const { data: hold, error: updateError } = await supabaseAdmin
      .from('reservation_holds')
      .update({
        status: 'CONSUMED',
        reservation_id: reservation_id,
      })
      .eq('id', holdId)
      .eq('status', 'ACTIVE') // Seulement si encore actif
      .select()
      .single();

    if (updateError || !hold) {
      console.error('[HOLD] Erreur consommation hold:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la consommation du hold', details: updateError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      hold_id: hold.id,
      reservation_id: hold.reservation_id,
    });
  } catch (error) {
    console.error('[HOLD] Erreur API consume hold:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}





