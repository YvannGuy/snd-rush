# Simplification du Chat - Changements Effectués

## ✅ Modifications Complétées

### 1. Migration SQL
- ✅ **Fichier** : `supabase/migrations/20250105000002_add_source_and_chat_context_to_client_reservations.sql`
- ✅ **Statut** : Appliquée avec succès
- **Changements** :
  - Ajout colonne `source` (text) pour tracker l'origine (chat, admin, api, etc.)
  - Ajout colonne `chat_context` (jsonb) pour stocker le contexte complet du chat
  - Index créé sur `source` pour performances

### 2. Types Simplifiés
- ✅ **Fichier** : `types/chat.ts`
- **Changements** :
  - Ajout interface `ChatDraft` (structure simplifiée)
  - `ReservationRequestDraft` marqué DEPRECATED (gardé pour compatibilité)

### 3. API Chat - Nouveau Prompt Système
- ✅ **Fichier** : `app/api/chat/route.ts`
- **Changements** :
  - Création `SYSTEM_PROMPT_SIMPLIFIED` avec flow en 3 phases
  - Nouveau prompt mode pack simplifié (remplace l'ancien)
  - Support extraction `chatDraft` depuis réponse JSON
  - Retour API enrichi : `chatDraft`, `summary`, `estimatedTotal`, `depositAmount`
  - Compatibilité maintenue avec ancien système (legacy)

## ⏳ Modifications En Cours / À Faire

### 4. FloatingChatWidget.tsx
**À modifier** :
- Supprimer `trackingUrl` et état associé
- Supprimer bouton "Suivre ma demande"
- Supprimer bouton "Envoyer la demande"
- Supprimer logique `isInstantBookingEligible`
- Supprimer logique `handleNormalRequest`
- Remplacer `handleInstantBooking` par version simplifiée
- Simplifier vérification disponibilité
- Supprimer holds

**À garder/modifier** :
- Quick replies packs (Phase 0)
- Collecte téléphone (Phase 1)
- Résumé avec infos minimales (Phase 2)
- 2 CTAs : "Payer acompte 30%" + "Appeler Soundrush" (Phase 2)

**Nouveaux états** :
- `selectedPackKey`: 'conference' | 'soiree' | 'mariage' | null
- `chatDraft`: ChatDraft (simplifié)
- `phone`: string
- `isLoading`: boolean

### 5. useChat.ts
**À modifier** :
- Remplacer `reservationRequestDraft` par `chatDraft`
- Simplifier structure exposée
- Garder anti-doublons et welcome

### 6. lib/chatState.ts
**À simplifier** :
- Réduire extraction au strict nécessaire
- Supprimer scénarios non utiles

### 7. API Paiement
**À adapter** :
- **Fichier** : `app/api/payments/create-checkout-session/route.ts`
- Accepter `chatDraft` OU `clientReservationId`
- Si `chatDraft` fourni :
  - Créer directement `client_reservation` avec :
    - `source = 'chat'`
    - `chat_context = chatDraft`
    - `status = 'AWAITING_PAYMENT'`
  - Calculer `price_total` depuis pack
  - Calculer `deposit_amount = 30%` arrondi
  - Lancer Stripe checkout pour acompte

### 8. Dashboards
**À vérifier** :
- `app/dashboard/page.tsx` : affichage correct des `client_reservations` créées via chat
- `app/admin/reservations/page.tsx` : affichage correct avec source 'chat'

## 📋 Structure Nouvelle API Chat

### Réponse API (nouveau format)
```json
{
  "reply": "Résumé texte...",
  "intent": "READY_TO_ADD",
  "chatDraft": {
    "packKey": "conference",
    "startAt": "2025-01-15T19:00:00Z",
    "endAt": "2025-01-15T23:00:00Z",
    "location": "Paris 11ème",
    "phone": "0612345678",
    "extras": {
      "microsCount": 2
    }
  },
  "summary": "Pack Conférence pour le 15 janvier à Paris 11ème. Total estimé : 279€. Acompte 30% : 84€.",
  "estimatedTotal": 279,
  "depositAmount": 84
}
```

### Format Legacy (maintenu pour compatibilité)
```json
{
  "reply": "...",
  "intent": "READY_TO_ADD",
  "reservationRequestDraft": {
    "pack_key": "conference",
    "payload": {...}
  }
}
```

## 🎯 Nouveau Flow Chat (Obligatoire)

### PHASE 0 (Welcome)
- Message : "Je te propose 3 packs: Conférence / Soirée / Mariage"
- Quick replies : 3 boutons

### PHASE 1 (Infos minimales)
Questions strict minimum :
1. Date + horaire (start_at / end_at)
2. Ville / code postal (ou département)
3. Téléphone (obligatoire)

Options selon pack :
- Conférence : "combien de micros ?" (1–4)
- Soirée : "combien de personnes ?" (<=50 / 50-100 / 100+)
- Mariage : "intérieur ou extérieur ?"

### PHASE 2 (Résumé)
- Résumé clair : pack + date + lieu + total estimé + acompte 30%
- **CTA 1** : "Payer l'acompte 30%" (principal)
- **CTA 2** : "Appeler Soundrush" (secondaire)
- Mention : "Solde J-5, caution J-2"

### PHASE 3 (Paiement)
- CTA 1 → Créer `client_reservation` + Stripe checkout
- CTA 2 → Ouvrir `tel:+33123456789`

## 🚫 Interdictions Absolues

- ❌ JAMAIS proposer "envoyer une demande"
- ❌ JAMAIS proposer "suivre ma demande"
- ❌ JAMAIS poser plus de questions que nécessaire
- ❌ JAMAIS répéter une question déjà posée

## 📝 Notes Techniques

- Le nouveau système est compatible avec l'ancien (legacy)
- `chatDraft` est prioritaire sur `reservationRequestDraft` si présent
- Migration SQL appliquée avec succès
- Types créés et prêts à être utilisés

## 🔄 Prochaines Étapes

1. Modifier `FloatingChatWidget.tsx` pour utiliser `chatDraft`
2. Modifier `useChat.ts` pour exposer `chatDraft`
3. Simplifier `lib/chatState.ts`
4. Adapter API paiement pour créer `client_reservation` depuis `chatDraft`
5. Vérifier dashboards
6. Nettoyage code mort
