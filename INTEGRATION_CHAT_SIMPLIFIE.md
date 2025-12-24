# Guide d'Intégration - Chat Simplifié

## Fichiers Créés

### 1. Types
- ✅ `types/chat.ts` (modifié) - Ajout `ReservationDraft`, `ChatStep`, `ChatResponse`

### 2. Hook
- ✅ `hooks/useChat.simplified.ts` - Hook simplifié

### 3. API
- ✅ `app/api/chat/simplified.route.ts` - API rule-based
- ✅ `app/api/reservations/create-deposit-session/route.ts` - Endpoint checkout

### 4. Composant
- ✅ `components/FloatingChatWidget.simplified.tsx` - Widget simplifié

---

## Étapes d'Intégration

### Étape 1: Renommer les fichiers simplifiés

```bash
# Renommer les fichiers simplifiés pour remplacer les anciens
mv hooks/useChat.simplified.ts hooks/useChat.new.ts
mv app/api/chat/simplified.route.ts app/api/chat/new.route.ts
mv components/FloatingChatWidget.simplified.tsx components/FloatingChatWidget.new.tsx
```

### Étape 2: Adapter les imports

Dans `components/FloatingChatWidget.new.tsx`:
- Vérifier que `useChatSimplified` est bien importé depuis `hooks/useChat.new.ts`
- Vérifier que l'API `/api/chat/simplified` existe (ou renommer en `/api/chat`)

### Étape 3: Tester le flow complet

1. **Test Chat**:
   - Ouvrir chat avec pack prérempli
   - Entrer dates → location → phone
   - Vérifier récap + 2 boutons

2. **Test Checkout**:
   - Cliquer "Payer acompte 30%"
   - Vérifier redirection Stripe
   - Compléter paiement test

3. **Test Webhook**:
   - Vérifier que `deposit_paid_at` est rempli
   - Vérifier que `status` = AWAITING_BALANCE

4. **Test Dashboard**:
   - Vérifier affichage réservation
   - Vérifier paiements (acompte/solde/caution)
   - Vérifier documents (contrat/facture)

### Étape 4: Remplacer progressivement

**Option A: Remplacement direct**
```bash
# Backup anciens fichiers
mv hooks/useChat.ts hooks/useChat.old.ts
mv app/api/chat/route.ts app/api/chat/old.route.ts
mv components/FloatingChatWidget.tsx components/FloatingChatWidget.old.tsx

# Remplacer par nouveaux
mv hooks/useChat.new.ts hooks/useChat.ts
mv app/api/chat/new.route.ts app/api/chat/route.ts
mv components/FloatingChatWidget.new.tsx components/FloatingChatWidget.tsx
```

**Option B: Feature flag**
- Ajouter un flag `NEXT_PUBLIC_USE_SIMPLIFIED_CHAT=true`
- Conditionner l'import selon le flag
- Tester en production avec flag désactivé

### Étape 5: Mettre à jour les imports

Chercher tous les imports de `useChat` et `FloatingChatWidget`:
```bash
grep -r "useChat" --include="*.ts" --include="*.tsx"
grep -r "FloatingChatWidget" --include="*.ts" --include="*.tsx"
```

Adapter selon besoin:
- Si ancien hook utilisé ailleurs → garder les deux versions
- Si widget utilisé ailleurs → vérifier compatibilité

---

## Points d'Attention

### 1. localStorage
- Ancien: `sndrush_chat_messages`
- Nouveau: `sndrush_chat_messages_simplified`
- **Action**: Vider localStorage ou migrer les données

### 2. API Endpoint
- Ancien: `/api/chat` (OpenAI)
- Nouveau: `/api/chat/simplified` (rule-based)
- **Action**: Renommer ou créer redirect

### 3. Types
- Ancien: `ReservationRequestDraft`, `DraftFinalConfig`
- Nouveau: `ReservationDraft`, `ChatStep`
- **Action**: Vérifier compatibilité avec autres composants

### 4. État du Hook
- Ancien: `draftConfig`, `activeScenarioId`, `reservationRequestDraft`, `availabilityStatus`
- Nouveau: `reservationDraft`, `currentStep`
- **Action**: Adapter les composants qui utilisent ces états

---

## Checklist Pré-Déploiement

- [ ] Tous les tests QA passent (voir `CHECKLIST_QA_CHAT_SIMPLIFIE.md`)
- [ ] localStorage migré ou vidé
- [ ] API endpoint accessible (`/api/chat/simplified` ou `/api/chat`)
- [ ] Stripe checkout fonctionne
- [ ] Webhook Stripe fonctionne
- [ ] Dashboard user affiche correctement
- [ ] Dashboard admin affiche correctement
- [ ] PDFs (contrat/facture) fonctionnent
- [ ] Mobile responsive
- [ ] Pas de régressions sur autres features

---

## Rollback Plan

Si problème en production:

1. **Revert fichiers**:
```bash
mv hooks/useChat.ts hooks/useChat.new.ts
mv hooks/useChat.old.ts hooks/useChat.ts

mv app/api/chat/route.ts app/api/chat/new.route.ts
mv app/api/chat/old.route.ts app/api/chat/route.ts

mv components/FloatingChatWidget.tsx components/FloatingChatWidget.new.tsx
mv components/FloatingChatWidget.old.tsx components/FloatingChatWidget.tsx
```

2. **Redeploy**

3. **Vider localStorage** (optionnel):
```javascript
localStorage.removeItem('sndrush_chat_messages_simplified');
```

---

## Support

En cas de problème:
1. Vérifier les logs console (erreurs JS)
2. Vérifier les logs API (`/api/chat/simplified`, `/api/reservations/create-deposit-session`)
3. Vérifier les logs webhook Stripe
4. Vérifier Supabase (RLS, données `client_reservations`)
