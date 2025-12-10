import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

// Créer le client Supabase seulement si les variables sont définies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

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
    const { userId, items, cartItems, total, depositTotal, deliveryFee, deliveryOption, customerEmail, customerName, customerPhone, address } = body;

    // Vérifier que l'utilisateur est authentifié
    if (!userId) {
      console.error('❌ userId manquant dans la requête');
      return NextResponse.json(
        { success: false, error: 'Authentification requise. Veuillez vous connecter.' },
        { status: 401 }
      );
    }

    // Vérifier que l'ID est un UUID valide
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error('❌ userId invalide:', userId);
      return NextResponse.json(
        { success: false, error: 'ID utilisateur invalide. Veuillez vous reconnecter.' },
        { status: 401 }
      );
    }

    // Vérifier que Supabase est configuré (nécessaire pour créer la réservation)
    if (!supabaseAdmin) {
      console.error('❌ Supabase non configuré');
      console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'défini' : 'manquant');
      console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'défini' : 'manquant');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Configuration Supabase manquante. Veuillez vérifier les variables d\'environnement NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.' 
        },
        { status: 500 }
      );
    }

    // Vérifier que l'utilisateur existe (optionnel si Supabase a des problèmes)
    let user;
    if (supabaseAdmin) {
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        
        if (userError) {
          console.error('❌ Erreur récupération utilisateur:', userError);
          // Si l'erreur est "Invalid API key", c'est un problème de configuration
          if (userError.message?.includes('Invalid API key') || userError.message?.includes('JWT') || userError.message?.includes('Invalid')) {
            console.error('⚠️ Clé API Supabase invalide. Continuation en mode dégradé (sans vérification utilisateur).');
            // On continue sans vérification utilisateur mais on log l'erreur
          } else {
            // Pour les autres erreurs, on continue aussi en mode dégradé
            console.warn('⚠️ Erreur vérification utilisateur, continuation en mode dégradé:', userError.message);
          }
        } else if (userData) {
          user = userData;
          console.log('✅ Utilisateur vérifié:', userData.user.email);
        }
      } catch (error: any) {
        console.error('❌ Exception lors de la vérification utilisateur:', error);
        console.warn('⚠️ Continuation sans vérification Supabase (mode dégradé)');
        // On accepte le userId si c'est un UUID valide
      }
    }

    // Calculer le montant total
    const totalAmount = total + (deliveryFee || 0);

    // Vérifier l'email vérifié pour les commandes importantes (> 1000€)
    // Seulement si on a réussi à récupérer l'utilisateur
    if (user) {
      if (totalAmount > 1000 && !user.user.email_confirmed_at) {
        return NextResponse.json(
          { success: false, error: 'Vérification email requise pour les commandes supérieures à 1000€' },
          { status: 403 }
        );
      }
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
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Configuration serveur manquante. Veuillez contacter le support.' },
        { status: 500 }
      );
    }

    let reservation;
    try {
      const { data: reservationData, error: reservationError } = await supabaseAdmin
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
            customerPhone: customerPhone || '',
            deliveryOption: deliveryOption || 'paris',
            // Stocker les heures si disponibles dans les cartItems
            startTime: cartItems?.[0]?.startTime || null,
            endTime: cartItems?.[0]?.endTime || null,
          }),
        })
        .select()
        .single();

      if (reservationError) {
        console.error('❌ Erreur création réservation:', reservationError);
        
        // Si c'est une erreur de clé API invalide, donner un message plus clair
        if (reservationError.message?.includes('Invalid API key') || reservationError.message?.includes('JWT')) {
          console.error('❌ Clé API Supabase invalide - Impossible de créer la réservation');
          return NextResponse.json(
            { 
              success: false, 
              error: 'Erreur de configuration serveur. La clé API Supabase est invalide. Veuillez vérifier la variable d\'environnement SUPABASE_SERVICE_ROLE_KEY.' 
            },
            { status: 500 }
          );
        }
        
        return NextResponse.json(
          { 
            success: false, 
            error: `Erreur lors de la création de la réservation: ${reservationError.message || 'Erreur inconnue'}` 
          },
          { status: 500 }
        );
      }

      if (!reservationData) {
        console.error('❌ Réservation créée mais aucune donnée retournée');
        return NextResponse.json(
          { success: false, error: 'Erreur lors de la création de la réservation (aucune donnée retournée)' },
          { status: 500 }
        );
      }

      reservation = reservationData;
      console.log('✅ Réservation créée:', {
        id: reservation.id,
        user_id: reservation.user_id,
        status: reservation.status,
        total_price: reservation.total_price,
      });
    } catch (error: any) {
      console.error('❌ Exception lors de la création de la réservation:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: `Erreur serveur lors de la création de la réservation: ${error.message || 'Erreur inconnue'}` 
        },
        { status: 500 }
      );
    }

    // Convertir le montant de la caution en centimes pour Stripe
    const depositAmountInCents = depositTotal ? Math.round(depositTotal * 100) : 0;

    // Créer la session Stripe Checkout avec l'ID de la réservation
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      // Rediriger vers l'API de création de session caution après succès du paiement principal
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/create-deposit-session?session_id={CHECKOUT_SESSION_ID}&deposit=${depositAmountInCents}&reservationId=${reservation.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/panier/cancel`,
      customer_email: customerEmail || (user?.user?.email || undefined),
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
        customerPhone: customerPhone || '',
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
            customerPhone: customerPhone || '',
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

