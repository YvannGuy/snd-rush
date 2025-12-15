/**
 * Script pour tester la configuration du webhook Stripe
 * 
 * Ce script vérifie:
 * 1. Les variables d'environnement
 * 2. La configuration du webhook dans Stripe Dashboard
 * 3. Les tentatives de webhook récentes
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

console.log('\n🔍 Vérification de la configuration du webhook Stripe\n');

if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY manquante dans les variables d\'environnement');
  console.error('   Ajoutez-la dans .env.local');
  process.exit(1);
}

if (!webhookSecret) {
  console.warn('⚠️  STRIPE_WEBHOOK_SECRET manquante dans les variables d\'environnement');
  console.log('\n📝 Pour obtenir le secret du webhook:');
  console.log('   1. Allez sur https://dashboard.stripe.com/webhooks');
  console.log('   2. Cliquez sur votre webhook');
  console.log('   3. Dans "Signing secret", cliquez sur "Reveal"');
  console.log('   4. Copiez le secret (commence par whsec_)');
  console.log('   5. Ajoutez-le à STRIPE_WEBHOOK_SECRET dans .env.local');
  console.log('   6. Redémarrez votre serveur\n');
}

const stripe = new Stripe(stripeSecretKey);

async function checkWebhooks() {
  try {
    console.log('📡 Vérification des webhooks configurés...\n');
    
    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
    
    if (webhooks.data.length === 0) {
      console.log('❌ Aucun webhook configuré dans Stripe');
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
      console.log(`${index + 1}. ${webhook.url}`);
      console.log(`   Status: ${webhook.status === 'enabled' ? '✅ Activé' : '❌ Désactivé'}`);
      console.log(`   Événements: ${webhook.enabled_events.length} événement(s)`);
      
      if (webhook.enabled_events.includes('checkout.session.completed')) {
        console.log('   ✅ checkout.session.completed est activé');
      } else {
        console.log('   ❌ checkout.session.completed n\'est PAS activé');
        console.log('   ⚠️  Activez cet événement pour que les factures soient créées');
      }
      
      console.log('');
    });
    
    // Vérifier les tentatives récentes
    if (webhooks.data.length > 0) {
      const webhookId = webhooks.data[0].id;
      console.log(`📊 Tentatives récentes pour le webhook ${webhookId}...\n`);
      
      try {
        const attempts = await stripe.webhookEndpoints.listAttempts(webhookId, { limit: 5 });
        
        if (attempts.data.length === 0) {
          console.log('⚠️  Aucune tentative récente trouvée');
          console.log('   Cela peut signifier que le webhook n\'a jamais été appelé');
        } else {
          console.log(`✅ ${attempts.data.length} tentative(s) récente(s):\n`);
          
          attempts.data.forEach((attempt, index) => {
            const status = attempt.response_status_code;
            const statusIcon = status >= 200 && status < 300 ? '✅' : '❌';
            console.log(`${index + 1}. ${statusIcon} Status: ${status}`);
            console.log(`   Date: ${new Date(attempt.created * 1000).toLocaleString('fr-FR')}`);
            console.log(`   Type: ${attempt.event_type || 'N/A'}`);
            if (attempt.response_body) {
              const body = typeof attempt.response_body === 'string' 
                ? attempt.response_body 
                : JSON.stringify(attempt.response_body);
              if (body.length > 100) {
                console.log(`   Réponse: ${body.substring(0, 100)}...`);
              } else {
                console.log(`   Réponse: ${body}`);
              }
            }
            console.log('');
          });
        }
      } catch (error) {
        console.warn('⚠️  Impossible de récupérer les tentatives:', error.message);
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des webhooks:', error.message);
    if (error.message.includes('Invalid API key')) {
      console.error('\n⚠️  Vérifiez que STRIPE_SECRET_KEY est correcte');
    }
  }
}

async function checkRecentEvents() {
  try {
    console.log('\n📊 Événements checkout.session.completed récents...\n');
    
    const events = await stripe.events.list({
      type: 'checkout.session.completed',
      limit: 5,
    });
    
    if (events.data.length === 0) {
      console.log('⚠️  Aucun événement checkout.session.completed trouvé récemment');
      console.log('   Cela peut signifier qu\'aucun paiement n\'a été effectué récemment');
      return;
    }
    
    console.log(`✅ ${events.data.length} événement(s) récent(s):\n`);
    
    events.data.forEach((event, index) => {
      const session = event.data.object;
      console.log(`${index + 1}. Session: ${session.id}`);
      console.log(`   Date: ${new Date(event.created * 1000).toLocaleString('fr-FR')}`);
      console.log(`   Email: ${session.customer_email || 'Non défini'}`);
      console.log(`   Montant: ${(session.amount_total || 0) / 100}€`);
      console.log(`   Status: ${session.payment_status}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des événements:', error.message);
  }
}

async function main() {
  await checkWebhooks();
  await checkRecentEvents();
  
  console.log('\n💡 Pour tester le webhook localement:');
  console.log('   1. Installez Stripe CLI: brew install stripe/stripe-cli/stripe');
  console.log('   2. Connectez-vous: stripe login');
  console.log('   3. Démarrez votre serveur: npm run dev');
  console.log('   4. Dans un autre terminal, lancez: npm run test:webhook');
  console.log('   5. Effectuez un paiement test ou lancez: npm run trigger:webhook');
  console.log('   6. Vérifiez les logs de votre serveur pour voir si le webhook est reçu\n');
}

main().catch(console.error);
