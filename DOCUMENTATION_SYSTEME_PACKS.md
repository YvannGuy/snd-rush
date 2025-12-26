# 📦 Documentation Complète du Système de Calcul et Taille des Packs (V3 — Auto par paliers)

## 🎯 Vue d'ensemble

Le système de packs propose **3 types d’événements** (Conférence, Soirée, Mariage) et **3 tiers** (S, M, L) déterminés automatiquement par le **nombre de personnes**.

✅ Le prix final est calculé **100% côté frontend** et comprend :

* le **prix du pack** (matériel)
* la **livraison + récupération** selon la **zone (code postal)**
* l’**installation** ajoutée automatiquement dès que le tier n’est plus S
* le supplément **Récupération J+1** appliqué automatiquement selon l’**heure de fin** saisie dans le wizard

---

## ✅ Règles automatiques (sans options client)

### 1) Installation (AUTO)

* **Tier S** → ✅ installation incluse (0€)
* **Tier M / L** → ❌ installation non incluse → **surcoût ajouté automatiquement**

  * M : **+59€**
  * L : **+89€**

### 2) Livraison + récupération (AUTO) via code postal

* **Paris (75xxx)** : **+0€**
* **Petite couronne (92/93/94)** : **+60€**
* **Grande couronne (77/78/91/95)** : **+90€**

### 3) Récupération J+1 (AUTO) via l’heure de fin (wizard)

* Si la récupération peut se faire **le jour J** dans la fenêtre standard → **0€**
* Si l’heure de fin implique une récupération **le lendemain (J+1)** → surcoût AUTO selon zone :

  * Paris : **+45€**
  * Petite couronne : **+70€**
  * Grande couronne : **+110€**

> Règle recommandée (simple et compréhensible) :
> **Si l’heure de fin est après 02:00 am → récupération J+1 automatique.**

---

## 💰 Prix des Packs (matériel uniquement — “base Paris”)

> Les prix ci-dessous correspondent au **matériel**.
> Ensuite le système ajoute automatiquement : **livraison zone + installation (si M/L) + J+1 (si applicable)**.

---

## 📊 Packs & Tiers (V2 matos)

### Pack Conférence (V2)

| Tier  | Personnes | Matériel Inclus                                                          | Prix Pack (base) |
| ----- | --------: | ------------------------------------------------------------------------ | ---------------: |
| **S** |      ≤ 30 | 1x Enceinte<br>2x Micro HF<br>1x Console de mixage                       |         **299€** |
| **M** |     30–70 | 2x Enceintes<br>3x Micro HF<br>1x Console de mixage                      |         **389€** |
| **L** |    70–150 | 2x Enceintes façade<br>4x Micro HF<br>1x Console<br>+ 2x Enceintes delay |         **569€** |

---

### Pack Soirée (V2)

| Tier  | Personnes | Matériel Inclus                           | Prix Pack (base) |
| ----- | --------: | ----------------------------------------- | ---------------: |
| **S** |      ≤ 30 | 1x Enceinte<br>1x Console de mixage       |         **249€** |
| **M** |     30–70 | 2x Enceintes<br>1x Caisson<br>1x Console  |         **399€** |
| **L** |    70–150 | 2x Enceintes<br>2x Caissons<br>1x Console |         **499€** |

---

### Pack Mariage (V2)

| Tier  | Personnes | Matériel Inclus                                          | Prix Pack (base) |
| ----- | --------: | -------------------------------------------------------- | ---------------: |
| **S** |      ≤ 30 | 1x Enceinte<br>1x Caisson<br>2x Micro HF<br>1x Console   |         **349€** |
| **M** |     30–70 | 2x Enceintes<br>1x Caisson<br>2x Micro HF<br>1x Console  |         **499€** |
| **L** |    70–150 | 2x Enceintes<br>2x Caissons<br>4x Micro HF<br>1x Console |         **649€** |

---

