import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getCatalogItemById } from '@/lib/catalog';

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
      console.error('❌ STRIPE_SECRET_KEY manquante dans les variables d\'environnement');
      return NextResponse.json(
        { success: false, error: 'Configuration Stripe manquante. Veuillez contacter le support.' },
        { status: 500 }
      );
    }

    // Vérifier que la clé Stripe est valide (commence par sk_test_ ou sk_live_)
    const stripeKey = process.env.STRIPE_SECRET_KEY.trim();
    if (!stripeKey.startsWith('sk_test_') && !stripeKey.startsWith('sk_live_')) {
      console.error('❌ STRIPE_SECRET_KEY invalide (doit commencer par sk_test_ ou sk_live_)');
      return NextResponse.json(
        { success: false, error: 'Configuration Stripe invalide. Veuillez contacter le support.' },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      return NextResponse.json(
        { success: false, error: 'URL de base manquante' },
        { status: 500 }
      );
    }

    // Vérifier l'identité depuis le token Bearer — jamais depuis le body
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentification requise. Veuillez vous connecter.' },
        { status: 401 }
      );
    }

    if (!supabaseUrl || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ success: false, error: 'Configuration Supabase manquante.' }, { status: 500 });
    }

    // Vérifier le token côté serveur — retourne l'utilisateur réel connecté
    const supabaseUserClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Session expirée. Veuillez vous reconnecter.' },
        { status: 401 }
      );
    }
    const userId = user.id; // toujours l'ID réel du token, pas celui du body

    const CheckoutBodySchema = z.object({
      items: z.array(z.object({
        name: z.string().max(200),
        price: z.number().positive(),
        quantity: z.number().int().positive(),
      })).optional(),
      cartItems: z.array(z.object({
        catalogId: z.string().max(100).optional(),
        name: z.string().max(200).optional(),
        quantity: z.number().int().positive().optional(),
        rentalDays: z.number().int().positive().optional(),
        startDate: z.string().max(50).optional(),
        endDate: z.string().max(50).optional(),
        startTime: z.string().max(20).optional(),
        endTime: z.string().max(20).optional(),
        isDelivery: z.boolean().optional(),
      })).optional(),
      total: z.number().nonnegative().optional(),
      depositTotal: z.number().nonnegative().optional(),
      deliveryFee: z.number().nonnegative().optional(),
      deliveryOption: z.enum(['paris', 'petite_couronne', 'grande_couronne']).optional(),
      customerEmail: z.string().email().max(320).optional(),
      customerName: z.string().max(200).optional(),
      customerPhone: z.string().max(30).optional(),
      address: z.string().max(500).optional(),
    });

    let body: z.infer<typeof CheckoutBodySchema>;
    try {
      const rawBody = await req.json();
      const result = CheckoutBodySchema.safeParse(rawBody);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: 'Données invalides', details: result.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      body = result.data;
    } catch {
      return NextResponse.json({ success: false, error: 'JSON invalide' }, { status: 400 });
    }

    const { items, cartItems, total, depositTotal, deliveryFee, deliveryOption, customerEmail, customerName, customerPhone, address } = body;

    // Vérifier que Supabase admin est configuré (nécessaire pour créer la réservation)
    if (!supabaseAdmin) {
      console.error('❌ Supabase non configuré');
      return NextResponse.json(
        { success: false, error: 'Configuration Supabase manquante.' },
        { status: 500 }
      );
    }

    // Vérifier que l'utilisateur existe dans Supabase admin
    let verifiedUser;
    if (supabaseAdmin) {
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        
        if (userError) {
          console.error('❌ Erreur récupération utilisateur:', userError);
          console.warn('⚠️ Continuation en mode dégradé:', userError.message);
        } else if (userData) {
          verifiedUser = userData;
          console.log('✅ Utilisateur vérifié:', userData.user.email);
        }
      } catch (error: any) {
        console.error('❌ Exception lors de la vérification utilisateur:', error);
        console.warn('⚠️ Continuation sans vérification Supabase (mode dégradé)');
        // On accepte le userId si c'est un UUID valide
      }
    }

    // ── Prix serveur-side ──────────────────────────────────────────────────────
    // Les prix ne proviennent JAMAIS du corps de la requête.
    // On les recalcule depuis le catalogue (Supabase / lib/catalog.ts).

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Le panier est vide ou invalide.' },
        { status: 400 }
      );
    }

    // Tarifs de livraison définis côté serveur
    const DELIVERY_FEES: Record<string, number> = {
      paris: 8000,          // 80 € en centimes
      petite_couronne: 12000,
      grande_couronne: 16000,
    };

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let serverTotal = 0;

    for (const cartItem of cartItems) {
      // Items de livraison : prix calculé côté serveur selon la zone
      if (cartItem.isDelivery || cartItem.catalogId === 'delivery') {
        const zone = (deliveryOption || 'paris').toLowerCase().replace('-', '_');
        const deliveryUnitAmount = DELIVERY_FEES[zone] ?? DELIVERY_FEES['paris'];
        lineItems.push({
          price_data: {
            currency: 'eur',
            product_data: { name: cartItem.name || 'Livraison' },
            unit_amount: deliveryUnitAmount,
          },
          quantity: 1,
        });
        serverTotal += deliveryUnitAmount;
        continue;
      }

      // Items catalogue (packs, produits, installation) : prix chargé depuis la BDD
      if (!cartItem.catalogId) continue;

      const catalogItem = await getCatalogItemById(cartItem.catalogId);
      if (!catalogItem) {
        console.error(`❌ Produit catalogue introuvable: ${cartItem.catalogId}`);
        return NextResponse.json(
          { success: false, error: `Produit introuvable dans le catalogue: ${cartItem.catalogId}` },
          { status: 400 }
        );
      }

      const rentalDays = cartItem.rentalDays || 1;
      const qty = cartItem.quantity || 1;
      const unitAmountCents =
        catalogItem.billingUnit === 'event'
          ? Math.round(catalogItem.unitPriceEur * 100)
          : Math.round(catalogItem.unitPriceEur * rentalDays * 100);

      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: catalogItem.name },
          unit_amount: unitAmountCents,
        },
        quantity: qty,
      });
      serverTotal += unitAmountCents * qty;
    }

    if (lineItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Impossible de construire le panier côté serveur.' },
        { status: 400 }
      );
    }

    // Montant total calculé côté serveur (en euros)
    const totalAmount = serverTotal / 100;

    // Vérifier l'email vérifié pour les commandes importantes (> 1000€)
    if (verifiedUser) {
      if (totalAmount > 1000 && !verifiedUser.user.email_confirmed_at) {
        return NextResponse.json(
          { success: false, error: 'Vérification email requise pour les commandes supérieures à 1000€' },
          { status: 403 }
        );
      }
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
          status: 'PENDING',
          start_date: startDate,
          end_date: endDate,
          quantity: 1,
          total_price: totalAmount,       // prix calculé côté serveur
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
      customer_email: customerEmail || (user?.email || undefined),
      metadata: {
        userId: userId,
        reservationId: reservation.id,
        type: 'cart',
        deliveryOption: deliveryOption || 'paris',
        deliveryFee: deliveryFee?.toString() || '0',
        total: totalAmount.toString(),  // total validé côté serveur
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
    
    // Gérer spécifiquement les erreurs de clé API Stripe invalide
    if (error.message?.includes('Invalid API Key') || error.message?.includes('Invalid API key')) {
      console.error('❌ Clé API Stripe invalide. Vérifiez STRIPE_SECRET_KEY dans les variables d\'environnement.');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur de configuration du paiement. Veuillez contacter le support technique.' 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

