# Guide : Résoudre le problème de confirmation d'email

## Problème
Quand vous cliquez sur "✅ Confirmer mon email" dans l'email de Supabase, Safari affiche :
> "Safari ne peut pas ouvrir la page car l'adresse n'est pas valide."

## Causes possibles

### 1. Variable d'environnement `NEXT_PUBLIC_BASE_URL` manquante ou invalide

**Vérification :**
- Ouvrez votre fichier `.env.local`
- Vérifiez que `NEXT_PUBLIC_BASE_URL` est définie et valide

**En développement local :**
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**En production :**
```env
NEXT_PUBLIC_BASE_URL=https://votre-domaine.com
```

**Important :**
- L'URL doit commencer par `http://` ou `https://`
- Pas d'espace avant/après
- Pas de slash final (`/`)

### 2. Configuration Supabase incorrecte

**Dans le dashboard Supabase :**

1. Allez dans **Authentication** → **URL Configuration**

2. Vérifiez **Site URL** :
   - En développement : `http://localhost:3000`
   - En production : `https://votre-domaine.com`

3. Vérifiez **Redirect URLs** (liste des URLs autorisées) :
   - `http://localhost:3000/auth/callback` (développement)
   - `https://votre-domaine.com/auth/callback` (production)
   - `http://localhost:3000/reinitialiser-mot-de-passe` (reset password)
   - `https://votre-domaine.com/reinitialiser-mot-de-passe` (reset password)

4. **Important** : Ajoutez toutes les URLs que vous utilisez, une par ligne

### 3. Vérifier les logs du navigateur

**Ouvrez la console du navigateur (F12) et regardez :**

Quand vous créez un compte, vous devriez voir :
```
🔐 Tentative d'inscription pour: votre@email.com
✅ URL de redirection validée: http://localhost:3000/auth/callback
📧 Envoi de l'email de confirmation avec URL: http://localhost:3000/auth/callback
```

Si vous voyez une erreur ou une URL invalide, notez-la.

### 4. Vérifier l'email reçu

**Dans l'email de confirmation Supabase :**

1. Cliquez avec le bouton droit sur le lien "Confirmer mon email"
2. Sélectionnez "Copier l'adresse du lien"
3. Collez-la dans un éditeur de texte
4. Vérifiez que l'URL est valide :
   - Commence par `http://` ou `https://`
   - Ne contient pas d'espaces
   - Ne contient pas de caractères bizarres

**Exemple d'URL valide :**
```
https://votre-projet.supabase.co/auth/v1/verify?token=xxx&type=signup&redirect_to=http://localhost:3000/auth/callback
```

**Exemple d'URL invalide :**
```
https://votre-projet.supabase.co/auth/v1/verify?token=xxx&type=signup&redirect_to=undefined/auth/callback
```

### 5. Solution temporaire : Utiliser l'URL absolue du navigateur

Le code a été modifié pour utiliser `window.location.origin` si l'URL générée est invalide. Cela devrait fonctionner automatiquement.

## Actions à faire maintenant

1. **Vérifiez `.env.local`** :
   ```bash
   cat .env.local | grep NEXT_PUBLIC_BASE_URL
   ```

2. **Vérifiez la configuration Supabase** :
   - Dashboard Supabase → Authentication → URL Configuration
   - Ajoutez toutes les URLs nécessaires

3. **Testez à nouveau** :
   - Créez un nouveau compte
   - Vérifiez les logs dans la console
   - Vérifiez l'email reçu

4. **Si le problème persiste** :
   - Copiez l'URL complète du lien dans l'email
   - Partagez-la pour analyse

## Code modifié

Les fichiers suivants ont été modifiés pour valider les URLs :
- `hooks/useAuth.ts` : Validation de toutes les URLs de redirection
- `app/auth/callback/route.ts` : Validation de l'URL de base

Les URLs sont maintenant validées avant d'être envoyées à Supabase, et une URL par défaut est utilisée si l'URL générée est invalide.
