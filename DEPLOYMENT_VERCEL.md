# 🚀 Déploiement Vercel et Configuration Environnement

## ⚠️ Problème Actuel

**Sur mobile en production** :
- ❌ Badge ROUGE : `⚠️ Supabase NON configuré`
- ❌ Photos ne s'enregistrent pas dans Supabase
- ❌ Photos en base64 → Crash ou erreur
- ❌ Analyse IA désactivée
- ❌ Erreur: "Application error: a client-side exception has occurred"

**Cause** : Les variables d'environnement Supabase ne sont pas configurées en production sur Vercel.

---

## ✅ Solution : Configurer les Variables d'Environnement sur Vercel

### Étape 1 : Accéder aux paramètres Vercel

1. Ouvrez https://vercel.com
2. Connectez-vous
3. Sélectionnez votre projet **SND Rush**
4. Cliquez sur **Settings** (dans le menu en haut)

### Étape 2 : Ajouter les Variables d'Environnement

1. Dans le menu latéral, cliquez sur **Environment Variables**
2. Vous devriez voir une page pour ajouter des variables

### Étape 3 : Ajouter les 3 Variables Requises

**Variable 1 : NEXT_PUBLIC_SUPABASE_URL**
- **Key** : `NEXT_PUBLIC_SUPABASE_URL`
- **Value** : `https://juxjiuzlvlxvmocnqxql.supabase.co`
- **Environments** : ✅ Production, ✅ Preview, ✅ Development
- Cliquez **"Add"**

