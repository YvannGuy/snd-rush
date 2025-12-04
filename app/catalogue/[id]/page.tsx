'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import QuantityStepper from '@/components/products/QuantityStepper';
import ProductAddons from '@/components/products/ProductAddons';
import { supabase } from '@/lib/supabase';
import { Product, AvailabilityResponse, CalendarDisabledRange, ProductAddon, CartItem } from '@/types/db';
import { useCart } from '@/contexts/CartContext';

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
  const [quantity, setQuantity] = useState(1);
  const [rentalDays, setRentalDays] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<ProductAddon[]>([]);

  // Disponibilité
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [disabledRanges, setDisabledRanges] = useState<CalendarDisabledRange[]>([]);

  // Toast pour l'ajout au panier
  const [showToast, setShowToast] = useState(false);

  // Charger le produit depuis Supabase ou données locales
  useEffect(() => {
    async function loadProduct() {
      if (supabase && productId) {
        try {
          const { data, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

          if (!productError && data) {
            setProduct(data);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Erreur chargement produit Supabase:', err);
        }
      }

      const localProducts = getLocalProducts();
      const foundProduct = localProducts.find(p => p.id.toString() === productId);
      
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
        id: 2,
        name: 'Pioneer XDJ-RX3',
        category: 'dj',
        description: 'Contrôleur DJ pro',
        price: '120€/jour',
        image: '/platinedj.jpg',
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

  // Vérifier la disponibilité quand les dates changent
  useEffect(() => {
    async function checkAvailability() {
      if (!product?.id || !startDate || !endDate) {
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
  }, [product?.id, startDate, endDate]);

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

    if (availability !== null && !availability.available) {
      alert(language === 'fr' 
        ? 'Ce produit n\'est pas disponible sur ces dates. Veuillez choisir d\'autres dates.' 
        : 'This product is not available for these dates. Please choose other dates.');
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
      dailyPrice: product.daily_price_ttc,
      deposit: product.deposit,
      addons: selectedAddons,
      images: product.images || [],
    };

    addToCart(cartItem);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
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
      getQuote: 'Obtenir un devis pour événement',
      toastAdded: 'Article ajouté au panier !',
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
      toastAdded: 'Item added to cart!',
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
  const canAddToCart = !checkingAvailability && startDate && endDate && (isAvailable === null || isAvailable === true);

  // Produits recommandés
  const recommendedProducts = [
    { name: 'Console de mixage', price: '45€/jour', image: '/platinedj.jpg' },
    { name: 'Micro sans fil', price: '35€/jour', image: '/microshure.png' },
    { name: 'Pied d\'enceinte', price: '15€/jour', image: '/pro1.png' },
    { name: 'Câbles XLR', price: '12€/jour', image: '/lyreled.png' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header language={language} onLanguageChange={setLanguage} />
      
      <main className="pt-20 pb-32 bg-white">
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
                <a href="/catalogue" className="hover:text-[#F2431E] transition-colors">{language === 'fr' ? 'Catalogue' : 'Catalogue'}</a>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">{product.name}</span>
              </nav>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  {language === 'fr' ? 'Puissant' : 'Powerful'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  {language === 'fr' ? 'Indoor/Outdoor' : 'Indoor/Outdoor'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                  {language === 'fr' ? 'Pro Quality' : 'Pro Quality'}
                </span>
              </div>

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
                  <span className="text-4xl font-bold text-black">{product.daily_price_ttc}€</span>
                  <span className="text-xl text-gray-500">{currentTexts.pricePerDay}</span>
                </div>
              </div>

              {/* Sélecteur de dates */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {language === 'fr' ? 'Période de location' : 'Rental period'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1.5">
                      {language === 'fr' ? 'Début' : 'Start'}
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
                      {language === 'fr' ? 'Fin' : 'End'}
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
              </div>

              {/* Disponibilité */}
              {startDate && endDate && (
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
                disabled={!canAddToCart}
                className={`
                  w-full py-4 rounded-lg font-bold text-base transition-all shadow-lg mb-3 flex items-center justify-center gap-2
                  ${canAddToCart
                    ? 'bg-[#F2431E] text-white hover:bg-[#E63A1A] hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                <span>🛒</span>
                {checkingAvailability 
                  ? currentTexts.checking
                  : currentTexts.addToCart
                }
              </button>

              {/* Caution */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <span>🔒</span>
                <span>{language === 'fr' ? `Caution: ${product.deposit}€` : `Deposit: ${product.deposit}€`}</span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          {product.description && (
            <div className="bg-white py-12">
              <h2 className="text-3xl font-bold text-black mb-6">{currentTexts.description}</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                {product.description}
              </p>
              
              {/* 3 Features avec icônes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">⚡</div>
                  <div>
                    <h3 className="font-bold text-black mb-1">
                      {language === 'fr' ? 'Puissance' : 'Power'} {product.specs?.puissance || '800W RMS'}
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
                      {language === 'fr' ? 'XLR, Jack, Bluetooth intégré' : 'XLR, Jack, Integrated Bluetooth'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-4xl">👥</div>
                  <div>
                    <h3 className="font-bold text-black mb-1">
                      {product.description.match(/\d+-\d+/)?.[0] || '50-200'} {language === 'fr' ? 'personnes' : 'people'}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {language === 'fr' ? 'Idéale pour mariages, conférences, DJ sets' : 'Ideal for weddings, conferences, DJ sets'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Caractéristiques techniques */}
          {product.specs && (
            <div className="bg-gray-50 py-12">
              <h2 className="text-3xl font-bold text-black mb-8">{currentTexts.specs}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(product.specs).slice(0, 8).map(([key, value], index) => (
                  <div key={key} className="bg-white rounded-xl p-4 text-center">
                    <div className="text-3xl mb-2">🔊</div>
                    <p className="text-sm font-semibold text-gray-700 capitalize">{key}</p>
                    <p className="text-lg font-bold text-black">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vous pourriez en avoir besoin */}
          <div className="bg-white py-12">
            <h2 className="text-3xl font-bold text-black mb-8">{currentTexts.youMightNeed}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedProducts.map((recProduct, index) => (
                <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={recProduct.image}
                      alt={recProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-black mb-2">{recProduct.name}</h3>
                    <p className="text-lg font-bold text-[#F2431E] mb-4">{recProduct.price}</p>
                    <button className="w-full bg-[#F2431E] text-white py-2 rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors">
                      {language === 'fr' ? 'Ajouter' : 'Add'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

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

      {/* Toast pour ajout au panier */}
      {showToast && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-fadeIn">
          <div className="flex items-center gap-4">
            <span>✅</span>
            <span className="font-semibold">{currentTexts.toastAdded}</span>
            <a
              href="/panier"
              className="ml-4 px-4 py-2 bg-[#F2431E] rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors"
            >
              {currentTexts.goToCart}
            </a>
          </div>
        </div>
      )}

      <Footer language={language} onLegalNoticeClick={() => {}} onRentalConditionsClick={() => {}} />
    </div>
  );
}
