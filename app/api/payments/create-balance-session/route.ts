import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/token';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * API pour créer une session Stripe pour le paiement du solde (70%).
 * Requiert soit un token Bearer (client connecté + ownership vérifié)
 * soit un token one-time valide (lien par email).
 */
export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Configuration Stripe manquante' }, { status: 500 });
    }

    const body = await req.json();
    const { reservation_id, token, customer_email } = body;

    if (!reservation_id) {
      return NextResponse.json({ error: 'reservation_id requis' }, { status: 400 });
    }

    // ── Vérification d'identité obligatoire ──────────────────────────────────
    const authHeader = req.headers.get('authorization');
    const hasBearer = authHeader?.startsWith('Bearer ');
    const hasToken = typeof token === 'string' && token.length > 0;

    if (!hasBearer && !hasToken) {
      return NextResponse.json({ error: 'Authentification requise (Bearer token ou lien sécurisé)' }, { status: 401 });
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Récupérer la réservation
    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from('client_reservations')
      .select('*')
      .eq('id', reservation_id)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    // Vérifier l'ownership selon le mode d'auth
    if (hasBearer) {
      // Mode connecté : vérifier que la réservation appartient à cet utilisateur
      const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader! } },
      });
      const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
      }
      const isOwner = reservation.user_id === user.id || reservation.customer_email === user.email;
      if (!isOwner) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
    } else {
      // Mode token one-time (lien email) : le token doit être valide
      if (!reservation.public_token_hash || !verifyToken(token, reservation.public_token_hash)) {
        return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 401 });
      }
    }

    if (!reservation.deposit_paid_at) {
      return NextResponse.json({ error: 'L\'acompte doit être payé avant de payer le solde' }, { status: 400 });
    }
    if (reservation.balance_paid_at) {
      return NextResponse.json({ error: 'Le solde a déjà été payé' }, { status: 400 });
    }

    const balanceAmount = reservation.balance_amount
      ? Math.round(parseFloat(reservation.balance_amount.toString()) * 100)
      : Math.round(parseFloat(reservation.price_total.toString()) * 0.7 * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Solde restant - Votre événement',
              description: `Solde de 70% pour votre événement (${balanceAmount / 100}€). Le solde est demandé 1 jour avant votre événement.`,
            },
            unit_amount: balanceAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?payment=success&reservation_id=${reservation.id}&type=balance`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?payment=cancelled`,
      customer_email: customer_email || reservation.customer_email || undefined,
      metadata: {
        type: 'client_reservation_balance',
        reservation_id: reservation.id,
        pack_key: reservation.pack_key,
        price_total: reservation.price_total.toString(),
        balance_amount: (balanceAmount / 100).toString(),
      },
    });

    await supabaseAdmin
      .from('client_reservations')
      .update({ balance_session_id: session.id })
      .eq('id', reservation.id);

    return NextResponse.json({ success: true, sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Erreur création session solde Stripe:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}
