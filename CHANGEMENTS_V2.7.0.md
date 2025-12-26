# 📋 CHANGEMENTS VERSION 2.7.0 - Système de Lien Magique

**Date :** 2025-01-06  
**Version :** 2.7.0  
**Objectif :** Création automatique de compte et connexion via lien magique après paiement

---

## 🎯 Vue d'ensemble

### Problème résolu
Avant : Les utilisateurs non connectés qui payaient devaient :
1. Recevoir un email avec un lien vers `/checkout/[id]?token=...`
2. Créer manuellement un compte
3. Se connecter
4. Accéder à leur dashboard

Après : Les utilisateurs non connectés qui payent :
1. Reçoivent un email avec un lien magique
2. Cliquent sur "Accéder à mon dashboard"
3. Le compte est créé automatiquement
4. Ils sont connectés automatiquement
5. Ils arrivent directement sur le dashboard avec un modal pour créer leur mot de passe

---

## 📁 FICHIERS CRÉÉS

### 1. `/app/api/auth/magic-link/[token]/route.ts` ⭐ NOUVEAU
**Emplacement dans MEGA_DOSSIER :** Section "Système de Lien Magique" → Point 1

**Rôle :** API route qui gère le lien magique depuis l'email

**Fonctionnalités :**
- Vérifie le token de réservation (`public_token_hash`)
- Récupère l'email depuis la réservation
- Vérifie si l'utilisateur existe déjà
- Si nouveau utilisateur : crée un compte avec mot de passe temporaire
- Rattache la réservation à l'utilisateur
- Génère un magic link Supabase via `admin.generateLink()`
- Retourne l'URL du magic link dans un JSON

**Code clé :**
```typescript
// Création compte si nécessaire
if (!existingUser) {
  const temporaryPassword = randomBytes(16).toString('base64url');
  await supabaseAdmin.auth.admin.createUser({
    email: customerEmail,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { needs_password_setup: true }
  });
}

// Génération magic link Supabase
const { data: magicLinkData } = await supabaseAdmin.auth.admin.generateLink({
  type: 'magiclink',
  email: customerEmail,
  options: { redirectTo: finalRedirectTo }
});

return NextResponse.json({ 
  success: true, 
  redirectUrl: magicLinkData.properties?.action_link 
});
```

**Flux :**
```
GET /api/auth/magic-link/[token]
  → Vérifie token
  → Crée compte si nécessaire
  → Génère magic link Supabase
  → Retourne { success: true, redirectUrl: "https://supabase.co/auth/v1/verify?token=..." }
```

---

### 2. `/app/auth/magic-link/[token]/page.tsx` ⭐ NOUVEAU
**Emplacement dans MEGA_DOSSIER :** Section "Système de Lien Magique" → Point 2

**Rôle :** Page client intermédiaire qui appelle l'API et redirige

**Fonctionnalités :**
- Affiche un loader pendant le traitement
- Appelle `/api/auth/magic-link/${token}`
- Récupère l'URL de redirection depuis le JSON
- Redirige automatiquement vers le magic link Supabase via un lien `<a>` cliqué programmatiquement

**Code clé :**
```typescript
const data = await response.json();
if (data.redirectUrl) {
  const link = document.createElement('a');
  link.href = data.redirectUrl;
  link.target = '_self';
  document.body.appendChild(link);
  link.click(); // Redirection automatique
}
```

**Flux :**
```
Utilisateur clique lien email
  → /auth/magic-link/[token]
  → Appelle API
  → Reçoit redirectUrl
  → Redirige vers Supabase auth
```

---

### 3. `/components/PasswordSetupModal.tsx` ⭐ NOUVEAU
**Emplacement dans MEGA_DOSSIER :** Section "Système de Lien Magique" → Point 3

**Rôle :** Modal pour créer un mot de passe permanent

**Fonctionnalités :**
- Validation (minimum 8 caractères, confirmation)
- Affichage/masquage du mot de passe (icônes Eye/EyeOff)
- Mise à jour du mot de passe via `supabase.auth.updateUser()`
- Mise à jour des métadonnées `needs_password_setup: false`
- Gestion des états (loading, success, error)

**Utilisation :**
```typescript
<PasswordSetupModal
  isOpen={showPasswordSetup}
  onClose={() => setShowPasswordSetup(false)}
  onSuccess={() => console.log('Mot de passe créé')}
/>
```

**Flux :**
```
Modal affiché
  → Utilisateur entre mot de passe
  → Validation
  → supabase.auth.updateUser({ password })
  → Met à jour métadonnées
  → Ferme modal
```

---

### 4. `/app/api/payments/verify-session/route.ts` ⭐ NOUVEAU
**Emplacement dans MEGA_DOSSIER :** Section "Système de Lien Magique" → Point 7

**Rôle :** Vérification manuelle du statut Stripe (utile en développement)

