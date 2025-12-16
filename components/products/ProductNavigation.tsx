'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types/db';

interface ProductNavigationProps {
  currentProduct: Product;
  language: 'fr' | 'en';
}

export default function ProductNavigation({ currentProduct, language }: ProductNavigationProps) {
  const router = useRouter();
  const [productsInCategory, setProductsInCategory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(currentProduct.category || 'all');
  const [allCategories, setAllCategories] = useState<string[]>([]);

  // Mettre à jour la catégorie sélectionnée quand le produit change
  useEffect(() => {
    if (currentProduct.category) {
      setSelectedCategory(currentProduct.category);
    }
  }, [currentProduct.id, currentProduct.category]);

  const texts = {
    fr: {
      navigate: 'Navigation',
      previous: 'Précédent',
      next: 'Suivant',
      category: 'Catégorie',
      all: 'Toutes les catégories',
      sonorisation: 'Sonorisation',
      micros: 'Micros',
      lumieres: 'Lumières',
      dj: 'DJ',
      accessoires: 'Accessoires',
      packs: 'Packs',
    },
    en: {
      navigate: 'Navigation',
      previous: 'Previous',
      next: 'Next',
      category: 'Category',
      all: 'All categories',
      sonorisation: 'Sound',
      micros: 'Microphones',
      lumieres: 'Lights',
      dj: 'DJ',
      accessoires: 'Accessories',
      packs: 'Packs',
    },
  };

  const currentTexts = texts[language];

  // Charger toutes les catégories disponibles
  useEffect(() => {
    async function loadCategories() {
      if (!supabase) return;

      try {
        const { data, error } = await supabase
          .from('products')
          .select('category')
          .not('category', 'is', null);

        if (error) {
          console.error('Erreur chargement catégories:', error);
          return;
        }

        if (data) {
          const uniqueCategories = Array.from(new Set(data.map(p => p.category).filter(Boolean))) as string[];
          setAllCategories(uniqueCategories.sort());
        }
      } catch (err) {
        console.error('Erreur chargement catégories:', err);
      }
    }

    loadCategories();
  }, []);

  // Charger les produits de la catégorie sélectionnée
  useEffect(() => {
    async function loadProductsInCategory() {
      if (!supabase || !selectedCategory) {
        setLoading(false);
        return;
      }

      try {
        let query = supabase
          .from('products')
          .select('id, name, slug, category')
          .order('name', { ascending: true });

        if (selectedCategory !== 'all') {
          query = query.eq('category', selectedCategory);
        }

        // Exclure Pioneer XDJ
        const { data, error } = await query;

        if (error) {
          console.error('Erreur chargement produits:', error);
          setLoading(false);
          return;
        }

        // Filtrer uniquement Pioneer XDJ (mais permettre DDJ-400)
        let filtered = (data || []).filter(p => {
          const nameLower = p.name.toLowerCase();
          return !nameLower.includes('xdj');
        });

        // Si on est dans la catégorie DJ, ajouter les packs DJ définis dans le code
        if (selectedCategory === 'dj') {
          const djPacks = [
            { id: 'pack-6', name: 'Pack DJ Essentiel', slug: 'pack-6', category: 'dj' },
            { id: 'pack-7', name: 'Pack DJ Performance', slug: 'pack-7', category: 'dj' },
            { id: 'pack-8', name: 'Pack DJ Premium', slug: 'pack-8', category: 'dj' },
          ];
          // Ajouter les packs DJ et trier par nom
          filtered = [...filtered, ...djPacks].sort((a, b) => a.name.localeCompare(b.name));
        }

        setProductsInCategory(filtered);
      } catch (err) {
        console.error('Erreur chargement produits:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProductsInCategory();
  }, [selectedCategory]);

  // Trouver l'index du produit actuel
  const currentIndex = productsInCategory.findIndex(
    p => p.id.toString() === currentProduct.id.toString() || 
        p.slug === currentProduct.slug || 
        (currentProduct.id.toString().startsWith('pack-') && p.id.toString() === currentProduct.id.toString())
  );

  const previousProduct = currentIndex > 0 ? productsInCategory[currentIndex - 1] : null;
  const nextProduct = currentIndex < productsInCategory.length - 1 ? productsInCategory[currentIndex + 1] : null;

  const getProductUrl = (product: Product) => {
    // Dans le contexte du catalogue, tous les produits (y compris packs DJ) pointent vers /catalogue
    return `/catalogue/${product.slug || product.id}`;
  };

  const handleCategoryChange = async (category: string) => {
    setSelectedCategory(category);
    
    // Si on change de catégorie et que ce n'est pas la catégorie actuelle, charger et rediriger
    if (category !== currentProduct.category && supabase) {
      try {
        let query = supabase
          .from('products')
          .select('id, name, slug, category')
          .order('name', { ascending: true });

        if (category !== 'all') {
          query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Erreur chargement produits:', error);
          return;
        }

        // Filtrer uniquement Pioneer XDJ (mais permettre DDJ-400)
        let filtered = (data || []).filter(p => {
          const nameLower = p.name.toLowerCase();
          return !nameLower.includes('xdj');
        });

        // Si on change vers la catégorie DJ, ajouter les packs DJ définis dans le code
        if (category === 'dj') {
          const djPacks = [
            { id: 'pack-6', name: 'Pack DJ Essentiel', slug: 'pack-6', category: 'dj' },
            { id: 'pack-7', name: 'Pack DJ Performance', slug: 'pack-7', category: 'dj' },
            { id: 'pack-8', name: 'Pack DJ Premium', slug: 'pack-8', category: 'dj' },
          ];
          filtered = [...filtered, ...djPacks].sort((a, b) => a.name.localeCompare(b.name));
        }

        // Rediriger vers le premier produit de la nouvelle catégorie
        if (filtered.length > 0) {
          const firstProduct = filtered[0];
          router.push(getProductUrl(firstProduct));
        }
      } catch (err) {
        console.error('Erreur changement catégorie:', err);
      }
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className="mb-8">
      {/* Navigation Précédent/Suivant - Style tutos */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {previousProduct ? (
          <Link 
            href={getProductUrl(previousProduct)}
            className="flex items-center gap-2 text-gray-600 hover:text-[#F2431E] transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">{currentTexts.previous}</span>
          </Link>
        ) : (
          <div></div>
        )}

        {nextProduct ? (
          <Link 
            href={getProductUrl(nextProduct)}
            className="flex items-center gap-2 text-gray-600 hover:text-[#F2431E] transition-colors group ml-auto"
          >
            <span className="hidden sm:inline">{currentTexts.next}</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <div></div>
        )}
      </div>

      {/* Sélecteur de catégorie */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
            {currentTexts.category}:
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:border-[#F2431E] focus:outline-none text-sm cursor-pointer"
          >
            <option value="all">{currentTexts.all}</option>
            {allCategories.map(category => (
              <option key={category} value={category}>
                {currentTexts[category as keyof typeof currentTexts] || category}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
