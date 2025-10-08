# 💰 Barème de Facturation des Dégradations

## 📋 Barème Officiel

Ce barème est utilisé par l'IA GPT-4 Vision pour évaluer automatiquement le niveau de dégradation et estimer la facturation correspondante.

### 1️⃣ Usure Normale
- **Description** : Micro-rayures, traces d'usage légères, sans impact esthétique ni fonctionnel
- **Facturation** : **0€**
- **Couleur affichage** : 🟢 Vert
- **Recommandation IA** : `OK` ou `USURE_NORMALE`

**Exemples** :
- Micro-rayures invisibles à 50cm
- Traces de doigts
- Patine normale du matériel
- Usure naturelle des boutons/molettes

---

### 2️⃣ Dégradation Mineure
- **Description** : Rayures visibles mais superficielles, frottements sur boîtier, sans altération du matériau
- **Facturation** : **20-50€**
- **Couleur affichage** : 🟡 Jaune
- **Recommandation IA** : `FACTURATION_LEGERE`

**Exemples** :
- Rayures superficielles visibles
- Frottements sur angles
- Marques de choc léger sur boîtier
- Rayures qui ne traversent pas la peinture

---

### 3️⃣ Dégradation Moyenne
- **Description** : Rayures profondes, chocs esthétiques, déformation partielle du boîtier
- **Facturation** : **60-150€**
- **Couleur affichage** : 🟠 Orange
- **Recommandation IA** : `FACTURATION_LEGERE` ou `FACTURATION_IMPORTANTE`

**Exemples** :
- Rayures profondes multiples
- Chocs visibles avec déformation
- Boîtier enfoncé/tordu partiellement
- Peinture écaillée

---

### 4️⃣ Dégradation Majeure
- **Description** : Fissure, pièce cassée, panne due à un choc, matériel inutilisable
- **Facturation** : **Remplacement ou valeur à neuf**
- **Couleur affichage** : 🔴 Rouge
- **Recommandation IA** : `FACTURATION_IMPORTANTE`

**Exemples** :
- Boîtier fissuré
- Pièce cassée (bouton, connecteur, écran)
- Matériel ne fonctionne plus
- Dommage irréparable
- Élément manquant

---

## 🤖 Intégration IA

### Comment l'IA utilise le barème

L'analyse GPT-4 Vision :

1. **Compare les photos AVANT/APRÈS** du matériel
2. **Identifie les dégradations** apparues pendant la location
3. **Classifie chaque dommage** selon le barème (usure_normale, mineure, moyenne, majeure)
4. **Estime la facturation** selon le niveau de gravité
5. **Génère un rapport détaillé** avec :
   - État général
   - Niveau barème global
   - Liste des dommages avec leur niveau individuel
   - Facturation estimée
   - Recommandation finale

### Format de réponse IA

```json
{
  "etatGeneral": "Dégradation visible",
  "changementsDetectes": true,
  "niveauBareme": "moyenne",
  "nouveauxDommages": [
    {
      "type": "rayure",
      "localisation": "panneau latéral gauche",
      "gravite": "moyenne",
      "description": "Rayure profonde de 8cm traversant la peinture",
      "visible_avant": false,
      "niveauBareme": "moyenne"
    }
  ],
  "commentaireComparatif": "Apparition de rayures profondes...",
  "recommandation": "FACTURATION_LEGERE",
  "facturationEstimee": "60-150€",
  "montantEstime": 100
}
```

---

## 📊 Affichage dans l'Interface

### Couleurs par niveau

```javascript
const COULEURS_BAREME = {
  usure_normale: '#d1fae5',  // Vert clair
  mineure: '#fef3c7',        // Jaune clair
  moyenne: '#fed7aa',        // Orange clair
  majeure: '#fecaca'         // Rouge clair
};
```

### Interface utilisateur

- **Encadré coloré** selon le niveau de gravité
- **Badge niveau barème** avec couleur correspondante
- **Facturation estimée** en gras et colorée (vert si 0€, rouge si > 0€)
- **Liste des dommages** avec badge niveau pour chacun

