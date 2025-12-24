# Ajustement Client Reservations - Récapitulatif

## Objectif
Permettre à l'admin d'ajuster une `client_reservation` (items finaux + prix) après qu'un client ait payé l'acompte 30%, puis générer un résumé client propre + préparer documents (contrat/facture).

## Fichiers Créés

### 1. Types Partagés
- ✅ **Fichier** : `types/db.ts`
- **Contenu** :
  - `FinalItem` : Structure pour les items finaux (pack + extras)
  - `ExtraItem` : Structure pour les extras ajoutés
  - `ClientReservation` : Structure complète d'une réservation

### 2. Helpers Pricing
- ✅ **Fichier** : `lib/pricing.ts`
- **Fonctions** :
  - `computeBasePackPrice(packKey, startAt?, endAt?)` : Calcule le prix de base du pack
  - `computeExtrasTotal(finalItems)` : Calcule le total des extras
  - `computePriceTotal(base, extras)` : Calcule le prix total
  - `computeDepositAmount(total)` : Calcule l'acompte 30% en centimes (pour Stripe)
  - `computeDepositAmountEur(total)` : Calcule l'acompte 30% en euros (pour affichage)
  - `computeBalanceAmount(total, depositPaidAmount?)` : Calcule le solde restant

### 3. Génération Résumé Client
- ✅ **Fichier** : `lib/customerSummary.ts`
- **Fonction** :
  - `buildCustomerSummary(reservation, finalItems)` : Génère un résumé clair (4-6 lignes)
  - Format : Pack + date + lieu + inclus + extras + paiement

### 4. API Admin Adjust
- ✅ **Fichier** : `app/api/admin/client-reservations/adjust/route.ts`
- **Endpoint** : `POST /api/admin/client-reservations/adjust`
- **Body** :
  ```json
  {
    "id": "uuid",
    "final_items": [
      {
        "id": "string",
        "label": "string",
        "qty": number,
        "unitPrice": number, // optionnel si inclus dans pack
        "isExtra": boolean,
        "note": "string" // optionnel
      }
    ],
    "admin_note": "string" // optionnel
  }
  ```
- **Fonctionnalités** :
  - Auth admin uniquement (service role)
  - Calcule automatiquement : `base_pack_price`, `extras_total`, `price_total`, `balance_amount`
  - Met à jour : `final_items`, `customer_summary`, `final_validated_at`
  - Gère les ajustements de prix après paiement acompte (recalcule `balance_amount`)

### 5. Migration SQL
- ✅ **Fichier** : `supabase/migrations/20250105000003_add_final_validated_at_to_client_reservations.sql`
- ✅ **Statut** : Appliquée avec succès
- **Changements** :
  - Ajout colonne `final_validated_at` (timestamptz nullable)
  - Index créé pour performances

### 6. Tests Unitaires
- ✅ **Fichier** : `lib/pricing.test.ts`
- ✅ **Fichier** : `lib/customerSummary.test.ts`
- **Couverture** :
  - Tests pour tous les helpers de pricing
  - Tests pour la génération du résumé client
  - Scénarios : avec/sans extras, avec/sans acompte payé, ajustements prix

## Logique de Calcul

### Prix de Base
- Les packs ont un prix fixe :
  - Pack Conférence : 279€
  - Pack Soirée : 329€
  - Pack Mariage : 449€
- Pour l'instant, pas de calcul selon durée (peut être ajouté plus tard)

### Extras
- Les extras sont identifiés par `isExtra: true`
- Le total = somme de `unitPrice * qty` pour tous les extras

### Prix Total
- `price_total = base_pack_price + extras_total`

### Acompte
- `deposit_amount = 30% de price_total` (arrondi au centime supérieur pour Stripe)

### Solde
- Si acompte **non payé** : `balance_amount = 70% de price_total`
- Si acompte **déjà payé** : `balance_amount = price_total - acompte_payé`
- **Important** : Si `price_total` change après paiement acompte, le `balance_amount` est recalculé automatiquement

## Exemple d'Utilisation

### Scénario : Ajustement après paiement acompte

1. **Réservation initiale** :
   - Pack Conférence : 279€
   - Acompte 30% : 83.7€ (payé)
   - Solde : 195.3€

2. **Admin ajoute extras** :
   - Micro supplémentaire : 25€
   - Nouveau total : 304€

3. **Recalcul automatique** :
   - Acompte payé : 83.7€ (inchangé)
   - Nouveau solde : 304 - 83.7 = 220.3€
   - `balance_amount` mis à jour automatiquement

### Appel API

```typescript
const response = await fetch('/api/admin/client-reservations/adjust', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    id: 'reservation-uuid',
    final_items: [
      { id: '1', label: 'Enceinte', qty: 2, isExtra: false },
      { id: '2', label: 'Micro HF', qty: 2, isExtra: false },
      { id: '3', label: 'Console de mixage', qty: 1, isExtra: false },
      { id: '4', label: 'Micro supplémentaire', qty: 1, isExtra: true, unitPrice: 25 },
    ],
    admin_note: 'Ajout micro supplémentaire pour intervenant supplémentaire'
  })
});
```

### Réponse API

```json
{
  "success": true,
  "reservation": {
    "id": "uuid",
    "base_pack_price": 279,
    "extras_total": 25,
    "price_total": 304,
    "balance_amount": 220.3,
    "final_items": [...],
    "customer_summary": "Pack Conférence le mercredi 15 janvier 2025 de 20:00 à 00:00. Lieu : Paris 11ème. Inclus : 2 enceintes, 2 micro hfs, console de mixage. Extras : micro supplémentaire. Paiement : Acompte 30% payé, solde J-5, caution J-2.",
    "final_validated_at": "2025-01-05T10:30:00Z"
  },
  "pricing": {
    "base_pack_price": 279,
    "extras_total": 25,
    "price_total": 304,
    "balance_amount": 220.3,
    "deposit_amount": null
  },
  "customer_summary": "..."
}
```

## Gestion des Statuts

### Option A (Implémentée)
- `status` reste `AWAITING_BALANCE` (tant que solde pas payé)
- `final_validated_at` est défini quand l'admin ajuste
- Permet de tracker quand la version finale est validée sans changer le statut de paiement

### Workflow
1. Client paie acompte → `status = AWAITING_BALANCE`, `deposit_paid_at` défini
2. Admin ajuste items/prix → `final_validated_at` défini, `balance_amount` recalculé
3. Client paie solde → `status = CONFIRMED`, `balance_paid_at` défini

## Notes Importantes

- **Ajustement après paiement acompte** : Le `balance_amount` est automatiquement recalculé pour refléter le nouveau prix total
- **Customer Summary** : Généré automatiquement à chaque ajustement
- **Final Items** : Doivent représenter EXACTEMENT ce qui sera livré (pack + extras)
- **Validation** : `final_validated_at` marque le moment où l'admin a validé la version finale

## Prochaines Étapes (Optionnel)

1. Intégrer l'API dans l'interface admin (page de détail réservation)
2. Ajouter validation côté client si besoin (notification email)
3. Ajouter logs d'audit pour les ajustements
4. Gérer les cas où le nouveau prix est inférieur à l'ancien (remboursement partiel)
