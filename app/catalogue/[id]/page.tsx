'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import QuantityStepper from '@/components/products/QuantityStepper';
import ProductAddons from '@/components/products/ProductAddons';
import ProductNavigation from '@/components/products/ProductNavigation';
import ShareProductButton from '@/components/ShareProductButton';
import AskAssistantButton from '@/components/AskAssistantButton';
import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';
import { supabase } from '@/lib/supabase';
import { Product, AvailabilityResponse, CalendarDisabledRange, ProductAddon, CartItem } from '@/types/db';
import { useCart } from '@/contexts/CartContext';
import { calculateInstallationPrice } from '@/lib/calculateInstallationPrice';
import { getDeliveryPrice, getZoneLabel, DELIVERY_AR } from '@/lib/zone-detection';

// Configuration : Masquer les options Installation et Livraison
// Pour les réactiver, changer cette valeur à true
const SHOW_INSTALLATION_AND_DELIVERY = false;

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

  // Produits recommandés - Désactivé car la section est masquée
  const [recommendedProducts] = useState<Product[]>([]);

  // Charger le produit depuis Supabase ou données locales
  useEffect(() => {
    async function loadProduct() {
      if (supabase && productId) {
        try {
          // Si c'est un pack (commence par pack-), utiliser getCatalogItemById
          if (productId.startsWith('pack-')) {
            const { getCatalogItemById } = await import('@/lib/catalog');
            const catalogItem = await getCatalogItemById(productId);
            
            if (catalogItem) {
              // Mapping des images des packs DJ
              const packImages: Record<string, string> = {
                'pack-6': '/packdjs.png',
                'pack-7': '/packdjM.png',
                'pack-8': '/packdjL.png',
              };

              // Mapping des specs pour les packs DJ
              const packSpecs: Record<string, Record<string, any>> = {
                'pack-6': {
                  puissance: '500W RMS',
                  poids: 'Enceinte: 15,2 kg + Console DJ: 2,8 kg',
                  dimensions: 'Enceinte: 15" + Console DJ: 320×230×85 mm',
                  bluetooth: true,
                  controle_dj: 'Console 2 voies compatible Rekordbox',
                  connectiques: 'USB, RCA, sortie casque',
                  usage: 'Parfaite pour soirées privées, anniversaires, DJ sets',
                },
                'pack-7': {
                  puissance: 'Puissance adaptée',
                  poids: 'Enceintes: 2×24 kg + Console DJ: 2,8 kg',
                  dimensions: 'Enceintes: 2×15" + Console DJ: 320×230×85 mm',
                  bluetooth: false,
                  controle_dj: 'Console 2 voies compatible Rekordbox',
                  connectiques: 'XLR, RCA, USB (console DJ Pioneer)',
                  usage: 'Idéal pour mariages, soirées privées, événements associatifs',
                },
                'pack-8': {
                  puissance: 'Son puissant + basses',
                  poids: 'Enceintes: 2×24 kg, Caisson: ~38 kg, Console DJ: 2,8 kg',
                  dimensions: 'Enceintes: 2×15", Caisson: 18", Console DJ: 320×230×85 mm',
                  bluetooth: false,
                  controle_dj: 'Console 2 voies compatible Rekordbox',
                  connectiques: 'XLR, RCA, USB (console DJ Pioneer)',
                  usage: 'Idéal pour soirées dansantes, mariages, événements festifs',
                },
              };

              // Convertir CatalogItem en Product avec images et specs
              const convertedProduct: Product = {
                id: catalogItem.id,
                name: catalogItem.name,
                slug: catalogItem.slug || catalogItem.id,
                description: catalogItem.description || '',
                long_description: null,
                daily_price_ttc: catalogItem.unitPriceEur || 0,
                deposit: catalogItem.deposit || 0,
                quantity: 1,
                category: catalogItem.category || 'packs',
                tags: null,
                images: packImages[productId] ? [packImages[productId]] : null,
                specs: packSpecs[productId] || null,
                features: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              setProduct(convertedProduct);
              setLoading(false);
              return;
            }
          }

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
        image: '/packs.png',
      },
      {
        id: 6,
        name: 'Caisson de basse 18"',
        category: 'sonorisation',
        description: '150-500 pers',
        price: '95€/jour',
        image: '/packL.png',
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
            productId: String(product.id),
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

  const handleAddToCart = async () => {
    if (!product || !startDate || !endDate) {
      return;
    }

    // Empêcher l'ajout des lumières au panier
    if (isLightProduct()) {
      alert(language === 'fr' 
        ? 'Ce produit est actuellement indisponible.' 
        : 'This product is currently unavailable.');
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
      productId: String(product.id),
      productName: product.name,
      productSlug: product.slug || String(product.id),
      quantity,
      rentalDays,
      startDate,
      endDate,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      dailyPrice: product.daily_price_ttc || 0,
      deposit: product.deposit || 0,
      addons: selectedAddons,
      images: product.images || [],
    };

    const result = await addToCart(cartItem);
    if (!result.success) {
      const errorMessage = result.error || (language === 'fr' 
        ? 'Impossible d\'ajouter ce produit au panier.' 
        : 'Unable to add this product to cart.');
      alert(errorMessage);
    }
  };

  const calculateTotal = () => {
    if (!product || !startDate || !endDate) return 0;
    const basePrice = (product.daily_price_ttc || 0) * quantity * rentalDays;
    const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    return basePrice + addonsTotal;
  };

  // Fonction pour vérifier si le produit est une lumière
  const isLightProduct = (): boolean => {
    if (!product) return false;
    if (product.category === 'lumieres') return true;
    
    const productNameLower = product.name.toLowerCase();
    
    // Exclure les produits qui ne sont clairement pas des lumières
    if (productNameLower.includes('pied') || 
        productNameLower.includes('stand') ||
        productNameLower.includes('support') ||
        productNameLower.includes('micro') ||
        productNameLower.includes('cable') ||
        productNameLower.includes('câble') ||
        productNameLower.includes('xlr') ||
        productNameLower.includes('adaptateur')) {
      return false;
    }
    
    // Vérifier les mots-clés spécifiques aux lumières
    return productNameLower.includes('led') || 
           productNameLower.includes('lumière') || 
           productNameLower.includes('lumieres') ||
           productNameLower.includes('lyre led') || 
           productNameLower.includes('barre led') ||
           productNameLower.includes('par led') ||
           (productNameLower.includes('boomtone') && 
            (productNameLower.includes('led') || productNameLower.includes('lumière') || productNameLower.includes('light'))) ||
           (productNameLower.includes('par') && 
            (productNameLower.includes('led') || productNameLower.includes('lumière') || productNameLower.includes('light'))) ||
           productNameLower.includes('light');
  };

  // Fonction pour obtenir le prix d'installation selon le produit
  const getInstallationPrice = (): number | null => {
    if (!product || product.category === 'accessoires') return null;
    
    const productNameLower = product.name.toLowerCase();
    
    // Enceintes
    if (productNameLower.includes('enceinte') || productNameLower.includes('as 115') || productNameLower.includes('as 108') || productNameLower.includes('fbt')) {
      return 40; // 1 enceinte seule
    }
    // Caissons
    else if (productNameLower.includes('caisson') || productNameLower.includes('subwoofer') || productNameLower.includes('basse')) {
      return 40; // Caisson seul
    }
    // Consoles
    else if (productNameLower.includes('promix') || productNameLower.includes('console') || productNameLower.includes('hpa')) {
      return 40; // Console seule
    }
    // Micros
    else if (productNameLower.includes('micro')) {
      return 30; // Micros seuls
    }
    // Lumières
    else if (productNameLower.includes('led') || productNameLower.includes('lumière') || productNameLower.includes('lyre') || productNameLower.includes('barre')) {
      return 40; // 1 lumière
    }
    
    return null;
  };

  // Fonction pour ajouter l'installation au panier
  const handleAddInstallation = async () => {
    if (!product || !startDate || !endDate) {
      alert(language === 'fr' 
        ? 'Veuillez d\'abord sélectionner les dates de location.' 
        : 'Please select rental dates first.');
      return;
    }

    const installationPrice = getInstallationPrice();
    if (!installationPrice) return;

    const installationItem: CartItem = {
      productId: `installation-${product.id}`,
      productName: language === 'fr' ? 'Installation' : 'Installation',
      productSlug: `installation-${product.id}`,
      quantity: 1,
      rentalDays: rentalDays,
      startDate,
      endDate,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      dailyPrice: installationPrice,
      deposit: 0,
      addons: [],
      images: ['/installation.jpg'],
    };

    // L'installation n'a pas de stock, on peut l'ajouter sans vérification
    await addToCart(installationItem);
    
    if (language === 'fr') {
      alert('Installation ajoutée au panier');
    } else {
      alert('Installation added to cart');
    }
  };

  // Fonction pour ajouter la livraison au panier
  const handleAddDelivery = async (zone: string) => {
    if (!product || !startDate || !endDate) {
      alert(language === 'fr' 
        ? 'Veuillez d\'abord sélectionner les dates de location.' 
        : 'Please select rental dates first.');
      return;
    }

    const deliveryPrice = getDeliveryPrice(zone);
    if (deliveryPrice === 0 && zone !== 'retrait') return;

    const zoneNames: Record<string, string> = {
      'paris': language === 'fr' ? 'Livraison Paris' : 'Paris Delivery',
      'petite': language === 'fr' ? 'Livraison Petite Couronne' : 'Inner Suburbs Delivery',
      'grande': language === 'fr' ? 'Livraison Grande Couronne' : 'Greater Paris Delivery',
      'retrait': language === 'fr' ? 'Retrait sur place' : 'Pickup on site',
    };

    const zoneName = zoneNames[zone] || (language === 'fr' ? 'Livraison' : 'Delivery');

    const deliveryItem: CartItem = {
      productId: `delivery-${zone}`,
      productName: zoneName,
      productSlug: `delivery-${zone}`,
      quantity: 1,
      rentalDays: 1, // La livraison est facturée une seule fois
      startDate,
      endDate,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      dailyPrice: deliveryPrice,
      deposit: 0,
      addons: [],
      images: ['/livraison.jpg'],
    };

    // La livraison n'a pas de stock, on peut l'ajouter sans vérification
    await addToCart(deliveryItem);
    
    if (language === 'fr') {
      alert(`${zoneName} ajoutée au panier`);
    } else {
      alert(`${zoneName} added to cart`);
    }
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
      commitments: 'Nos engagements',
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
      commitments: 'Our commitments',
    },
  };

  const currentTexts = texts[language];

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header language={language} onLanguageChange={setLanguage} />
        <main className="pt-[112px] min-h-screen flex items-center justify-center">
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
        <main className="pt-[112px] min-h-screen flex items-center justify-center">
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


  // Générer les structured data pour le produit
  const structuredData = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.long_description || `Location ${product.name} - SoundRush Paris`,
    image: product.images && product.images.length > 0 ? product.images[0] : 'https://www.sndrush.com/og-image.jpg',
    brand: {
      '@type': 'Brand',
      name: 'SoundRush Paris',
    },
    offers: {
      '@type': 'Offer',
      price: product.daily_price_ttc?.toString() || '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: `https://www.sndrush.com/catalogue/${productId}`,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: product.daily_price_ttc?.toString() || '0',
        priceCurrency: 'EUR',
        unitCode: 'DAY',
      },
    },
    category: product.category,
  } : null;

  return (
    <div className="min-h-screen bg-white">
      {product && (
        <SEOHead
          title={product.name}
          description={product.description || product.long_description || `Location ${product.name} - SoundRush Paris. Matériel professionnel disponible à Paris et Île-de-France.`}
          canonicalUrl={`https://www.sndrush.com/catalogue/${productId}`}
          ogImage={product.images && product.images.length > 0 ? product.images[0] : 'https://www.sndrush.com/og-image.jpg'}
          structuredData={structuredData || undefined}
          keywords={[
            `location ${product.name.toLowerCase()}`,
            `location ${product.category} Paris`,
            'location matériel audio Paris',
            'sonorisation professionnelle',
            'location sono Île-de-France',
          ]}
        />
      )}
      <Header language={language} onLanguageChange={setLanguage} />
      
      <main className="pt-[180px] sm:pt-[200px] pb-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          {/* Hero Section - Image Gallery + Infos principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Galerie d'images */}
            <div>
              {/* Image principale */}
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100">
                <Image
                  src={product.images && product.images.length > 0 ? product.images[0] : '/products/default.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  loading="eager"
                />
              </div>
            </div>

            {/* Infos principales */}
            <div>
              {/* Breadcrumb avec structured data */}
              <Breadcrumb
                items={[
                  { label: language === 'fr' ? 'Accueil' : 'Home', href: '/' },
                  { label: language === 'fr' ? 'Catalogue' : 'Catalogue', href: '/catalogue' },
                  { label: product.name, href: `/catalogue/${productId}` },
                ]}
                language={language}
              />

              {/* Navigation entre produits - uniquement pour les produits (pas pour les packs non-DJ) */}
              {product && product.category !== 'packs' && <ProductNavigation currentProduct={product} language={language} />}

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
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-4xl md:text-5xl font-bold text-black leading-tight flex-1">
                  {product.name}
                </h1>
                <ShareProductButton
                  productName={product.name}
                  productUrl={`/catalogue/${product.slug || product.id}`}
                  language={language}
                  className="flex-shrink-0"
                />
              </div>

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

              {/* Bouton Réserver */}
              <a
                href="tel:+33744782754"
                className="w-full py-4 rounded-lg font-bold text-base transition-all shadow-lg mb-6 flex items-center justify-center gap-2 bg-[#F2431E] text-white hover:bg-[#E63A1A] hover:shadow-xl"
              >
                <span>📞</span>
                {language === 'fr' ? 'Réserver' : 'Reserve'}
              </a>

              {/* Carte Installation - Masquée pour les accessoires et lumières */}
              {SHOW_INSTALLATION_AND_DELIVERY && product.category !== 'accessoires' && !isLightProduct() && (() => {
                const installationPrice = getInstallationPrice();
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
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-900">
                        {installationPrice}€
                      </span>
                      <span className="text-xs text-gray-500">
                        {language === 'fr' ? 'Optionnel' : 'Optional'}
                      </span>
                    </div>
                    <button
                      onClick={handleAddInstallation}
                      disabled={!startDate || !endDate}
                      className={`
                        w-full py-2 rounded-lg font-semibold text-sm transition-all
                        ${startDate && endDate
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }
                      `}
                    >
                      {language === 'fr' ? 'Ajouter' : 'Add'}
                    </button>
                  </div>
                );
              })()}

              {/* Carte Livraison - Masquée pour les accessoires et lumières */}
              {SHOW_INSTALLATION_AND_DELIVERY && product.category !== 'accessoires' && !isLightProduct() && (
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900">{language === 'fr' ? 'Livraison et récupération' : 'Delivery and pickup'}</h3>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-600">
                      {language === 'fr' 
                        ? 'Sélectionnez votre zone de livraison'
                        : 'Select your delivery zone'}
                    </p>
                    <span className="text-xs text-gray-500">
                      {language === 'fr' ? 'Optionnel' : 'Optional'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(DELIVERY_AR)
                      .filter(([zone]) => zone !== 'retrait') // Exclure retrait sur place
                      .map(([zone, price]) => {
                      const zoneLabels: Record<string, string> = {
                        'paris': language === 'fr' ? 'Paris (75)' : 'Paris (75)',
                        'petite': language === 'fr' ? 'Petite couronne (92, 93, 94)' : 'Inner suburbs (92, 93, 94)',
                        'grande': language === 'fr' ? 'Grande couronne (77, 78, 91, 95)' : 'Greater Paris (77, 78, 91, 95)',
                        'retrait': language === 'fr' ? 'Retrait sur place' : 'Pickup on site',
                      };
                      const zoneLabel = zoneLabels[zone] || zone;
                      
                      return (
                        <div key={zone} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">{zoneLabel}</span>
                            {price > 0 && (
                              <span className="text-xs text-gray-500 ml-2">{price}€</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleAddDelivery(zone)}
                            disabled={!startDate || !endDate}
                            className={`
                              px-4 py-1.5 rounded-lg font-semibold text-xs transition-all
                              ${startDate && endDate
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }
                            `}
                          >
                            {language === 'fr' ? 'Ajouter' : 'Add'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                } else if (product.category === 'dj' || product.specs?.controle_dj) {
                  // Pour les produits DJ : ⚡ Contrôle DJ, 🔌 Connectiques, 👥 Usage
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">⚡</div>
                        <div>
                          <h3 className="font-bold text-black mb-1">
                            {language === 'fr' ? 'Contrôle DJ' : 'DJ Control'}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {product.specs?.controle_dj || (language === 'fr' ? 'Console 2 voies compatible Rekordbox' : '2-channel console compatible with Rekordbox')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">🔌</div>
                        <div>
                          <h3 className="font-bold text-black mb-1">
                            {language === 'fr' ? 'Connectiques' : 'Connectivity'}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {product.specs?.connectiques || product.specs?.connectivity || (language === 'fr' ? 'USB, RCA, sortie casque' : 'USB, RCA, headphone output')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">👥</div>
                        <div>
                          <h3 className="font-bold text-black mb-1">
                            {language === 'fr' ? 'Usage' : 'Usage'}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {product.specs?.usage || (language === 'fr' ? 'Parfaite pour soirées privées, anniversaires, DJ sets' : 'Perfect for private parties, birthdays, DJ sets')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
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

          {/* Caractéristiques techniques pour produits DJ */}
          {product && (product.category === 'dj' || product.specs?.controle_dj) && (
            <div className="bg-gray-50 py-12">
              <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-black mb-8">{currentTexts.specs}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-4 text-center">
                    <div className="text-3xl mb-2">🎛️</div>
                    <p className="text-sm font-semibold text-gray-700">{language === 'fr' ? 'Voies' : 'Channels'}</p>
                    <p className="text-lg font-bold text-black">
                      {product.specs?.voies 
                        ? `${product.specs.voies} ${language === 'fr' ? 'voies' : 'channels'}`
                        : product.specs?.puissance || product.specs?.power_rms || product.specs?.power || '—'}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center">
                    <div className="text-3xl mb-2">📦</div>
                    <p className="text-sm font-semibold text-gray-700">{language === 'fr' ? 'Poids' : 'Weight'}</p>
                    <p className="text-lg font-bold text-black">
                      {product.specs?.poids || product.specs?.weight || '—'}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center">
                    <div className="text-3xl mb-2">📐</div>
                    <p className="text-sm font-semibold text-gray-700">{language === 'fr' ? 'Dimensions' : 'Dimensions'}</p>
                    <p className="text-lg font-bold text-black">
                      {product.specs?.dimensions || product.specs?.size || '—'}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center">
                    <div className="text-3xl mb-2">📶</div>
                    <p className="text-sm font-semibold text-gray-700">Bluetooth</p>
                    <p className="text-lg font-bold text-black">
                      {product.specs?.bluetooth === true || product.specs?.bluetooth === 'true' 
                        ? (language === 'fr' ? 'Oui' : 'Yes')
                        : product.specs?.bluetooth === false || product.specs?.bluetooth === 'false'
                        ? (language === 'fr' ? 'Non' : 'No')
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Nos engagements */}
          <div className="bg-gray-50 py-12">
            <h2 className="text-3xl font-bold text-black mb-8">{currentTexts.commitments}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#F2431E] to-[#E63A1A] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-black mb-2">
                  {language === 'fr' ? 'Matériel vérifié' : 'Verified equipment'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'fr' 
                    ? 'Avant chaque location' 
                    : 'Before each rental'}
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#F2431E] to-[#E63A1A] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-black mb-2">
                  {language === 'fr' ? 'Réactivité 24/7' : '24/7 responsiveness'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'fr' 
                    ? 'En cas de problème' 
                    : 'In case of problem'}
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#F2431E] to-[#E63A1A] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-black mb-2">
                  {language === 'fr' ? 'Transparence totale' : 'Total transparency'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'fr' 
                    ? 'Sur les tarifs' 
                    : 'On pricing'}
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#F2431E] to-[#E63A1A] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-black mb-2">
                  {language === 'fr' ? 'Réservation sécurisée' : 'Secure booking'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'fr' 
                    ? 'Avec confirmation immédiate' 
                    : 'With instant confirmation'}
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#F2431E] to-[#E63A1A] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-black mb-2">
                  {language === 'fr' ? 'Accompagnement personnalisé' : 'Personalized support'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'fr' 
                    ? 'Pour votre événement' 
                    : 'For your event'}
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
