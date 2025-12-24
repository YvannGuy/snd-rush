# Plan de Refactor Chat Simplifié - 8 PRs Logiques

## Architecture Finale Simplifiée

```
┌─────────────────────────────────────────────────────────────┐
│                    HOME PAGE                                 │
│  3 Cards (Conference, Soirée, Mariage)                      │
│  Bouton "Réserver" → Ouvre chat avec pack_key prérempli      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              FLOATING CHAT WIDGET                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ STEP 1: Collect Dates                               │   │
│  │   - start_at (date + heure)                          │   │
│  │   - end_at (date + heure)                            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ STEP 2: Collect Location + Phone                   │   │
│  │   - address (ville/CP/département)                  │   │
│  │   - phone (obligatoire)                              │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ STEP 3: Récap + 2 Actions                           │   │
│  │   - Récap: pack + dates + lieu                      │   │
│  │   - Bouton 1: "Payer acompte 30%"                   │   │
│  │   - Bouton 2: "Appeler Soundrush"                  │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         API /api/chat (Rule-Based)                          │
│  State Machine:                                             │
│    - Pas de dates → Demander dates                          │
│    - Pas de location → Demander ville/CP/département        │
│    - Pas de phone → Demander téléphone                      │
│    - Tout OK → Renvoyer récap + readyToCheckout: true       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  API /api/reservations/create-deposit-session              │
│  Input: pack_key, start_at, end_at, address, phone          │
│  Action:                                                    │
│    1. Upsert client_reservations (AWAITING_PAYMENT)         │
│    2. Créer Stripe checkout session (30% deposit)           │
│    3. Return checkoutUrl                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              STRIPE CHECKOUT                                │
│  Paiement acompte 30%                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         WEBHOOK /api/webhooks/stripe                        │
│  Update client_reservations:                                │
│    - deposit_paid_at                                        │
│    - status = AWAITING_BALANCE                              │
│    - balance_due_at (J-5)                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              DASHBOARD USER                                 │
│  - Paiements (acompte/solde/caution)                        │
│  - Contrat (signer si nécessaire)                           │
│  - Documents (télécharger)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## PR 1: Types TypeScript Simplifiés

**Objectif**: Créer les nouveaux types pour le flow simplifié

**Fichiers**:
- `types/chat.ts` (modifier)
  - Supprimer: `ReservationRequestDraft`, `DraftFinalConfig`, `ChatIntent` complexes
  - Ajouter: `ReservationDraft` simple
  - Ajouter: `ChatStep` enum ('dates' | 'location' | 'recap')
  - Ajouter: `ChatResponse` simplifié

**Changements**:
```typescript
// Nouveau type simplifié
export interface ReservationDraft {
  packKey: 'conference' | 'soiree' | 'mariage';
  startAt?: string; // ISO date string
  endAt?: string; // ISO date string
  address?: string; // ville/CP/département
  phone?: string; // obligatoire
}

export type ChatStep = 'dates' | 'location' | 'recap';

