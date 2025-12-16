'use client';

import { useState, useEffect } from 'react';
import { Share2, MessageCircle, Link as LinkIcon, Check } from 'lucide-react';

interface ShareProductButtonProps {
  productName: string;
  productUrl?: string;
  language?: 'fr' | 'en';
  className?: string;
}

export default function ShareProductButton({
  productName,
  productUrl,
  language = 'fr',
  className = ''
}: ShareProductButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canUseWebShare, setCanUseWebShare] = useState(false);
  const [fullUrl, setFullUrl] = useState<string>('');

  // Détecter si Web Share API est disponible et construire l'URL complète
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Détecter Web Share API
      if ('navigator' in window && 'share' in navigator) {
        setCanUseWebShare(true);
      }
      
      // Construire l'URL complète
      if (productUrl) {
        const url = productUrl.startsWith('http') ? productUrl : `${window.location.origin}${productUrl}`;
        setFullUrl(url);
      } else {
        setFullUrl(window.location.href);
      }
    }
  }, [productUrl]);

  // Message de partage (construit uniquement côté client via useMemo pour éviter recalculs)
  const shareText = fullUrl
    ? (language === 'fr'
        ? `Regarde ce matériel pour notre événement 👇\n\n${productName}\n\n${fullUrl}`
        : `Check out this equipment for our event 👇\n\n${productName}\n\n${fullUrl}`)
    : '';

  // Utiliser Web Share API (mobile)
  const handleWebShare = async () => {
    if (!canUseWebShare || !fullUrl) {
      setShowMenu(true);
      return;
    }

    try {
      await navigator.share({
        title: productName,
        text: shareText,
        url: fullUrl,
      });
      setShowMenu(false);
    } catch (error) {
      // L'utilisateur a annulé ou erreur
      if ((error as Error).name !== 'AbortError') {
        console.error('Erreur partage:', error);
        // Fallback sur le menu personnalisé
        setShowMenu(true);
      }
    }
  };

  // Partager sur WhatsApp
  const handleWhatsAppShare = () => {
    if (!shareText || typeof window === 'undefined') return;
    const encodedText = encodeURIComponent(shareText);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
    setShowMenu(false);
  };

  // Partager sur Facebook Messenger
  const handleMessengerShare = () => {
    if (!fullUrl || !shareText || typeof window === 'undefined') return;
    // Messenger nécessite un app_id, donc on utilise le partage Facebook standard
    // ou on copie simplement le lien pour que l'utilisateur le colle dans Messenger
    const encodedUrl = encodeURIComponent(fullUrl);
    const encodedText = encodeURIComponent(shareText);
    // Utiliser le partage Facebook standard
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    setShowMenu(false);
  };

  // Copier le lien
  const handleCopyLink = async () => {
    if (!fullUrl || typeof window === 'undefined') return;
    
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 2000);
    } catch (error) {
      console.error('Erreur copie:', error);
      // Fallback pour navigateurs plus anciens
      if (typeof document !== 'undefined') {
        const textArea = document.createElement('textarea');
        textArea.value = fullUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
          setShowMenu(false);
        }, 2000);
      }
    }
  };

  // Fermer le menu si clic en dehors
  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.share-menu-container')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const buttonLabel = language === 'fr' ? 'Partager' : 'Share';

  return (
    <div className={`share-menu-container relative ${className}`}>
      <button
        onClick={canUseWebShare ? handleWebShare : () => setShowMenu(!showMenu)}
        className="flex items-center justify-center p-2 text-gray-600 hover:text-[#F2431E] transition-colors border border-gray-200 rounded-lg hover:border-[#F2431E] bg-white hover:bg-orange-50"
        aria-label={buttonLabel}
        aria-expanded={showMenu}
        aria-haspopup="true"
      >
        <Share2 className="w-4 h-4" />
      </button>

      {/* Menu de partage personnalisé */}
      {showMenu && !canUseWebShare && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
          <div className="py-2">
            <button
              onClick={handleWhatsAppShare}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
              aria-label="Partager sur WhatsApp"
            >
              <MessageCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm">WhatsApp</span>
            </button>

            <button
              onClick={handleMessengerShare}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
              aria-label="Partager sur Facebook Messenger"
            >
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm">Messenger</span>
            </button>

            <div className="border-t border-gray-200 my-1" />

            <button
              onClick={handleCopyLink}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
              aria-label="Copier le lien"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-600">
                    {language === 'fr' ? 'Lien copié !' : 'Link copied!'}
                  </span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm">
                    {language === 'fr' ? 'Copier le lien' : 'Copy link'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Toast pour confirmation copie */}
      {copied && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-[9999] flex items-center gap-2 transition-all duration-300 ease-out opacity-100 transform translate-y-0">
          <Check className="w-5 h-5" />
          <span className="font-medium">{language === 'fr' ? 'Lien copié !' : 'Link copied!'}</span>
        </div>
      )}
    </div>
  );
}
