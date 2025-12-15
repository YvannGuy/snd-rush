# 🔍 Diagnostic du Webhook Stripe

## Problème identifié
Les factures ne s'affichent pas car aucun order n'est créé dans la base de données.

## ⚡ Test Rapide avec Stripe CLI

Pour tester rapidement le webhook en local :

```bash
# 1. Installer Stripe CLI (si pas déjà fait)
brew install stripe/stripe-cli/stripe

# 2. Se connecter
stripe login

# 3. Démarrer l'écoute (dans un terminal)
npm run test:webhook
# OU
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# 4. Dans un autre terminal, déclencher un événement de test
npm run trigger:webhook
# OU
stripe trigger checkout.session.completed

# 5. Vérifier les logs du serveur et les orders créés
node scripts/check-webhook-orders.js
```

**Important** : Quand vous utilisez `stripe listen`, copiez le secret `whsec_...` affiché et ajoutez-le à `STRIPE_WEBHOOK_SECRET` dans `.env.local`, puis redémarrez le serveur.

## Vérifications à effectuer

### 1. Vérifier la configuration du webhook dans Stripe Dashboard

1. Connectez-vous à [Stripe Dashboard](https://dashboard.stripe.com)
2. Allez dans **Developers** → **Webhooks**
3. Vérifiez qu'un webhook est configuré avec :
   - **Endpoint URL** : `https://votre-domaine.com/api/webhooks/stripe`
   - **Événements à écouter** : `checkout.session.completed` doit être sélectionné
   - **Statut** : Le webhook doit être actif (pas désactivé)

### 2. Vérifier les variables d'environnement

Assurez-vous que ces variables sont définies dans `.env.local` :

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Important** : Le `STRIPE_WEBHOOK_SECRET` doit correspondre au secret du webhook configuré dans Stripe Dashboard.

### 3. Vérifier les logs du webhook

#### Dans Stripe Dashboard :
1. Allez dans **Developers** → **Webhooks**
2. Cliquez sur votre webhook
3. Consultez l'onglet **Logs** pour voir :
   - Les événements reçus
   - Les réponses HTTP (doit être 200)
   - Les erreurs éventuelles

#### Dans les logs du serveur :
Recherchez ces messages lors d'un paiement :
- `✅ Webhook Stripe reçu: checkout.session.completed`
- `📦 Création de l'order avec les données:`
- `✅ Order créé avec succès:`

Si vous voyez des erreurs :
- `❌ customerEmail manquant` → Le webhook ne peut pas créer l'order
- `❌ Erreur création order:` → Problème avec Supabase

### 4. Tester le webhook manuellement

#### Option A : Utiliser Stripe CLI (recommandé pour le développement local)

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Se connecter
stripe login

# Écouter les webhooks localement
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

#### Option B : Utiliser un outil de test Stripe

1. Dans Stripe Dashboard → **Developers** → **Webhooks**
2. Cliquez sur votre webhook
3. Cliquez sur **Send test webhook**
4. Sélectionnez `checkout.session.completed`
5. Vérifiez les logs

### 5. Vérifier que les orders sont créés

Exécutez le script de diagnostic :

```bash
node scripts/check-webhook-orders.js
```

Ce script affichera :
- Le nombre d'orders dans la base
- Les orders avec/sans `customer_email`
- Les orders récents (24h)
- Les problèmes détectés

### 6. Vérifier les réservations

Les orders sont liés aux réservations. Vérifiez que :
1. Les réservations sont créées lors du checkout (`/api/checkout/create-session`)
2. Les réservations ont un `stripe_session_id` dans leurs `notes`
3. Le webhook peut récupérer le `customer_email` depuis la réservation

## Solutions aux problèmes courants

### Problème : Le webhook ne reçoit pas les événements

**Solutions** :
1. Vérifier que l'URL du webhook est correcte et accessible
2. Vérifier que le webhook n'est pas en mode "test" si vous testez avec des paiements réels
3. Vérifier les logs Stripe pour voir si les événements sont envoyés

### Problème : Le webhook reçoit les événements mais ne crée pas d'orders

**Solutions** :
1. Vérifier les logs du serveur pour voir les erreurs
2. Vérifier que `STRIPE_WEBHOOK_SECRET` correspond au secret du webhook
3. Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est correct
4. Vérifier que le `customer_email` est présent dans les métadonnées

### Problème : Les orders sont créés mais les factures ne s'affichent pas

**Solutions** :
1. Vérifier que `order.customer_email` correspond à `user.email`
2. Exécuter `node scripts/check-webhook-orders.js` pour voir les orders
3. Vérifier dans `app/mes-factures/page.tsx` que le filtre `.eq('customer_email', user.email)` fonctionne

## Améliorations apportées au webhook

1. ✅ Vérification robuste du `customer_email` avec fallbacks multiples
2. ✅ Logs détaillés pour le débogage
3. ✅ Gestion d'erreurs améliorée
4. ✅ Script de diagnostic créé

## Prochaines étapes

1. Vérifier la configuration du webhook dans Stripe Dashboard
2. Effectuer un paiement test et vérifier les logs
3. Exécuter le script de diagnostic pour voir les orders créés
4. Si aucun order n'est créé, vérifier les logs du serveur pour identifier l'erreur
