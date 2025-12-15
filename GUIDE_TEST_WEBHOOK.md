# Guide de test du webhook Stripe

Ce guide vous explique comment tester le webhook Stripe localement et vérifier qu'il fonctionne correctement.

## Prérequis

1. **Stripe CLI installé**
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Compte Stripe configuré**
   - Vous devez avoir un compte Stripe (mode test ou production)
   - Les clés API doivent être configurées dans `.env.local`

## Variables d'environnement requises

Assurez-vous d'avoir ces variables dans `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_... (ou sk_live_... pour la production)
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_ici
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role
```

## Test local avec Stripe CLI

### 1. Vérifier la configuration

```bash
npm run check:webhook
```

Ce script vérifie:
- Les variables d'environnement
- La configuration du webhook dans Stripe Dashboard
- Les événements récents
- Les orders existants dans la base de données

### 2. Démarrer le serveur de développement

```bash
npm run dev
```

Le serveur doit démarrer sur `http://localhost:3000`

### 3. Démarrer Stripe CLI en mode listen

Dans un **nouveau terminal**, lancez:

```bash
npm run test:webhook
```

Ou manuellement:

```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

**Important** : Quand vous utilisez `stripe listen`, copiez le secret `whsec_...` affiché et ajoutez-le à `STRIPE_WEBHOOK_SECRET` dans `.env.local`, puis redémarrez le serveur.

### 4. Déclencher un événement de test

Dans un **troisième terminal**, lancez:

```bash
npm run trigger:webhook
```

Ou manuellement:

```bash
stripe trigger checkout.session.completed
```

### 5. Vérifier les logs

Vous devriez voir dans les logs du serveur (`npm run dev`):

```
✅ Webhook Stripe reçu: checkout.session.completed
✅ Paiement réussi - Session ID: cs_test_...
📦 Création de l'order avec les données: ...
✅ Order créé avec succès: ...
```

## Test avec un paiement réel (mode test)

1. Allez sur votre site en mode développement
2. Ajoutez des produits au panier
3. Procédez au checkout avec une carte de test Stripe:
   - Numéro: `4242 4242 4242 4242`
   - Date: n'importe quelle date future
   - CVC: n'importe quel code à 3 chiffres
4. Complétez le paiement
5. Vérifiez les logs du serveur pour voir si le webhook est reçu

## Vérifier que les factures apparaissent

1. Connectez-vous à votre compte
2. Allez sur `/mes-factures`
3. Vous devriez voir la facture correspondant au paiement

## Créer des orders pour les factures passées

Si vous avez des réservations payées qui n'ont pas d'order correspondant (factures passées), vous pouvez créer les orders manquants:

```bash
npm run create:orders
```

Ce script:
- Trouve les réservations payées sans order
- Récupère les données depuis Stripe
- Crée les orders manquants dans Supabase

## Configuration du webhook en production

### 1. Créer le webhook dans Stripe Dashboard

1. Allez sur https://dashboard.stripe.com/webhooks
2. Cliquez sur "Add endpoint"
3. Entrez l'URL: `https://votre-domaine.com/api/webhooks/stripe`
4. Sélectionnez les événements:
   - `checkout.session.completed`
5. Cliquez sur "Add endpoint"

### 2. Récupérer le secret du webhook

1. Cliquez sur le webhook créé
2. Dans "Signing secret", cliquez sur "Reveal"
3. Copiez le secret (commence par `whsec_`)

### 3. Configurer les variables d'environnement

Dans votre plateforme de déploiement (Vercel, etc.), ajoutez:

```env
STRIPE_SECRET_KEY=sk_live_... (clé LIVE, pas test)
STRIPE_WEBHOOK_SECRET=whsec_... (le secret du webhook production)
```

### 4. Vérifier que le webhook fonctionne

1. Effectuez un paiement test en production
2. Allez sur Stripe Dashboard > Webhooks
3. Cliquez sur votre webhook
4. Vérifiez les "Recent deliveries"
5. Vous devriez voir des tentatives avec status 200

## Dépannage

### Le webhook n'est pas reçu

1. Vérifiez que le serveur est démarré
2. Vérifiez que `STRIPE_WEBHOOK_SECRET` correspond au secret affiché par `stripe listen`
3. Vérifiez les logs du serveur pour les erreurs

### Les factures n'apparaissent pas

1. Vérifiez que le webhook crée bien les orders:
   ```bash
   npm run check:webhook
   ```

2. Vérifiez que `customer_email` est correctement défini dans les orders:
   - Le webhook essaie de récupérer l'email depuis plusieurs sources
   - Si l'email est manquant, l'order ne sera pas créé

3. Vérifiez que l'email de l'utilisateur connecté correspond à `customer_email` dans les orders

### Erreur "Webhook signature verification failed"

- Vérifiez que `STRIPE_WEBHOOK_SECRET` est correct
- En local, utilisez le secret affiché par `stripe listen`
- En production, utilisez le secret du webhook configuré dans Stripe Dashboard

## Commandes utiles

```bash
# Vérifier la configuration
npm run check:webhook

# Créer les orders manquants
npm run create:orders

# Tester le webhook localement
npm run test:webhook

# Déclencher un événement de test
npm run trigger:webhook
```
