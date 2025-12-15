/**
 * Script de diagnostic pour vérifier le webhook Stripe et les factures
 * 
 * Ce script vérifie:
 * 1. Les variables d'environnement Stripe
 * 2. La configuration du webhook dans Stripe
 * 3. Les orders existants dans Supabase
 * 4. Les réservations payées sans order correspondant
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔍 Diagnostic du webhook Stripe\n');
console.log('📋 Variables d\'environnement:');
console.log(`   STRIPE_SECRET_KEY: ${stripeSecretKey ? '✅ Définie' : '❌ Manquante'}`);
console.log(`   STRIPE_WEBHOOK_SECRET: ${webhookSecret ? '✅ Définie' : '❌ Manquante'}`);
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Définie' : '❌ Manquante'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Définie' : '❌ Manquante'}`);

if (!stripeSecretKey) {
  console.error('\n❌ STRIPE_SECRET_KEY manquante. Impossible de continuer.');
  process.exit(1);
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Configuration Supabase manquante. Impossible de continuer.');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkWebhookConfiguration() {
  console.log('\n📡 Vérification de la configuration du webhook dans Stripe...\n');
  
  try {
    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
    
    if (webhooks.data.length === 0) {
      console.log('⚠️  Aucun webhook configuré dans Stripe');
      console.log('\n📝 Pour configurer un webhook:');
      console.log('   1. Allez sur https://dashboard.stripe.com/webhooks');
      console.log('   2. Cliquez sur "Add endpoint"');
      console.log('   3. Entrez l\'URL: https://votre-domaine.com/api/webhooks/stripe');
      console.log('   4. Sélectionnez les événements: checkout.session.completed');
      console.log('   5. Copiez le "Signing secret" et ajoutez-le à STRIPE_WEBHOOK_SECRET');
      return;
    }
    
    console.log(`✅ ${webhooks.data.length} webhook(s) trouvé(s):\n`);
    
    webhooks.data.forEach((webhook, index) => {
      console.log(`   ${index + 1}. ${webhook.url}`);
      console.log(`      Status: ${webhook.status === 'enabled' ? '✅ Activé' : '❌ Désactivé'}`);
      console.log(`      Événements: ${webhook.enabled_events.length} événement(s)`);
      if (webhook.enabled_events.includes('checkout.session.completed')) {
        console.log(`      ✅ checkout.session.completed est activé`);
      } else {
        console.log(`      ❌ checkout.session.completed n'est PAS activé`);
      }
      console.log(`      Secret: ${webhook.secret ? '✅ Défini' : '❌ Manquant'}`);
      console.log('');
    });
    
    // Vérifier si le secret correspond
    if (webhookSecret) {
      const matchingWebhook = webhooks.data.find(w => w.secret === webhookSecret);
      if (matchingWebhook) {
        console.log('✅ Le STRIPE_WEBHOOK_SECRET correspond à un webhook configuré\n');
      } else {
        console.log('⚠️  Le STRIPE_WEBHOOK_SECRET ne correspond à aucun webhook configuré');
        console.log('   Vérifiez que vous utilisez le bon secret pour votre environnement (test vs production)\n');
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des webhooks:', error.message);
  }
}

async function checkRecentEvents() {
  console.log('\n📊 Vérification des événements récents...\n');
  
  try {
    const events = await stripe.events.list({
      type: 'checkout.session.completed',
      limit: 10,
    });
    
    if (events.data.length === 0) {
      console.log('⚠️  Aucun événement checkout.session.completed trouvé récemment');
      return;
    }
    
    console.log(`✅ ${events.data.length} événement(s) récent(s) trouvé(s):\n`);
    
    for (const event of events.data.slice(0, 5)) {
      const session = event.data.object;
      console.log(`   - Session: ${session.id}`);
      console.log(`     Date: ${new Date(event.created * 1000).toLocaleString('fr-FR')}`);
      console.log(`     Email: ${session.customer_email || 'Non défini'}`);
      console.log(`     Montant: ${(session.amount_total || 0) / 100}€`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des événements:', error.message);
  }
}

async function checkOrdersInDatabase() {
  console.log('\n💾 Vérification des orders dans Supabase...\n');
  
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, customer_email, total, created_at, stripe_session_id')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Erreur lors de la récupération des orders:', error.message);
      return;
    }
    
    if (!orders || orders.length === 0) {
      console.log('⚠️  Aucun order trouvé dans la base de données');
      console.log('   Cela peut signifier que le webhook n\'a jamais été appelé avec succès');
      return;
    }
    
    console.log(`✅ ${orders.length} order(s) trouvé(s) dans la base de données:\n`);
    
    orders.forEach((order, index) => {
      console.log(`   ${index + 1}. Order ID: ${order.id.slice(0, 8)}...`);
      console.log(`      Email: ${order.customer_email || '❌ Non défini'}`);
      console.log(`      Montant: ${order.total}€`);
      console.log(`      Date: ${new Date(order.created_at).toLocaleString('fr-FR')}`);
      console.log(`      Session Stripe: ${order.stripe_session_id || 'Non défini'}`);
      console.log('');
    });
    
    // Vérifier les orders sans customer_email
    const ordersWithoutEmail = orders.filter(o => !o.customer_email);
    if (ordersWithoutEmail.length > 0) {
      console.log(`⚠️  ${ordersWithoutEmail.length} order(s) sans customer_email trouvé(s)`);
      console.log('   Ces orders ne seront pas visibles dans "Mes factures"\n');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des orders:', error.message);
  }
}

async function checkReservationsWithoutOrders() {
  console.log('\n🔗 Vérification des réservations payées sans order...\n');
  
  try {
    // Récupérer les réservations avec un stripe_payment_intent_id mais sans order correspondant
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('id, user_id, status, stripe_payment_intent_id, notes, created_at')
      .not('stripe_payment_intent_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('❌ Erreur lors de la récupération des réservations:', error.message);
      return;
    }
    
    if (!reservations || reservations.length === 0) {
      console.log('✅ Aucune réservation avec paiement trouvée');
      return;
    }
    
    // Vérifier pour chaque réservation si un order existe
    const reservationsWithoutOrders = [];
    
    for (const reservation of reservations) {
      let sessionId = null;
      try {
        const notes = typeof reservation.notes === 'string' 
          ? JSON.parse(reservation.notes) 
          : reservation.notes;
        sessionId = notes?.sessionId;
      } catch (e) {
        // Ignorer
      }
      
      if (sessionId) {
        const { data: order } = await supabase
          .from('orders')
          .select('id')
          .eq('stripe_session_id', sessionId)
          .maybeSingle();
        
        if (!order) {
          reservationsWithoutOrders.push({ ...reservation, sessionId });
        }
      }
    }
    
    if (reservationsWithoutOrders.length === 0) {
      console.log('✅ Toutes les réservations payées ont un order correspondant');
    } else {
      console.log(`⚠️  ${reservationsWithoutOrders.length} réservation(s) payée(s) sans order correspondant:\n`);
      reservationsWithoutOrders.forEach((r, index) => {
        console.log(`   ${index + 1}. Réservation ID: ${r.id}`);
        console.log(`      Session Stripe: ${r.sessionId || 'Non trouvé'}`);
        console.log(`      Date: ${new Date(r.created_at).toLocaleString('fr-FR')}`);
        console.log('');
      });
      console.log('💡 Vous pouvez créer les orders manquants avec: node scripts/create-orders-from-reservations.js');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des réservations:', error.message);
  }
}

async function main() {
  await checkWebhookConfiguration();
  await checkRecentEvents();
  await checkOrdersInDatabase();
  await checkReservationsWithoutOrders();
  
  console.log('\n✅ Diagnostic terminé\n');
}

main().catch(console.error);
