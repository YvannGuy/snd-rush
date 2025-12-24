# 📦 Documentation Complète du Système de Calcul et Taille des Packs

## 🎯 Vue d'ensemble

Le système de packs est basé sur **3 types de packs** (Conférence, Soirée, Mariage) avec **3 paliers de taille** (S, M, L) qui s'ajustent automatiquement selon le nombre de personnes. Le calcul est **100% frontend** et ne modifie pas le backend.

---

## 💰 Prix de Base des Packs

| Pack | Prix de Base | Description |
|------|--------------|-------------|
| **Pack Conférence** | **279€** | Solution complète pour conférences, réunions d'affaires, présentations |
| **Pack Soirée** | **329€** | Sonorisation pour soirées et événements privés |
| **Pack Mariage** | **449€** | Solution complète pour mariages et événements importants |

---

## 📊 Paliers de Taille selon le Nombre de Personnes

### Pack Conférence

| Tier | Nombre de Personnes | Matériel Inclus | Multiplicateur Prix | Prix Final |
|------|---------------------|-----------------|---------------------|------------|
| **S** | ≤ 30 | 1x Enceinte<br>2x Micro HF<br>1x Console de mixage | **-15%** (×0.85) | **237€** |
| **M** | 30-70 | 2x Enceinte<br>3x Micro HF<br>1x Console de mixage | **+10%** (×1.1) | **307€** |
| **L** | 70-150 | 2x Enceinte<br>2x Caisson de basses<br>4x Micro HF<br>1x Console de mixage | **+25%** (×1.25) | **349€** |
| **XL** | 150+ | 2x Enceinte<br>2x Caisson de basses<br>4x Micro HF<br>1x Console de mixage | **+50%** (×1.5) | **419€** |

**Pack par défaut** : Pack S (si pas de nombre de personnes renseigné)

---

### Pack Soirée

| Tier | Nombre de Personnes | Matériel Inclus | Multiplicateur Prix | Prix Final |
|------|---------------------|-----------------|---------------------|------------|
| **S** | ≤ 30 | 1x Enceinte<br>1x Console de mixage | **-15%** (×0.85) | **280€** |
| **M** | 30-70 | 2x Enceinte<br>1x Console de mixage | **+10%** (×1.1) | **362€** |
| **L** | 70-150 | 2x Enceinte<br>2x Caisson de basses<br>4x Micro HF<br>1x Console de mixage | **+25%** (×1.25) | **411€** |
| **XL** | 150+ | 2x Enceinte<br>2x Caisson de basses<br>4x Micro HF<br>1x Console de mixage | **+50%** (×1.5) | **494€** |

**Pack par défaut** : Pack S (si pas de nombre de personnes renseigné)

---

### Pack Mariage

| Tier | Nombre de Personnes | Matériel Inclus | Multiplicateur Prix | Prix Final |
|------|---------------------|-----------------|---------------------|------------|
| **M** | 30-70 | 2x Enceinte<br>1x Caisson de basses<br>2x Micro<br>1x Console de mixage | **+10%** (×1.1) | **494€** |
| **L** | 70-150 | 2x Enceinte<br>2x Caisson de basses<br>4x Micro HF<br>1x Console de mixage | **+25%** (×1.25) | **561€** |
| **XL** | 150+ | 2x Enceinte<br>2x Caisson de basses<br>4x Micro HF<br>1x Console de mixage | **+50%** (×1.5) | **674€** |

**⚠️ IMPORTANT** : Pack Mariage **commence directement en Pack M** (pas de Pack S disponible)

---

## 🎚️ Options et Ajustements Supplémentaires

### 1. Micros Supplémentaires (Packs M et L uniquement)

Les utilisateurs peuvent ajouter des micros supplémentaires uniquement pour les packs M et L :

| Type | Prix | Disponibilité |
|------|------|--------------|
| **Micro filaire** | **+10€** | Packs M et L uniquement |
| **Micro sans fil** | **+20€** | Packs M et L uniquement |

