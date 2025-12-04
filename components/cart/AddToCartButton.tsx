'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { CartItem } from '@/types/db';

interface AddToCartButtonProps {
  item: Omit<CartItem, 'productId' | 'productName' | 'productSlug'> & {
    productId: string;
    productName: string;
    productSlug: string;
  };
  language?: 'fr' | 'en';
  className?: string;
  disabled?: boolean;
  onAdd?: () => void;
}

export default function AddToCartButton({
  item,
  language = 'fr',
  className = '',
  disabled = false,
  onAdd,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [showToast, setShowToast] = useState(false);

  const texts = {
    fr: {
      addToCart: 'Ajouter au panier',
      added: 'Ajouté au panier !',
    },
    en: {
      addToCart: 'Add to cart',
      added: 'Added to cart!',
    },
  };

  const currentTexts = texts[language];

  const handleAddToCart = () => {
    if (disabled) return;

    const cartItem: CartItem = {
      productId: item.productId,
      productName: item.productName,
      productSlug: item.productSlug,
      quantity: item.quantity,
      rentalDays: item.rentalDays,
      startDate: item.startDate,
      endDate: item.endDate,
      dailyPrice: item.dailyPrice,
      deposit: item.deposit,
      addons: item.addons,
      images: item.images,
    };

    addToCart(cartItem);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    if (onAdd) {
      onAdd();
    }
  };

  return (
    <>
      <button
        onClick={handleAddToCart}
        disabled={disabled}
        className={`
          ${className}
          ${disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-[#F2431E] text-white hover:bg-[#E63A1A]'
          }
          transition-all font-semibold shadow-lg hover:shadow-xl
        `}
      >
        {currentTexts.addToCart}
      </button>

      {/* Toast notification */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span className="font-semibold">{currentTexts.added}</span>
          </div>
        </div>
      )}
    </>
  );
}

