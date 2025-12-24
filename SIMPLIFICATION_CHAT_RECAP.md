# Simplification du Chat - Récapitulatif des Changements

## Objectif
Simplifier drastiquement le chat pour que le client n'ait QUE 2 sorties possibles :
1. **Payer l'acompte 30%** (checkout) pour bloquer la date
2. **Appeler Soundrush** (téléphone) si préférence ou info manquante/urgence

## Nouveau Flow Simplifié

### PHASE 0 (Welcome)
- Message : "Je te propose 3 packs: Conférence / Soirée / Mariage"
- Quick replies : 3 boutons (Conférence, Soirée, Mariage)

### PHASE 1 (Infos minimales)
Questions strict minimum (pas de répétition) :
1. Date + horaire (start_at / end_at)
2. Ville / code postal (ou département)
3. Téléphone (obligatoire)

Options selon pack :
- **Conférence** : "combien de micros ?" (1–4)
- **Soirée** : "combien de personnes ?" (<=50 / 50-100 / 100+)
- **Mariage** : "intérieur ou extérieur ?"

### PHASE 2 (Résumé)
- Résumé clair : pack choisi + date + lieu + total estimé + acompte 30% (montant)
- **CTA 1** : "Payer l'acompte 30%" (principal)
- **CTA 2** : "Appeler Soundrush" (secondaire)
- Mention courte : "solde J-5, caution J-2" (1 ligne max)

### PHASE 3 (Paiement)
- Au clic CTA 1 :
  - Créer directement une `client_reservation` en status `AWAITING_PAYMENT`
  - Lancer Stripe checkout pour montant acompte (30%)
  - Après paiement: webhook → `deposit_paid_at` + status `AWAITING_BALANCE`
- Au clic CTA 2 : ouvrir `tel:+33123456789` + message "Dis que tu viens du site"

## Fichiers Modifiés

### 1. Migration SQL
- ✅ `supabase/migrations/20250105000002_add_source_and_chat_context_to_client_reservations.sql`
  - Ajout colonne `source` (text)
  - Ajout colonne `chat_context` (jsonb)

### 2. Types
- ✅ `types/chat.ts`
  - Ajout interface `ChatDraft` (simplifié)
  - `ReservationRequestDraft` marqué DEPRECATED

### 3. À Modifier (En cours)

#### `components/FloatingChatWidget.tsx`
**À supprimer** :
- `trackingUrl` et état associé
- Bouton "Suivre ma demande"
- Bouton "Envoyer la demande"
- Logique `isInstantBookingEligible`
- Logique `handleNormalRequest`
- Logique `handleInstantBooking` (remplacer par version simplifiée)
- Vérification disponibilité complexe
- Holds

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

#### `hooks/useChat.ts`
**À supprimer** :
- `reservationRequestDraft` (remplacer par `chatDraft`)
- Logique availability check complexe
- Logique instant booking

**À garder/modifier** :
- Anti-doublons
- Welcome message
- Structure simple : `chatDraft { packKey, startAt, endAt, location, phone, extras }`

#### `lib/chatState.ts`
**À simplifier** :
- Réduire extraction au strict nécessaire (date, lieu, téléphone, options pack)
- Supprimer scénarios non utiles

#### `app/api/chat/route.ts`
**À réécrire** :
- Nouveau prompt système simplifié :
  - Phase 0 : Welcome avec 3 packs
  - Phase 1 : Questions minimales uniquement
  - Phase 2 : Résumé + 2 CTAs obligatoires
  - Aucune proposition "demande" / "suivi"
  - Pas de questions déjà posées
  - Toujours finir par résumé + 2 CTAs quand complet