**Calcul** : `Prix final = Prix du pack ajusté + (nombre de micros × prix du micro)`

**Exemple** :
- Pack Conférence M : 307€
- + 2 micros sans fil : +40€
- **Total : 347€**

---

### 2. Ajustements selon l'Ambiance (Conférence et Soirée uniquement)

Si l'utilisateur sélectionne une ambiance **"fort"** ou **"mixte"** :

- **Ajout automatique** : 1x Caisson de basses (si pas déjà présent)
- **Majoration** : **+15%** sur le prix du pack
- **Condition** : Uniquement pour packs M et L
- **Exception** : Pack Mariage (déjà équipé d'un caisson)

**Exemple** :
- Pack Conférence M : 307€
- Ambiance "fort" → +1 caisson → +15% → **353€**

---

### 3. Ajustements selon Intérieur/Extérieur

Si l'utilisateur sélectionne **"extérieur"** :

- **Ajout automatique** : +1 Enceinte supplémentaire
- **Majoration** : **+10%** sur le prix du pack

**Exemple** :
- Pack Conférence M : 307€
- Extérieur → +1 enceinte → +10% → **338€**

---

## 💳 Système de Caution

La caution est calculée selon le **type de pack** et le **tier** :

### Caution de Base par Pack

| Pack | Caution Base |
|------|--------------|
| **Conférence** | **700€** |
| **Soirée** | **1100€** |
| **Mariage** | **1600€** |

### Multiplicateurs selon le Tier

| Tier | Multiplicateur | Exemple Conférence |
|------|----------------|-------------------|
| **S** | ×1.0 (base) | 700€ |
| **M** | ×1.2 (+20%) | **840€** |
| **L** | ×1.5 (+50%) | **1050€** |

**Formule** : `Caution = Caution de base × Multiplicateur tier`

**Exemples** :
- Pack Conférence S : 700€ × 1.0 = **700€**
- Pack Conférence M : 700€ × 1.2 = **840€**
- Pack Conférence L : 700€ × 1.5 = **1050€**
- Pack Mariage M : 1600€ × 1.2 = **1920€**
- Pack Mariage L : 1600€ × 1.5 = **2400€**

---

## 📋 Calcul du Prix Final

### Formule Complète

```
Prix Final = (Prix de base × Multiplicateur tier) 
           + (Ajustement ambiance si applicable) 
           + (Ajustement extérieur si applicable)
           + (Micros supplémentaires)
```

### Exemple de Calcul Complet

**Scénario** : Pack Conférence pour 50 personnes, ambiance "fort", extérieur, +2 micros sans fil

1. **Détermination du tier** : 50 personnes → Pack M
2. **Prix de base ajusté** : 279€ × 1.1 = **307€**
3. **Ajustement ambiance** : +15% (caisson) = 307€ × 1.15 = **353€**
4. **Ajustement extérieur** : +10% = 353€ × 1.1 = **388€**
5. **Micros supplémentaires** : +2 × 20€ = **+40€**
6. **Prix final** : **428€**

---

## 🔄 Logique de Calcul (Code)

### Fichier : `lib/pack-tier-logic.ts`

```typescript
function calculatePackTier(
  basePack: BasePack,
  peopleCount: number | null,
  ambiance: string = '',
  indoorOutdoor: string = ''
): PackTierAdjustment
```

**Étapes de calcul** :

1. **Si pas de nombre de personnes** :
   - Conférence/Soirée → Pack S (prix de base)
   - Mariage → Pack M (prix de base × 1.1)

2. **Détermination du tier** :
   - ≤ 30 pers → Tier S
   - 30-70 pers → Tier M
   - 70-150 pers → Tier L
   - 150+ pers → Tier L avec prix ×1.5

3. **Configuration matériel** selon pack + tier

4. **Ajustements** :
   - Ambiance "fort"/"mixte" → +caisson (+15%) si M ou L
   - Extérieur → +1 enceinte (+10%)

5. **Calcul prix final** : `basePrice × priceMultiplier`

---

## 📍 Prix de Livraison (Désactivé)

**⚠️ ACTUELLEMENT DÉSACTIVÉ** : Le prix est **fixe** et ne varie plus selon le code postal.

Les prix de livraison existent dans le code mais ne sont **pas appliqués** :

| Zone | Code Postal | Prix (non appliqué) |
|------|-------------|---------------------|
| **Paris** | 75xxx | 80€ |
| **Petite couronne** | 92xxx, 93xxx, 94xxx | 60€ |
| **Grande couronne** | 77xxx, 78xxx, 91xxx, 95xxx | 90€ |

---

## 💰 Système de Paiement

### Acompte

- **30%** du prix final à payer immédiatement
- **Formule** : `Acompte = Prix final × 0.3`

### Solde

- **70%** du prix final à régler **J-5** (5 jours avant l'événement)
- **Formule** : `Solde = Prix final - Acompte`

### Caution

- Montant calculé selon pack + tier (voir section Caution)
- Demandée **J-2** (2 jours avant l'événement)
- **Bloquée** sur la carte mais **non débitée** sauf dommage/perte

---

## 📝 Exemples Complets

### Exemple 1 : Pack Conférence Simple

- **Nombre de personnes** : 25
- **Pack déterminé** : Pack S
- **Prix** : 279€ × 0.85 = **237€**
- **Acompte** : 237€ × 0.3 = **71€**
- **Solde** : 237€ - 71€ = **166€**
- **Caution** : 700€ × 1.0 = **700€**

---

### Exemple 2 : Pack Mariage avec Options

- **Nombre de personnes** : 100
- **Pack déterminé** : Pack L
- **Prix de base** : 449€ × 1.25 = **561€**
- **+ 3 micros sans fil** : +60€
- **Prix final** : **621€**
- **Acompte** : 621€ × 0.3 = **186€**
- **Solde** : 621€ - 186€ = **435€**
- **Caution** : 1600€ × 1.5 = **2400€**

---

### Exemple 3 : Pack Soirée Extérieur

- **Nombre de personnes** : 60
- **Pack déterminé** : Pack M
- **Prix de base** : 329€ × 1.1 = **362€**
- **Extérieur** : +10% = **398€**
- **Acompte** : 398€ × 0.3 = **119€**
- **Solde** : 398€ - 119€ = **279€**
- **Caution** : 1100€ × 1.2 = **1320€**

---

## 🎯 Règles Spéciales

1. **Pack Mariage** : Commence toujours en Pack M (pas de Pack S)
2. **Micros supplémentaires** : Disponibles uniquement pour packs M et L
3. **Caisson automatique** : Ajouté pour ambiance "fort"/"mixte" (sauf Mariage)
4. **Prix fixe** : Pas de variation selon code postal (livraison incluse)
5. **Frontend-only** : Tous les calculs sont côté client, pas de modification backend

---

## 📂 Fichiers Clés

- **`lib/pack-tier-logic.ts`** : Logique de calcul des tiers et ajustements
- **`lib/packs/basePacks.ts`** : Définition des packs de base et prix
- **`lib/zone-detection.ts`** : Détection zone (non utilisée actuellement)
- **`components/ReservationWizard.tsx`** : Interface wizard de réservation
- **`app/book/[pack_key]/BookPageContent.tsx`** : Page de réservation avec calculs

---

## 🔍 Points d'Attention

1. **Prix arrondis** : Les prix sont arrondis avec `Math.round()`
2. **Multiplicateurs cumulatifs** : Les ajustements s'additionnent (ex: +15% + 10% = +25%)
3. **Pack L standardisé** : Tous les packs L ont la même configuration matériel
4. **Caution tier-based** : La caution dépend du tier final, pas du pack de base

---

*Documentation générée le : $(date)*
*Version : 1.0*
