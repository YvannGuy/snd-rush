# État du Refactor Chat Simplifié

## ✅ COMPLÉTÉ

### 1. Plan de Refactor
- ✅ **Fichier**: `PLAN_REFACTOR_CHAT_SIMPLIFIE.md`
- Plan complet en 8 PRs logiques avec architecture finale

### 2. Types TypeScript Simplifiés
- ✅ **Fichier**: `types/chat.ts` (modifié)
- ✅ Ajout: `ReservationDraft` (simplifié)
- ✅ Ajout: `ChatStep` enum ('dates' | 'location' | 'recap')
- ✅ Ajout: `ChatResponse` (réponse API simplifiée)

### 3. Hook useChat Simplifié
- ✅ **Fichier**: `hooks/useChat.simplified.ts` (nouveau)
- ✅ État simplifié: messages, isOpen, isLoading, activePackKey, reservationDraft, currentStep
- ✅ Fonction `canCheckout()` implémentée
- ✅ Suppression: draftConfig, activeScenarioId, reservationRequestDraft, availabilityStatus, etc.
- ✅ Fonctions simplifiées: addUserMessage, addAssistantMessage, openChatWithPack, etc.

### 4. API Chat Rule-Based
- ✅ **Fichier**: `app/api/chat/simplified.route.ts` (nouveau)
- ✅ State machine simple: dates → location → recap
- ✅ Extraction automatique: dates, adresse, téléphone depuis message
- ✅ Pas d'OpenAI, logique locale uniquement
- ✅ Réponse JSON simplifiée selon `ChatResponse`

---

## ⏳ EN COURS / À FAIRE

### 5. Refactor FloatingChatWidget.tsx
- ⏳ **Fichier**: `components/FloatingChatWidget.tsx`
- ⏳ Supprimer: logiques "normal request", "envoyer la demande", "suivre ma demande"
- ⏳ Supprimer: instant booking, holds, scenarios, trackingUrl
- ⏳ Ajouter: Affichage conditionnel selon `currentStep`
- ⏳ Ajouter: 2 boutons finaux uniquement (payer acompte / appeler)

### 6. Endpoint Création Réservation
- ⏳ **Fichier**: `app/api/reservations/create-deposit-session/route.ts` (à créer)
- ⏳ Input: packKey, startAt, endAt, address, phone
- ⏳ Action: upsert client_reservations + Stripe checkout
- ⏳ Return: checkoutUrl

### 7. Intégration Complète
- ⏳ Remplacer `useChat` par `useChatSimplified` dans FloatingChatWidget
- ⏳ Remplacer `/api/chat` par `/api/chat/simplified` (ou adapter l'existant)
- ⏳ Tester le flow complet: chat → checkout → webhook → dashboard

### 8. Nettoyage Dashboard User/Admin
- ⏳ Simplifier dashboard user en 3 sections
- ⏳ Simplifier dashboard admin (widgets client_reservations uniquement)

---

## 📋 PROCHAINES ÉTAPES

1. **Créer FloatingChatWidget simplifié** utilisant `useChatSimplified`
2. **Créer endpoint `/api/reservations/create-deposit-session`**
3. **Tester le flow complet** (chat → checkout → dashboard)
4. **Remplacer progressivement** les anciens fichiers par les nouveaux
5. **Nettoyer les dashboards** selon le plan

---

## 📝 NOTES

- Les fichiers simplifiés sont créés avec le suffixe `.simplified.ts` pour éviter de casser l'existant
- Une fois testés, remplacer les anciens fichiers
- Garder les anciens fichiers en backup pendant la transition