export interface ChatResponse {
  assistantMessage: string;
  collected: Partial<ReservationDraft>;
  currentStep: ChatStep;
  readyToCheckout: boolean;
}
```

---

## PR 2: Refactor useChat.ts - État Simplifié

**Objectif**: Simplifier l'état du hook useChat

**Fichiers**:
- `hooks/useChat.ts` (refactor complet)

**Changements**:
- Supprimer: `draftConfig`, `activeScenarioId`, `reservationRequestDraft`, `availabilityStatus`, `availabilityDetails`
- Garder: `messages`, `isOpen`, `isLoading`, `activePackKey`
- Ajouter: `reservationDraft: ReservationDraft | null`
- Ajouter: `currentStep: ChatStep`
- Ajouter: `canCheckout(): boolean`
- Simplifier: `addUserMessage`, `addAssistantMessage`
- Supprimer: logiques complexes (scenarios, instant booking, holds, etc.)

**Nouvelle structure**:
```typescript
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activePackKey, setActivePackKey] = useState<'conference' | 'soiree' | 'mariage' | null>(null);
  const [reservationDraft, setReservationDraft] = useState<ReservationDraft | null>(null);
  const [currentStep, setCurrentStep] = useState<ChatStep>('dates');

  const canCheckout = useCallback((): boolean => {
    if (!reservationDraft) return false;
    return !!(
      reservationDraft.packKey &&
      reservationDraft.startAt &&
      reservationDraft.endAt &&
      reservationDraft.address &&
      reservationDraft.phone
    );
  }, [reservationDraft]);

  // ... fonctions simplifiées
}
```

---

## PR 3: Refactor app/api/chat/route.ts - Logique Rule-Based

**Objectif**: Remplacer OpenAI par une logique rule-based simple

**Fichiers**:
- `app/api/chat/route.ts` (refactor complet)

**Changements**:
- Supprimer: import OpenAI, prompts complexes, scenarios
- Supprimer: `buildConversationState`, `getNextQuestion`, etc.
- Ajouter: State machine simple
- Ajouter: Messages pré-définis pour chaque étape

**Nouvelle logique**:
```typescript
export async function POST(req: NextRequest) {
  const { message, packKey, collected } = await req.json();
  
  // State machine simple
  let currentStep: ChatStep = 'dates';
  let assistantMessage = '';
  
  // Étape 1: Dates
  if (!collected.startAt || !collected.endAt) {
    assistantMessage = "Quelle est la date et l'heure de votre événement ? (ex: 15 janvier 2025 de 19h à 23h)";
    currentStep = 'dates';
  }
  // Étape 2: Location + Phone
  else if (!collected.address || !collected.phone) {
    if (!collected.address) {
      assistantMessage = "Dans quelle ville ou département se déroule l'événement ?";
    } else {
      assistantMessage = "Quel est votre numéro de téléphone ? (obligatoire)";
    }
    currentStep = 'location';
  }
  // Étape 3: Récap
  else {
    assistantMessage = `Parfait ! Récapitulatif:\n\nPack: ${packKey}\nDate: ${collected.startAt} - ${collected.endAt}\nLieu: ${collected.address}\nTéléphone: ${collected.phone}\n\nSouhaitez-vous payer l'acompte 30% pour bloquer la date ou préférez-vous nous appeler ?`;
    currentStep = 'recap';
  }
  
  return NextResponse.json({
    assistantMessage,
    collected,
    currentStep,
    readyToCheckout: currentStep === 'recap',
  });
}
```

---

## PR 4: Refactor FloatingChatWidget.tsx - 3 Étapes Strictes

**Objectif**: Simplifier le widget en 3 étapes strictes

**Fichiers**:
- `components/FloatingChatWidget.tsx` (refactor complet)

**Changements**:
- Supprimer: logiques "normal request", "envoyer la demande", "suivre ma demande"
- Supprimer: instant booking, holds, scenarios
- Supprimer: `trackingUrl`, `draftConfig`, `reservationRequestDraft`
- Ajouter: Affichage conditionnel selon `currentStep`
- Ajouter: 2 boutons finaux uniquement (payer acompte / appeler)

**Nouvelle structure**:
```typescript
export default function FloatingChatWidget() {
  const {
    messages,
    isOpen,
    isLoading,
    activePackKey,
    reservationDraft,
    currentStep,
    canCheckout,
    // ... fonctions simplifiées
  } = useChat();

  // Rendu conditionnel selon currentStep
  return (
    <Dialog open={isOpen}>
      {/* Messages */}
      {/* Input selon step */}
      {/* Boutons finaux si readyToCheckout */}
    </Dialog>
  );
}
```

---

## PR 5: Créer Endpoint /api/reservations/create-deposit-session

**Objectif**: Endpoint unique pour créer réservation + Stripe checkout

**Fichiers**:
- `app/api/reservations/create-deposit-session/route.ts` (nouveau)

**Logique**:
```typescript
export async function POST(req: NextRequest) {
  const { packKey, startAt, endAt, address, phone, customerEmail, customerName } = await req.json();
  
  // 1. Upsert client_reservations
  const { data: reservation } = await supabaseAdmin
    .from('client_reservations')
    .upsert({
      pack_key: packKey,
      start_at: startAt,
      end_at: endAt,
      address,
      customer_phone: phone,
      customer_email: customerEmail,
      customer_name: customerName,
      status: 'AWAITING_PAYMENT',
      source: 'chat',
      // ... autres champs
    })
    .select()
    .single();
  
  // 2. Calculer acompte 30%
  const basePackPrice = computeBasePackPrice(packKey);
  const depositAmount = computeDepositAmountEur(basePackPrice);
  
  // 3. Créer Stripe checkout
  const session = await stripe.checkout.sessions.create({
    // ... config checkout
    metadata: {
      reservation_id: reservation.id,
      type: 'client_reservation_deposit',
    },
  });
  
  // 4. Update reservation avec stripe_session_id
  await supabaseAdmin
    .from('client_reservations')
    .update({ stripe_session_id: session.id })
    .eq('id', reservation.id);
  
  return NextResponse.json({ checkoutUrl: session.url });
}
```

---

## PR 6: Adapter Webhook Stripe (si nécessaire)

**Objectif**: S'assurer que le webhook gère correctement les nouvelles réservations

**Fichiers**:
- `app/api/webhooks/stripe/route.ts` (vérifier/adapter)

**Vérifications**:
- ✅ `client_reservation_id` déjà rempli (fait précédemment)
- ✅ `deposit_paid_at` mis à jour
- ✅ `status` = AWAITING_BALANCE
- ✅ `balance_due_at` calculé (J-5)

---

## PR 7: Nettoyer Dashboard User (simplification)

**Objectif**: Simplifier le dashboard en 3 sections

**Fichiers**:
- `app/dashboard/page.tsx` (refactor partiel)

**Changements**:
- Section 1: "Mes paiements" (acompte/solde/caution)
- Section 2: "Mes documents" (contrat/facture)
- Section 3: "Mes actions" (signer contrat si nécessaire)
- Priorité sur `client_reservations`

---

## PR 8: Nettoyer Dashboard Admin (simplification)

**Objectif**: Widgets basés uniquement sur client_reservations

**Fichiers**:
- `app/admin/page.tsx` (refactor partiel)

**Changements**:
- Widgets basés sur `client_reservations` uniquement
- Accès rapide: télécharger contrat/facture
- Listes paiements solde/caution sur `client_reservations`

---

## Migration SQL Minimale

**Fichier**: `supabase/migrations/20250105000004_cleanup_chat_fields.sql`

```sql
-- Aucune migration nécessaire (champs déjà présents)
-- Vérifier que les champs suivants existent:
-- - client_reservations.source
-- - client_reservations.chat_context
-- - client_reservations.client_signature
-- - client_reservations.client_signed_at
```

---

## Check-list QA (10 cas)

1. ✅ **Chat - Sélection pack**: Cliquer "Réserver" sur une card pack ouvre le chat avec pack_key prérempli
2. ✅ **Chat - Étape dates**: Le chat demande date + heure, accepte format naturel
3. ✅ **Chat - Étape location**: Après dates, demande ville/CP/département
4. ✅ **Chat - Étape phone**: Après location, demande téléphone (obligatoire)
5. ✅ **Chat - Récap**: Affiche récap complet avec 2 boutons (payer / appeler)
6. ✅ **Checkout - Acompte**: Clic "Payer acompte 30%" → Stripe checkout → redirection dashboard
7. ✅ **Webhook - Paiement**: Après paiement, `deposit_paid_at` rempli, `status` = AWAITING_BALANCE
8. ✅ **Dashboard - Paiements**: Affiche acompte payé, solde J-5, caution J-2
9. ✅ **Dashboard - Contrat**: Affiche bouton "Signer contrat" si nécessaire
10. ✅ **Dashboard - Documents**: Téléchargement contrat/facture fonctionne

---

## Ordre d'Exécution Recommandé

1. **PR 1** → Types (base pour tout)
2. **PR 2** → useChat (base pour widget)
3. **PR 3** → API chat (indépendant)
4. **PR 4** → Widget (utilise PR 1-3)
5. **PR 5** → Endpoint checkout (utilise PR 4)
6. **PR 6** → Webhook (vérification)
7. **PR 7** → Dashboard user (indépendant)
8. **PR 8** → Dashboard admin (indépendant)

---

## Notes Importantes

- **Pas de breaking changes**: Les anciennes tables/fonctions restent, on ne les utilise juste plus
- **RLS intact**: Les politiques Supabase restent valides
- **Admin service role**: Utilisation service role pour admin comme avant
- **Backward compatible**: Les anciennes réservations continuent de fonctionner
