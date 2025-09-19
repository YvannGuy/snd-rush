# 🤖 Widget Assistant SND Rush - Guide d'intégration

## 📋 Vue d'ensemble

Le widget assistant IA `sndrush-assistant.js` est un composant Web autonome qui aide les visiteurs à choisir le pack de sonorisation adapté à leurs besoins.

### ✨ Fonctionnalités

- **7 questions ciblées** sur la sonorisation
- **Recommandation intelligente** basée sur les réponses
- **Intégration native** avec le système de réservation existant
- **Design responsive** et accessible
- **Persistance locale** des réponses
- **Zero backend** - tout fonctionne côté client

## 🚀 Installation

### 1. Ajouter le fichier JavaScript

```html
<!-- Dans le <head> ou avant la fermeture du </body> -->
<script src="/sndrush-assistant.js" defer></script>
```

### 2. Définir les packs (optionnel)

```html
<script>
window.__SNDRUSH_PACKS__ = [
  {
    name: 'Pack STANDARD',
    priceText: '139€',
    priceValue: 139,
    description: 'Solution complète avec micro sans fil...',
    features: ['2 enceintes', 'Console de mixage', '...'],
    capacity: 'small' // 'small', 'medium', 'large'
  },
  // ... autres packs
];
</script>
```

### 3. Auto-initialisation

Le widget s'initialise automatiquement au chargement de la page. Aucune configuration supplémentaire n'est nécessaire.

## 🎯 Questions de l'assistant

1. **Type d'événement** : Mariage, Anniversaire, Corporate, Église, Association, Autre
2. **Nombre d'invités** : 0-50, 50-100, 100-200, 200+
3. **Lieu** : Paris, Petite Couronne, Grande Couronne, Orléans
4. **Environnement** : Intérieur, Extérieur
5. **Usage** : Discours, Musique d'ambiance, Soirée dansante, Live
6. **Logistique** : Retrait sur place, Livraison + Installation, Technicien sur place
7. **Date** : Champ texte libre

## 🧠 Logique de recommandation

### Critères principaux

- **Nombre d'invités** : Détermine la capacité requise
- **Usage** : Soirée dansante/Live → packs plus puissants
- **Environnement** : Extérieur → bonus puissance
- **Logistique** : Prise en compte des options

### Scores par capacité

```javascript
// Exemple de scoring
const capacityScore = {
  '0-50': { small: 0.9, medium: 0.3, large: 0.1 },
  '50-100': { small: 0.7, medium: 0.8, large: 0.2 },
  '100-200': { small: 0.2, medium: 0.9, large: 0.6 },
  '200+': { small: 0.1, medium: 0.4, large: 0.95 }
};
```

## 🔧 DOM Scraping

Le widget détecte automatiquement les packs présents sur la page :

### Sélecteurs utilisés

```javascript
const selectors = {
  packs: [
    '[data-pack]', '.pack', '.card-pack', '.pack-item', 
    '.product', '.tarif', '.bg-white.rounded-xl.shadow-lg'
  ],
  packTitle: ['.pack-title', 'h2', 'h3', '[data-pack-name]'],
  packPrice: ['.price', '[data-pack-price]', '.text-3xl'],
  packDesc: ['.desc', '.content', '[data-pack-desc]'],
  packFeatures: ['ul li', '.features li', '.list-disc li']
};
```

### Format de données attendu

```javascript
{
  name: 'Pack STANDARD',
  priceText: '139€',
  priceValue: 139,
  description: 'Description du pack...',
  features: ['Feature 1', 'Feature 2', '...'],
  capacity: 'small' // 'small', 'medium', 'large'
}
```

## 🎨 Personnalisation

### Couleurs

```javascript
const CONFIG = {
  accentColor: '#e27431', // Couleur principale
  // ... autres options
};
```

### Questions personnalisées

Modifiez le tableau `QUESTIONS` dans le fichier JavaScript :

