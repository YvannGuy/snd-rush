import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getBasePack, generateCustomerSummary } from '@/lib/packs/basePacks';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * POST /api/instant-reservations
 * Crée directement une réservation client avec status AWAITING_PAYMENT (instant booking V1.3)
 * 
 * Body:
 * {
 *   pack_key: 'conference' | 'soiree' | 'mariage',
 *   start_at: string (ISO),
 *   end_at: string (ISO),
 *   address?: string,
 *   customer_email?: string,
 *   customer_phone: string (obligatoire),
 *   customer_name?: string,
 *   payload: object (données additionnelles)
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
      address,
      customer_email,
      customer_phone,
      customer_name,
      payload = {},
      hold_id, // HOLD v1 - ID du hold à consommer après création
    } = body;

    // Validations
    if (!pack_key || !['conference', 'soiree', 'mariage'].includes(pack_key)) {
      return NextResponse.json({ error: 'pack_key invalide' }, { status: 400 });
    }

    if (!start_at || !end_at) {
      return NextResponse.json({ error: 'start_at et end_at sont requis' }, { status: 400 });
    }

    if (!customer_phone || customer_phone.trim() === '') {
      return NextResponse.json({ error: 'customer_phone est obligatoire' }, { status: 400 });
    }

    // Récupérer le pack de base
    const basePack = getBasePack(pack_key);
    if (!basePack) {
      return NextResponse.json({ error: 'Pack non trouvé' }, { status: 404 });
    }

    // Préparer les données de la réservation
    const finalItems = basePack.defaultItems; // Pas d'extras pour instant booking V1.3
    const basePackPrice = basePack.basePrice;
    const extrasTotal = 0; // Pas d'extras pour instant booking V1.3
    const priceTotal = basePackPrice;
    const depositAmount = Math.round(priceTotal * 0.3); // 30% de caution

    // Générer le résumé client
    const customerSummary = generateCustomerSummary(
      pack_key,
      finalItems,
      payload.peopleCount
    );

    // Créer la réservation
    // Préparer les données d'insertion
    const insertData: any = {
      // Pas de request_id (réservation instantanée)
      user_id: null, // Sera rempli après connexion/inscription si nécessaire
      pack_key: pack_key,
      status: 'AWAITING_PAYMENT',
      price_total: priceTotal,
      deposit_amount: depositAmount,
      base_pack_price: basePackPrice,
      extras_total: extrasTotal,
      start_at: new Date(start_at).toISOString(),
      end_at: new Date(end_at).toISOString(),
      address: address || null,
      notes: JSON.stringify({
        ...payload,
        customer_phone,
        customer_name: customer_name || null,
        instant_booking: true, // Flag pour identifier les réservations instantanées
      }),
      final_items: finalItems,
      customer_summary: customerSummary,
    };
    
    // Ne pas inclure customer_email si vide/null (la colonne est nullable)
    if (customer_email && customer_email.trim() !== '') {
      insertData.customer_email = customer_email.trim();
    }
    // Si customer_email est vide/null, on ne l'inclut pas du tout (Supabase utilisera NULL par défaut)
    
    console.log('[INSTANT] Insertion réservation avec customer_email:', insertData.customer_email || 'NULL (non inclus)');
    
    const { data: reservation, error: createError } = await supabaseAdmin
      .from('client_reservations')
      .insert(insertData)
      .select()
      .single();

    if (createError || !reservation) {
      console.error('[INSTANT] Erreur création réservation:', createError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la réservation', details: createError?.message },
        { status: 500 }
      );
    }

    // HOLD v1 - Consommer le hold si fourni
    if (hold_id) {
      try {
        const { error: consumeError } = await supabaseAdmin
          .from('reservation_holds')
          .update({
            status: 'CONSUMED',
            reservation_id: reservation.id,
          })
          .eq('id', hold_id)
          .eq('status', 'ACTIVE'); // Seulement si encore actif

        if (consumeError) {
          // Ne pas bloquer si la consommation échoue, juste logger
          console.warn('[INSTANT] Erreur consommation hold (non bloquant):', consumeError);
        }
      } catch (consumeError) {
        // Ne pas bloquer si erreur, juste logger
        console.warn('[INSTANT] Erreur consommation hold (non bloquant):', consumeError);
      }
    }

    return NextResponse.json({
      reservation_id: reservation.id,
      status: reservation.status,
      price_total: reservation.price_total,
      deposit_amount: reservation.deposit_amount,
    });
  } catch (error) {
    console.error('[INSTANT] Erreur API instant-reservations:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}




