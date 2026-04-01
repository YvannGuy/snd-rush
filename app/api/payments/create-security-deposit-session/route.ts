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
 * API pour créer une session Stripe pour la caution.
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
    const { reservation_id, token } = body;

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
      if (!reservation.public_token_hash || !verifyToken(token, reservation.public_token_hash)) {
        return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 401 });
      }
    }

    if (!reservation.deposit_amount || parseFloat(reservation.deposit_amount.toString()) === 0) {
      return NextResponse.json({ error: 'Aucune caution à payer pour cette réservation' }, { status: 400 });
    }

    const depositAmountInCents = Math.round(parseFloat(reservation.deposit_amount.toString()) * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Caution - Sécurité matériel',
              description: `Caution de ${depositAmountInCents / 100}€ pour votre événement. Cette caution sera bloquée sur votre carte mais non débitée sauf en cas d'incident. Elle sera libérée après retour du matériel en bon état.`,
            },
            unit_amount: depositAmountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?payment=success&reservation_id=${reservation.id}&type=deposit`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?payment=cancelled`,
      customer_email: reservation.customer_email || undefined,
      metadata: {
        type: 'client_reservation_security_deposit',
        reservation_id: reservation.id,
        pack_key: reservation.pack_key,
        deposit_amount: reservation.deposit_amount.toString(),
      },
    });

    await supabaseAdmin
      .from('client_reservations')
      .update({ deposit_session_id: session.id })
      .eq('id', reservation.id);

    return NextResponse.json({ success: true, sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Erreur création session caution Stripe:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}
