'use client';

import { MessageCircle, Sparkles } from 'lucide-react';

interface AskAssistantButtonProps {
  productId: string;
  productName: string;
  productType: 'pack' | 'product';
  productUrl: string;
  language?: 'fr' | 'en';
  className?: string;
  variant?: 'default' | 'compact';
}

export default function AskAssistantButton({
  productId,
  productName,
  productType,
  productUrl,
  language = 'fr',
  className = '',
  variant = 'default'
}: AskAssistantButtonProps) {
  const handleAskAssistant = () => {
    // Construire le message prérempli avec le contexte produit
    // Note: productName contient déjà "Pack" pour les packs, donc on utilise directement productName
    const message = language === 'fr'
      ? `Je suis sur la page du ${productName} et j'hésite à le choisir.`
      : `I'm on the ${productName} page and I'm hesitating to choose it.`;

    // Ouvrir le chat avec le message draft et le contexte produit
    window.dispatchEvent(new CustomEvent('openChatWithDraft', {
      detail: {
        message: message,
        productContext: {
          productType,
          productId,
          productName,
          productUrl: productUrl.startsWith('http') ? productUrl : `${window.location.origin}${productUrl}`
        }
      }
    }));
  };

  const buttonText = language === 'fr' ? 'Demander à l\'assistant' : 'Ask assistant';
  const helpText = language === 'fr' 
    ? 'Vous n\'êtes pas sûr de votre choix ? Obtenez une recommandation instantanée.'
    : 'Not sure about your choice? Get an instant recommendation.';

  if (variant === 'compact') {
    return (
      <button
        onClick={handleAskAssistant}
        className={`flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-[#F2431E] transition-colors border border-gray-200 rounded-lg hover:border-[#F2431E] bg-white hover:bg-orange-50 ${className}`}
        aria-label={buttonText}
      >
        <Sparkles className="w-4 h-4" />
        <span>{buttonText}</span>
      </button>
    );
  }

  return (
    <div className={className}>
      {helpText && (
        <p className="text-sm text-gray-600 mb-2 text-center">
          {helpText}
        </p>
      )}
      <button
        onClick={handleAskAssistant}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:text-[#F2431E] transition-colors border-2 border-gray-200 rounded-lg hover:border-[#F2431E] bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-[#F2431E] focus:ring-offset-2"
        aria-label={buttonText}
      >
        <MessageCircle className="w-5 h-5" />
        <span>{buttonText}</span>
      </button>
    </div>
  );
}
