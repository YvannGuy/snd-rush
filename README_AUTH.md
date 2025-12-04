# 🔐 Authentification Supabase - Guide de Configuration

Ce document explique comment configurer l'authentification Supabase pour SND Rush.

## ✅ Ce qui a été implémenté

### 1. Tables Supabase créées
- ✅ `user_profiles` - Profils utilisateurs (phone, address, company, avatar_url)
- ✅ `carts` - Paniers utilisateurs avec persistance
- ✅ `reservations` - Réservations liées aux utilisateurs (mise à jour avec user_id, cart_id, etc.)

### 2. Composants créés
- ✅ `hooks/useUser.ts` - Hook pour récupérer l'utilisateur actuel
- ✅ `hooks/useAuth.ts` - Hook pour les actions d'authentification (signIn, signUp, signOut, etc.)
- ✅ `components/auth/SignModal.tsx` - Modal de connexion/inscription avec :
  - Connexion email/password
  - Inscription email/password
  - Magic link (passwordless)
  - Connexion Google OAuth

### 3. Header mis à jour
- ✅ Icône d'authentification (avatar ou icône utilisateur)
- ✅ Menu profil avec :
  - Mes réservations
  - Mes factures
  - Déconnexion

### 4. API Endpoints créés
- ✅ `POST /api/cart/attach` - Attacher le panier local à l'utilisateur après connexion
- ✅ `POST /api/checkout/create-session` - Créer une session Stripe Checkout (requiert authentification)
- ✅ `GET /api/user/cart` - Récupérer le panier de l'utilisateur depuis Supabase

### 5. Pages créées
- ✅ `app/auth/callback/route.ts` - Callback pour OAuth et magic link
- ✅ `app/mes-reservations/page.tsx` - Page pour voir les réservations de l'utilisateur
- ✅ `app/mes-factures/page.tsx` - Page pour voir les factures de l'utilisateur

### 6. CartContext mis à jour
- ✅ Attachement automatique du panier après connexion
- ✅ Synchronisation avec Supabase
- ✅ Persistance dans localStorage pour les visiteurs anonymes

### 7. Page panier mise à jour
- ✅ Vérification de l'authentification avant checkout
- ✅ Ouverture automatique du modal de connexion si non connecté
- ✅ Champs email/nom/adresse pour le checkout

## 🔧 Configuration requise

### Variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` :

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # ou https://votre-domaine.com
```

### Configuration Supabase Auth

1. **Activer les providers d'authentification** dans Supabase Dashboard :
   - Email/Password : ✅ Activé
   - Magic Link : ✅ Activé
   - Google OAuth : ⚙️ À configurer

2. **Configurer la confirmation email (IMPORTANT)** :
   - Aller dans Authentication > Settings > Email Auth
   - **Option 1 (Recommandé pour développement)** : Désactiver "Enable email confirmations"
     - Cela permet de créer des comptes sans envoyer d'email de confirmation
     - Les utilisateurs peuvent se connecter immédiatement après inscription
   - **Option 2 (Production)** : Configurer un service email
     - Aller dans Project Settings > Auth > SMTP Settings
     - Configurer Resend, SendGrid, ou un autre service SMTP
     - Ajouter les credentials SMTP

3. **Configurer Google OAuth** (optionnel) :
   - Aller dans Authentication > Providers > Google
   - Ajouter les credentials Google OAuth
   - Configurer les URLs de redirection :
     - `http://localhost:3000/auth/callback` (dev)
     - `https://votre-domaine.com/auth/callback` (prod)

4. **Configurer les URLs de redirection** :
   - Dans Authentication > URL Configuration
   - Site URL : `http://localhost:3000` (dev) ou `https://votre-domaine.com` (prod)
   - Redirect URLs : 
     - `http://localhost:3000/auth/callback`
     - `https://votre-domaine.com/auth/callback`

### Row Level Security (RLS)

Les politiques RLS ont été créées automatiquement via la migration :
- ✅ `user_profiles` : Les utilisateurs ne peuvent voir/modifier que leur propre profil
- ✅ `carts` : Les utilisateurs ne peuvent voir/modifier que leur propre panier
- ✅ `reservations` : Les utilisateurs ne peuvent voir que leurs propres réservations

## 🚀 Utilisation

### Connexion/Inscription

L'utilisateur peut se connecter via :
1. **Email/Password** : Formulaire classique
2. **Magic Link** : Envoi d'un email avec lien de connexion
3. **Google OAuth** : Connexion avec compte Google

### Flow de checkout

1. L'utilisateur ajoute des produits au panier (localStorage)
2. Il clique sur "Payer"
3. Si non connecté → Modal de connexion s'ouvre
4. Après connexion → Le panier local est attaché à l'utilisateur dans Supabase
5. Le checkout continue avec Stripe

### Attachement automatique du panier

Le `CartContext` détecte automatiquement quand un utilisateur se connecte et :
1. Récupère le panier depuis Supabase (s'il existe)
2. Fusionne avec le panier local si nécessaire
3. Sauvegarde le panier dans Supabase à chaque modification

## 🔒 Sécurité

### Vérification email pour commandes importantes

Pour les commandes > 1000€, l'email doit être vérifié. Cette vérification est gérée dans `/api/checkout/create-session`.

### Tokens et sessions

- Les tokens Supabase sont stockés dans des cookies sécurisés
- Le refresh token est géré automatiquement par Supabase
- Les sessions sont vérifiées côté serveur pour les API routes

## 📝 Notes importantes

1. **Magic Link** : L'utilisateur reçoit un email avec un lien. Après clic, il est redirigé vers `/auth/callback` qui échange le code pour une session.

2. **Google OAuth** : Après autorisation Google, l'utilisateur est redirigé vers `/auth/callback` qui complète l'authentification.

3. **Panier anonyme** : Les visiteurs peuvent ajouter au panier sans compte, mais doivent se connecter pour payer.

4. **Persistance** : Le panier est sauvegardé dans :
   - `localStorage` (pour les visiteurs anonymes)
   - Supabase `carts` table (pour les utilisateurs connectés)

## 🐛 Dépannage

### Erreur "Error sending confirmation email"
**Solution rapide (développement)** :
1. Aller dans Supabase Dashboard > Authentication > Settings > Email Auth
2. Désactiver "Enable email confirmations"
3. Les utilisateurs pourront se connecter immédiatement après inscription

**Solution production** :
1. Configurer un service SMTP dans Supabase (Resend recommandé)
2. Aller dans Project Settings > Auth > SMTP Settings
3. Ajouter vos credentials SMTP

**Note** : Le code gère maintenant cette erreur gracieusement - même si l'email échoue, l'utilisateur peut quand même se connecter.

### L'authentification ne fonctionne pas
- Vérifier que les variables d'environnement sont correctes
- Vérifier que Supabase Auth est activé dans le dashboard
- Vérifier les URLs de redirection dans Supabase

### Le panier ne s'attache pas après connexion
- Vérifier les logs du navigateur (console)
- Vérifier que l'API `/api/cart/attach` fonctionne
- Vérifier que l'utilisateur a bien une session active

### Google OAuth ne fonctionne pas
- Vérifier les credentials Google OAuth dans Supabase
- Vérifier que les URLs de redirection sont correctes
- Vérifier que le domaine est autorisé dans Google Console

## 📚 Ressources

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Documentation Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Documentation Stripe Checkout](https://stripe.com/docs/payments/checkout)

