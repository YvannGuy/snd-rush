# Configuration Stripe Webhooks

## 📋 Vue d'ensemble

Ce projet utilise **deux méthodes** pour gérer les paiements Stripe :

### 1. **Redirects (URLs success/cancel)** ✅ Déjà configuré
- **Success URL** : `/panier/success` - Quand le client termine le paiement
- **Cancel URL** : `/panier/cancel` - Quand le client clique sur "retour"

**Avantages** :
- Simple à mettre en place
- Redirection immédiate de l'utilisateur
- Le panier est vidé côté client

**Limitations** :
- L'utilisateur peut fermer la page avant la redirection
- Pas de vérification côté serveur du paiement réel
- Moins sécurisé (l'utilisateur peut modifier l'URL)

### 2. **Webhooks Stripe** 🔒 Recommandé pour la production
- **Endpoint** : `/api/webhooks/stripe`
- Vérifie les paiements côté serveur de manière sécurisée

**Avantages** :
- ✅ Sécurisé : vérification de la signature Stripe
- ✅ Fiable : Stripe garantit la livraison des événements
- ✅ Traçable : logs de tous les événements
- ✅ Permet de créer des commandes/réservations dans la base de données

## 🚀 Configuration des Webhooks

### Étape 1 : Obtenir le secret du webhook

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Cliquez sur "Add endpoint"
3. URL de l'endpoint : `https://votre-domaine.com/api/webhooks/stripe`
4. Sélectionnez les événements à écouter :
   - `checkout.session.completed` ✅ (obligatoire)
   - `checkout.session.async_payment_succeeded` (optionnel)
   - `checkout.session.async_payment_failed` (optionnel)
   - `payment_intent.succeeded` (optionnel)
   - `payment_intent.payment_failed` (optionnel)
5. Copiez le **Signing secret** (commence par `whsec_...`)

### Étape 2 : Ajouter le secret dans les variables d'environnement

Ajoutez dans votre fichier `.env.local` :

```env
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_ici
```

### Étape 3 : Tester en local avec Stripe CLI (optionnel)

Pour tester les webhooks en local :

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Se connecter
stripe login

# Forwarder les webhooks vers votre serveur local
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Stripe CLI vous donnera un secret temporaire à utiliser dans `.env.local` pour les tests.

## 📝 Événements gérés

### `checkout.session.completed`
Déclenché quand un paiement est complété avec succès.

**Actions recommandées** :
- Créer une commande dans votre base de données
- Créer des réservations dans Supabase
- Envoyer un email de confirmation
- Mettre à jour le stock

### `checkout.session.async_payment_failed`
Déclenché quand un paiement asynchrone (ex: virement bancaire) échoue.

**Actions recommandées** :
- Notifier le client
- Annuler les réservations temporaires

## 🔒 Sécurité

Le webhook vérifie automatiquement :
- ✅ La signature Stripe (empêche les faux événements)
- ✅ L'authenticité de la requête
- ✅ L'intégrité des données

## 📊 Logs

Tous les événements sont loggés dans la console :
- ✅ Succès : `✅ Paiement réussi - Session ID: ...`
- ❌ Échecs : `❌ Paiement échoué - Session ID: ...`

## 🎯 Prochaines étapes

1. **Créer une table `orders` dans Supabase** pour stocker les commandes
2. **Créer une table `reservations`** pour les réservations de matériel
3. **Envoyer des emails de confirmation** avec Resend
4. **Mettre à jour le stock** après chaque paiement réussi

## ⚠️ Important

- Les webhooks sont **complémentaires** aux redirects, pas un remplacement
- Les redirects gèrent l'expérience utilisateur (redirection immédiate)
- Les webhooks gèrent la logique métier côté serveur (création de commandes, etc.)
- **En production**, utilisez toujours les deux pour une sécurité maximale

