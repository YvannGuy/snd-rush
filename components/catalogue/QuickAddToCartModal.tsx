'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { CartItem } from '@/types/db';

interface QuickAddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: number;
    name: string;
    price: string;
    image: string;
  };
  language: 'fr' | 'en';
}

export default function QuickAddToCartModal({ isOpen, onClose, product, language }: QuickAddToCartModalProps) {
  const { addToCart } = useCart();
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string>('19:00');
  const [endTime, setEndTime] = useState<string>('23:00');
  const [quantity, setQuantity] = useState(1);
  const [rentalDays, setRentalDays] = useState(1);

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

  // Extraire le prix journalier
  const dailyPrice = parseFloat(product.price.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  const total = dailyPrice * quantity * rentalDays;

  const handleAddToCart = async () => {
    if (!startDate || !endDate) {
      return;
    }

    // Empêcher l'ajout des lumières au panier
    const productNameLower = product.name.toLowerCase();
    
    // Exclure les produits qui ne sont clairement pas des lumières
    const isNotLight = productNameLower.includes('pied') || 
                       productNameLower.includes('stand') ||
                       productNameLower.includes('support') ||
                       productNameLower.includes('micro') ||
                       productNameLower.includes('cable') ||
                       productNameLower.includes('câble') ||
                       productNameLower.includes('xlr') ||
                       productNameLower.includes('adaptateur');
    
    if (!isNotLight) {
      // Vérifier les mots-clés spécifiques aux lumières
      const isLight = productNameLower.includes('led') || 
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
      
      if (isLight) {
        alert(language === 'fr' 
          ? 'Ce produit est actuellement indisponible.' 
          : 'This product is currently unavailable.');
        return;
      }
    }

    // Mapper les IDs de packs du catalogue vers les IDs utilisés dans le système
    let productId = product.id.toString();
    const isPack = productId.startsWith('pack-');
    
    if (isPack) {
      const packMapping: Record<string, string> = {
        'pack-1': 'pack_petit',
        'pack-2': 'pack_confort',
        'pack-3': 'pack_grand',
        'pack-5': 'pack_maxi',
        'pack-6': 'pack_dj_essentiel',
        'pack-7': 'pack_dj_performance',
        'pack-8': 'pack_dj_premium',
      };
      productId = packMapping[productId] || productId;
      
      // Pour les packs, les ajouter directement comme packs (PAS de décomposition)
      if (productId !== 'pack_maxi') {
        // Mapping des images des packs
        const packImages: Record<string, string> = {
          'pack_petit': '/packs.png',
          'pack_confort': '/packM.png',
          'pack_grand': '/packL.png',
          'pack_dj_essentiel': '/packdjs.png',
          'pack_dj_performance': '/packdjM.png',
          'pack_dj_premium': '/packdjL.png',
        };
        
        // Récupérer la caution depuis getPacksInfo()
        let packDeposit = 0;
        try {
          const { getPacksInfo } = await import('@/lib/assistant-products');
          const packs = getPacksInfo();
          const packInfo = packs.find(p => p.id === productId);
          packDeposit = packInfo?.deposit || 0;
        } catch (e) {
          console.error('Erreur récupération caution pack:', e);
        }
        
        const cartItem: CartItem = {
          productId,
          productName: product.name,
          productSlug: productId,
          quantity,
          rentalDays,
          startDate,
          endDate,
          dailyPrice,
          deposit: packDeposit,
          addons: [],
          images: packImages[productId] ? [packImages[productId]] : [product.image],
          startTime,
          endTime,
        };
        
        const result = await addToCart(cartItem);
        if (result.success) {
          onClose();
        } else {
          alert(result.error || (language === 'fr' 
            ? 'Impossible d\'ajouter ce produit au panier.' 
            : 'Unable to add this product to cart.'));
        }
        return;
      }
    }

    // Pour les produits individuels, ajouter directement
    const cartItem: CartItem = {
      productId,
      productName: product.name,
      productSlug: product.name.toLowerCase().replace(/\s+/g, '-'),
      quantity,
      rentalDays,
      startDate,
      endDate,
      dailyPrice,
      deposit: 500,
      addons: [],
      images: [product.image],
      eventType: 'event',
      startTime,
      endTime,
    };

    const result = await addToCart(cartItem);
    if (result.success) {
      onClose();
    } else {
      alert(result.error || (language === 'fr' 
        ? 'Impossible d\'ajouter ce produit au panier.' 
        : 'Unable to add this product to cart.'));
    }
  };

  const texts = {
    fr: {
      title: 'Ajouter au panier',
      startDate: 'Date de début',
      endDate: 'Date de fin',
      quantity: 'Quantité',
      total: 'Total',
      days: 'jours',
      addToCart: 'Ajouter au panier',
      close: 'Fermer',
      added: 'Produit ajouté au panier !',
    },
    en: {
      title: 'Add to cart',
      startDate: 'Start date',
      endDate: 'End date',
      quantity: 'Quantity',
      total: 'Total',
      days: 'days',
      addToCart: 'Add to cart',
      close: 'Close',
      added: 'Product added to cart!',
    },
  };

  const currentTexts = texts[language];

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">{currentTexts.title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-2xl text-gray-500">×</span>
            </button>
          </div>

          {/* Product Info */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-black mb-2">{product.name}</h3>
            <p className="text-xl font-bold text-[#F2431E]">{product.price}</p>
          </div>

          {/* Date Selection */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {currentTexts.startDate}
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {language === 'fr' ? 'Heure de début' : 'Start time'}
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:border-[#F2431E] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {currentTexts.endDate}
              </label>
              <input
                type="date"
                value={endDate || ''}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:border-[#F2431E] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {language === 'fr' ? 'Heure de fin' : 'End time'}
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:border-[#F2431E] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {currentTexts.quantity}
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center border-2 border-gray-200 rounded-lg hover:border-[#F2431E] transition-colors"
                >
                  -
                </button>
                <span className="text-lg font-bold text-black w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center border-2 border-gray-200 rounded-lg hover:border-[#F2431E] transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Total */}
          {startDate && endDate && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">
                  {currentTexts.total} ({rentalDays} {currentTexts.days})
                </span>
                <span className="text-2xl font-bold text-black">{total.toFixed(2)}€</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              {currentTexts.close}
            </button>
            <button
              onClick={handleAddToCart}
              disabled={!startDate || !endDate}
              className={`
                flex-1 py-3 rounded-lg font-semibold transition-all
                ${startDate && endDate
                  ? 'bg-[#F2431E] text-white hover:bg-[#E63A1A]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {currentTexts.addToCart}
            </button>
          </div>
        </div>
      </div>

    </>
  );
}

