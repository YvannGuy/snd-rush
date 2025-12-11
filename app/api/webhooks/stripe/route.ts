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

// Configuration pour Stripe webhook
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Gérer les requêtes OPTIONS (CORS preflight)
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('❌ Stripe signature manquante');
      // Retourner 200 pour éviter que Stripe réessaie
      return NextResponse.json({ received: false, error: 'Signature manquante' }, { status: 200 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET manquante dans les variables d\'environnement');
      // Retourner 200 pour éviter que Stripe réessaie
      return NextResponse.json({ received: false, error: 'Configuration webhook manquante' }, { status: 200 });
    }

    let event: Stripe.Event;

    try {
      // Vérifier la signature du webhook
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('❌ Erreur vérification signature Stripe:', err.message);
      // Retourner 200 pour éviter que Stripe réessaie
      return NextResponse.json({ received: false, error: `Webhook signature verification failed: ${err.message}` }, { status: 200 });
    }

    console.log('✅ Webhook Stripe reçu:', event.type);

    // Gérer les différents types d'événements
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('✅ Paiement réussi - Session ID:', session.id);
        console.log('📋 Métadonnées de la session:', JSON.stringify(session.metadata || {}, null, 2));
        
        if (!supabaseAdmin) {
          console.error('❌ Supabase non configuré');
          return NextResponse.json({ received: true });
        }
        
        const supabaseClient = supabaseAdmin;
        
        try {
          // Récupérer les métadonnées de la session
          const metadata = session.metadata || {};
          const paymentType = metadata.type || 'cart'; // 'cart' pour paiement principal, 'deposit' pour caution
          
          console.log('🔍 Type de paiement détecté:', paymentType);
          console.log('🔍 Métadonnées complètes:', JSON.stringify(metadata, null, 2));
          
          // Si c'est un paiement de caution, traiter différemment
          if (paymentType === 'deposit') {
          const reservationId = metadata.reservationId;
          const mainSessionId = metadata.mainSessionId;
          
          console.log('💰 Webhook caution reçu:', {
            sessionId: session.id,
            reservationId,
            mainSessionId,
            metadata: JSON.stringify(metadata),
          });
          
          if (reservationId) {
            // Récupérer le PaymentIntent pour obtenir l'ID de paiement
            let paymentIntentId = null;
            if (session.payment_intent) {
              if (typeof session.payment_intent === 'string') {
                paymentIntentId = session.payment_intent;
              } else {
                paymentIntentId = session.payment_intent.id;
              }
            }

            // Récupérer les notes existantes de la réservation
            let existingNotes = {};
            try {
              const { data: existingReservation } = await supabaseClient
                .from('reservations')
                .select('notes')
                .eq('id', reservationId)
                .single();
              
              if (existingReservation?.notes) {
                existingNotes = JSON.parse(existingReservation.notes);
              }
            } catch (e) {
              console.warn('⚠️ Impossible de récupérer les notes existantes:', e);
            }

            // Mettre à jour la réservation pour indiquer que la caution a été autorisée
            const { data: updatedReservation, error: updateError } = await supabaseClient
              .from('reservations')
              .update({
                status: 'CONFIRMED',
                stripe_deposit_session_id: session.id,
                stripe_deposit_payment_intent_id: paymentIntentId,
                notes: JSON.stringify({
                  ...existingNotes,
                  depositAuthorized: true,
                  depositSessionId: session.id,
                  depositPaymentIntentId: paymentIntentId,
                  depositAuthorizedAt: new Date().toISOString(),
                }),
              })
              .eq('id', reservationId)
              .select()
              .single();

            if (updateError) {
              console.error('❌ Erreur mise à jour réservation pour caution:', updateError);
            } else {
              console.log('✅ Caution autorisée - Réservation mise à jour:', {
                reservationId,
                status: updatedReservation?.status,
                depositSessionId: session.id,
              });
            }
          } else {
            console.warn('⚠️ Aucun reservationId dans les métadonnées de la session caution');
          }
          
            return NextResponse.json({ received: true });
          }
          
          // Traitement du paiement principal (type: 'cart')
          const userId = metadata.userId;
          const customerEmail = session.customer_email || metadata.customerEmail || '';
          const customerName = metadata.customerName || '';
          const customerPhone = metadata.customerPhone || '';
          const deliveryOption = metadata.deliveryOption || 'paris';
          const deliveryFee = parseFloat(metadata.deliveryFee || '0');
          const total = parseFloat(metadata.total || '0');
          const depositTotal = parseFloat(metadata.depositTotal || '0');
          const address = metadata.address || '';
          
          // Récupérer le PaymentIntent pour obtenir l'ID de paiement
          let paymentIntentId = null;
          if (session.payment_intent) {
            if (typeof session.payment_intent === 'string') {
              paymentIntentId = session.payment_intent;
            } else {
              paymentIntentId = session.payment_intent.id;
            }
          }

          // Calculer le subtotal (total - frais de livraison)
          const subtotal = total;

          // Récupérer les items du panier depuis la réservation (au lieu des métadonnées)
          let cartItems: any[] = [];
          const reservationId = metadata.reservationId;
        
        if (reservationId) {
          try {
            // Récupérer la réservation pour obtenir les cartItems
            const { data: reservation, error: reservationError } = await supabaseClient
              .from('reservations')
              .select('notes')
              .eq('id', reservationId)
              .single();

            if (!reservationError && reservation?.notes) {
              try {
                const notesData = JSON.parse(reservation.notes);
                cartItems = notesData.cartItems || [];
              } catch (e) {
                console.error('Erreur parsing notes de la réservation:', e);
              }
            }
          } catch (e) {
            console.error('Erreur récupération réservation:', e);
          }
        }
        
        // Fallback : essayer de récupérer depuis les métadonnées (pour compatibilité)
        if (cartItems.length === 0) {
          try {
            if (metadata.cartItems) {
              cartItems = JSON.parse(metadata.cartItems);
            }
          } catch (e) {
            console.error('Erreur parsing cartItems depuis métadonnées:', e);
          }
        }

        // Créer l'order dans Supabase
        const { data: order, error: orderError } = await supabaseClient
          .from('orders')
          .insert({
            stripe_session_id: session.id,
            stripe_payment_intent_id: paymentIntentId,
            customer_email: customerEmail,
            customer_name: customerName,
            customer_phone: customerPhone,
            delivery_address: address,
            delivery_option: deliveryOption,
            delivery_fee: deliveryFee,
            subtotal: subtotal,
            total: (session.amount_total || 0) / 100, // Convertir de centimes en euros
            deposit_total: depositTotal,
            status: 'PAID',
            metadata: {
              userId: userId,
              cartItems: cartItems,
              sessionMetadata: metadata,
            },
          })
          .select()
          .single();

        if (orderError) {
          console.error('❌ Erreur création order:', orderError);
          throw orderError;
        }

        console.log('✅ Order créé:', order.id);

        // Créer les order_items si on a les données du panier
        let orderItemsToInsert: any[] = [];
        if (cartItems.length > 0 && order) {
          // Récupérer les line items de Stripe pour avoir plus de détails
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
            expand: ['data.price.product'],
          });

          // Créer les order_items
          for (const lineItem of lineItems.data) {
            // Ignorer les frais de livraison (seront dans delivery_fee)
            if (lineItem.description?.includes('Livraison') || lineItem.description?.includes('delivery')) {
              continue;
            }

            // Trouver l'item correspondant dans cartItems si disponible
            const cartItem = cartItems.find((item: any) => 
              item.name === lineItem.description || item.productName === lineItem.description
            );

            if (cartItem) {
              // Utiliser les données complètes du panier
              orderItemsToInsert.push({
                order_id: order.id,
                product_id: cartItem.productId?.startsWith('pack-') ? null : (cartItem.productId || null),
                product_name: cartItem.productName || lineItem.description || 'Produit',
                product_slug: cartItem.productSlug || null,
                quantity: cartItem.quantity || lineItem.quantity || 1,
                rental_days: cartItem.rentalDays || 1,
                start_date: cartItem.startDate || new Date().toISOString().split('T')[0],
                end_date: cartItem.endDate || new Date().toISOString().split('T')[0],
                daily_price: cartItem.dailyPrice || (lineItem.price?.unit_amount || 0) / 100,
                deposit: cartItem.deposit || 0,
                addons: cartItem.addons || [],
                images: cartItem.images || [],
              });
            } else {
              // Fallback : créer un order_item basique depuis Stripe
              orderItemsToInsert.push({
                order_id: order.id,
                product_id: null,
                product_name: lineItem.description || 'Produit',
                product_slug: null,
                quantity: lineItem.quantity || 1,
                rental_days: 1,
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0],
                daily_price: (lineItem.price?.unit_amount || 0) / 100,
                deposit: 0,
                addons: [],
                images: [],
              });
            }
          }

          if (orderItemsToInsert.length > 0) {
            const { error: itemsError } = await supabaseClient
              .from('order_items')
              .insert(orderItemsToInsert);

            if (itemsError) {
              console.error('❌ Erreur création order_items:', itemsError);
            } else {
              console.log(`✅ ${orderItemsToInsert.length} order_items créés`);
            }
          }
        }

          // NOTE: On ne crée plus de nouvelles réservations ici car elles sont déjà créées lors du checkout
          // La réservation PENDING est créée dans /api/checkout/create-session et mise à jour ci-dessous
          // Cette section est désactivée pour éviter les doublons
          console.log('ℹ️ Réservations déjà créées lors du checkout, pas de création supplémentaire nécessaire');

          // Mettre à jour la réservation PENDING créée lors du checkout avec les bonnes données
          // IMPORTANT : On garde le statut PENDING jusqu'à ce que la caution soit autorisée
          if (reservationId) {
            try {
              // Récupérer la réservation PENDING originale
              const { data: pendingReservation, error: pendingError } = await supabaseClient
                .from('reservations')
                .select('*')
                .eq('id', reservationId)
                .single();

              if (!pendingError && pendingReservation && pendingReservation.status === 'PENDING') {
                // Récupérer les notes existantes
                let existingNotes = {};
                try {
                  if (pendingReservation.notes) {
                    existingNotes = JSON.parse(pendingReservation.notes);
                  }
                } catch (e) {
                  console.error('Erreur parsing notes existantes:', e);
                }

                // Mettre à jour avec les données complètes (mais garder le statut PENDING)
                const updatedNotes = {
                  ...existingNotes,
                  sessionId: session.id,
                  cartItems: cartItems,
                  customerEmail,
                  customerName,
                  deliveryOption: deliveryOption || 'paris',
                  orderId: order.id,
                  mainPaymentCompleted: true,
                  mainPaymentCompletedAt: new Date().toISOString(),
                };

                await supabaseClient
                  .from('reservations')
                  .update({
                    // Garder le statut PENDING jusqu'à ce que la caution soit autorisée
                    status: 'PENDING',
                    stripe_payment_intent_id: paymentIntentId,
                    total_price: (session.amount_total || 0) / 100,
                    notes: JSON.stringify(updatedNotes),
                  })
                  .eq('id', reservationId);

                console.log(`✅ Réservation PENDING ${reservationId} mise à jour (paiement principal complété, en attente de caution)`);
              }
            } catch (e) {
              console.error('Erreur mise à jour réservation PENDING:', e);
            }
          }

          // Aussi mettre à jour les autres réservations existantes en pending si elles existent
          const { data: pendingReservations } = await supabaseClient
            .from('reservations')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false })
            .limit(10);

          if (pendingReservations && pendingReservations.length > 0) {
            await supabaseClient
              .from('reservations')
              .update({
                status: 'CONFIRMED',
                stripe_payment_intent_id: paymentIntentId,
              })
              .in('id', pendingReservations.map(r => r.id));

            console.log(`✅ ${pendingReservations.length} réservations en attente mises à jour`);
          }

          // Vider le panier de l'utilisateur après paiement réussi
          if (userId) {
            try {
              const { error: cartDeleteError } = await supabaseClient
                .from('carts')
                .delete()
                .eq('user_id', userId);

              if (cartDeleteError) {
                console.error('❌ Erreur suppression panier:', cartDeleteError);
              } else {
                console.log('✅ Panier vidé pour l\'utilisateur:', userId);
              }
            } catch (e) {
              console.error('❌ Erreur lors de la suppression du panier:', e);
            }
          }

          console.log('✅ Commande traitée avec succès pour la session:', session.id);
        } catch (error: any) {
          console.error('❌ Erreur lors du traitement de la commande:', error);
          // Ne pas retourner d'erreur pour éviter que Stripe réessaie indéfiniment
          // Vous pouvez logger l'erreur et la traiter manuellement
        }
        break;
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('✅ Paiement asynchrone réussi - Session ID:', session.id);
        // Traiter le paiement asynchrone (ex: virement bancaire)
        break;
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('❌ Paiement asynchrone échoué - Session ID:', session.id);
        // Notifier le client que le paiement a échoué
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('✅ PaymentIntent réussi:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('❌ PaymentIntent échoué:', paymentIntent.id);
        break;
      }

      default:
        console.log(`⚠️ Événement non géré: ${event.type}`);
    }

    // Toujours retourner 200 pour que Stripe considère l'événement comme traité
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    // Gérer toutes les erreurs non capturées
    console.error('❌ Erreur générale dans le webhook Stripe:', error);
    // Toujours retourner 200 pour éviter que Stripe réessaie indéfiniment
    return NextResponse.json({ received: false, error: error.message || 'Erreur serveur' }, { status: 200 });
  }
}