### Dans le PDF

- Rapport IA complet avec barème
- Niveau global et facturation estimée
- Détails de chaque dommage avec son niveau
- Horodatage et modèle IA utilisé
- Mention "fait foi comme preuve contractuelle objective"

---

## 🔧 Configuration

### Modification du barème

Le barème est défini dans `/app/api/analyze-photo/route.ts` :

```typescript
const BAREME_DEGRADATIONS = {
  "usure_normale": {
    "description": "...",
    "facturation": "0€"
  },
  "mineure": {
    "description": "...",
    "facturation": "20-50€"
  },
  "moyenne": {
    "description": "...",
    "facturation": "60-150€"
  },
  "majeure": {
    "description": "...",
    "facturation": "remplacement ou valeur à neuf"
  }
};
```

### Ajouter un niveau

1. Ajouter le niveau dans `BAREME_DEGRADATIONS`
2. Mettre à jour les types TypeScript :
   - `type Dommage` : `niveauBareme`
   - `type AnalyseIA` : `niveauBareme`
3. Ajouter la couleur dans les composants d'affichage
4. Mettre à jour le prompt GPT-4

---

## 📈 Statistiques et Cas d'Usage

### Cas typiques

**🟢 Pas de facturation (70% des cas)** :
- Retour en bon état
- Usure normale uniquement
- IA valide : "OK"

**🟡 Facturation légère (20% des cas)** :
- Rayures superficielles
- Marques d'usage intensif
- Facturation : 20-50€

**🟠 Facturation moyenne (8% des cas)** :
- Chocs avec déformation
- Rayures profondes
- Facturation : 60-150€

**🔴 Remplacement (2% des cas)** :
- Casse
- Panne suite à choc
- Pièce manquante
- Facturation : Valeur à neuf

---

## ⚖️ Valeur Juridique

### Preuve contractuelle

Le rapport IA :
- ✅ **Horodaté** : Date et heure de l'analyse
- ✅ **Traçable** : Modèle IA utilisé (GPT-4o)
- ✅ **Objectif** : Analyse automatique sans intervention humaine
- ✅ **Détaillé** : Photos, descriptions, localisations précises
- ✅ **Conforme au barème** : Facturation selon grille officielle

### Contestation client

En cas de contestation :
1. Le rapport IA fait foi comme première évaluation
2. Photos AVANT/APRÈS à l'appui
3. Barème officiel communiqué et accepté (CGV)
4. Expertise humaine possible en complément
5. Client peut fournir contre-preuve datée

---

## 🎯 Avantages

### Pour l'entreprise

- ✅ **Objectivité** : Pas de jugement humain subjectif
- ✅ **Rapidité** : Analyse en 5-10 secondes
- ✅ **Traçabilité** : Rapport automatique systématique
- ✅ **Cohérence** : Même barème appliqué à tous
- ✅ **Preuve** : Documentation photo + analyse
- ✅ **Professionnalisme** : Rapport technique détaillé

### Pour le client

- ✅ **Transparence** : Barème clair et public
- ✅ **Équité** : Analyse objective IA
- ✅ **Preuves** : Photos et rapport à disposition
- ✅ **Prévisibilité** : Sait à quoi s'attendre
- ✅ **Contestation** : Possibilité de contre-expertise

---

## 📞 Support

Pour toute question sur le barème ou l'analyse IA :
- **Documentation technique** : `/ANALYSE_IA_SETUP.md`
- **Workflow complet** : `/WORKFLOW_ETAT_MATERIEL.md`
- **Config Supabase** : `/SUPABASE_BUCKET_PUBLIC.md`
- **Format photos iPhone** : `/FORMAT_PHOTOS_IPHONE.md`

---

**Mise à jour** : Le barème est intégré dans le prompt GPT-4 Vision et appliqué automatiquement à chaque analyse.

