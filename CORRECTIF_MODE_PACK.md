# Correctif Mode Pack - Chat Robuste

## 📋 Résumé des corrections

Ce correctif rend le chat "mode pack" robuste en :
1. Pré-remplissant automatiquement la logistique (livraison + installation incluses)
2. Supprimant la question "retrait ou livraison" en mode pack
3. Adaptant les questions vibe selon le packKey (conférence ≠ DJ/son fort)
4. Empêchant la génération de `draftFinalConfig` en mode pack (uniquement `reservationRequestDraft`)
5. Ajoutant des garde-fous anti-mélange DJ/conférence

## 🔧 Modifications apportées

### A) `lib/chatState.ts`

#### 1. Types mis à jour
- `KnownContext` : Ajout de `withInstallation?: boolean`
- `ConversationState` : Ajout de `packKey?: string | null`

#### 2. `buildConversationState()` amélioré
- Ajout du paramètre `packKey?: string | null`
- **Pré-remplissage automatique** si `packKey` défini :
  - `known.deliveryChoice = 'livraison'`
  - `known.withInstallation = true`
  - `asked.deliveryChoice = true` (pour ne jamais poser la question)
- Retourne `packKey` dans le state

#### 3. `getNextQuestion()` avec flow mode pack
- **Branche prioritaire** si `state.packKey` défini
- Ordre strict mode pack :
  1. eventType
  2. peopleCount
  3. indoorOutdoor
  4. vibe (adapté selon packKey)
  5. start (date+heure)
  6. end (date+heure)
  7. department (obligatoire)
  8. address (obligatoire)
  9. confirmation
- **Questions vibe contextuelles** :
  - `packKey === "conference"` : Questions micros/intervenants/vidéo (PAS DJ/son fort)
  - `packKey === "soiree"` : Ambiance/DJ/son fort ok
  - `packKey === "mariage"` : Cérémonie + discours + soirée DJ
- **Suppression totale** de la question `deliveryChoice` en mode pack

#### 4. `extractVibe()` amélioré
- Ajout du paramètre `packKey`
- **Anti-mélange** : Si `packKey === "conference"`, ne retourne jamais 'dj'
- Ignore explicitement les mentions DJ/son fort pour conférence

### B) `app/api/chat/route.ts`

#### 1. Passage de `packKey` à `buildConversationState`
- `buildConversationState({ ..., packKey: packKey || null })`
- Logs ajoutés pour debugging mode pack

#### 2. Instructions mode pack améliorées dans le prompt système
- Clarification : Livraison + Installation INCLUSES (ne jamais demander)
- Instructions vibe adaptées selon packKey
- Interdiction absolue de générer `draftFinalConfig` en mode pack

#### 3. Garde-fous anti-mélange dans `buildAssistantReply()`
- Bloque les templates mentionnant DJ/son fort si `packKey === "conference"`
- Bloque les templates répétitifs en mode pack

#### 4. Garde-fous anti-`draftFinalConfig` en mode pack
- Vérification lors du parsing JSON : ignore `draftFinalConfig` si `packKey` défini
- Bloque la construction manuelle de `draftFinalConfig` en mode pack

## 📊 Exemple de flow mode pack

### Pack Conférence

**Utilisateur** : "Je souhaite faire une demande de réservation pour le Pack Conférence."
**Assistant** : "Parfait ! Pour le Pack Conférence, j'ai besoin de quelques infos. C'est pour quel type d'événement ?"

**Utilisateur** : "conférence"
**Assistant** : "Combien de personnes environ ?"

**Utilisateur** : "50"
**Assistant** : "C'est en intérieur ou en extérieur ?"

**Utilisateur** : "intérieur"
**Assistant** : "Combien d'intervenants auront besoin d'un micro ?" ✅ (PAS de mention DJ/son fort)

**Utilisateur** : "3 intervenants"
**Assistant** : "C'est quelle date de début (jour + heure) ?"

**Utilisateur** : "du 20 décembre au 21 décembre"
**Assistant** : "Et la date/heure de fin ?"

**Utilisateur** : "de 20h à 06h"
**Assistant** : "Tu es dans quel département ?" ✅ (Livraison incluse, pas de question "retrait ou livraison")

**Utilisateur** : "75"
**Assistant** : "Et l'adresse de livraison exacte ?"

**Utilisateur** : "123 rue de la Paix, 75001 Paris"
**Assistant** : Génère `reservationRequestDraft` ✅ (PAS de `draftFinalConfig`)

## ✅ Points clés du correctif

1. **Logistique pré-remplie** : Livraison + Installation automatiques en mode pack
2. **Questions adaptées** : Vibe selon packKey (conférence ≠ DJ)
3. **Anti-mélange robuste** : Garde-fous multiples pour éviter DJ/conférence
4. **Pas de draftFinalConfig** : Uniquement `reservationRequestDraft` en mode pack
5. **Flow strict** : Ordre des questions respecté, pas de répétition

## 🧪 Tests recommandés

### Test 1 : Pack Conférence
- Vérifier qu'aucune question "retrait ou livraison" n'apparaît
- Vérifier qu'aucune mention DJ/son fort n'apparaît
- Vérifier que `reservationRequestDraft` est généré (pas `draftFinalConfig`)

### Test 2 : Pack Soirée
- Vérifier que DJ/son fort peut être mentionné
- Vérifier le flow complet jusqu'à `reservationRequestDraft`

### Test 3 : Pack Mariage
- Vérifier les questions cérémonie + soirée
- Vérifier le flow complet

## 📝 Notes techniques

- **TypeScript strict** : Tous les types sont correctement définis
- **Rétrocompatible** : Le mode normal (sans packKey) continue de fonctionner
- **Minimalement intrusif** : Changements ciblés, pas de refactor massif
- **Logs ajoutés** : Pour faciliter le debugging mode pack

## 🚀 Prochaines étapes recommandées

1. Tester en conditions réelles avec les 3 packs
2. Monitorer les logs pour détecter d'éventuels cas edge
3. Vérifier que le front envoie bien `packKey` dans les requêtes
4. Valider que `reservationRequestDraft` est correctement traité côté front