## 📍 Barème zone (AUTO) : livraison + récupération

| Zone                | Code Postal       | Surcoût Zone |
| ------------------- | ----------------- | -----------: |
| **Paris**           | 75xxx             |      **+0€** |
| **Petite couronne** | 92 / 93 / 94      |     **+60€** |
| **Grande couronne** | 77 / 78 / 91 / 95 |     **+90€** |

---

## 🛠️ Barème installation (AUTO)

| Tier  | Surcoût Installation |
| ----- | -------------------: |
| **S** |    **+0€** (incluse) |
| **M** |             **+59€** |
| **L** |             **+89€** |

---

## 🕒 Barème récupération J+1 (AUTO)

### Déclencheur (wizard)

* Si `endTime > 02:00` → récupération **J+1** automatiquement

| Zone            | Surcoût J+1 |
| --------------- | ----------: |
| Paris           |    **+45€** |
| Petite couronne |    **+70€** |
| Grande couronne |   **+110€** |

---

## 📋 Calcul du Prix Final (Formule)

```
PrixFinal =
  PrixPackBase(pack, tier)
+ SurcoutZone(codePostal)
+ SurcoutInstallation(tier)          // S=0, M=+59, L=+89
+ SurcoutRecuperationJPlus1(endTime, zone)  // 0 ou J+1 selon règle
```

---

## 🧠 Logique de calcul (résumé)

1. Déterminer le **tier** via nombre de personnes (S/M/L)
2. Charger `PrixPackBase` + matériel correspondant
3. Déterminer la **zone** via code postal → ajouter `SurcoutZone`
4. Si tier M/L → ajouter automatiquement `SurcoutInstallation`
5. Si `endTime > seuil` → ajouter automatiquement `SurcoutJ+1` selon zone

---

## 💳 Paiement

### Acompte

* **30%** immédiatement
  `Acompte = PrixFinal × 0.30`

### Solde

* **70%** à régler **J-5**
  `Solde = PrixFinal - Acompte`

### Caution

* Demandée **J-2**
* Calcul selon pack + tier (voir section caution)

---

## 💳 Caution

### Caution de base

| Pack       |  Base |
| ---------- | ----: |
| Conférence |  700€ |
| Soirée     | 1100€ |
| Mariage    | 1600€ |

### Multiplicateur tier

| Tier | Multiplicateur |
| ---- | -------------- |
| S    | ×1.0           |
| M    | ×1.2           |
| L    | ×1.5           |

`Caution = Base(pack) × Multiplicateur(tier)`

---

## 📝 Exemples (AUTO)

### Exemple A — Soirée 60 pers, 92, fin 21:00

* Tier M → installation auto +59€
* Zone 92 → +60€
* Fin 21:00 → J+1 = 0€
  Prix = 399 + 60 + 59 = **518€**

### Exemple B — Conférence 120 pers, 75, fin 23:30

* Tier L → installation auto +89€
* Zone 75 → +0
* Fin 23:30 → J+1 Paris +45€
  Prix = 569 + 0 + 89 + 45 = **703€**

### Exemple C — Mariage 25 pers, 95, fin 00:30

* Tier S → installation incluse (0€)
* Zone 95 → +90€
* Fin 00:30 → J+1 Grande couronne +110€
  Prix = 349 + 90 + 0 + 110 = **549€**

---

## 📂 Fichiers clés

* `lib/pack-tier-logic.ts` : tier S/M/L
* `lib/packs/basePacks.ts` : prix base + contenu
* `lib/zone-detection.ts` : zone via CP
* `lib/time-rules.ts` : seuil J+1 via heure fin
* `components/ReservationWizard.tsx` : collecte CP + heure + calcul

---

## ✅ Bloc “Aide” en fin de wizard

Vous avez besoin de conseils ou souhaitez ajuster votre configuration ?
Nos experts sont là pour vous accompagner.

**Bouton :** Parler à un expert