```javascript
const QUESTIONS = [
  {
    id: 'customQuestion',
    question: 'Votre question personnalisée ?',
    type: 'single', // ou 'text'
    options: [
      { value: 'option1', label: 'Option 1', icon: '🎵' }
    ]
  }
];
```

## 🔗 Intégration réservation

### Sélecteurs de réservation

Le widget cherche automatiquement ces éléments :

```javascript
const reservationSelectors = [
  'a[href*="reserver"]',
  'a[href*="#reserver"]', 
  '[data-cta="reserve"]',
  'button:contains("Réserver")',
  '#booking', '#reserver'
];
```

### Préremplissage automatique

Le widget tente de préremplir :

- `input[name*="name"]` → Nom
- `input[name*="email"]` → Email  
- `input[name*="date"]` → Date
- `textarea[name*="message"]` → Message généré

### Message généré

```
Bonjour,

Je souhaite réserver le Pack STANDARD (139€) pour mon événement.

Détails de l'événement :
- Type : Mariage
- Invités : 100-200 personnes
- Lieu : Paris
- Environnement : Intérieur
- Usage : Soirée dansante
- Logistique : Livraison + Installation
- Date : 15 juin 2024

Merci de me recontacter pour finaliser la réservation.
```

## 📱 API JavaScript

### Initialisation manuelle

```javascript
// Initialiser le widget
SndRushAssistant.init();

// Détruire le widget
SndRushAssistant.destroy();

// Définir des packs personnalisés
SndRushAssistant.setPacks([
  { name: 'Pack Custom', priceText: '199€', ... }
]);
```

### Événements

```javascript
// Écouter les recommandations
document.addEventListener('sndrush-recommendation', (event) => {
  console.log('Pack recommandé:', event.detail);
});
```

## 🎯 Accessibilité

- **Navigation clavier** : Tab, Enter, Escape
- **Rôles ARIA** : `aria-label`, `aria-expanded`
- **Focus visible** : Indicateurs visuels clairs
- **Contraste** : Respect des standards WCAG

## 📊 Performance

- **Taille** : < 60KB minifié
- **Dépendances** : Aucune (vanilla JS)
- **Chargement** : Asynchrone avec `defer`
- **Mémoire** : Optimisé avec Shadow DOM

## 🧪 Tests

### Fichier de test inclus

Ouvrez `test-widget.html` dans un navigateur pour tester :

1. ✅ Détection automatique des packs
2. ✅ Questions et navigation
3. ✅ Logique de recommandation
4. ✅ Intégration réservation
5. ✅ Responsive design

### Tests recommandés

- [ ] Différents types d'événements
- [ ] Nombre d'invités variés
- [ ] Environnements intérieur/extérieur
- [ ] Usages différents (discours vs soirée)
- [ ] Options logistiques
- [ ] Navigation clavier
- [ ] Mobile/desktop

## 🐛 Dépannage

### Widget ne s'affiche pas

1. Vérifiez que le script est chargé
2. Ouvrez la console pour les erreurs
3. Vérifiez les sélecteurs CSS

### Packs non détectés

1. Vérifiez `window.__SNDRUSH_PACKS__`
2. Ajoutez des attributs `data-pack`
3. Vérifiez la structure HTML

### Réservation ne fonctionne pas

1. Vérifiez les sélecteurs de réservation
2. Ajoutez `id="reserver"` au formulaire
3. Vérifiez les noms des champs

## 📈 Métriques recommandées

- Taux de completion des questions
- Pack le plus recommandé
- Taux de clic sur "Réserver maintenant"
- Temps moyen de session

## 🔄 Mises à jour

Pour mettre à jour le widget :

1. Remplacez `sndrush-assistant.js`
2. Videz le cache navigateur
3. Testez les nouvelles fonctionnalités

---

**Support** : Pour toute question technique, consultez la console du navigateur ou contactez l'équipe de développement.

