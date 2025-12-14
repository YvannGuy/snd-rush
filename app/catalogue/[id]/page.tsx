'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import QuantityStepper from '@/components/products/QuantityStepper';
import ProductAddons from '@/components/products/ProductAddons';
import { supabase } from '@/lib/supabase';
import { Product, AvailabilityResponse, CalendarDisabledRange, ProductAddon, CartItem } from '@/types/db';
import { useCart } from '@/contexts/CartContext';
import { calculateInstallationPrice } from '@/lib/calculateInstallationPrice';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params?.id as string;
  const { addToCart } = useCart();

  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // État du formulaire
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [rentalDays, setRentalDays] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<ProductAddon[]>([]);

  // Disponibilité
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [disabledRanges, setDisabledRanges] = useState<CalendarDisabledRange[]>([]);

  // Produits recommandés
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

  // Charger les produits recommandés depuis Supabase
  useEffect(() => {
    async function loadRecommendedProducts() {
      if (!product || !supabase) return;

      try {
        // Définir les catégories recommandées selon le produit actuel
        let targetCategories: string[] = [];
        
        if (product.category === 'sonorisation') {
          // Pour les enceintes/caissons : recommander micros, consoles, câbles, pieds d'enceinte
          targetCategories = ['micros', 'sonorisation', 'accessoires']; // On inclut aussi sonorisation pour avoir des consoles et accessoires pour les pieds
        } else if (product.category === 'micros') {
          // Pour les micros : recommander câbles, consoles, autres micros
          targetCategories = ['accessoires', 'sonorisation'];
        } else if (product.category === 'lumieres') {
          // Pour les lumières : recommander autres lumières, câbles
          targetCategories = ['lumieres', 'accessoires'];
        } else if (product.category === 'accessoires') {
          // Pour les accessoires : recommander produits principaux
          targetCategories = ['sonorisation', 'micros', 'lumieres'];
        } else {
          // Par défaut : recommander produits de différentes catégories
          targetCategories = ['sonorisation', 'micros', 'accessoires', 'lumieres'];
        }

        // Charger les produits depuis Supabase
        const { data: allProducts, error } = await supabase
          .from('products')
          .select('*')
          .neq('id', product.id) // Exclure le produit actuel
          .in('category', targetCategories)
          .limit(20); // Charger plus pour avoir un meilleur choix

        // Exclure Pioneer XDJ des produits recommandés
        const filteredByPioneer = allProducts?.filter(p => 
          !p.name.toLowerCase().includes('pioneer') && !p.name.toLowerCase().includes('xdj')
        ) || [];

        if (error) {
          console.error('Erreur chargement produits recommandés:', error);
          return;
        }

        if (filteredByPioneer && filteredByPioneer.length > 0) {
          // Trier et sélectionner les produits les plus pertinents
          let filtered = filteredByPioneer;

          // Prioriser les produits complémentaires selon le type de produit
          if (product.category === 'sonorisation') {
            // Pour enceintes/caissons : prioriser micros, puis consoles, puis pieds d'enceinte, puis autres accessoires
            filtered = allProducts.sort((a, b) => {
              const aIsMicro = a.category === 'micros' ? 4 : 0;
              const bIsMicro = b.category === 'micros' ? 4 : 0;
              const aIsConsole = (a.name.toLowerCase().includes('promix') || a.name.toLowerCase().includes('console')) ? 3 : 0;
              const bIsConsole = (b.name.toLowerCase().includes('promix') || b.name.toLowerCase().includes('console')) ? 3 : 0;
              const aIsPied = (a.name.toLowerCase().includes('pied') || a.name.toLowerCase().includes('boomtone')) ? 2 : 0;
              const bIsPied = (b.name.toLowerCase().includes('pied') || b.name.toLowerCase().includes('boomtone')) ? 2 : 0;
              const aIsAccessoire = a.category === 'accessoires' ? 1 : 0;
              const bIsAccessoire = b.category === 'accessoires' ? 1 : 0;
              
              const aScore = aIsMicro + aIsConsole + aIsPied + aIsAccessoire;
              const bScore = bIsMicro + bIsConsole + bIsPied + bIsAccessoire;
              return bScore - aScore;
            });
          } else if (product.category === 'micros') {
            // Pour micros : prioriser câbles XLR, puis adaptateurs, puis consoles
            filtered = allProducts.sort((a, b) => {
              const aIsCableXlr = a.name.toLowerCase().includes('xlr') && a.category === 'accessoires' ? 3 : 0;
              const bIsCableXlr = b.name.toLowerCase().includes('xlr') && b.category === 'accessoires' ? 3 : 0;
              const aIsAdaptateur = a.name.toLowerCase().includes('adaptateur') ? 2 : 0;
              const bIsAdaptateur = b.name.toLowerCase().includes('adaptateur') ? 2 : 0;
              const aIsConsole = (a.name.toLowerCase().includes('promix') || a.name.toLowerCase().includes('console')) ? 1 : 0;
              const bIsConsole = (b.name.toLowerCase().includes('promix') || b.name.toLowerCase().includes('console')) ? 1 : 0;
              
              const aScore = aIsCableXlr + aIsAdaptateur + aIsConsole;
              const bScore = bIsCableXlr + bIsAdaptateur + bIsConsole;
              return bScore - aScore;
            });
          } else if (product.category === 'lumieres') {
            // Pour lumières : prioriser autres lumières, puis accessoires (câbles DMX potentiels)
            filtered = allProducts.sort((a, b) => {
              const aIsLumiere = a.category === 'lumieres' ? 2 : 0;
              const bIsLumiere = b.category === 'lumieres' ? 2 : 0;
              const aIsAccessoire = a.category === 'accessoires' ? 1 : 0;
              const bIsAccessoire = b.category === 'accessoires' ? 1 : 0;
              
              const aScore = aIsLumiere + aIsAccessoire;
              const bScore = bIsLumiere + bIsAccessoire;
              return bScore - aScore;
            });
          } else if (product.category === 'accessoires') {
            // Pour accessoires : prioriser produits principaux (enceintes, micros, consoles)
            filtered = allProducts.sort((a, b) => {
              const aIsSonorisation = a.category === 'sonorisation' ? 3 : 0;
              const bIsSonorisation = b.category === 'sonorisation' ? 3 : 0;
              const aIsMicro = a.category === 'micros' ? 2 : 0;
              const bIsMicro = b.category === 'micros' ? 2 : 0;
              const aIsConsole = (a.name.toLowerCase().includes('promix') || a.name.toLowerCase().includes('console')) ? 1 : 0;
              const bIsConsole = (b.name.toLowerCase().includes('promix') || b.name.toLowerCase().includes('console')) ? 1 : 0;
              
              const aScore = aIsSonorisation + aIsMicro + aIsConsole;
              const bScore = bIsSonorisation + bIsMicro + bIsConsole;
              return bScore - aScore;
            });
          }

          // Prendre les 4 premiers
          setRecommendedProducts(filtered.slice(0, 4));
        }
      } catch (err) {
        console.error('Erreur chargement produits recommandés:', err);
      }
    }

    loadRecommendedProducts();
  }, [product]);

  // Charger le produit depuis Supabase ou données locales
  useEffect(() => {
    async function loadProduct() {
      if (supabase && productId) {
        try {
          // D'abord, essayer de chercher par ID (si c'est un nombre)
          const numericId = parseInt(productId, 10);
          if (!isNaN(numericId)) {
            const { data, error: productError } = await supabase
              .from('products')
              .select('*')
              .eq('id', numericId)
              .single();

            if (!productError && data) {
              setProduct(data);
              setLoading(false);
              return;
            }
          }

          // Si la recherche par ID a échoué, essayer par slug
          const { data: slugData, error: slugError } = await supabase
            .from('products')
            .select('*')
            .eq('slug', productId)
            .single();

          if (!slugError && slugData) {
            setProduct(slugData);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Erreur chargement produit Supabase:', err);
        }
      }

      // Si Supabase n'a pas fonctionné, essayer les produits locaux
      const localProducts = getLocalProducts();
      // Chercher par ID numérique
      let foundProduct = localProducts.find(p => p.id.toString() === productId);
      
      // Si pas trouvé par ID, essayer de matcher par nom (slug approximatif)
      if (!foundProduct) {
        const slugMatch = productId.toLowerCase().replace(/-/g, ' ');
        foundProduct = localProducts.find(p => 
          p.name.toLowerCase().replace(/\s+/g, '-') === productId.toLowerCase() ||
          p.name.toLowerCase().includes(slugMatch)
        );
      }
      
      if (foundProduct) {
        const convertedProduct: Product = {
          id: foundProduct.id.toString(),
          name: foundProduct.name,
          slug: foundProduct.name.toLowerCase().replace(/\s+/g, '-'),
          description: foundProduct.description,
          long_description: null,
          daily_price_ttc: parseFloat(foundProduct.price.replace(/[^\d,]/g, '').replace(',', '.')),
          deposit: 500,
          quantity: 1,
          category: foundProduct.category,
          tags: null,
          images: [foundProduct.image],
          specs: null,
          features: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProduct(convertedProduct);
      } else {
        setError('Produit non trouvé');
      }
      setLoading(false);
    }

    loadProduct();
  }, [productId]);

  function getLocalProducts() {
    return [
      {
        id: 1,
        name: 'Enceinte active 15"',
        category: 'sonorisation',
        description: '100-300 pers.',
        price: '85€/jour',
        image: '/enceintebt.jpg',
      },
      {
        id: 3,
        name: 'Shure SM58',
        category: 'micros',
        description: 'Micro dynamique',
        price: '25€/jour',
        image: '/microshure.png',
      },
      {
        id: 4,
        name: 'Lyre LED',
        category: 'lumieres',
        description: 'Éclairage dynamique',
        price: '45€/jour',
        image: '/lyreled.png',
      },
      {
        id: 5,
        name: 'Pack Mariage',
        category: 'packs',
        description: '2 enceintes + micro + table, 50-150 pers.',
        price: '180€/jour',
        image: '/pack2c.jpg',
      },
      {
        id: 6,
        name: 'Caisson de basse 18"',
        category: 'sonorisation',
        description: '150-500 pers',
        price: '95€/jour',
        image: '/pack4cc.jpg',
      },
      {
        id: 7,
        name: 'Micro serre-tête',
        category: 'micros',
        description: 'Sans fil HF',
        price: '35€/jour',
        image: '/microshure.png',
      },
      {
        id: 8,
        name: 'Barre LED',
        category: 'lumieres',
        description: 'Éclairage d\'ambiance',
        price: '30€/jour',
        image: '/lyreled.png',
      },
    ];
  }

  // Charger les dates bloquées pour le calendrier
  useEffect(() => {
    async function loadDisabledRanges() {
      if (!product?.id) return;

      try {
        const today = new Date();
        const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        
        const response = await fetch(`/api/availability/calendar?productId=${product.id}&month=${month}`);
        if (response.ok) {
          const data = await response.json();
          setDisabledRanges(data.disabledRanges || []);
        }
      } catch (err) {
        console.error('Erreur chargement calendrier:', err);
      }
    }

    if (product) {
      loadDisabledRanges();
    }
  }, [product]);

  // Vérifier la disponibilité quand les dates ou heures changent
  useEffect(() => {
    async function checkAvailability() {
      if (!product?.id || !startDate || !endDate || !startTime || !endTime) {
        setAvailability(null);
        return;
      }

      setCheckingAvailability(true);
      try {
        const response = await fetch('/api/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            startDate,
            endDate,
            startTime: startTime || null,
            endTime: endTime || null,
          }),
        });

        if (response.ok) {
          const data: AvailabilityResponse = await response.json();
          setAvailability(data);
        }
      } catch (err) {
        console.error('Erreur vérification disponibilité:', err);
      } finally {
        setCheckingAvailability(false);
      }
    }

    checkAvailability();
  }, [product?.id, startDate, endDate, startTime, endTime]);

  // Calculer les jours de location
  useEffect(() => {
    if (startDate && endDate) {
      const startParts = startDate.split('-').map(Number);
      const endParts = endDate.split('-').map(Number);
      
      if (startParts.length === 3 && endParts.length === 3) {
        const start = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2]));
        const end = new Date(Date.UTC(endParts[0], endParts[1] - 1, endParts[2]));
        
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        setRentalDays(diffDays);
      } else {
        setRentalDays(1);
      }
    } else {
      setRentalDays(1);
    }
  }, [startDate, endDate]);

  // Add-ons par défaut
  const defaultAddons: ProductAddon[] = [
    { id: 'technician', name: 'Technicien installation', price: 80, description: 'Installation et reprise incluses' },
    { id: 'microphone', name: 'Microphone supplémentaire', price: 10 },
    { id: 'dibox', name: 'DI box', price: 8 },
  ];

  const handleAddToCart = () => {
    if (!product || !startDate || !endDate) {
      return;
    }

    if (!startTime || !endTime) {
      alert(language === 'fr' 
        ? 'Veuillez sélectionner les heures de début et de fin pour éviter les doublons de réservation.' 
        : 'Please select start and end times to prevent duplicate reservations.');
      return;
    }

    if (availability !== null && !availability.available) {
      alert(language === 'fr' 
        ? 'Ce produit n\'est pas disponible sur ces dates et heures. Veuillez choisir d\'autres dates ou heures.' 
        : 'This product is not available for these dates and times. Please choose other dates or times.');
      return;
    }

    const cartItem: CartItem = {
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      quantity,
      rentalDays,
      startDate,
      endDate,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      dailyPrice: product.daily_price_ttc,
      deposit: product.deposit,
      addons: selectedAddons,
      images: product.images || [],
    };

    addToCart(cartItem);
  };

  const calculateTotal = () => {
    if (!product || !startDate || !endDate) return 0;
    const basePrice = product.daily_price_ttc * quantity * rentalDays;
    const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    return basePrice + addonsTotal;
  };

  const texts = {
    fr: {
      pricePerDay: '/jour',
      description: 'Description',
      specs: 'Caractéristiques techniques',
      deposit: 'Dépôt de garantie',
      depositNote: 'non débité',
      youMightNeed: 'Vous pourriez en avoir besoin',
      addToCart: 'Ajouter au panier',
      checking: 'Vérification...',
      available: 'Disponible',
      unavailable: 'Indisponible',
      quantity: 'Quantité',
      rentalDuration: 'Durée',
      days: 'jours',
      totalPrice: 'Total',
      getQuote: 'Utiliser l\'assistant SoundRush Paris',
      goToCart: 'Voir le panier',
      testimonials: 'Avis clients',
    },
    en: {
      pricePerDay: '/day',
      description: 'Description',
      specs: 'Technical specifications',
      deposit: 'Security deposit',
      depositNote: 'not charged',
      youMightNeed: 'You might also need',
      addToCart: 'Add to cart',
      checking: 'Checking...',
      available: 'Available',
      unavailable: 'Unavailable',
      quantity: 'Quantity',
      rentalDuration: 'Duration',
      days: 'days',
      totalPrice: 'Total',
      getQuote: 'Get a quote for event',
      goToCart: 'View cart',
      testimonials: 'Customer reviews',
    },
  };

  const currentTexts = texts[language];

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header language={language} onLanguageChange={setLanguage} />
        <main className="pt-20 min-h-screen flex items-center justify-center">
          <p className="text-gray-600">{language === 'fr' ? 'Chargement...' : 'Loading...'}</p>
        </main>
        <Footer language={language} onLegalNoticeClick={() => {}} onRentalConditionsClick={() => {}} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <Header language={language} onLanguageChange={setLanguage} />
        <main className="pt-20 min-h-screen flex items-center justify-center">
          <p className="text-gray-600">{error || (language === 'fr' ? 'Produit non trouvé' : 'Product not found')}</p>
        </main>
        <Footer language={language} onLegalNoticeClick={() => {}} onRentalConditionsClick={() => {}} />
      </div>
    );
  }

  const isAvailable = availability?.available ?? null;
  const isSameDay = startDate === endDate;
  // Les heures sont requises pour éviter les doublons, surtout si même jour
  const needsTime = (!startTime || !endTime);
  const canAddToCart = !checkingAvailability && startDate && endDate && startTime && endTime && (isAvailable === null || isAvailable === true);


  return (
    <div className="min-h-screen bg-white">
      <Header language={language} onLanguageChange={setLanguage} />
      
      <main className="pt-[180px] sm:pt-[200px] pb-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          {/* Hero Section - Image Gallery + Infos principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Galerie d'images */}
            <div>
              {/* Image principale */}
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100">
                <img
                  src={product.images && product.images.length > 0 ? product.images[0] : '/products/default.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Infos principales */}
            <div>
              {/* Breadcrumb */}
              <nav className="text-sm text-gray-500 mb-4">
                <Link href="/catalogue" className="hover:text-[#F2431E] transition-colors">{language === 'fr' ? 'Catalogue' : 'Catalogue'}</Link>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">{product.name}</span>
              </nav>

              {/* Tags */}
              {(() => {
                // Fonction pour générer les tags selon le produit
                const getProductTags = (product: Product): Array<{ text: string; color: string }> => {
                  const tags: Array<{ text: string; color: string }> = [];
                  const nameLower = product.name.toLowerCase();
                  const category = product.category;
                  const specs = product.specs || {};
                  const longDesc = product.long_description || '';
                  
                  // Tags selon la catégorie
                  if (category === 'sonorisation') {
                    // Enceintes et caissons
                    if (nameLower.includes('caisson') || nameLower.includes('sub')) {
                      tags.push({ text: language === 'fr' ? 'Basses profondes' : 'Deep Bass', color: 'bg-purple-100 text-purple-800' });
                      tags.push({ text: language === 'fr' ? 'Puissant' : 'Powerful', color: 'bg-green-100 text-green-800' });
                      tags.push({ text: language === 'fr' ? 'Pro' : 'Pro', color: 'bg-blue-100 text-blue-800' });
                    } else {
                      // Enceintes
                      if (specs.bluetooth || longDesc.toLowerCase().includes('bluetooth')) {
                        tags.push({ text: 'Bluetooth', color: 'bg-blue-100 text-blue-800' });
                      }
                      tags.push({ text: language === 'fr' ? 'Puissant' : 'Powerful', color: 'bg-green-100 text-green-800' });
                      tags.push({ text: language === 'fr' ? 'Pro' : 'Pro', color: 'bg-purple-100 text-purple-800' });
                    }
                  } else if (category === 'micros') {
                    if (nameLower.includes('sans fil') || nameLower.includes('wireless')) {
                      tags.push({ text: language === 'fr' ? 'Sans fil' : 'Wireless', color: 'bg-blue-100 text-blue-800' });
                    } else {
                      tags.push({ text: 'XLR', color: 'bg-blue-100 text-blue-800' });
                    }
                    tags.push({ text: language === 'fr' ? 'Professionnel' : 'Professional', color: 'bg-green-100 text-green-800' });
                    if (nameLower.includes('shure') || nameLower.includes('mipro')) {
                      tags.push({ text: language === 'fr' ? 'Référence' : 'Reference', color: 'bg-purple-100 text-purple-800' });
                    } else {
                      tags.push({ text: language === 'fr' ? 'Qualité' : 'Quality', color: 'bg-purple-100 text-purple-800' });
                    }
                  } else if (category === 'lumieres') {
                    tags.push({ text: 'LED', color: 'bg-blue-100 text-blue-800' });
                    if (longDesc.toLowerCase().includes('dmx')) {
                      tags.push({ text: 'DMX', color: 'bg-green-100 text-green-800' });
                    }
                    tags.push({ text: language === 'fr' ? 'Professionnel' : 'Professional', color: 'bg-purple-100 text-purple-800' });
                  } else if (category === 'accessoires') {
                    if (nameLower.includes('xlr')) {
                      tags.push({ text: 'XLR', color: 'bg-blue-100 text-blue-800' });
                    }
                    if (nameLower.includes('adaptateur')) {
                      tags.push({ text: language === 'fr' ? 'Adaptateur' : 'Adapter', color: 'bg-green-100 text-green-800' });
                    }
                    tags.push({ text: language === 'fr' ? 'Professionnel' : 'Professional', color: 'bg-purple-100 text-purple-800' });
                  } else if (nameLower.includes('promix') || nameLower.includes('console')) {
                    // Consoles de mixage
                    tags.push({ text: language === 'fr' ? 'Mixage' : 'Mixing', color: 'bg-blue-100 text-blue-800' });
                    if (longDesc.toLowerCase().includes('effets') || longDesc.toLowerCase().includes('dsp')) {
                      tags.push({ text: language === 'fr' ? 'Effets intégrés' : 'Built-in Effects', color: 'bg-green-100 text-green-800' });
                    }
                    tags.push({ text: language === 'fr' ? 'Pro' : 'Pro', color: 'bg-purple-100 text-purple-800' });
                  } else {
                    // Tags par défaut
                    tags.push({ text: language === 'fr' ? 'Professionnel' : 'Professional', color: 'bg-green-100 text-green-800' });
                    tags.push({ text: language === 'fr' ? 'Qualité' : 'Quality', color: 'bg-blue-100 text-blue-800' });
                    tags.push({ text: language === 'fr' ? 'Pro' : 'Pro', color: 'bg-purple-100 text-purple-800' });
                  }
                  
                  return tags;
                };
                
                const tags = product ? getProductTags(product) : [];
                
                return tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tags.map((tag, index) => (
                      <span key={index} className={`px-3 py-1 rounded-full text-xs font-semibold ${tag.color}`}>
                        {tag.text}
                      </span>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Titre */}
              <h1 className="text-4xl md:text-5xl font-bold text-black mb-4 leading-tight">
                {product.name}
              </h1>

              {/* Description courte */}
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {product.description || product.long_description}
              </p>

              {/* Prix */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-black">{product.daily_price_ttc}€ /jour</span>
                </div>
              </div>

              {/* Sélecteur de dates et heures */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {language === 'fr' ? 'Période de location' : 'Rental period'}
                </label>
                <div className="space-y-3">
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1.5">
                        {language === 'fr' ? 'Date de début' : 'Start date'}
                      </label>
                      <input
                        type="date"
                        value={startDate || ''}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (e.target.value && endDate && e.target.value > endDate) {
                            setEndDate(null);
                          }
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:border-[#F2431E] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1.5">
                        {language === 'fr' ? 'Date de fin' : 'End date'}
                      </label>
                      <input
                        type="date"
                        value={endDate || ''}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:border-[#F2431E] transition-colors"
                      />
                    </div>
                  </div>
                  {/* Heures - Requises pour éviter les doublons */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1.5">
                        {language === 'fr' ? 'Heure de début *' : 'Start time *'}
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:border-[#F2431E] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1.5">
                        {language === 'fr' ? 'Heure de fin *' : 'End time *'}
                      </label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:border-[#F2431E] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Disponibilité */}
              {startDate && endDate && startTime && endTime && (
                <div className="mb-6">
                  {checkingAvailability ? (
                    <div className="text-sm text-gray-600 py-2">{currentTexts.checking}</div>
                  ) : availability ? (
                    <div className={`flex items-center gap-2 ${availability.available ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="text-lg">{availability.available ? '●' : '●'}</span>
                      <span className="font-medium text-sm">
                        {availability.available 
                          ? (language === 'fr' ? 'Disponible aux dates sélectionnées' : 'Available on selected dates')
                          : currentTexts.unavailable
                        }
                      </span>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Total */}
              {startDate && endDate && (
                <div className="mb-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">
                    {currentTexts.totalPrice} ({rentalDays} {currentTexts.days})
                  </span>
                  <span className="text-2xl font-bold text-black">{calculateTotal().toFixed(2)}€</span>
                </div>
              )}

              {/* Bouton Ajouter au panier */}
              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart || checkingAvailability}
                className={`
                  w-full py-4 rounded-lg font-bold text-base transition-all shadow-lg mb-3 flex items-center justify-center gap-2
                  ${canAddToCart && !checkingAvailability
                    ? 'bg-[#F2431E] text-white hover:bg-[#E63A1A] hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                <span>🛒</span>
                {checkingAvailability 
                  ? currentTexts.checking
                  : needsTime
                  ? (language === 'fr' ? 'Veuillez spécifier les heures' : 'Please specify times')
                  : currentTexts.addToCart
                }
              </button>

              {/* Carte Installation */}
              {(() => {
                // Calculer le prix d'installation selon le produit
                const productNameLower = product.name.toLowerCase();
                let installationPrice: number | null = null;
                
                // Enceintes
                if (productNameLower.includes('enceinte') || productNameLower.includes('as 115') || productNameLower.includes('as 108') || productNameLower.includes('fbt')) {
                  installationPrice = 40; // 1 enceinte seule
                }
                // Caissons
                else if (productNameLower.includes('caisson') || productNameLower.includes('subwoofer') || productNameLower.includes('basse')) {
                  installationPrice = 40; // Caisson seul
                }
                // Consoles
                else if (productNameLower.includes('promix') || productNameLower.includes('console') || productNameLower.includes('hpa')) {
                  installationPrice = 40; // Console seule
                }
                // Micros
                else if (productNameLower.includes('micro')) {
                  installationPrice = 30; // Micros seuls
                }
                // Lumières
                else if (productNameLower.includes('led') || productNameLower.includes('lumière') || productNameLower.includes('lyre') || productNameLower.includes('barre')) {
                  installationPrice = 40; // 1 lumière
                }
                // Accessoires (pas d'installation nécessaire)
                else if (product.category === 'accessoires') {
                  installationPrice = null; // Pas d'installation pour les accessoires
                }
                
                if (installationPrice === null) return null;
                
                return (
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900">{language === 'fr' ? 'Installation' : 'Installation'}</h3>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      {language === 'fr' 
                        ? 'Installation par technicien professionnel'
                        : 'Installation by professional technician'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">
                        {installationPrice}€
                      </span>
                      <span className="text-xs text-gray-500">
                        {language === 'fr' ? 'Optionnel' : 'Optional'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Caution */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <span>🔒</span>
                <span>{language === 'fr' ? `Caution: ${product.deposit}€` : `Deposit: ${product.deposit}€`}</span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          {(product.description || product.long_description) && (
            <div className="bg-white py-12">
              <h2 className="text-3xl font-bold text-black mb-6">{currentTexts.description}</h2>
              
              {/* Description courte - extraire la première phrase ou description courte */}
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                {(() => {
                  if (product.description) {
                    // Prendre la première phrase de la description
                    const firstSentence = product.description.split('.')[0];
                    return firstSentence.length > 0 ? firstSentence + '.' : product.description;
                  }
                  if (product.long_description) {
                    // Extraire la première ligne descriptive (sans emoji)
                    const lines = product.long_description.split('\n');
                    const firstDescriptiveLine = lines.find(line => {
                      const trimmed = line.trim();
                      return trimmed && !trimmed.match(/^[🎤🔊⚡🔌👥🎶📡]/) && !trimmed.startsWith('Caractéristiques');
                    });
                    return firstDescriptiveLine?.trim() || lines[0]?.trim() || '';
                  }
                  return '';
                })()}
              </p>
              
              {/* 3 Features avec icônes - Format adapté selon le type de produit */}
              {(() => {
                const isMicro = product.category === 'micros';
                const isLumiere = product.category === 'lumieres';
                const isAccessoire = product.category === 'accessoires';
                const longDesc = product.long_description || '';
                const hasCustomFormat = longDesc.includes('🎶') || longDesc.includes('🎛️') || longDesc.includes('✨') || longDesc.includes('🎨') || longDesc.includes('🎤') || longDesc.includes('🎧') || longDesc.includes('📏');
                
                // Fonction pour extraire le titre et la description après un emoji
                const extractSection = (emoji: string) => {
                  const lines = longDesc.split('\n');
                  const emojiIndex = lines.findIndex((l: string) => l.trim().startsWith(emoji));
                  if (emojiIndex === -1) return { title: '', desc: '' };
                  
                  const titleLine = lines[emojiIndex]?.replace(emoji, '').trim() || '';
                  // Chercher la première ligne non vide après l'emoji (ignorer les lignes vides)
                  let descLine = '';
                  for (let i = emojiIndex + 1; i < lines.length; i++) {
                    const trimmed = lines[i]?.trim();
                    if (trimmed && !trimmed.match(/^[🎤🔊⚡🔌👥🎶🎛️🎚️✨🎨🏛️📏✅🎧]/) && !trimmed.startsWith('Caractéristiques')) {
                      descLine = trimmed;
                      break;
                    }
                  }
                  return { title: titleLine, desc: descLine };
                };
                
                // Pour les lumières avec format personnalisé
                if (isLumiere && (longDesc.includes('✨') || longDesc.includes('🎨'))) {
                  // Format Lyre LED : ✨, 🎨, 🎛️
                  if (longDesc.includes('✨')) {
                    const led = extractSection('✨');
                    const effects = extractSection('🎨');
                    const control = extractSection('🎛️');
                    const usage = extractSection('🏛️');
                    
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">✨</div>
                          <div>
                            <h3 className="font-bold text-black mb-1">
                              {led.title || 'LED blanche 100W'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {led.desc || 'Faisceau puissant et précis'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">🎨</div>
                          <div>
                            <h3 className="font-bold text-black mb-1">
                              {effects.title || 'Effets intégrés'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {effects.desc || 'Goboss, couleurs, prisme et effets Rainbow'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">🎛️</div>
                          <div>
                            <h3 className="font-bold text-black mb-1">
                              {control.title || 'Modes de contrôle'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {control.desc || 'DMX, automatique, musical et maître-esclave'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  // Format Barre LED : 🎨, ⚡, 🎛️
                  else if (longDesc.includes('🎨') && longDesc.includes('⚡')) {
                    const colors = extractSection('🎨');
                    const power = extractSection('⚡');
                    const control = extractSection('🎛️');
                    const installation = extractSection('🏛️');
                    
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">🎨</div>
                          <div>
                            <h3 className="font-bold text-black mb-1">
                              {colors.title || 'Couleurs puissantes et variées'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {colors.desc || 'Mélange RGBAW-UV pour des effets riches et dynamiques'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">⚡</div>
                          <div>
                            <h3 className="font-bold text-black mb-1">
                              {power.title || '7 LED de 10W'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {power.desc || 'Éclairage homogène et performant'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">🎛️</div>
                          <div>
                            <h3 className="font-bold text-black mb-1">
                              {control.title || 'Contrôle simple'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {control.desc || 'DMX, automatique, musical, maître-esclave + télécommande incluse'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                }
                
                // Pour les accessoires avec format 🔌, 🎤/🎧, 🔌, 📏
                // Ou format pied d'enceinte : ⚡, 📏, 🎒, 🏗️
                if (isAccessoire && (longDesc.includes('🎤') || longDesc.includes('🎧') || longDesc.includes('📏') || longDesc.includes('🎒') || longDesc.includes('🏗️'))) {
                  // Vérifier si c'est un pied d'enceinte (format ⚡, 📏, 🎒, 🏗️)
                  const isPiedEnceinte = longDesc.includes('🎒') || longDesc.includes('🏗️') || product.name.toLowerCase().includes('pied');
                  
                  if (isPiedEnceinte) {
                    const charge = extractSection('⚡');
                    const hauteur = extractSection('📏');
                    const livraison = extractSection('🎒');
                    const matiere = extractSection('🏗️');
                    
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {charge.title && (
                          <div className="flex items-start gap-4">
                            <div className="text-4xl">⚡</div>
                            <div>
                              <h3 className="font-bold text-black mb-1">
                                {charge.title || 'Charge maximale'}
                              </h3>
                              <p className="text-gray-600 text-sm">
                                {charge.desc || '≈ 30 kg par pied'}
                              </p>
                            </div>
                          </div>
                        )}
                        {hauteur.title && (
                          <div className="flex items-start gap-4">
                            <div className="text-4xl">📏</div>
                            <div>
                              <h3 className="font-bold text-black mb-1">
                                {hauteur.title || 'Hauteur réglable'}
                              </h3>
                              <p className="text-gray-600 text-sm">
                                {hauteur.desc || '1000 ⭢ 1600 mm'}
                              </p>
                            </div>
                          </div>
                        )}
                        {livraison.title && (
                          <div className="flex items-start gap-4">
                            <div className="text-4xl">🎒</div>
                            <div>
                              <h3 className="font-bold text-black mb-1">
                                {livraison.title || 'Livré avec housse'}
                              </h3>
                              <p className="text-gray-600 text-sm">
                                {livraison.desc || 'Goupille de sécurité et pieds ajustables'}
                              </p>
                            </div>
                          </div>
                        )}
                        {matiere.title && (
                          <div className="flex items-start gap-4">
                            <div className="text-4xl">🏗️</div>
                            <div>
                              <h3 className="font-bold text-black mb-1">
                                {matiere.title || 'Matière'}
                              </h3>
                              <p className="text-gray-600 text-sm">
                                {matiere.desc || 'Acier noir, solide et durable'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  // Format standard pour autres accessoires
                  const transmission = extractSection('🎤');
                  const usage = extractSection('🎧');
                  const connect = extractSection('🔌');
                  const length = extractSection('📏');
                  
                  // Format Câble XLR : 🎤, 🔌, 📏
                  if (transmission.title) {
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">🎤</div>
                          <div>
                            <h3 className="font-bold text-black mb-1">
                              {transmission.title || 'Transmission stable'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {transmission.desc || 'Signal clair et sans interférences'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">🔌</div>
                          <div>
                            <h3 className="font-bold text-black mb-1">
                              {connect.title || 'Connectique standard'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {connect.desc || 'XLR femelle ↔ XLR mâle'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">📏</div>
                          <div>
                            <h3 className="font-bold text-black mb-1">
                              {length.title || 'Longueur'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {length.desc || '6 mètres'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  // Format Adaptateur RCA : 🎧, 🔌, 📏
                  else if (usage.title) {
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">🎧</div>
                          <div>
                            <h3 className="font-bold text-black mb-1">
                              {usage.title || 'Usage pratique'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {usage.desc || 'Idéal pour relier lecteur, table de mixage ou enceinte'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">🔌</div>
                          <div>
                            <h3 className="font-bold text-black mb-1">
                              {connect.title || 'Connectique'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {connect.desc || 'XLR femelle ↔ RCA mâle'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">📏</div>
                          <div>
                            <h3 className="font-bold text-black mb-1">
                              {length.title || 'Longueur'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {length.desc || '3 mètres'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                }
                
                // Pour les micros ou produits avec format personnalisé : 🎶, 🔌, 👥 (ou 🎛️ pour consoles, ou ⚡🎶👥 pour caisson)
                if (isMicro || hasCustomFormat) {
                  const power = extractSection('⚡');
                  const quality = extractSection('🎶');
                  const effects = extractSection('🎛️');
                  const connect = extractSection('🔌');
                  const usage = extractSection('👥');
                  
                  // Si c'est un caisson avec ⚡, afficher ⚡, 🎶, 👥
                  if (power.title && quality.title) {
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">⚡</div>
                          <div>
                            <h3 className="font-bold text-black mb-1">
                              {power.title || 'Puissance 1200W'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {power.desc || 'Basses profondes et percutantes pour une immersion totale'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">🎶</div>
                          <div>
                            <h3 className="font-bold text-black mb-1">
                              {quality.title || 'Haut-parleur 18"'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {quality.desc || 'Idéal pour musique live, DJ sets et événements'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">👥</div>
                          <div>
                            <h3 className="font-bold text-black mb-1">
                              {usage.title || 'Événements moyens à grands'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {usage.desc || 'Idéal pour événements de moyenne à grande envergure'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  // Si c'est une console avec effets (🎛️), afficher 🎶, 🎛️, 🔌
                  else if (effects.title) {
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">🎶</div>
                          <div>
                            <h3 className="font-bold text-black mb-1">
                              {quality.title || 'Mixage simple et précis'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {quality.desc || 'Idéale pour conférences, cultes et animations'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">🎛️</div>
                          <div>
                            <h3 className="font-bold text-black mb-1">
                              {effects.title || 'Effets intégrés'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {effects.desc || '24 effets DSP avec réglage'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">🔌</div>
                          <div>
                            <h3 className="font-bold text-black mb-1">
                              {connect.title || 'Connectivité essentielle'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {connect.desc || '6 entrées micro XLR, USB & Bluetooth'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    // Format pour les micros : 🎶, 🔌, 👥
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">🎶</div>
                          <div>
                            <h3 className="font-bold text-black mb-1">
                              {quality.title || 'Qualité sonore légendaire'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {quality.desc || 'Son clair, chaud et précis pour discours et chant'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">🔌</div>
                          <div>
                            <h3 className="font-bold text-black mb-1">
                              {connect.title || 'Connectique XLR'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {connect.desc || 'Compatible avec toutes les enceintes et consoles pro'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">👥</div>
                          <div>
                            <h3 className="font-bold text-black mb-1">
                              {usage.title || 'Usage universel'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {usage.desc || 'Idéal pour conférences, cultes, événements live'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                } else {
                  // Pour les autres produits : ⚡ Puissance, 🔌 Connectiques, 👥 Capacité
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">⚡</div>
                        <div>
                          <h3 className="font-bold text-black mb-1">
                            {(() => {
                              const power = product.specs?.puissance || product.specs?.power_rms || product.specs?.power;
                              return power ? `${language === 'fr' ? 'Puissance' : 'Power'} ${power}` : (language === 'fr' ? 'Puissance 800W RMS' : 'Power 800W RMS');
                            })()}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {language === 'fr' ? 'Son puissant et cristallin pour tous vos événements' : 'Powerful and crystal-clear sound for all your events'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">🔌</div>
                        <div>
                          <h3 className="font-bold text-black mb-1">
                            {language === 'fr' ? 'Connectiques pro' : 'Pro Connectivity'}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {product.specs?.connectivity || product.specs?.inputs || (product.specs?.bluetooth ? (language === 'fr' ? 'XLR, Jack, Bluetooth intégré' : 'XLR, Jack, Integrated Bluetooth') : (language === 'fr' ? 'XLR, Jack, Bluetooth intégré' : 'XLR, Jack, Integrated Bluetooth'))}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">👥</div>
                        <div>
                          <h3 className="font-bold text-black mb-1">
                            {(() => {
                              const capacity = product.specs?.capacity || product.description?.match(/\d+-\d+/)?.[0];
                              return capacity ? `${capacity} ${language === 'fr' ? 'personnes' : 'people'}` : (language === 'fr' ? '50-200 personnes' : '50-200 people');
                            })()}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {product.specs?.usage_type === 'event' ? (language === 'fr' ? 'Idéale pour mariages, conférences, DJ sets' : 'Ideal for weddings, conferences, DJ sets') : 
                             product.specs?.usage_type === 'dj' ? (language === 'fr' ? 'Idéale pour sets DJ et événements musicaux' : 'Ideal for DJ sets and musical events') :
                             (language === 'fr' ? 'Idéale pour mariages, conférences, DJ sets' : 'Ideal for weddings, conferences, DJ sets')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          )}

          {/* Vous pourriez en avoir besoin */}
          {recommendedProducts.length > 0 && (
            <div className="bg-white py-12">
              <h2 className="text-3xl font-bold text-black mb-8">{currentTexts.youMightNeed}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendedProducts.map((recProduct) => {
                  // Gérer les images (peuvent être un tableau ou une chaîne JSON)
                  let productImages: string[] = [];
                  if (Array.isArray(recProduct.images)) {
                    productImages = recProduct.images;
                  } else if (typeof recProduct.images === 'string') {
                    try {
                      const parsed = JSON.parse(recProduct.images);
                      productImages = Array.isArray(parsed) ? parsed : [parsed];
                    } catch {
                      productImages = [recProduct.images];
                    }
                  }
                  
                  const productImage = productImages.length > 0 
                    ? productImages[0] 
                    : '/products/default.jpg';
                  
                  const handleAddRecommended = () => {
                    const cartItem: CartItem = {
                      productId: recProduct.id,
                      productName: recProduct.name,
                      dailyPrice: parseFloat(recProduct.daily_price_ttc.toString()),
                      quantity: 1,
                      rentalDays: 1,
                      startDate: null,
                      endDate: null,
                      startTime: '',
                      endTime: '',
                      deposit: parseFloat(recProduct.deposit?.toString() || '0'),
                      image: productImage,
                    };
                    addToCart(cartItem);
                  };

                  return (
                    <Link 
                      key={recProduct.id} 
                      href={`/catalogue/${recProduct.id}`}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full"
                    >
                      <div className="relative h-48 bg-gray-100 flex-shrink-0">
                        <img
                          src={productImage}
                          alt={recProduct.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 flex flex-col flex-grow">
                        <div className="h-[3rem] mb-2 flex items-start">
                          <h3 className="font-bold text-black line-clamp-2">{recProduct.name}</h3>
                        </div>
                        <div className="h-[2rem] mb-4 flex items-end">
                          <p className="text-lg font-bold text-[#F2431E]">
                            {recProduct.daily_price_ttc}€/{language === 'fr' ? 'jour' : 'day'}
                          </p>
                        </div>
                        <div className="mt-auto">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddRecommended();
                            }}
                            className="w-full bg-[#F2431E] text-white py-2 rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors"
                          >
                            {language === 'fr' ? 'Ajouter' : 'Add'}
                          </button>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Avis clients */}
          <div className="bg-gray-50 py-12">
            <h2 className="text-3xl font-bold text-black mb-8">{currentTexts.testimonials}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#F2431E] to-[#E63A1A] rounded-full flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div>
                    <p className="font-semibold text-black">Marie L.</p>
                    <div className="flex text-[#F2431E]">★★★★★</div>
                  </div>
                </div>
                <p className="text-gray-700">
                  "{language === 'fr' 
                    ? 'Parfait pour notre mariage! Son cristallin et puissance au rendez-vous. Livraison et installation impeccables.' 
                    : 'Perfect for our wedding! Crystal-clear sound and power delivered. Impeccable delivery and installation.'}"
                </p>
              </div>
              <div className="bg-white rounded-xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#F2431E] to-[#E63A1A] rounded-full flex items-center justify-center text-white font-bold">
                    T
                  </div>
                  <div>
                    <p className="font-semibold text-black">Thomas R.</p>
                    <div className="flex text-[#F2431E]">★★★★★</div>
                  </div>
                </div>
                <p className="text-gray-700">
                  "{language === 'fr' 
                    ? 'Matériel professionnel de qualité. Idéal pour nos événements d\'entreprise. Je recommande vivement!' 
                    : 'Professional quality equipment. Ideal for our corporate events. I highly recommend it!'}"
                </p>
              </div>
              <div className="bg-white rounded-xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#F2431E] to-[#E63A1A] rounded-full flex items-center justify-center text-white font-bold">
                    S
                  </div>
                  <div>
                    <p className="font-semibold text-black">Sophie M.</p>
                    <div className="flex text-[#F2431E]">★★★★★</div>
                  </div>
                </div>
                <p className="text-gray-700">
                  "{language === 'fr' 
                    ? 'Excellent rapport qualité/prix. Service client réactif et matériel en parfait état. Très satisfaite!' 
                    : 'Excellent value for money. Responsive customer service and equipment in perfect condition. Very satisfied!'}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>


      <Footer language={language} onLegalNoticeClick={() => {}} onRentalConditionsClick={() => {}} />
    </div>
  );
}
