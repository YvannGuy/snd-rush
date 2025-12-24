# Check-list QA - Chat Simplifié (10 cas)

## ✅ Cas de Test

### 1. Chat - Sélection Pack
**Action**: Cliquer sur "Réserver" sur une card pack (Conference/Soirée/Mariage)  
**Attendu**: 
- ✅ Le chat s'ouvre avec `packKey` prérempli
- ✅ Message de bienvenue affiché
- ✅ Étape actuelle = 'dates'

---

### 2. Chat - Étape Dates
**Action**: Entrer un message avec date + heure (ex: "15 janvier 2025 de 19h à 23h")  
**Attendu**:
- ✅ Les dates sont extraites automatiquement
- ✅ `startAt` et `endAt` remplis dans `reservationDraft`
- ✅ Étape suivante = 'location'
- ✅ Message assistant demande la location

---

### 3. Chat - Étape Location
**Action**: Entrer un message avec ville/CP/département (ex: "Paris 11ème" ou "75011")  
**Attendu**:
- ✅ L'adresse est extraite automatiquement
- ✅ `address` rempli dans `reservationDraft`
- ✅ Message assistant demande le téléphone

---

### 4. Chat - Étape Phone
**Action**: Entrer un numéro de téléphone (ex: "06 12 34 56 78")  
**Attendu**:
- ✅ Le téléphone est extrait automatiquement
- ✅ `phone` rempli dans `reservationDraft`
- ✅ Étape suivante = 'recap'
- ✅ Message récapitulatif affiché avec 2 boutons

---

### 5. Chat - Récap + Boutons
**Action**: Vérifier l'affichage du récap  
**Attendu**:
- ✅ Récap complet affiché (pack + date + lieu + téléphone)
- ✅ 2 boutons visibles:
  - "Payer l'acompte 30%"
  - "Appeler Soundrush"
- ✅ `readyToCheckout` = true

---

### 6. Checkout - Acompte 30%
**Action**: Cliquer sur "Payer l'acompte 30%"  
**Attendu**:
- ✅ Appel API `/api/reservations/create-deposit-session`
- ✅ Réservation créée dans `client_reservations` (status AWAITING_PAYMENT)
- ✅ Redirection vers Stripe checkout
- ✅ Montant = 30% du prix du pack

---

### 7. Webhook - Paiement Acompte
**Action**: Compléter le paiement Stripe  
**Attendu**:
- ✅ Webhook `/api/webhooks/stripe` reçoit l'événement
- ✅ `deposit_paid_at` rempli dans `client_reservations`
- ✅ `status` = AWAITING_BALANCE
- ✅ `balance_due_at` calculé (J-5)
- ✅ Order créé avec `client_reservation_id`

---

### 8. Dashboard - Paiements
**Action**: Ouvrir `/dashboard` après paiement acompte  
**Attendu**:
- ✅ Section "Mes paiements" affiche:
  - Acompte 30%: ✅ Payé
  - Solde: J-5 (date calculée)
  - Caution: J-2 (date calculée)
- ✅ Réservation visible dans la liste

---

### 9. Dashboard - Contrat
**Action**: Vérifier l'affichage du contrat  
**Attendu**:
- ✅ Bouton "Signer le contrat" visible si status = AWAITING_BALANCE ou CONFIRMED
- ✅ Clic sur bouton → redirection `/sign-contract?clientReservationId=...`
- ✅ Contrat PDF généré avec bonnes données

---

### 10. Dashboard - Documents
**Action**: Télécharger contrat et facture  
**Attendu**:
- ✅ Contrat PDF téléchargeable via `/api/contract/download?clientReservationId=...`
- ✅ Facture PDF téléchargeable via `/api/invoice/download?orderId=...`
- ✅ PDFs contiennent les bonnes informations (pack, dates, lieu, prix)

---

## 🔍 Tests Additionnels (Optionnels)

### 11. Chat - Bouton Appeler
**Action**: Cliquer sur "Appeler Soundrush"  
**Attendu**:
- ✅ Ouverture `tel:0651084994`
- ✅ Message "Dis que tu viens du site" (optionnel)

### 12. Chat - Reset
**Action**: Fermer et rouvrir le chat  
**Attendu**:
- ✅ Messages conservés dans localStorage
- ✅ `reservationDraft` conservé
- ✅ Étape actuelle conservée

### 13. Chat - Extraction Dates Complexes
**Action**: Entrer différents formats de dates  
**Attendu**:
- ✅ "15/01/2025 19h-23h" → dates extraites
- ✅ "15 janvier 2025 de 19h à 23h" → dates extraites
- ✅ Gestion des erreurs si format invalide

---

## 📝 Notes de Test

- Tester avec les 3 packs (conference, soiree, mariage)
- Tester avec différents formats d'entrée (dates, adresses, téléphones)
- Vérifier la persistance localStorage
- Vérifier les erreurs (champs manquants, API down, etc.)
- Vérifier la compatibilité mobile
