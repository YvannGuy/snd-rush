# 🤖 Configuration Analyse IA des Photos

Ce guide explique comment activer l'analyse automatique des photos avec GPT-4 Vision.

## 🎯 Fonctionnalité

**Analyse automatique et comparative des photos** :
- ✅ Photo AVANT → IA documente l'état initial
- ✅ Photo APRÈS → IA compare avec AVANT et détecte TOUS les changements
- ✅ Génération automatique de rapport détaillé
- ✅ Auto-remplissage de l'état du matériel
- ✅ Preuve contractuelle horodatée et objective

---

## 🔑 1. Obtenir une clé API OpenAI

### Créer un compte OpenAI
1. Allez sur [platform.openai.com](https://platform.openai.com)
2. Créez un compte ou connectez-vous
3. Allez dans **API Keys** (menu gauche)
4. Cliquez sur **Create new secret key**
5. Donnez un nom : `SND Rush - Analyse Photos`
6. Copiez la clé (format: `sk-proj-...`)

### Ajouter du crédit
1. Allez dans **Billing** (menu gauche)
2. Ajoutez un moyen de paiement
3. Ajoutez au moins **5€** de crédit pour commencer
4. Les analyses coûtent ~0.01€ chacune

---

## ⚙️ 2. Configurer la clé API

### Créer le fichier `.env.local`

À la racine du projet, créez un fichier `.env.local` :

```env
# Supabase (si configuré)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon-publique

# OpenAI API pour analyse automatique des photos
OPENAI_API_KEY=sk-proj-votre-cle-ici

# Autres services...
```

### Redémarrer le serveur

```bash
npm run dev
```

---

## 🧪 3. Tester l'analyse automatique

### Test simple :

1. Allez sur `/etat-materiel`
2. Connectez-vous (`sndrush2025`)
3. Ajoutez un matériel
4. **Uploadez une photo AVANT** (optionnel)
5. **Uploadez une photo APRÈS**
6. **Ouvrez la console** (F12)

### Vous devriez voir :

```
📸 Traitement de 1 photo(s)
🔍 Supabase configuré: true/false
🤖 Lancement analyse IA automatique...
✅ Analyse IA reçue: {...}
✅ Aucun dommage détecté par l'IA
```

OU

```
⚠️ 3 dommage(s) détecté(s) par l'IA
```

### Dans l'interface :

Un encadré jaune (si dommages) ou vert (si OK) s'affiche avec :

```
🤖 Analyse IA automatique [OK]

État général: Bon
⚠️ NOUVEAUX DOMMAGES DÉTECTÉS:
• RAYURE (moyenne) - panneau latéral gauche
  Rayure de 8cm sur le plastique

Analysé le 08/10/2025 15:30:45 - gpt-4o
```

---

## 📄 4. Dans le PDF

Le rapport IA s'affiche automatiquement dans le PDF final :

```
┌─────────────────────────────────────────────────┐
│ 🤖 ANALYSE AUTOMATIQUE PAR INTELLIGENCE         │
│    ARTIFICIELLE                                  │
│                                                  │
│ État général: Dégradation visible               │
│ Recommandation: FACTURATION_IMPORTANTE          │
│                                                  │
│ ⚠️ NOUVEAUX DOMMAGES DÉTECTÉS:                  │
│ • RAYURE (grave) - panneau latéral gauche       │
│   Rayure profonde de 12cm traversant le logo    │
│ • CHOC (moyenne) - angle inférieur droit        │
│   Déformation du capot avec plastique enfoncé   │
│                                                  │
│ Rapport généré automatiquement le 08/10/2025    │
│ Modèle: gpt-4o                                   │
│ Ce rapport fait foi comme preuve contractuelle  │
│ objective                                        │
└─────────────────────────────────────────────────┘
```

**Valeur juridique** : Preuve technique automatisée, horodatée, neutre et objective.

---

## 💰 5. Coût

### Tarification OpenAI GPT-4 Vision :

| Résolution | Prix input | Prix output |
|------------|------------|-------------|
| Standard | $2.50 / 1M tokens | $10 / 1M tokens |
| High detail | $5 / 1M tokens | $15 / 1M tokens |

### En pratique :

- **1 analyse** (2 photos) : ~0.01-0.02€
- **10 équipements** : ~0.15€ par événement
- **100 événements/mois** : ~15€/mois

### Budget recommandé :

- Débutant : 10€/mois (600-700 analyses)
- Usage normal : 20€/mois (1500+ analyses)
- Usage intensif : 50€/mois (3000+ analyses)

---

## 🔍 6. Ce que l'IA peut détecter

### ✅ Très bien détecté :
- Rayures (localisation, taille)
- Chocs, bosses, déformations
- Salissures, taches
- Traces de liquide
- Éléments manquants
- Grilles enfoncées
- Capots cassés
- Connecteurs abîmés

### ⚠️ Moins bien :
- Micro-rayures < 1mm
- Problèmes internes (électronique)
- Différences d'éclairage
- Usure normale vs dommage

### ❌ Impossible :
- Test fonctionnel (son, électrique)
- Odeurs
- Problèmes cachés

---

## 🛡️ 7. Valeur juridique

### Pourquoi c'est indiscutable :

**1. Automatisation complète**
- ✅ Analyse déclenchée **automatiquement** à l'upload
- ✅ Impossible de modifier après coup
- ✅ Horodatage précis (timestamp)

**2. Objectivité**
- ✅ IA neutre (pas d'intérêt dans le litige)
- ✅ Pas de subjectivité humaine
- ✅ Même algorithme pour tous

**3. Traçabilité**
- ✅ Timestamp de l'analyse
- ✅ Modèle utilisé (gpt-4o)
- ✅ Photos horodatées
- ✅ Rapport inclus dans PDF signé

**4. Opposabilité**
- ✅ Mention dans CGV
- ✅ Client informé lors de la signature
- ✅ Rapport fait partie du contrat

---

## 🚨 8. Dépannage

### Erreur : "Pas de réponse de GPT-4"

**Cause** : Clé API invalide ou crédit insuffisant

**Solution** :
1. Vérifiez votre clé dans `.env.local`
2. Vérifiez votre crédit sur platform.openai.com
3. Redémarrez le serveur Next.js

### L'analyse ne se lance pas

**Cause** : Photos pas en Supabase ou base64 trop gros

**Solution** :
1. Configurez Supabase Storage (voir SUPABASE_SETUP_GUIDE.md)
2. Ou réduisez la taille des photos avant upload

### Analyse trop lente

**Cause** : GPT-4 Vision prend 5-10 secondes par photo

**Solution** : C'est normal. Un indicateur de chargement s'affiche.

---

## 📊 9. Exemple de rapport IA

### Cas 1 : Matériel OK

```json
{
  "etatGeneral": "Bon",
  "changementsDetectes": false,
  "nouveauxDommages": [],
  "commentaireComparatif": "Le matériel est identique aux photos de livraison, aucun dommage détecté.",
  "recommandation": "OK",
  "montantEstime": 0
}
```

### Cas 2 : Dommages détectés

```json
{
  "etatGeneral": "Dégradation visible",
  "changementsDetectes": true,
  "nouveauxDommages": [
    {
      "type": "rayure",
      "localisation": "panneau latéral gauche",
      "gravite": "moyenne",
      "description": "Rayure de 8cm sur la surface plastique, absente sur photo initiale",
      "visible_avant": false
    },
    {
      "type": "choc",
      "localisation": "angle inférieur droit",
      "gravite": "grave",
      "description": "Déformation du capot avec plastique enfoncé de 5mm",
      "visible_avant": false
    }
  ],
  "commentaireComparatif": "Deux nouveaux dommages significatifs détectés par rapport à la livraison",
  "recommandation": "FACTURATION_IMPORTANTE",
  "montantEstime": 150
}
```

---

## 🔄 10. Workflow automatique

```
LIVRAISON
├─ Upload photo AVANT
├─ IA: "Documente état actuel"
└─ Rapport: "Équipement en parfait état"
     │
     └─ Sauvegardé + horodaté
          │
ÉVÉNEMENT
          │
REPRISE
├─ Upload photo APRÈS
├─ 🤖 IA s'active AUTOMATIQUEMENT
├─ Compare AVANT vs APRÈS
├─ Détecte: rayure + choc + salissure
├─ Génère rapport détaillé
├─ Auto-rempli état = "Dégradation visible"
└─ Affiche encadré jaune avec détails
     │
     └─ Client signe
          │
          └─ PDF généré avec rapport IA
               │
               └─ PREUVE INCONTESTABLE
```

---

## 💡 11. Conseil d'utilisation

**Pour maximiser l'efficacité** :

1. **Photos de qualité** : Bien éclairées, nettes, même angle si possible
2. **Photo AVANT obligatoire** : Pour comparaison optimale
3. **Plusieurs angles** : Si gros dommage, prenez 2-3 photos
4. **Laisser analyser** : L'IA prend 5-10s, c'est normal
5. **Vérifier le rapport** : L'IA peut se tromper, validation humaine recommandée

---

## ✅ Activation

L'analyse IA est **automatique** dès que vous :
1. Ajoutez `OPENAI_API_KEY` dans `.env.local`
2. Redémarrez le serveur
3. Uploadez une photo APRÈS

Pas de configuration supplémentaire nécessaire ! 🎉

