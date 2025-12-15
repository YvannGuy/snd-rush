# 🔧 Configuration du Webhook Stripe pour la Production

## ✅ Vérification : Les factures apparaîtront-elles en production ?

**OUI**, les factures apparaîtront en production **SI** le webhook Stripe est correctement configuré dans Stripe Dashboard pour votre URL de production.

## 📋 Étapes de Configuration pour la Production

### 1. Vérifier l'URL de Production

Votre application doit avoir une URL de production (ex: `https://www.sndrush.com` ou votre domaine Vercel).

Vérifiez que `NEXT_PUBLIC_BASE_URL` dans vos variables d'environnement de production correspond à cette URL.

### 2. Configurer le Webhook dans Stripe Dashboard

#### Pour la Production :

1. **Connectez-vous à Stripe Dashboard** : https://dashboard.stripe.com
2. **Allez dans** : **Developers** → **Webhooks**
3. **Cliquez sur** : **"Add endpoint"** (ou modifiez l'existant)
4. **Configurez** :
   - **Endpoint URL** : `https://votre-domaine.com/api/webhooks/stripe`
     - Exemple : `https://www.sndrush.com/api/webhooks/stripe`
     - Ou : `https://votre-app.vercel.app/api/webhooks/stripe`
   - **Description** : "Webhook production - Orders et réservations"
   - **Événements à écouter** : Sélectionnez `checkout.session.completed`
   - **Mode** : Assurez-vous d'être en mode **"Live"** (pas "Test")
5. **Cliquez sur** : **"Add endpoint"**
6. **Copiez le "Signing secret"** : Il commence par `whsec_...`

### 3. Configurer les Variables d'Environnement en Production

#### Sur Vercel (ou votre plateforme de déploiement) :

1. **Allez dans** : Votre projet → **Settings** → **Environment Variables**
2. **Ajoutez/Mettez à jour** :
   ```env
   STRIPE_SECRET_KEY=sk_live_... (clé LIVE, pas test)
   STRIPE_WEBHOOK_SECRET=whsec_... (le secret du webhook production)
   NEXT_PUBLIC_BASE_URL=https://www.sndrush.com (ou votre domaine)
   NEXT_PUBLIC_SUPABASE_URL=https://...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

**Important** :
- Utilisez `sk_live_...` pour `STRIPE_SECRET_KEY` (pas `sk_test_...`)
- Utilisez le secret du webhook **production** (pas celui du webhook test)
- L'URL doit être celle de votre site en production

### 4. Vérifier que le Webhook est Actif

Dans Stripe Dashboard → **Developers** → **Webhooks** :
- Le webhook doit avoir le statut **"Enabled"** (vert)
- Il doit être en mode **"Live"** (pas "Test")
- L'URL doit correspondre exactement à votre domaine de production

### 5. Tester le Webhook en Production

#### Option A : Effectuer un vrai paiement test

1. Utilisez une carte de test Stripe en mode Live :
   - Carte de test : `4242 4242 4242 4242`
   - Date d'expiration : n'importe quelle date future
   - CVC : n'importe quel 3 chiffres
2. Effectuez un paiement dans votre application en production
3. Vérifiez les logs dans Stripe Dashboard → **Developers** → **Webhooks** → Votre webhook → **Logs**
4. Vérifiez que l'order est créé dans votre base de données

#### Option B : Utiliser Stripe CLI pour tester en production

```bash
# Se connecter avec votre clé API live
stripe listen --forward-to https://www.sndrush.com/api/webhooks/stripe --api-key sk_live_...

# Dans un autre terminal
stripe trigger checkout.session.completed --api-key sk_live_...
```

## 🔍 Vérification Post-Déploiement

### 1. Vérifier les Logs du Webhook

Dans Stripe Dashboard → **Developers** → **Webhooks** → Votre webhook → **Logs** :
- Les événements doivent avoir le statut **200 OK**
- Si vous voyez des erreurs, vérifiez les détails

### 2. Vérifier les Orders Créés

Exécutez le script de vérification (sur votre serveur ou localement avec les bonnes variables) :

```bash
node scripts/check-webhook-orders.js
```

### 3. Vérifier dans l'Application

- Connectez-vous en tant qu'utilisateur ayant effectué un paiement
- Allez dans **"Mes factures"**
- Vérifiez que la facture apparaît

## ⚠️ Problèmes Courants en Production

### Le webhook ne reçoit pas les événements

**Causes possibles** :
1. L'URL du webhook est incorrecte
2. Le webhook est en mode "Test" au lieu de "Live"
3. Le serveur n'est pas accessible depuis Internet
4. Problème de certificat SSL (HTTPS requis)

**Solutions** :
- Vérifiez l'URL dans Stripe Dashboard
- Assurez-vous que le webhook est en mode "Live"
- Vérifiez que votre site est accessible en HTTPS
- Vérifiez les logs dans Stripe Dashboard

### Erreur de signature

**Cause** : Le `STRIPE_WEBHOOK_SECRET` ne correspond pas au secret du webhook production

**Solution** :
- Copiez le secret depuis Stripe Dashboard → Votre webhook → **"Reveal"**
- Mettez à jour `STRIPE_WEBHOOK_SECRET` dans vos variables d'environnement
- Redéployez l'application

### Les orders ne sont pas créés

**Causes possibles** :
1. Le `customer_email` est manquant dans les métadonnées
2. Erreur dans le code du webhook
3. Problème de connexion à Supabase

**Solutions** :
- Vérifiez les logs du serveur (Vercel Logs, etc.)
- Vérifiez les logs dans Stripe Dashboard
- Vérifiez que les variables d'environnement Supabase sont correctes

## 📝 Checklist de Déploiement

Avant de mettre en production, vérifiez :

- [ ] Webhook configuré dans Stripe Dashboard avec l'URL de production
- [ ] Webhook en mode **"Live"** (pas "Test")
- [ ] `STRIPE_SECRET_KEY` est une clé **LIVE** (`sk_live_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` correspond au secret du webhook **production**
- [ ] `NEXT_PUBLIC_BASE_URL` correspond à votre domaine de production
- [ ] Toutes les variables d'environnement sont configurées sur votre plateforme de déploiement
- [ ] Le webhook a le statut **"Enabled"** dans Stripe Dashboard
- [ ] L'événement `checkout.session.completed` est sélectionné
- [ ] Test effectué avec un paiement réel (ou test en mode Live)

## 🎯 Résumé

**OUI, les factures apparaîtront en production** si :
1. ✅ Le webhook est configuré dans Stripe Dashboard avec l'URL de production
2. ✅ Le webhook est en mode **"Live"**
3. ✅ Les variables d'environnement sont correctes (`STRIPE_WEBHOOK_SECRET` production)
4. ✅ L'application est déployée avec les bonnes variables

Le code du webhook fonctionne en test ET en production. La seule différence est la configuration dans Stripe Dashboard et les variables d'environnement.