**Nouveau prompt système** :
```
Tu es l'assistant Soundrush. Ton rôle est simple :

PHASE 0 (Welcome) :
- Présenter les 3 packs : Conférence / Soirée / Mariage
- Attendre le choix du client

PHASE 1 (Infos minimales) :
Collecter UNIQUEMENT :
1. Date + horaire (début et fin)
2. Ville / code postal
3. Téléphone (obligatoire)

Options selon pack :
- Conférence : nombre de micros (1-4)
- Soirée : nombre de personnes (<=50 / 50-100 / 100+)
- Mariage : intérieur ou extérieur

NE JAMAIS :
- Répéter une question déjà posée
- Poser plus de questions que nécessaire
- Proposer "envoyer une demande" ou "suivre ma demande"

PHASE 2 (Résumé + CTAs) :
Quand toutes les infos sont collectées :
1. Afficher un résumé clair : pack + date + lieu + total estimé + acompte 30%
2. Proposer 2 CTAs :
   - "Payer l'acompte 30%" (principal)
   - "Appeler Soundrush" (secondaire)
3. Mentionner : "Solde J-5, caution J-2"

Format JSON pour résumé complet :
{
  "chatDraft": {
    "packKey": "conference" | "soiree" | "mariage",
    "startAt": "2025-01-15T19:00:00Z",
    "endAt": "2025-01-15T23:00:00Z",
    "location": "Paris 11ème",
    "phone": "0612345678",
    "extras": {
      "microsCount": 2, // ou peopleCount, ou indoorOutdoor selon pack
    }
  },
  "summary": "Résumé texte pour l'utilisateur",
  "estimatedTotal": 279, // prix pack
  "depositAmount": 84 // 30% arrondi
}
```

#### `app/api/payments/create-checkout-session/route.ts`
**À adapter** :
- Accepter `clientReservationId` OU créer directement `client_reservation` depuis `chatDraft`
- Calculer acompte = 30% de `price_total` (arrondi propre)
- Si `chatDraft` fourni, créer `client_reservation` avec `source='chat'` et `chat_context`

#### Dashboards
**À vérifier** :
- `app/dashboard/page.tsx` : affichage correct des `client_reservations` créées via chat
- `app/admin/reservations/page.tsx` : affichage correct avec source 'chat'

## Code Supprimé

### Composants/Fichiers à supprimer (si plus utilisés)
- `components/ChatboxProvider.tsx` (si plus utilisé)
- `components/ChatboxAssistant.tsx` (si plus utilisé)
- Logique `reservation_requests` pour le flux chat (garder pour admin manuel si besoin)

### Constants/Types devenus inutiles
- `ReservationRequestDraft` (remplacer par `ChatDraft`)
- Types availability check complexes (simplifier si nécessaire)

## Notes Importantes

- Le client ne doit JAMAIS voir "Envoyer une demande"
- Toujours : acompte 30% OU appel
- Un seul CTA principal
- Pas de sur-qualification (pas 15 questions)
- Rester robuste : si date manquante → demander date; si lieu manquant → demander lieu; si téléphone manquant → demander téléphone

## Prochaines Étapes

1. ✅ Migration SQL créée et appliquée
2. ✅ Types simplifiés créés (ChatDraft)
3. ✅ Nouveau prompt système créé dans app/api/chat/route.ts
4. ✅ Support chatDraft dans extraction JSON API
5. ⏳ Modifier FloatingChatWidget.tsx (utiliser chatDraft au lieu de reservationRequestDraft)
6. ⏳ Modifier useChat.ts (exposer chatDraft)
7. ⏳ Simplifier lib/chatState.ts
8. ⏳ Adapter API paiement (créer client_reservation depuis chatDraft)
9. ⏳ Vérifier dashboards
10. ⏳ Nettoyage code mort

## Fichiers Modifiés

- ✅ `supabase/migrations/20250105000002_add_source_and_chat_context_to_client_reservations.sql`
- ✅ `types/chat.ts`
- ✅ `app/api/chat/route.ts`
- 📄 `SIMPLIFICATION_CHAT_CHANGEMENTS_EFFECTUES.md` (créé)

## Fichiers À Modifier

- ⏳ `components/FloatingChatWidget.tsx`
- ⏳ `hooks/useChat.ts`
- ⏳ `lib/chatState.ts`
- ⏳ `app/api/payments/create-checkout-session/route.ts`
