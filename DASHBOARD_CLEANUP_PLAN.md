# Plan de Nettoyage Dashboards

## Dashboard User - Simplification en 3 sections

### Structure cible :
1. **Mes Paiements** (Section principale)
   - Acompte 30% (payé / à payer)
   - Solde restant (J-5)
   - Caution (J-2, non débitée sauf incident)
   - Boutons d'action pour payer

2. **Mes Documents** (Section principale)
   - Contrat (signer / télécharger)
   - Factures (télécharger)
   - États des lieux (si disponible)

3. **Mes Actions** (Section principale)
   - Signer contrat si nécessaire
   - Voir réservation détaillée
   - Support

### À supprimer/simplifier :
- Stats cards (signedContracts, totalDeposit, totalRentals) → Optionnel ou déplacé
- "Ma prochaine prestation" → Intégré dans "Mes Actions"
- "Réservations payées" → Intégré dans "Mes Documents"
- Actions rapides → Simplifié dans "Mes Actions"

---

## Dashboard Admin - Basculer sur client_reservations

### Changements :
1. **Stats Cards** → Basculer sur `client_reservations` uniquement
2. **Réservations à venir** → Basculer sur `client_reservations`
3. **CA du mois** → Calculer depuis `client_reservations`
4. **Matériel sorti** → Basculer sur `client_reservations`
5. **Retours en retard** → Basculer sur `client_reservations`
6. **Planning** → Basculer sur `client_reservations`

### À garder (déjà OK) :
- Automatisation (solde J-5, caution J-2) → Déjà sur `client_reservations` ✅
- Événements de la semaine → Déjà sur `client_reservations` ✅

### À ajouter :
- Accès rapide documents (contrat/facture) dans chaque réservation
- Voir signature (client_signed_at) dans le détail
