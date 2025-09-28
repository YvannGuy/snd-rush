# 🧪 Assistant SND Rush - Checklist QA

## ✅ Critères d'Acceptation - Tests de Validation

### 1. **Validation Stricte** ✅
- [ ] **Impossible d'avancer** sans réponse valide à chaque étape
- [ ] **Messages d'erreur** visibles sous chaque groupe si tentative d'avancer sans répondre
- [ ] **Barre de progression** "Étape X/6" affichée
- [ ] **Bouton "Suivant"** désactivé tant que validation KO

### 2. **Détection Zone Automatique** ✅
- [ ] **Code postal Paris (75)** → Zone "Paris" + 80€ A/R
- [ ] **Code postal Petite couronne (92,93,94)** → Zone "Petite" + 120€ A/R  
- [ ] **Code postal Grande couronne (77,78,91,95)** → Zone "Grande" + 156€ A/R
- [ ] **Zone non détectée** → Fallback manuel obligatoire
- [ ] **Prix A/R affiché** une fois zone détectée
- [ ] **Bouton "Changer"** pour modifier la zone

**Tests de codes postaux :**
- `75015` → Paris (80€)
- `93100` → Petite couronne (120€) 
- `78100` → Grande couronne (156€)
- `12345` → Fallback manuel

### 3. **Concordance Besoins ↔ Contenu/Prix** ✅
- [ ] **"Lumière" non coché** → Pas de lumière ajoutée (ou -80€ si pack en contient)
- [ ] **"Son" coché** → Base sonore selon invités
- [ ] **"Micros" coché** → Options micros disponibles
- [ ] **"DJ" coché** → Pack plus puissant recommandé
- [ ] **Besoins intensifs** → Pack Premium/Prestige prioritaire

**Tests de concordance :**
- Besoins: Son seul → Pack Essentiel
- Besoins: Son + Lumière → Pack Standard avec lumière
- Besoins: Son + DJ → Pack Premium/Prestige

### 4. **Bouton "Je n'en ai pas besoin"** ✅
- [ ] **Bouton cliquable** (pas label désactivé)
- [ ] **Désélectionne toutes les options** quand cliqué
- [ ] **Met noExtras=true** dans les réponses
- [ ] **Visuel des cases** se met à jour (controlled components)
- [ ] **Focus visible** sur le bouton

### 5. **Urgence +20%** ✅
- [ ] **Date J+1** → +20% appliqué ET affiché
- [ ] **Date J+5** → Pas de majoration
- [ ] **Calcul correct** : `total = (base + delivery + options) * 1.2`
- [ ] **Affichage ligne** "Majoration urgence (+20%)" dans récap
- [ ] **Test avec heure** : 19h00 J+1 → +20%

### 6. **APIs Resend & Stripe** ✅
- [ ] **Demande d'info** → POST `/api/send-email` + toast succès
- [ ] **Réservation acompte** → POST `/api/send-email` + POST `/api/create-checkout-session` + redirection
- [ ] **Diagnostics d'erreur** → Console.error + toast d'erreur
- [ ] **Boutons test dev** → "Test Resend" et "Test Stripe" (dev uniquement)
- [ ] **Aucun mailto:** → Toutes les actions via APIs

### 7. **Accessibilité** ✅
- [ ] **Navigation clavier** → Tab, Enter, Escape
- [ ] **Focus visible** → Outline sur éléments focusables
- [ ] **Escape ferme** → Modal se ferme avec Esc
- [ ] **Overlay clic** → Ferme le modal
- [ ] **Roles ARIA** → `role="dialog"`, `aria-modal="true"`
- [ ] **Labels** → Tous les champs ont des labels

## 🧪 **Tests de Cas d'Usage**

### **Test Complet - Mariage Paris**
1. **Type** : Mariage
2. **Invités** : 100-200 personnes  
3. **Adresse** : "123 rue de Rivoli, 75001 Paris"
4. **Environnement** : Intérieur
5. **Besoins** : Son + Lumière + Micros
6. **Options** : Technicien sur place
7. **Date** : J+3, 19h00

**Résultat attendu :**
- Zone détectée : Paris (80€ A/R)
- Pack recommandé : Premium (1499€)
- Options : +150€ (technicien)
- Total : 1499 + 80 + 150 = 1729€
- Pas de majoration urgence

### **Test Urgence - Anniversaire**
1. **Type** : Anniversaire
2. **Invités** : 50-100 personnes
3. **Adresse** : "456 avenue des Champs, 93100 Montreuil"  
4. **Environnement** : Extérieur
5. **Besoins** : Son + Lumière
6. **Options** : Aucune
7. **Date** : J+1, 20h00

**Résultat attendu :**
- Zone détectée : Petite couronne (120€ A/R)
- Pack recommandé : Standard (799€)
- Total : 799 + 120 = 919€
- Majoration urgence : 919 * 1.2 = 1103€

### **Test "Je n'en ai pas besoin"**
1. **Besoins** : Son seul
2. **Options** : Toutes cochées puis "Je n'en ai pas besoin"
3. **Résultat** : Aucune option, pas de surcoût

## 🚨 **Points de Vigilance**

- **Validation stricte** : Impossible de contourner les étapes
- **Zone auto** : Fallback obligatoire si non détectée  
- **Concordance** : Prix cohérent avec besoins cochés
- **Urgence** : Calcul précis avec heure
- **APIs** : Diagnostics d'erreur complets
- **A11y** : Navigation clavier fluide

## 📋 **Checklist Finale**

- [ ] Tous les critères d'acceptation validés
- [ ] Tests de cas d'usage passés
- [ ] Aucune erreur de linting
- [ ] APIs fonctionnelles (Resend + Stripe)
- [ ] Accessibilité complète
- [ ] Performance optimale
- [ ] Design responsive

---

**✅ Assistant SND Rush - Prêt pour la production !**