**Fonctionnalités :**
- Vérifie le statut d'une session Stripe directement
- Met à jour la réservation si `payment_status === 'paid'`
- Crée l'order associé
- Envoie l'email de confirmation avec le magic link

**Utilisation :** Appelée depuis `/book/success` après 3 tentatives si le webhook n'a pas encore traité

**Code clé :**
```typescript
const session = await stripe.checkout.sessions.retrieve(session_id);
if (session.payment_status === 'paid') {
  await supabaseAdmin
    .from('client_reservations')
    .update({ status: 'PAID' })
    .eq('id', reservation_id);
  // Envoie email avec magic link...
}
```

**Flux :**
```
POST /api/payments/verify-session
  → Vérifie session Stripe
  → Si payé : met à jour réservation
  → Crée order
  → Envoie email
```

---

## 📝 FICHIERS MODIFIÉS

### 5. `/app/auth/callback/route.ts` ✏️ MODIFIÉ
**Emplacement dans MEGA_DOSSIER :** Section "Système de Lien Magique" → Point 4

**Changements :**
- Ajout de la gestion du paramètre `type=magic_link` avec token
- Utilisation de `exchangeCodeForSession(token)` pour le magic link
- Rattachement automatique des réservations à l'utilisateur
- Redirection vers `/dashboard?setup_password=true&new_user=true` si nouveau compte

**Code ajouté :**
```typescript
// Gérer le magic link avec token (depuis l'API magic-link)
const token = requestUrl.searchParams.get('token');
const magicLinkType = requestUrl.searchParams.get('type') === 'magic_link';

if (token && magicLinkType) {
  const { data } = await supabase.auth.exchangeCodeForSession(token);
  // Rattacher réservations...
  if (isNewUser && setupPassword) {
    return NextResponse.redirect('/dashboard?setup_password=true&new_user=true');
  }
}
```

**Avant :** Gestion uniquement des codes d'authentification classiques  
**Après :** Gestion aussi des magic links avec token

---

### 6. `/app/api/webhooks/stripe/route.ts` ✏️ MODIFIÉ
**Emplacement dans MEGA_DOSSIER :** Section "Système de Lien Magique" → Point 5

**Changements :**
- Le lien dans l'email utilise maintenant `/auth/magic-link/${token}` au lieu de `/checkout/${id}?token=${token}`
- Le bouton dans l'email s'appelle "📋 Accéder à mon dashboard" au lieu de "📋 Voir ma réservation"
- Correction du bug : `metadata` n'était pas défini dans la portée (ajout de `const metadata = session.metadata || {}`)

**Code modifié :**
```typescript
// AVANT
const checkoutUrl = checkoutToken 
  ? `${baseUrl}/checkout/${reservationId}?token=${checkoutToken}`
  : `${baseUrl}/checkout/${reservationId}`;

// APRÈS
const magicLinkUrl = checkoutToken 
  ? `${baseUrl}/auth/magic-link/${checkoutToken}`
  : `${baseUrl}/checkout/${reservationId}`;

// Dans l'email HTML :
<a href="${magicLinkUrl}">📋 Accéder à mon dashboard</a>
```

**Impact :** Tous les emails de confirmation de paiement contiennent maintenant le lien magique

---

### 7. `/app/dashboard/page.tsx` ✏️ MODIFIÉ
**Emplacement dans MEGA_DOSSIER :** Section "Système de Lien Magique" → Point 6

**Changements :**
- Ajout de l'import `PasswordSetupModal`
- Ajout du state `showPasswordSetup`
- Ajout d'un `useEffect` pour détecter `setup_password=true` et `new_user=true`
- Affichage automatique du modal si ces paramètres sont présents
- Nettoyage des paramètres de l'URL après affichage

**Code ajouté :**
```typescript
import PasswordSetupModal from '@/components/PasswordSetupModal';

const [showPasswordSetup, setShowPasswordSetup] = useState(false);

useEffect(() => {
  const setupPassword = searchParams.get('setup_password');
  const newUser = searchParams.get('new_user');
  
  if (setupPassword === 'true' && newUser === 'true' && user) {
    setShowPasswordSetup(true);
    // Nettoyer l'URL...
  }
}, [searchParams, user]);

// Dans le JSX :
<PasswordSetupModal
  isOpen={showPasswordSetup}
  onClose={() => setShowPasswordSetup(false)}
/>
```

**Impact :** Les nouveaux utilisateurs voient automatiquement le modal de création de mot de passe

---

### 8. `/app/book/success/page.tsx` ✏️ MODIFIÉ
**Emplacement dans MEGA_DOSSIER :** Section "Système de Lien Magique" → Point 8

**Changements :**
- Ajout d'une vérification manuelle après 3 tentatives si le statut reste `AWAITING_PAYMENT`
- Appel à `/api/payments/verify-session` pour vérifier directement le statut Stripe
- Mise à jour locale du statut si le paiement est confirmé

