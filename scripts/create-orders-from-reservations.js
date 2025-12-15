/**
 * Script pour créer des orders manquants à partir des réservations payées
 * 
 * Ce script:
 * 1. Trouve les réservations payées sans order correspondant
 * 2. Récupère les données de la session Stripe
 * 3. Crée les orders manquants dans Supabase
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createOrdersFromReservations() {
  console.log('\n🔍 Recherche des réservations payées sans order...\n');
  
  try {
    // Récupérer toutes les réservations avec un payment_intent_id
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('id, user_id, status, stripe_payment_intent_id, notes, total_price, created_at')
      .not('stripe_payment_intent_id', 'is', null)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erreur lors de la récupération des réservations:', error);
      return;
    }
    
    if (!reservations || reservations.length === 0) {
      console.log('✅ Aucune réservation avec paiement trouvée');
      return;
    }
    
    console.log(`📋 ${reservations.length} réservation(s) avec paiement trouvée(s)\n`);
    
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const reservation of reservations) {
      try {
        // Extraire le sessionId depuis les notes
        let sessionId = null;
        let customerEmail = null;
        let customerName = null;
        let customerPhone = null;
        let cartItems = [];
        let deliveryOption = 'paris';
        let deliveryFee = 0;
        
        try {
          const notes = typeof reservation.notes === 'string' 
            ? JSON.parse(reservation.notes) 
            : reservation.notes;
          sessionId = notes?.sessionId;
          customerEmail = notes?.customerEmail;
          customerName = notes?.customerName;
          customerPhone = notes?.customerPhone;
          cartItems = notes?.cartItems || [];
          deliveryOption = notes?.deliveryOption || 'paris';
        } catch (e) {
          console.warn(`⚠️  Erreur parsing notes pour réservation ${reservation.id}:`, e.message);
        }
        
        if (!sessionId) {
          console.log(`⏭️  Réservation ${reservation.id}: Pas de sessionId, ignorée`);
          skippedCount++;
          continue;
        }
        
        // Vérifier si un order existe déjà
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('stripe_session_id', sessionId)
          .maybeSingle();
        
        if (existingOrder) {
          console.log(`⏭️  Réservation ${reservation.id}: Order existe déjà (${existingOrder.id.slice(0, 8)}...)`);
          skippedCount++;
          continue;
        }
        
        // Récupérer la session Stripe
        let session;
        try {
          session = await stripe.checkout.sessions.retrieve(sessionId);
        } catch (e) {
          console.error(`❌ Erreur récupération session Stripe ${sessionId}:`, e.message);
          errorCount++;
          continue;
        }
        
        // Récupérer l'email depuis la session ou les notes
        const email = session.customer_email || customerEmail;
        
        if (!email) {
          console.warn(`⚠️  Réservation ${reservation.id}: Pas d'email trouvé, ignorée`);
          skippedCount++;
          continue;
        }
        
        // Récupérer le PaymentIntent
        let paymentIntentId = null;
        if (session.payment_intent) {
          paymentIntentId = typeof session.payment_intent === 'string' 
            ? session.payment_intent 
            : session.payment_intent.id;
        }
        
        // Récupérer les line items
        const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
          expand: ['data.price.product'],
        });
        
        // Calculer le total depuis la session
        const total = (session.amount_total || 0) / 100;
        const subtotal = total;
        
        // Créer l'order
        const orderData = {
          stripe_session_id: sessionId,
          stripe_payment_intent_id: paymentIntentId,
          customer_email: email,
          customer_name: customerName || '',
          customer_phone: customerPhone || '',
          delivery_address: session.metadata?.address || '',
          delivery_option: deliveryOption,
          delivery_fee: parseFloat(session.metadata?.deliveryFee || '0'),
          subtotal: subtotal,
          total: total,
          deposit_total: parseFloat(session.metadata?.depositTotal || '0'),
          status: 'PAID',
          metadata: {
            userId: reservation.user_id,
            cartItems: cartItems,
            sessionMetadata: session.metadata || {},
          },
        };
        
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single();
        
        if (orderError) {
          console.error(`❌ Erreur création order pour réservation ${reservation.id}:`, orderError);
          errorCount++;
          continue;
        }
        
        // Créer les order_items
        if (cartItems.length > 0) {
          const orderItemsToInsert = [];
          
          for (const lineItem of lineItems.data) {
            // Ignorer les frais de livraison
            if (lineItem.description?.includes('Livraison') || lineItem.description?.includes('delivery')) {
              continue;
            }
            
            const cartItem = cartItems.find((item: any) => 
              item.name === lineItem.description || item.productName === lineItem.description
            );
            
            if (cartItem) {
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
            const { error: itemsError } = await supabase
              .from('order_items')
              .insert(orderItemsToInsert);
            
            if (itemsError) {
              console.error(`⚠️  Erreur création order_items pour order ${order.id}:`, itemsError);
            }
          }
        }
        
        console.log(`✅ Order créé pour réservation ${reservation.id} (${email})`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Erreur traitement réservation ${reservation.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Résumé:');
    console.log(`   ✅ Orders créés: ${createdCount}`);
    console.log(`   ⏭️  Ignorés: ${skippedCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    console.log('');
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

createOrdersFromReservations().catch(console.error);
