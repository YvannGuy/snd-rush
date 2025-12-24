# ✅ Intégration Complète - Chat Simplifié

## 🎯 Modifications Effectuées

### 1. Layout Global
**Fichier**: `app/layout.tsx`
- ✅ Import `FloatingChatWidgetSimplified`
- ✅ Condition selon `NEXT_PUBLIC_USE_SIMPLIFIED_CHAT`
- ✅ Fallback sur ancien widget si flag désactivé

### 2. Pages Packs Individuels
**Fichiers**: 
- ✅ `app/conference/page.tsx` - Ouvre chat avec `packKey: 'conference'`
- ✅ `app/soiree/page.tsx` - Ouvre chat avec `packKey: 'soiree'`
- ✅ `app/mariage/page.tsx` - Ouvre chat avec `packKey: 'mariage'`

**Changements**:
- Écoute événement `openChatWithPack` avec packKey correspondant
- Fallback sur ancien système si flag désactivé

### 3. Composant SolutionsSection
**Fichier**: `components/SolutionsSection.tsx`
- ✅ `handleReservationRequest` adapté pour nouveau système
- ✅ Dispatch `openChatWithPack` si flag activé
- ✅ Fallback sur `openChatWithDraft` si flag désactivé

### 4. Composant PackDetailContent
**Fichier**: `components/PackDetailContent.tsx`
- ✅ Mapping packId (9, 10, 11) → packKey (conference, soiree, mariage)
- ✅ Bouton "Réserver maintenant" adapté
- ✅ Dispatch `openChatWithPack` si flag activé

### 5. Widget Chat Simplifié
**Fichier**: `components/FloatingChatWidget.simplified.tsx`
- ✅ Écoute événements: `openChatWithPack`, `openChatWithDraft`, `openAssistantModal`
- ✅ Compatibilité avec anciens événements

---

## 🔧 Configuration

### Activer le Chat Simplifié

**Option 1: Variable d'environnement**
```bash
# .env.local
NEXT_PUBLIC_USE_SIMPLIFIED_CHAT=true
```

**Option 2: Forcer l'activation dans le code**
```typescript
// app/layout.tsx
// Remplacer la condition par:
<FloatingChatWidgetSimplified />
```

---

## 📋 Mapping PackId → PackKey

| PackId | PackKey | Page |
|--------|---------|------|
| 9 | conference | `/conference` |
| 10 | soiree | `/soiree` |
| 11 | mariage | `/mariage` |

---

## 🎨 Points d'Entrée Chat

### 1. SolutionsSection (Homepage)
- 3 cards avec boutons "Réserver"
- Dispatch `openChatWithPack` avec packKey correspondant

### 2. Pages Packs Individuels
- `/conference` → packKey: 'conference'
- `/soiree` → packKey: 'soiree'
- `/mariage` → packKey: 'mariage'

### 3. PackDetailContent
- Bouton "Réserver maintenant" pour packs 9, 10, 11
- Mapping automatique packId → packKey

### 4. FloatingChatButton
- Bouton flottant (bas droite)
- Ouvre chat sans packKey (mode normal)

---

## ✅ Checklist Intégration

- [x] Layout global adapté
- [x] Pages packs individuels adaptées
- [x] SolutionsSection adaptée
- [x] PackDetailContent adapté
- [x] Widget écoute événements
- [x] Compatibilité ancien système (fallback)
- [ ] Tests manuels (voir CHECKLIST_QA_CHAT_SIMPLIFIE.md)
- [ ] Variable d'environnement configurée
- [ ] Tests end-to-end

---

## 🚀 Prochaines Étapes

1. **Configurer la variable d'environnement**:
   ```bash
   echo "NEXT_PUBLIC_USE_SIMPLIFIED_CHAT=true" >> .env.local
   ```

2. **Tester le flow complet**:
   - Homepage → Clic "Réserver" sur card pack
   - Page pack → Clic "Réserver maintenant"
   - Chat → Entrer dates → location → phone → Payer acompte

3. **Vérifier le webhook Stripe**:
   - Paiement acompte → Vérifier `deposit_paid_at` rempli
   - Vérifier `status` = AWAITING_BALANCE

4. **Vérifier le dashboard**:
   - Réservation visible
   - Paiements affichés
   - Documents téléchargeables

---

## 🔄 Rollback

Si problème, désactiver le flag:
```bash
# .env.local
NEXT_PUBLIC_USE_SIMPLIFIED_CHAT=false
```

Ou commenter dans `app/layout.tsx`:
```typescript
// <FloatingChatWidgetSimplified />
<FloatingChatWidget />
```
