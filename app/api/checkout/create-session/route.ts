import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    // Vérifier les variables d'environnement
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Configuration Stripe manquante' },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      return NextResponse.json(
        { success: false, error: 'URL de base manquante' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { userId, items, cartItems, total, depositTotal, deliveryFee, deliveryOption, customerEmail, customerName, address } = body;

    // Vérifier que l'utilisateur est authentifié
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur existe
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 401 }
      );
    }

    // Vérifier l'email vérifié pour les commandes importantes (> 1000€)
    const totalAmount = total + (deliveryFee || 0);
    if (totalAmount > 1000 && !user.user.email_confirmed_at) {
      return NextResponse.json(
        { success: false, error: 'Vérification email requise pour les commandes supérieures à 1000€' },
        { status: 403 }
      );
    }

    // Créer les line items pour Stripe
    const lineItems = items.map((item: { name: string; quantity: number; price: number }) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
        },
        unit_amount: item.price, // Déjà en centimes
      },
      quantity: item.quantity,
    }));

    // Ajouter les frais de livraison si nécessaire
    if (deliveryFee && deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Livraison - ${deliveryOption}`,
          },
          unit_amount: deliveryFee * 100, // Convertir en centimes
        },
        quantity: 1,
      });
    }

    // Extraire les dates depuis les cartItems (utiliser les dates du premier item)
    const firstCartItem = cartItems && cartItems.length > 0 ? cartItems[0] : null;
    const startDate = firstCartItem?.startDate || new Date().toISOString().split('T')[0];
    const endDate = firstCartItem?.endDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Créer une réservation en attente dans Supabase AVANT la session Stripe
    // On stockera le sessionId après la création de la session
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('reservations')
      .insert({
        user_id: userId,
        status: 'PENDING', // Utiliser PENDING en majuscules (contrainte de la table)
        start_date: startDate,
        end_date: endDate,
        quantity: 1, // Valeur par défaut, sera mis à jour par le webhook avec les vraies données
        total_price: totalAmount,
        deposit_amount: depositTotal || 0,
        stripe_payment_intent_id: null, // Sera mis à jour par le webhook
        address: address || '',
        notes: JSON.stringify({
          cartItems: cartItems || items,
          customerEmail,
          customerName,
          deliveryOption: deliveryOption || 'paris',
        }),
      })
      .select()
      .single();

    if (reservationError) {
      console.error('Erreur création réservation:', reservationError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la création de la réservation' },
        { status: 500 }
      );
    }

    // Créer la session Stripe Checkout avec l'ID de la réservation
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/panier/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/panier/cancel`,
      customer_email: customerEmail || user.user.email,
      metadata: {
        userId: userId,
        reservationId: reservation.id, // Stocker l'ID de la réservation au lieu des cartItems
        type: 'cart',
        deliveryOption: deliveryOption || 'paris',
        deliveryFee: deliveryFee?.toString() || '0',
        total: total.toString(),
        depositTotal: depositTotal?.toString() || '0',
        address: address || '',
        customerEmail: customerEmail || '',
        customerName: customerName || '',
      },
      payment_intent_data: {
        metadata: {
          userId: userId,
          type: 'cart',
          deliveryOption: deliveryOption || 'paris',
        },
      },
    });

    // Mettre à jour la réservation avec le sessionId
    if (reservation && session.id) {
      await supabaseAdmin
        .from('reservations')
        .update({
          notes: JSON.stringify({
            sessionId: session.id,
            cartItems: cartItems || items,
            customerEmail,
            customerName,
            deliveryOption: deliveryOption || 'paris',
          }),
        })
        .eq('id', reservation.id);
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      reservationId: reservation?.id,
    });
  } catch (error: any) {
    console.error('Erreur création session Stripe:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

