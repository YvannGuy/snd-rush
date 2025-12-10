// Composant QuantitySelector pour gérer les quantités multiples (enceintes, caissons)
'use client';

import React from 'react';

interface QuantitySelectorProps {
  productId: string;
  productName: string;
  price: number;
  icon?: string;
  quantity: number;
  onQuantityChange: (productId: string, quantity: number) => void;
  maxQuantity?: number;
  suggested?: boolean;
}

export default function QuantitySelector({
  productId,
  productName,
  price,
  icon = '🔊',
  quantity,
  onQuantityChange,
  maxQuantity,
  suggested = false,
}: QuantitySelectorProps) {
  const handleDecrement = () => {
    if (quantity > 0) {
      onQuantityChange(productId, quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (!maxQuantity || quantity < maxQuantity) {
      onQuantityChange(productId, quantity + 1);
    }
  };

  return (
    <div className={`
      w-full p-5 rounded-2xl border-2 transition-all duration-300
      ${quantity > 0
        ? 'border-[#F2431E] bg-gradient-to-r from-[#F2431E]/10 to-[#e27431]/10 shadow-lg'
        : 'border-gray-200 hover:border-[#F2431E]/50 hover:bg-gray-50'
      }
      ${suggested ? 'ring-2 ring-yellow-400 ring-opacity-50 bg-yellow-50/30' : ''}
    `}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <span className="text-2xl">{icon}</span>
          <div>
            <span className="font-semibold text-lg text-gray-900">{productName}</span>
            {suggested && (
              <span className="ml-2 text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full font-semibold">
                💡 Suggéré
              </span>
            )}
          </div>
        </div>
        <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
          quantity > 0 ? 'bg-[#F2431E] text-white' : 'bg-gray-100 text-gray-700'
        }`}>
          {price} € / jour
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleDecrement}
            disabled={quantity === 0}
            className={`
              w-10 h-10 rounded-lg border-2 flex items-center justify-center font-bold text-lg transition-all
              ${quantity > 0
                ? 'border-[#F2431E] text-[#F2431E] hover:bg-[#F2431E] hover:text-white'
                : 'border-gray-300 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            −
          </button>
          <span className="text-xl font-bold text-gray-900 min-w-[3rem] text-center">
            {quantity}
          </span>
          <button
            onClick={handleIncrement}
            disabled={maxQuantity !== undefined && quantity >= maxQuantity}
            className={`
              w-10 h-10 rounded-lg border-2 flex items-center justify-center font-bold text-lg transition-all
              ${maxQuantity !== undefined && quantity >= maxQuantity
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-[#F2431E] text-[#F2431E] hover:bg-[#F2431E] hover:text-white'
              }
            `}
          >
            +
          </button>
        </div>
        {quantity > 0 && (
          <div className="text-right">
            <span className="text-sm text-gray-600">Total : </span>
            <span className="text-lg font-bold text-[#F2431E]">
              {quantity * price} €
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
