# UI Ajustement Réservation - Récapitulatif

## Objectif
Ajouter une UI admin simple pour ajuster les items d'une `client_reservation` + afficher côté user la version finale (final_items + résumé) et documents.

## Fichiers Créés/Modifiés

### 1. Composant Modal Admin
- ✅ **Fichier** : `components/admin/AdjustReservationModal.tsx`
- **Fonctionnalités** :
  - Liste items inclus (pack) en lecture seule
  - Section "Extras" éditable (ajouter/supprimer)
  - Affichage live des prix : base_pack_price, extras_total, total, acompte 30%, solde restant
  - Validation : qty >= 1, price >= 0, label non vide
  - Pré-remplissage avec final_items existant ou initialisation avec pack standard

### 2. Intégration Admin
- ✅ **Fichier** : `app/admin/reservations/page.tsx`
- **Modifications** :
  - Ajout bouton "Ajuster le pack" dans le modal de détail réservation
  - Visible uniquement pour `client_reservations` (vérification `start_at`)
  - Intégration du composant `AdjustReservationModal`
  - Rechargement automatique après ajustement

### 3. Affichage User Dashboard
- ✅ **Fichier** : `app/dashboard/page.tsx`
- **Modifications** :
  - Ajout bloc "Contenu de la prestation" pour `nextReservation`
  - Affichage liste courte (3-8 lignes) des `final_items`
  - Badge "Validé" si `final_validated_at` non null
  - Affichage `customer_summary` si présent
  - Distinction visuelle entre items pack et extras

### 4. PDF Contrat
- ✅ **Fichier** : `app/api/contract/download/route.ts`
- **Modifications** :
  - Ajout section "MATÉRIEL INCLUS" si `final_items` disponible
  - Séparation "Inclus dans le pack" et "Extras"
  - Affichage quantités et prix pour les extras

### 5. PDF Facture
- ✅ **Fichier** : `app/api/invoice/download/route.ts`
- **Modifications** :
  - Priorité 1 : Utiliser `final_items` depuis `client_reservation` si `order.client_reservation_id` présent
  - Création lignes facture cohérentes : base pack + extras
  - Fallback sur `order_items` ou `metadata.cartItems` si pas de `client_reservation`

### 6. Lien Order <-> Client Reservation
- ✅ **Vérification** : `app/api/webhooks/stripe/route.ts`
- **Statut** : ✅ Déjà implémenté
  - Les orders créés lors des paiements Stripe incluent `client_reservation_id`
  - Migration `20250105000000_add_client_reservation_id_to_orders.sql` déjà appliquée
  - Webhook remplit `client_reservation_id` pour :
    - `client_reservation_deposit` (acompte 30%)
    - `client_reservation_balance` (solde 70%)
    - `client_reservation_security_deposit` (caution)

## Flux Utilisateur

### Admin
1. Ouvrir la page `/admin/reservations`
2. Cliquer sur une réservation (client_reservation)
3. Dans le modal de détail, cliquer "Ajuster le pack"
4. Modal s'ouvre avec :
   - Items du pack (lecture seule)
   - Liste des extras existants (éditable)
   - Formulaire pour ajouter un extra (label, qty, price)
   - Calcul live des prix
5. Cliquer "Enregistrer" → POST `/api/admin/client-reservations/adjust`
6. La réservation est mise à jour avec `final_items`, `final_validated_at`, etc.

### User
1. Ouvrir `/dashboard`
2. Voir la section "Ma prochaine prestation"
3. Si `final_items` existe :
   - Bloc "Contenu de la prestation" affiché
   - Liste des items (max 8 lignes)
   - Badge "Validé" si `final_validated_at` présent
   - Résumé client (`customer_summary`) affiché

### Documents
- **Contrat PDF** : Affiche "MATÉRIEL INCLUS" avec pack + extras si `final_items` disponible
- **Facture PDF** : Utilise `final_items` depuis `client_reservation` pour créer les lignes de facture

## Structure Données

### FinalItem
```typescript
{
  id: string;
  label: string;
  qty: number;
  unitPrice?: number; // optionnel si inclus dans pack
  isExtra: boolean;
  note?: string;
}
```

### Exemple final_items
```json
[
  {
    "id": "pack-main",
    "label": "Pack Soirée",
    "qty": 1,
    "isExtra": false
  },
  {
    "id": "pack-1",
    "label": "Enceinte",
    "qty": 2,
    "isExtra": false
  },
  {
    "id": "extra-1",
    "label": "Micro supplémentaire",
    "qty": 1,
    "unitPrice": 25,
    "isExtra": true
  }
]
```

## Validation

- ✅ qty >= 1
- ✅ price >= 0 (pour extras)
- ✅ label non vide
- ✅ Calcul automatique des prix
- ✅ Recalcul du solde si acompte déjà payé

## Notes Techniques

- Le modal utilise `useEffect` pour initialiser les items depuis `final_items` ou le pack de base
- Les prix sont calculés en temps réel avec les helpers `lib/pricing.ts`
- Le `customer_summary` est généré automatiquement par `lib/customerSummary.ts`
- Les PDFs utilisent une logique de priorité pour déterminer la source des items

## Prochaines Étapes (Optionnel)

1. Ajouter historique des ajustements (audit trail)
2. Permettre modification des quantités des items pack (actuellement lecture seule)
3. Ajouter notifications email au client lors d'un ajustement
4. Ajouter validation côté client si besoin
