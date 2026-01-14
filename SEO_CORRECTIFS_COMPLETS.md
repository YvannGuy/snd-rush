# ✅ CORRECTIFS SEO - SoundRush Paris

## RÉSUMÉ EXÉCUTIF

**Problème identifié :** CTR faible (quasi 0) à position moyenne ~11 dans GSC pour requêtes cibles.

**Causes principales :**
1. ❌ Pages manquantes pour requêtes cibles ("location sono paris", "location enceinte paris", etc.)
2. ⚠️ Homepage Client Component (metadata moins optimale)
3. ⚠️ Pas de titleTemplate (titres répétitifs)
4. ⚠️ Pas de FAQPage schema sur pages money
5. ⚠️ Robots.txt statique

**Actions réalisées :**
- ✅ Ajout titleTemplate dans layout.tsx
- ✅ Création robots.txt route handler
- ✅ Création 5 pages dédiées pour requêtes cibles
- ✅ Ajout FAQPage schema sur pages money
- ✅ Mise à jour sitemap avec nouvelles pages
- ✅ Création composants réutilisables (CTA, Zones desservies)

## FICHIERS MODIFIÉS

### 1. `app/layout.tsx`
**Changement :** Ajout `titleTemplate` pour optimiser les titres
```typescript
title: {
  template: '%s | SoundRush Paris - Location Sono Express',
  default: 'SoundRush Paris - Location Sono Urgence 24/7 & Événementiel | Paris & Île-de-France',
},
```

### 2. `app/robots.txt/route.ts` (NOUVEAU)
**Changement :** Route handler dynamique au lieu de fichier statique
- Inclut les nouvelles pages dédiées dans Allow

### 3. `app/sitemap.xml/route.ts`
**Changement :** Ajout des 5 nouvelles pages dans le sitemap
- `/location-sono-paris` (priority 0.9)
- `/location-enceinte-paris` (priority 0.9)
- `/prestataire-audiovisuel-paris` (priority 0.9)
- `/sonorisation-concert-paris` (priority 0.9)
- `/guide-sonorisation` (priority 0.8)

### 4. `components/PackSEOContent.tsx`
**Changement :** Ajout FAQPage schema JSON-LD
- Fonction `generateFAQSchema()` créée
- Script JSON-LD injecté pour chaque page pack

### 5. `components/CTASection.tsx` (NOUVEAU)
**Composant réutilisable** pour sections CTA
- Props : title, description, primaryAction, secondaryAction, variant
- Support téléphone et liens

### 6. `components/ZonesDesservies.tsx` (NOUVEAU)
**Composant réutilisable** pour afficher les zones desservies
- Liste des 8 départements d'Île-de-France

## NOUVELLES PAGES CRÉÉES

### 1. `/location-sono-paris`
- **H1 :** "Location Sono Paris 24/7"
- **Contenu :** ~800 mots, sections zones, packs, FAQ
- **Schema :** FAQPage + Service
- **CTA :** Téléphone + lien packs

### 2. `/location-enceinte-paris`
- **H1 :** "Location Enceinte Paris"
- **Contenu :** Types d'enceintes, FAQ
- **Schema :** FAQPage
- **CTA :** Catalogue enceintes

### 3. `/prestataire-audiovisuel-paris`
- **H1 :** "Prestataire Audiovisuel Paris"
- **Contenu :** Services (son, lumière, vidéo), FAQ
- **Schema :** FAQPage + Service
- **CTA :** Devis + téléphone

### 4. `/sonorisation-concert-paris`
- **H1 :** "Sonorisation Concert Paris"
- **Contenu :** Matériel scène, FAQ
- **Schema :** FAQPage
- **CTA :** Pack concert + téléphone

### 5. `/guide-sonorisation`
- **H1 :** "Guide Sonorisation Événement"
- **Contenu :** Guide complet avec calculs, conseils
- **Schema :** FAQPage
- **CTA :** Packs + catalogue

## CHECKLIST FINALE

- [x] titleTemplate dans layout.tsx
- [x] robots.txt route handler
- [x] Page `/location-sono-paris`
- [x] Page `/location-enceinte-paris`
- [x] Page `/prestataire-audiovisuel-paris`
- [x] Page `/sonorisation-concert-paris`
- [x] Page `/guide-sonorisation`
- [x] FAQPage JSON-LD sur pages money (PackSEOContent)
- [x] Service JSON-LD sur pages dédiées
- [x] Sitemap mis à jour
- [x] Composant CTA réutilisable
- [x] Composant Zones desservies réutilisable

## PROCHAINES ÉTAPES RECOMMANDÉES

1. **Homepage Server Component** (P1)
   - Convertir en Server Component wrapper
   - Utiliser `generateMetadata` au lieu de SEOHead client-side

2. **Optimisation meta descriptions** (P2)
   - Ajouter CTA dans descriptions
   - Inclure chiffres (ex: "Devis en 2h", "24/7")

3. **Internal linking** (P2)
   - Ajouter liens stratégiques entre pages
   - Créer maillage vers pages money

4. **Performance** (P3)
   - Vérifier LCP sur nouvelles pages
   - Optimiser images (next/image avec priority)

5. **Rich Snippets** (P3)
   - Ajouter Review schema si avis disponibles
   - Ajouter Event schema pour événements

## COMMITS RECOMMANDÉS

```bash
git add app/layout.tsx app/robots.txt/route.ts app/sitemap.xml/route.ts
git commit -m "feat(seo): Ajout titleTemplate et robots.txt route handler"

git add app/location-sono-paris app/location-enceinte-paris app/prestataire-audiovisuel-paris app/sonorisation-concert-paris app/guide-sonorisation
git commit -m "feat(seo): Création pages dédiées pour requêtes cibles GSC"

git add components/PackSEOContent.tsx components/CTASection.tsx components/ZonesDesservies.tsx
git commit -m "feat(seo): Ajout FAQPage schema et composants réutilisables"
```

## IMPACT ATTENDU

- **CTR :** +50% à +100% sur 3-6 mois (pages dédiées + titres optimisés)
- **Position :** Amélioration de 2-3 positions (pages ciblées + schema)
- **Impressions :** +20% (nouvelles pages indexées)
- **Trafic organique :** +30% à +50% sur 6 mois