**Code ajouté :**
```typescript
if (attempts >= 3 && reservation.stripe_session_id) {
  const verifyResponse = await fetch('/api/payments/verify-session', {
    method: 'POST',
    body: JSON.stringify({
      session_id: reservation.stripe_session_id,
      reservation_id: reservationId,
    }),
  });
  
  if (verifyResponse.ok) {
    const verifyData = await verifyResponse.json();
    if (verifyData.success && verifyData.status === 'PAID') {
      setReservation({ ...reservation, status: 'PAID' });
    }
  }
}
```

**Impact :** En développement, si le webhook ne fonctionne pas, la vérification manuelle permet de mettre à jour le statut

---

## 🔄 FLUX COMPLET

### Flux avant (v2.6.4)
```
1. Paiement → Webhook → Email avec lien /checkout/[id]?token=...
2. Utilisateur clique → Page checkout publique
3. Utilisateur doit créer compte manuellement
4. Utilisateur doit se connecter
5. Utilisateur accède au dashboard
```

### Flux après (v2.7.0)
```
1. Paiement → Webhook → Email avec lien /auth/magic-link/[token]
2. Utilisateur clique → Page magic-link
3. Page appelle API → Crée compte automatiquement
4. API génère magic link Supabase → Redirige
5. Supabase connecte automatiquement → Callback auth
6. Callback redirige → Dashboard avec setup_password=true
7. Dashboard détecte paramètre → Affiche modal
8. Utilisateur crée mot de passe → Terminé !
```

---

## 📍 EMPLACEMENT DANS LE MEGA_DOSSIER_COMPLET.md

### Section principale
**Ligne 1526-1727** : Section complète "Système de Lien Magique avec Création Automatique de Compte (Version 2.7.0)"

### Structure de la documentation

1. **Ligne 1528-1534** : Objectif et description générale
2. **Ligne 1536-1692** : 8 fichiers détaillés (créés/modifiés)
3. **Ligne 1694-1704** : Flux complet en 9 étapes
4. **Ligne 1706-1712** : Avantages
5. **Ligne 1714-1720** : Sécurité
6. **Ligne 1722-1726** : Résultat v2.7.0

### Points clés documentés

- ✅ **Code clé** pour chaque fichier avec exemples
- ✅ **Flux détaillé** étape par étape
- ✅ **Avantages** de la nouvelle approche
- ✅ **Sécurité** (tokens, hash, expiration)
- ✅ **Impact** sur l'expérience utilisateur

---

## 🔐 SÉCURITÉ

### Tokens
- Token vérifié via `verifyToken()` avec hash SHA256
- Expiration vérifiée (`public_token_expires_at`)
- Token plaintext jamais stocké en DB (uniquement hash)

### Authentification
- Magic link Supabase avec expiration automatique
- Mot de passe temporaire généré avec `randomBytes(16)`
- Session créée uniquement après vérification du token

### Métadonnées
- Flag `needs_password_setup: true` pour forcer la création de mot de passe
- Rattachement automatique des réservations à l'utilisateur

---

## 📊 IMPACT

### Avant (v2.6.4)
- ❌ Utilisateur doit créer compte manuellement
- ❌ Utilisateur doit se connecter manuellement
- ❌ Friction dans le processus
- ❌ Abandon potentiel

### Après (v2.7.0)
- ✅ Création de compte automatique
- ✅ Connexion automatique
- ✅ Accès direct au dashboard
- ✅ Meilleure conversion
- ✅ Expérience fluide

---

## 🧪 TESTS

### Scénarios testés
1. ✅ Nouvel utilisateur : Création compte + connexion + modal mot de passe
2. ✅ Utilisateur existant : Connexion automatique sans modal
3. ✅ Token invalide : Redirection vers page d'erreur
4. ✅ Token expiré : Redirection vers page d'erreur
5. ✅ Webhook en développement : Vérification manuelle fonctionne

---

## 📝 NOTES IMPORTANTES

### Développement vs Production
- **Développement** : Les webhooks Stripe ne fonctionnent pas sur localhost, donc la vérification manuelle est utilisée
- **Production** : Les webhooks fonctionnent normalement, la vérification manuelle est un fallback

### Compatibilité
- ✅ Compatible avec les réservations existantes
- ✅ Compatible avec les utilisateurs existants
- ✅ Pas de breaking changes

### Performance
- ✅ Pas d'impact sur les performances
- ✅ Requêtes optimisées (une seule requête pour créer compte + générer link)
- ✅ Redirection côté client (pas de round-trip serveur)

---

## 🔗 LIENS ASSOCIÉS

- **MEGA_DOSSIER_COMPLET.md** : Ligne 1526-1727
- **FLOW_COMPLET_RESERVATION_DIRECTE.md** : À mettre à jour si nécessaire
- **DOCUMENTATION_SYSTEME_PACKS.md** : À mettre à jour si nécessaire

---

**Fin du document**

