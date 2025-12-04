# Guide de test des Webhooks Stripe via CLI

## 🚀 Démarrage rapide

### 1. Vérifier que Stripe CLI est installé

```bash
stripe --version
```

### 2. Se connecter à Stripe (si pas déjà fait)

```bash
stripe login
```

Cela ouvrira votre navigateur pour vous authentifier.

### 3. Démarrer le forward des webhooks vers votre serveur local

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Important** : Cette commande va :
- ✅ Créer un tunnel vers votre serveur local
- ✅ Vous donner un **secret webhook temporaire** (commence par `whsec_...`)
- ✅ Forwarder tous les événements Stripe vers votre endpoint local

### 4. Copier le secret webhook temporaire

Quand vous lancez `stripe listen`, vous verrez quelque chose comme :

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

**Copiez ce secret** et ajoutez-le dans votre `.env.local` :

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

⚠️ **Note** : Ce secret change à chaque fois que vous relancez `stripe listen`. Vous devez le mettre à jour dans `.env.local` à chaque fois.

### 5. Redémarrer votre serveur Next.js

Après avoir ajouté le secret dans `.env.local`, redémarrez votre serveur :

```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

## 🧪 Tester les webhooks

### Test 1 : Simuler un paiement réussi

Dans un **nouveau terminal**, lancez :

```bash
stripe trigger checkout.session.completed
```

Cela va simuler un événement `checkout.session.completed` et vous devriez voir :
- ✅ Dans le terminal `stripe listen` : L'événement reçu
- ✅ Dans les logs de votre serveur Next.js : Les logs de traitement
- ✅ Dans Supabase : Une nouvelle commande créée (si tout fonctionne)

### Test 2 : Simuler un paiement échoué

```bash
stripe trigger payment_intent.payment_failed
```

### Test 3 : Tester avec des données personnalisées

Vous pouvez créer un événement avec des données spécifiques :

```bash
stripe trigger checkout.session.completed --override checkout_session:metadata.userId=test-user-123
```

## 📊 Vérifier les logs

### Dans le terminal `stripe listen`
Vous verrez tous les événements reçus avec leurs détails.

### Dans les logs de votre serveur Next.js
Vous devriez voir :
```
✅ Webhook Stripe reçu: checkout.session.completed
✅ Paiement réussi - Session ID: cs_test_xxxxx
✅ Order créé: xxxxx-xxxx-xxxx
✅ X order_items créés
```

### Dans Supabase
Vérifiez les tables :
- `orders` : Une nouvelle commande devrait apparaître
- `order_items` : Les items de la commande
- `reservations` : Les réservations mises à jour

## 🔍 Dépannage

### Problème : "Webhook signature verification failed"

**Solution** : Vérifiez que :
1. Le `STRIPE_WEBHOOK_SECRET` dans `.env.local` correspond au secret affiché par `stripe listen`
2. Vous avez redémarré le serveur après avoir ajouté le secret
3. Le secret n'a pas changé (relancez `stripe listen` si nécessaire)

### Problème : "Configuration webhook manquante"

**Solution** : Vérifiez que `STRIPE_WEBHOOK_SECRET` est bien défini dans `.env.local`

### Problème : Le webhook n'arrive pas

**Solution** : Vérifiez que :
1. Votre serveur Next.js est bien en cours d'exécution sur le port 3000
2. Le chemin `/api/webhooks/stripe` est correct
3. Le tunnel Stripe CLI est actif (terminal `stripe listen` ouvert)

## 🎯 Événements disponibles pour les tests

```bash
# Paiement réussi
stripe trigger checkout.session.completed

# Paiement échoué
stripe trigger payment_intent.payment_failed

# Paiement asynchrone réussi
stripe trigger checkout.session.async_payment_succeeded

# Paiement asynchrone échoué
stripe trigger checkout.session.async_payment_failed
```

## 📝 Commandes utiles

### Voir tous les événements reçus
```bash
stripe events list
```

### Voir les détails d'un événement spécifique
```bash
stripe events retrieve evt_xxxxx
```

### Tester avec un fichier JSON personnalisé
```bash
stripe trigger checkout.session.completed --override @event.json
```

## ⚠️ Important

- **En développement** : Utilisez `stripe listen` avec le secret temporaire
- **En production** : Utilisez le secret webhook depuis le Dashboard Stripe
- Le secret change à chaque `stripe listen`, pensez à le mettre à jour dans `.env.local`
- Gardez le terminal `stripe listen` ouvert pendant vos tests

## 🎉 C'est prêt !

Une fois configuré, vous pouvez tester vos webhooks en temps réel pendant le développement. Les événements Stripe seront automatiquement forwardés vers votre serveur local.

