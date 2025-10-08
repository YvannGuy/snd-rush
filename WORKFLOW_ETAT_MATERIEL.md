# 📋 Workflow - État du Matériel

Ce document explique le nouveau processus de génération des rapports d'état du matériel avec les deux signatures.

## 💾 Sauvegarde automatique

**Vos données sont protégées !**
- ✅ **Sauvegarde automatique** à chaque modification (localStorage)
- ✅ **Restauration automatique** si vous fermez puis rouvrez la page
- ✅ **Avertissement** si vous tentez de fermer la page avec des données non sauvegardées
- ✅ **Indicateur visuel** : 💾 Sauvegarde auto (en haut à droite)
- ✅ **Message de confirmation** : Si des données sont restaurées, un message vert s'affiche pendant 5 secondes

**Ce qui est sauvegardé :**
- Informations client (nom, contact, adresse, etc.)
- Liste du matériel ajouté
- États (AVANT et APRÈS)
- Commentaires
- Photos (URLs Supabase ou base64)
- Signatures (AVANT et APRÈS)

**Nettoyage automatique :**
- ✅ Lors de la génération du PDF final
- ✅ Lors du clic sur "Réinitialiser tout"

## 🔄 Processus en 2 étapes

### Étape 1 : LIVRAISON (À la mise à disposition du matériel)

#### 1️⃣ Remplir les informations obligatoires
- ✅ **Client / Organisation** (obligatoire)
- ✅ **Contact** (email / tél.) (obligatoire)
- ✅ **Heure de dépôt (livraison)** (obligatoire)

#### Informations optionnelles
- Adresse
- Code postal
- Notes internes

#### 2️⃣ Ajouter le matériel
- Rechercher et ajouter le matériel depuis le catalogue
- Ou ajouter manuellement du matériel personnalisé
- ⭐ Vous pouvez ajouter plusieurs fois le même équipement

#### 3️⃣ Documenter l'état AVANT
Pour chaque matériel :
- Sélectionner l'état : OK / RAYURES / CHOC / MANQUANT
- Ajouter des photos AVANT
- Ajouter des commentaires si nécessaire

#### 4️⃣ Faire signer le client (signature AVANT)
- Le client signe dans la zone : **"📦 Signature du client - À la livraison (AVANT)"**
- Ceci certifie : "Je reconnais avoir reçu le matériel en bon état et conforme au devis."

#### 5️⃣ Générer le rapport de livraison
- Cliquer sur **"📄 Générer le rapport de LIVRAISON"** (bouton vert)
- Un PDF sera généré : `sndrush_livraison_XXX.pdf`
- ⚠️ **IMPORTANT** : Le formulaire **NE SE RÉINITIALISE PAS**
- Toutes les données restent en place pour la suite

---

### Étape 2 : REPRISE (Après l'événement)

#### 6️⃣ Compléter l'heure de récupération
- ✅ **Heure de récupération** (obligatoire pour le rapport final)

#### 7️⃣ Documenter l'état APRÈS
Pour chaque matériel :
- Sélectionner l'état APRÈS : OK / RAYURES / CHOC / MANQUANT
- Ajouter des photos APRÈS
- Compléter les commentaires si nécessaire

#### 8️⃣ Faire signer le client (signature APRÈS)
- Le client signe dans la zone : **"🔄 Signature du client - À la reprise (APRÈS)"**
- Ceci certifie : "Matériel restitué et contrôlé par Guy Location Events le [date/heure]"

#### 9️⃣ Générer le rapport FINAL
- Cliquer sur **"📄 Générer le rapport FINAL (avec reset)"** (bouton rouge)
- Un PDF complet sera généré : `sndrush_final_XXX.pdf`
- Ce PDF contient :
  - ✅ Toutes les infos client
  - ✅ État AVANT avec signature
  - ✅ État APRÈS avec signature
- ✨ **Le formulaire se réinitialise automatiquement** pour un nouveau rapport

---

## 🎯 Résumé du flux

```
1. LIVRAISON
   ├─ Remplir infos client
   ├─ Ajouter matériel
   ├─ Documenter état AVANT
   ├─ Signature client AVANT
   ├─ 📄 Générer PDF LIVRAISON
   └─ ⚠️ NE PAS RESET
        ↓
2. [ÉVÉNEMENT SE DÉROULE]
        ↓
3. REPRISE
   ├─ Compléter heure récupération
   ├─ Documenter état APRÈS
   ├─ Signature client APRÈS
   ├─ 📄 Générer PDF FINAL
   └─ ✅ RESET automatique
        ↓
4. [Prêt pour nouveau rapport]
```

