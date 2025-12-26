import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * GET /api/reservations/public/[id]
 * Récupère les données publiques d'une réservation (sans authentification requise)
 * Utilisé pour la page de succès après paiement
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id?: string }> | { id?: string } }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
    }

    // Gérer les paramètres (Next.js 15+ peut retourner une Promise)
    const resolvedParams = params instanceof Promise ? await params : params;
    
    // Accepter l'ID soit depuis les paramètres de route, soit depuis les query params
    const reservationId = resolvedParams.id || new URL(req.url).searchParams.get('reservation_id');

    if (!reservationId) {
      return NextResponse.json({ error: 'ID de réservation requis' }, { status: 400 });
    }

    // Récupérer uniquement les données publiques de la réservation
    const { data: reservation, error } = await supabaseAdmin
      .from('client_reservations')
      .select(`
        id,
        pack_key,
        status,
        start_at,
        end_at,
        address,
        customer_email,
        price_total,
        deposit_amount,
        balance_amount,
        created_at
      `)
      .eq('id', reservationId)
      .single();

    if (error) {
      console.error('[PUBLIC_RESERVATION] Erreur récupération:', error);
      return NextResponse.json(
        { error: 'Réservation non trouvée', details: error.message },
        { status: 404 }
      );
    }

    if (!reservation) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    // Retourner uniquement les données publiques (pas de données sensibles)
    return NextResponse.json({
      id: reservation.id,
      pack_key: reservation.pack_key,
      status: reservation.status,
      start_at: reservation.start_at,
      end_at: reservation.end_at,
      address: reservation.address,
      customer_email: reservation.customer_email,
      price_total: reservation.price_total,
      deposit_amount: reservation.deposit_amount,
      balance_amount: reservation.balance_amount,
      created_at: reservation.created_at,
    });

  } catch (error) {
    console.error('[PUBLIC_RESERVATION] Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