**Variable 2 : NEXT_PUBLIC_SUPABASE_ANON_KEY**
- **Key** : `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value** : Votre clé anon Supabase (trouvez-la dans `.env.local`)
- **Environments** : ✅ Production, ✅ Preview, ✅ Development
- Cliquez **"Add"**

**Variable 3 : OPENAI_API_KEY**
- **Key** : `OPENAI_API_KEY`
- **Value** : Votre clé OpenAI (trouvez-la dans `.env.local`)
- **Environments** : ✅ Production, ✅ Preview, ✅ Development
- Cliquez **"Add"**

### Étape 4 : Redéployer

**⚠️ IMPORTANT** : Les nouvelles variables ne sont actives qu'après un nouveau déploiement !

**Option A : Redéployer automatiquement**
1. Dans **Deployments**, cliquez sur le dernier déploiement
2. Cliquez sur **"..."** (3 points en haut à droite)
3. Sélectionnez **"Redeploy"**
4. Confirmez

**Option B : Nouveau commit (plus simple)**
1. Faites un petit changement (ex: espace dans un commentaire)
2. `git add -A && git commit -m "chore: redeploy with env vars" && git push`
3. Vercel redéploie automatiquement

### Étape 5 : Vérifier

Une fois le déploiement terminé (⏱️ 2-3 minutes) :

1. Ouvrez votre site en production sur iPhone
2. Allez sur `/etat-materiel`
3. **Regardez le badge** :
   - 🟢 **Badge VERT** : `📡 Supabase + IA OK` → ✅ Succès !
   - 🔴 **Badge ROUGE** : Retournez vérifier les variables

---

## 🔍 Où Trouver Vos Clés Supabase

### Option 1 : Dans votre `.env.local` local

Ouvrez le fichier `.env.local` à la racine du projet :
```env
NEXT_PUBLIC_SUPABASE_URL=https://juxjiuzlvlxvmocnqxql.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-...
```

**⚠️ Utilisez EXACTEMENT les mêmes valeurs** pour Vercel !

### Option 2 : Dashboard Supabase

1. Ouvrez https://app.supabase.com
2. Sélectionnez votre projet
3. Dans le menu latéral, cliquez sur **Settings** (icône ⚙️)
4. Cliquez sur **API**
5. Vous verrez :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Copiez ces valeurs** et ajoutez-les dans Vercel.

---

## 📊 Diagnostic : Vérifier les Variables

### Dans Vercel

1. **Settings** → **Environment Variables**
2. Vérifiez que vous voyez bien les 3 variables :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
3. Vérifiez que **"Production"** est coché pour chacune ✅

### Après Redéploiement

Dans les **Deployment Logs** de Vercel, cherchez :
```
✓ Loaded env from .env.local
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - OPENAI_API_KEY
```

---

## 🎯 Résultat Attendu

### AVANT Configuration (Actuellement)

**Sur iPhone (production)** :
- 🔴 Badge ROUGE
- ❌ Photos en base64
- ❌ Erreur "Application error"
- ❌ Pas d'analyse IA
- ❌ Crash possible sur upload

### APRÈS Configuration

**Sur iPhone (production)** :
- 🟢 Badge VERT
- ✅ Photos uploadées dans Supabase
- ✅ Pas d'erreur
- ✅ Analyse IA automatique (5-10s)
- ✅ Rapport dans l'interface et PDF

---

## 🛠️ Dépannage

### "Les variables ne s'affichent pas dans Vercel"

- Essayez de rafraîchir la page
- Vérifiez que vous êtes sur le bon projet
- Vérifiez vos permissions (Owner ou Admin requis)

### "Le badge reste rouge après redéploiement"

1. Vérifiez que les 3 variables sont bien présentes
2. Vérifiez qu'elles sont activées pour **Production** ✅
3. Attendez 2-3 min que le déploiement se propage
4. **Videz le cache Safari** sur iPhone :
   - Réglages → Safari → Effacer historique et données de sites web
5. Rechargez la page

### "J'ai ajouté les variables mais ça ne marche toujours pas"

1. Vérifiez que vous avez **redéployé** après avoir ajouté les variables
2. Les variables ne sont actives qu'après un nouveau déploiement
3. Dans Vercel → **Deployments** → Dernier déploiement → Vérifiez qu'il est en **"Ready"**

### "Erreur QuotaExceededError"

Cela signifie que trop de données base64 sont stockées. Solutions :
1. Configurez Supabase en production (recommandé)
2. Supprimez les anciennes photos
3. Utilisez le bouton "🗑️ Réinitialiser tout"

---

## 📋 Checklist Complète

- [ ] Variables ajoutées dans Vercel (Settings → Environment Variables)
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `OPENAI_API_KEY`
- [ ] Environnements cochés (Production, Preview, Development)
- [ ] Site redéployé (Deployments → Redeploy ou nouveau commit)
- [ ] Déploiement terminé (status "Ready")
- [ ] Cache Safari vidé sur iPhone
- [ ] Page rechargée
- [ ] Badge VERT visible ✅

---

## 🎊 Une Fois Configuré

**Workflow complet fonctionnel** :

1. 📱 Upload photo AVANT (iPhone, format JPEG)
2. ✅ Sauvegarde Supabase Storage
3. 📸 Upload photo APRÈS (iPhone, format JPEG)
4. ✅ Sauvegarde Supabase Storage
5. 🤖 Analyse IA automatique (5-10s)
6. 📊 Rapport avec barème de facturation
7. 📄 PDF généré avec tout le détail
8. ✅ Client ne peut pas contester (preuve IA objective)

---

## 💡 Pourquoi c'est Crucial

### Sans Supabase en Production

- Photos en base64 → Très lourd (1 photo = ~1-3 MB en base64)
- Stockage local limité (quota navigateur ~5-10 MB)
- Crash si quota dépassé
- Pas d'analyse IA (OpenAI refuse base64)
- Pas de preuve objective pour facturation

### Avec Supabase en Production

- Photos en URL → Léger (<1 KB par photo)
- Stockage illimité (Supabase)
- Pas de crash
- Analyse IA automatique
- Rapport IA fait foi juridiquement

---

## 🔗 Ressources

- **Vercel Docs** : https://vercel.com/docs/projects/environment-variables
- **Supabase API Keys** : https://app.supabase.com → Settings → API
- **OpenAI API Keys** : https://platform.openai.com/api-keys

---

**Configurez maintenant et tout fonctionnera parfaitement sur mobile !** 📱✨