---

## 📄 Types de PDF générés

### PDF de LIVRAISON
- **Nom** : `sndrush_livraison_[ID].pdf`
- **Contient** :
  - Infos client
  - État du matériel AVANT
  - Signature AVANT uniquement
- **Couleur du bouton** : 🟢 Vert
- **Action après** : Garde toutes les données

### PDF FINAL
- **Nom** : `sndrush_final_[ID].pdf`
- **Contient** :
  - Infos client
  - État du matériel AVANT
  - État du matériel APRÈS
  - Signature AVANT
  - Signature APRÈS
- **Couleur du bouton** : 🔴 Rouge
- **Action après** : Réinitialise tout

---

## 🚨 Validations

### Champs obligatoires pour le PDF de LIVRAISON :
- ✅ **Client** renseigné (champ obligatoire *)
- ✅ **Contact** renseigné (champ obligatoire *)
- ✅ **Heure de dépôt** renseignée (champ obligatoire *)
- ✅ Au moins **1 matériel** ajouté
- ✅ **Signature AVANT** effectuée

### Champs optionnels :
- Adresse
- Code postal
- Notes internes
- État du matériel (OK, RAYURES, etc.)
- Photos
- Commentaires

### Validations supplémentaires pour le PDF FINAL :
- ✅ Toutes les validations de livraison
- ✅ **Heure de récupération** renseignée (champ obligatoire * pour PDF final)
- ✅ **Signature APRÈS** effectuée

---

## 💡 Cas d'usage

### Cas normal
1. Livraison le lundi à 14h → Génère PDF livraison → **Garde les données**
2. Reprise le mardi à 18h → Complète état APRÈS → Génère PDF final → **Reset**

### Cas avec interruption (sauvegarde automatique)
1. **Lundi 14h** : Remplir infos client, ajouter matériel, prendre photos AVANT
2. **Fermeture accidentelle** de la page (navigateur, onglet, etc.)
3. **Rouvrir la page** → ✅ Message vert : "Vos données ont été restaurées"
4. Continuer où vous vous êtes arrêté → Signature AVANT → PDF livraison
5. **Mardi 18h** : Page déjà remplie avec toutes les infos de la livraison
6. Compléter état APRÈS → Signature APRÈS → PDF final → **Reset**

### Si vous fermez entre livraison et reprise
1. **Lundi** : PDF livraison généré ✅
2. Fermer la page → Toutes les données sont sauvegardées
3. **Mardi** : Rouvrir la page → Tout est restauré (infos, matériel, signature AVANT)
4. Juste à compléter la partie APRÈS !

### Si vous devez recommencer
- Utilisez le bouton **"🗑️ Réinitialiser tout (urgence)"**
- ⚠️ Cela effacera TOUT (y compris les signatures ET la sauvegarde)
- À utiliser uniquement en cas d'erreur

---

## 🗄️ Sauvegarde Supabase

Si Supabase est configuré :
- **PDF Livraison** : Sauvegarde avec `signature_apres = null`
- **PDF Final** : Sauvegarde avec les deux signatures complètes

---

## 🎨 Code couleur des boutons

| Bouton | Couleur | Action | Reset |
|--------|---------|--------|-------|
| 📄 Générer rapport LIVRAISON | 🟢 Vert | PDF livraison | ❌ Non |
| 📄 Générer rapport FINAL | 🔴 Rouge | PDF complet | ✅ Oui |
| 🗑️ Réinitialiser (urgence) | 🔴 Rouge outline | Efface tout | ✅ Oui |

---

## ✨ Fonctionnalités supplémentaires

- **Équipements multiples** : Ajoutez plusieurs fois le même équipement (ex: 3× FBT X-LITE)
- **Numérotation automatique** : Les équipements identiques sont numérotés (#1, #2, #3)
- **Photos Supabase** : Les photos sont stockées dans le cloud si configuré
- **Fallback base64** : Si Supabase échoue, les photos sont en base64

---

## 🔧 Dépannage

### Le bouton LIVRAISON est grisé ou ne fonctionne pas
→ Vérifiez que toutes les infos obligatoires sont remplies et que la signature AVANT est faite

### Le bouton FINAL ne fonctionne pas
→ Vérifiez que :
- Le PDF de livraison a été généré
- L'heure de récupération est renseignée
- La signature APRÈS est faite

### Je veux annuler et recommencer
→ Utilisez le bouton "🗑️ Réinitialiser tout (urgence)" en bas de page

