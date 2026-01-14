# 🔍 AUDIT SEO TECHNIQUE - SoundRush Paris

## 1. PAGES EXISTANTES (Indexables)

### Pages statiques principales
- ✅ `/` - Homepage (Client Component)
- ✅ `/location` - Location matériel (Server Component avec metadata)
- ✅ `/catalogue` - Catalogue (Client Component avec SEOHead)
- ✅ `/packs` - Liste packs
- ✅ `/conference` - Pack conférence (Server Component)
- ✅ `/mariage` - Pack mariage (Server Component)
- ✅ `/soiree` - Pack soirée (Server Component)
- ✅ `/blog` - Blog index
- ✅ `/guides` - Guides index

### Pages dynamiques
- ✅ `/blog/[slug]` - Articles blog
- ✅ `/guides/[slug]` - Guides
- ✅ `/packs/[id]` - Détail pack
- ✅ `/catalogue/[id]` - Détail produit

### ❌ PAGES MANQUANTES (requêtes GSC)
- ❌ `/location-sono-paris` - "location sono paris"
- ❌ `/location-enceinte-paris` - "location enceinte paris"
- ❌ `/prestataire-audiovisuel-paris` - "prestataire audiovisuel paris"
- ❌ `/sonorisation-concert-paris` - "sonorisation concert paris"
- ❌ `/guide-sonorisation` - "guide sonorisation"

## 2. CONFIGURATION SEO ACTUELLE

### Metadata
- ✅ `app/layout.tsx` : Metadata globale avec OpenGraph, Twitter
- ⚠️ Pas de `titleTemplate` (tous les titres sont complets)
- ⚠️ Homepage utilise `SEOHead` (Client Component) au lieu de `generateMetadata`
- ✅ Pages `/conference`, `/mariage`, `/soiree`, `/location` : Server Components avec metadata

### Sitemap
- ✅ `app/sitemap.xml/route.ts` : Route handler dynamique
- ✅ Inclut pages statiques, blog, guides, produits
- ⚠️ Pas de pages dédiées pour requêtes cibles

### Robots.txt
- ✅ `public/robots.txt` : Fichier statique
- ⚠️ Devrait être route handler pour dynamisme
- ✅ Sitemap déclaré

### Canonical
- ✅ Présent sur pages avec metadata
- ⚠️ Homepage utilise SEOHead client-side

### JSON-LD
- ✅ LocalBusiness dans layout.tsx
- ❌ Pas de FAQPage sur pages money
- ❌ Pas de Service schema sur pages dédiées

## 3. LES 5 PROBLÈMES SEO MAJEURS

### 🔴 P0 - Pages manquantes pour requêtes cibles
**Impact:** CTR faible car aucune page optimisée pour "location sono paris", "location enceinte paris", etc.
**Solution:** Créer 5 pages dédiées avec contenu optimisé, H1 unique, FAQ, CTA

### 🟠 P1 - Homepage Client Component sans metadata SSR
**Impact:** Metadata moins bien crawlée, pas de pré-rendu optimal
**Solution:** Convertir en Server Component wrapper + Client Component pour interactivité

### 🟡 P2 - Pas de titleTemplate
**Impact:** Titres répétitifs, moins optimisés pour CTR
**Solution:** Ajouter `title.template` dans layout.tsx

### 🟡 P3 - Pas de JSON-LD FAQPage sur pages money
**Impact:** Manque de rich snippets, moins de visibilité SERP
**Solution:** Ajouter FAQPage schema sur `/location`, `/conference`, `/mariage`, `/soiree`

### 🟡 P4 - Robots.txt statique
**Impact:** Moins flexible, pas de gestion dynamique
**Solution:** Créer route handler `app/robots.txt/route.ts`

## 4. DIAGNOSTIC GSC

### Pourquoi CTR faible à position 8-20 ?

1. **Titre non optimisé CTR** : Titres trop génériques, pas d'appel à l'action
2. **Pas de pages dédiées** : Requêtes ciblent des pages génériques (`/location` au lieu de `/location-sono-paris`)
3. **Meta description faible** : Pas assez orientée conversion, pas de CTA
4. **Pas de rich snippets** : Manque FAQPage, pas de stars/prix dans SERP
5. **Contenu thin** : Certaines pages manquent de profondeur

### Map Requête → Page Cible → Intention → CTA

| Requête | Page Cible | Intention | CTA |
|---------|------------|-----------|-----|
| "location sono paris" | `/location-sono-paris` | Trouver location sono à Paris | "Réserver maintenant" + tel |
| "location enceinte paris" | `/location-enceinte-paris` | Louer enceinte spécifique | "Voir catalogue enceintes" |
| "prestataire audiovisuel paris" | `/prestataire-audiovisuel-paris` | Trouver prestataire complet | "Demander devis" |
| "sonorisation concert paris" | `/sonorisation-concert-paris` | Sono pour concert | "Pack concert" |
| "guide sonorisation" | `/guide-sonorisation` | Apprendre/comprendre | "Voir nos packs" |

## 5. PLAN D'ACTION

### Phase 1 : Setup SEO (1h)
1. Ajouter `titleTemplate` dans layout.tsx
2. Créer robots.txt route handler
3. Améliorer metadata homepage (Server Component wrapper)

### Phase 2 : Pages dédiées (3h)
1. Créer 5 pages pour requêtes cibles
2. Chaque page : H1 unique, 600-800 mots, FAQ, CTA, JSON-LD
3. Ajouter au sitemap

### Phase 3 : Rich Snippets (1h)
1. Ajouter FAQPage schema sur pages money
2. Ajouter Service schema sur pages dédiées

### Phase 4 : Optimisations (1h)
1. Améliorer meta descriptions (CTA, chiffres)
2. Optimiser titres pour CTR
3. Ajouter internal links stratégiques

## 6. CHECKLIST FINALE

- [ ] titleTemplate dans layout.tsx
- [ ] robots.txt route handler
- [ ] Homepage Server Component wrapper
- [ ] Page `/location-sono-paris`
- [ ] Page `/location-enceinte-paris`
- [ ] Page `/prestataire-audiovisuel-paris`
- [ ] Page `/sonorisation-concert-paris`
- [ ] Page `/guide-sonorisation`
- [ ] FAQPage JSON-LD sur pages money
- [ ] Service JSON-LD sur pages dédiées
- [ ] Sitemap mis à jour
- [ ] Composant CTA réutilisable
- [ ] Section "Zones desservies" réutilisable

