
'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import MiniCart from '@/components/cart/MiniCart';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import SignModal from '@/components/auth/SignModal';
import TopBanner from '@/components/TopBanner';
// Icônes inline pour éviter la dépendance lucide-react
const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LogOutIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const FileTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

interface HeaderProps {
  language: 'fr' | 'en';
  onLanguageChange: (lang: 'fr' | 'en') => void;
}

export default function Header({ language, onLanguageChange }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { getCartItemCount } = useCart();
  const [cartCount, setCartCount] = useState(0);
  const { user } = useUser();
  const { signOut } = useAuth();

  useEffect(() => {
    // Initialiser le compteur au montage
    setCartCount(getCartItemCount());
    
    const handleCartUpdate = (event?: CustomEvent) => {
      // Utiliser les données de l'événement si disponibles, sinon lire depuis le contexte
      if (event?.detail) {
        const cart = event.detail as { items: any[] };
        const count = cart.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
        setCartCount(count);
      } else {
        setCartCount(getCartItemCount());
      }
    };
    
    const handleProductAdded = () => {
      // Ne pas ouvrir le MiniCart si on est déjà sur la page panier
      if (pathname !== '/panier') {
        setIsMiniCartOpen(true);
      }
      setCartCount(getCartItemCount());
    };
    
    // Écouter l'événement avec le type correct
    const cartUpdateHandler = (event: Event) => handleCartUpdate(event as CustomEvent);
    window.addEventListener('cartUpdated', cartUpdateHandler);
    window.addEventListener('productAddedToCart', handleProductAdded);
    
    return () => {
      window.removeEventListener('cartUpdated', cartUpdateHandler);
      window.removeEventListener('productAddedToCart', handleProductAdded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // Inclure pathname pour vérifier la page actuelle

  // Fermer le menu profil quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const getUserInitials = (user: any) => {
    const email = user?.email || '';
    return email.charAt(0).toUpperCase();
  };

  const handleSignOut = async () => {
    await signOut();
    setIsProfileMenuOpen(false);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'fr' ? 'en' : 'fr';
    onLanguageChange(newLanguage);
  };

  const texts = {
    fr: {
      catalogue: 'Catalogue',
      packs: 'Packs',
      urgence: 'Urgence 24/7',
      faq: 'FAQ',
      callNow: 'Appelez',
      banner: '1er spécialiste de l\'urgence sonore • Paris et Île-de-France • 24h/24 7j/7 • Intervention rapide • Devis gratuit',
      account: 'Mon compte',
      reservations: 'Mes réservations',
      invoices: 'Mes factures',
      signOut: 'Déconnexion',
    },
    en: {
      catalogue: 'Catalogue',
      packs: 'Packs',
      urgence: 'Emergency 24/7',
      faq: 'FAQ',
      callNow: 'Call',
      banner: '1st sound emergency specialist • Paris and Île-de-France • 24/7 • Fast intervention • Free quote',
      account: 'My account',
      reservations: 'My reservations',
      invoices: 'My invoices',
      signOut: 'Sign out',
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Bandeau orange en haut */}
      <TopBanner language={language} />
      
      {/* Header principal avec fond sombre */}
      <div className="bg-black shadow-md relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between h-16">
            {/* Logo SndRush */}
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-[#F2431E]">
                SndRush
              </span>
            </Link>

            {/* Navigation complète */}
            <nav className="hidden lg:flex items-center justify-center space-x-6 flex-1">
              <Link 
                href="/catalogue"
                className="text-white hover:text-[#F2431E] transition-colors font-medium cursor-pointer"
              >
                {texts[language].catalogue}
              </Link>
              <Link 
                href="/packs"
                className="text-white hover:text-[#F2431E] transition-colors font-medium cursor-pointer"
              >
                {texts[language].packs}
              </Link>
              <Link 
                href="/#urgency"
                onClick={(e) => {
                  if (pathname === '/') {
                    e.preventDefault();
                    scrollToSection('urgency');
                  }
                }}
                className="text-white hover:text-[#F2431E] transition-colors font-medium cursor-pointer"
              >
                {texts[language].urgence}
              </Link>
              <Link 
                href="/#faq"
                onClick={(e) => {
                  if (pathname === '/') {
                    e.preventDefault();
                    scrollToSection('faq');
                  }
                }}
                className="text-white hover:text-[#F2431E] transition-colors font-medium cursor-pointer"
              >
                {texts[language].faq}
              </Link>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* CTA Principal - Réserver */}
              <Link
                href="/packs"
                className="hidden lg:flex items-center justify-center px-4 py-2 bg-[#F2431E] text-white rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors text-sm"
              >
                {language === 'fr' ? 'Réserver' : 'Book'}
              </Link>

              {/* Language switcher - Desktop only */}
              <button
                onClick={toggleLanguage}
                className="hidden lg:flex items-center space-x-1 text-sm font-medium text-white hover:text-[#F2431E] transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  {language === 'fr' ? (
                    <span className="text-lg">🇬🇧</span>
                  ) : (
                    <span className="text-lg">🇫🇷</span>
                  )}
                </div>
                <span className="uppercase">{language === 'fr' ? 'EN' : 'FR'}</span>
              </button>

              {/* Auth Icon - Desktop only */}
              <div className="hidden lg:block relative" ref={profileMenuRef}>
                <button
                  onClick={() => user ? setIsProfileMenuOpen(!isProfileMenuOpen) : setIsSignModalOpen(true)}
                  className="relative p-2 text-white hover:text-[#F2431E] transition-colors cursor-pointer rounded-full"
                  aria-label={user ? texts[language].account : 'Se connecter'}
                >
                  {user ? (
                    <div className="w-8 h-8 rounded-full bg-[#F2431E] flex items-center justify-center text-white font-bold text-sm">
                      {getUserInitials(user)}
                    </div>
                  ) : (
                    <UserIcon className="w-6 h-6" />
                  )}
                </button>

                {/* Profile Menu Dropdown */}
                {user && isProfileMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-semibold text-black truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      {texts[language].reservations}
                    </Link>
                    <Link
                      href="/mes-factures"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FileTextIcon className="w-4 h-4" />
                      {texts[language].invoices}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOutIcon className="w-4 h-4" />
                      {texts[language].signOut}
                    </button>
                  </div>
                )}
              </div>

              {/* Panier - Desktop only */}
              <button
                onClick={() => setIsMiniCartOpen(true)}
                className="hidden lg:flex relative p-2 text-white hover:text-[#F2431E] transition-colors cursor-pointer"
                aria-label="Panier"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>

              {/* Panier Mobile */}
              <button
                onClick={() => setIsMiniCartOpen(true)}
                className="lg:hidden relative p-2 text-white"
                aria-label="Panier"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>

              {/* Mobile buttons - Toggle et Auth côte à côte */}
              <div className="lg:hidden flex items-center gap-2">
                {/* Auth Icon - Mobile */}
                <button
                  onClick={() => user ? setIsProfileMenuOpen(!isProfileMenuOpen) : setIsSignModalOpen(true)}
                  className="p-3 cursor-pointer text-white hover:bg-gray-800 rounded-lg transition-colors relative"
                  aria-label={user ? texts[language].account : 'Se connecter'}
                >
                  {user ? (
                    <div className="w-6 h-6 rounded-full bg-[#F2431E] flex items-center justify-center text-white font-bold text-xs">
                      {getUserInitials(user)}
                    </div>
                  ) : (
                    <UserIcon className="w-6 h-6" />
                  )}
                </button>

                {/* Mobile menu button */}
                <button 
                  className="p-3 cursor-pointer text-white hover:bg-gray-800 rounded-lg transition-colors relative z-50"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                  aria-expanded={isMobileMenuOpen}
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    {isMobileMenuOpen ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile menu - Positionné relativement au conteneur */}
          {isMobileMenuOpen && (
            <div 
              className="lg:hidden absolute top-full left-0 right-0 border-t border-white/20 z-30 overflow-hidden bg-black"
            >
              <div className="pt-3 pb-4 space-y-2 px-4">
            <Link 
              href="/catalogue"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-left px-2 py-2.5 text-sm font-medium text-white hover:text-[#F2431E] hover:bg-white/10 rounded-md cursor-pointer transition-colors"
            >
              {texts[language].catalogue}
            </Link>
            <Link 
              href="/packs"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-left px-2 py-2.5 text-sm font-medium text-white hover:text-[#F2431E] hover:bg-white/10 rounded-md cursor-pointer transition-colors"
            >
              {texts[language].packs}
            </Link>
            <Link 
              href="/#urgency"
              onClick={(e) => {
                if (pathname === '/') {
                  e.preventDefault();
                  scrollToSection('urgency');
                }
                setIsMobileMenuOpen(false);
              }}
              className="block w-full text-left px-2 py-2.5 text-sm font-medium text-white hover:text-[#F2431E] hover:bg-white/10 rounded-md cursor-pointer transition-colors"
            >
              {texts[language].urgence}
            </Link>
            <Link 
              href="/#faq"
              onClick={(e) => {
                if (pathname === '/') {
                  e.preventDefault();
                  scrollToSection('faq');
                }
                setIsMobileMenuOpen(false);
              }}
              className="block w-full text-left px-2 py-2.5 text-sm font-medium text-white hover:text-[#F2431E] hover:bg-white/10 rounded-md cursor-pointer transition-colors"
            >
              {texts[language].faq}
            </Link>
            
            {/* CTA Réserver - Mobile */}
            <Link
              href="/packs"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-left px-2 py-2.5 text-sm font-semibold bg-[#F2431E] text-white hover:bg-[#E63A1A] rounded-md cursor-pointer transition-colors text-center mt-2"
            >
              {language === 'fr' ? 'Réserver' : 'Book'}
            </Link>

            {/* Language switcher for mobile */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 w-full text-left px-2 py-2.5 text-sm font-medium text-white hover:text-[#F2431E] hover:bg-white/10 rounded-md cursor-pointer transition-colors"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                {language === 'fr' ? (
                  <span className="text-base">🇬🇧</span>
                ) : (
                  <span className="text-base">🇫🇷</span>
                )}
              </div>
              <span className="uppercase text-xs">{language === 'fr' ? 'EN' : 'FR'}</span>
            </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mini Cart */}
      <MiniCart
        isOpen={isMiniCartOpen}
        onClose={() => setIsMiniCartOpen(false)}
        language={language}
      />

      {/* Sign Modal */}
      <SignModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        language={language}
        onSuccess={() => {
          // Le panier sera attaché automatiquement via CartContext
          setIsSignModalOpen(false);
          // Rediriger vers le dashboard après connexion
          router.push('/dashboard');
        }}
        onOpenAdminModal={() => {
          setIsSignModalOpen(false);
          setIsAdminModalOpen(true);
        }}
      />

      {/* Admin Sign Modal */}
      <SignModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        language={language}
        isAdmin={true}
        onSuccess={() => {
          setIsAdminModalOpen(false);
          router.push('/admin');
        }}
        onOpenUserModal={() => {
          setIsAdminModalOpen(false);
          setIsSignModalOpen(true);
        }}
      />

      {/* Mobile Profile Menu */}
      {user && isProfileMenuOpen && (
        <div className="lg:hidden fixed top-[104px] left-0 right-0 bg-black/95 backdrop-blur-md z-40 border-t border-white/20">
          <div className="px-4 py-4 space-y-2">
            <div className="px-2 py-2 border-b border-white/20">
              <p className="text-sm font-semibold text-white truncate">{user.email}</p>
            </div>
            <Link
              href="/mes-reservations"
              onClick={() => setIsProfileMenuOpen(false)}
              className="flex items-center gap-3 px-2 py-2.5 text-sm font-medium text-white hover:text-[#F2431E] hover:bg-white/10 rounded-md transition-colors"
            >
              <CalendarIcon className="w-5 h-5" />
              {texts[language].reservations}
            </Link>
            <Link
              href="/mes-factures"
              onClick={() => setIsProfileMenuOpen(false)}
              className="flex items-center gap-3 px-2 py-2.5 text-sm font-medium text-white hover:text-[#F2431E] hover:bg-white/10 rounded-md transition-colors"
            >
              <FileTextIcon className="w-5 h-5" />
              {texts[language].invoices}
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-2 py-2.5 text-sm font-medium text-red-400 hover:bg-red-900/20 rounded-md transition-colors"
            >
              <LogOutIcon className="w-5 h-5" />
              {texts[language].signOut}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
