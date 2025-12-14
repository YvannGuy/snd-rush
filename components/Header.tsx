
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import MiniCart from '@/components/cart/MiniCart';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import SignModal from '@/components/auth/SignModal';
import TopBanner from '@/components/TopBanner';
import GuaranteesBanner from '@/components/GuaranteesBanner';
import SearchBar from '@/components/SearchBar';
import UserIconWithName from '@/components/UserIconWithName';
import { supabase } from '@/lib/supabase';
// Shadcn UI components
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
// Icônes lucide-react
import { User, ShoppingCart, Menu, X, Globe, ChevronDown } from 'lucide-react';


interface HeaderProps {
  language: 'fr' | 'en';
  onLanguageChange: (lang: 'fr' | 'en') => void;
}

export default function Header({ language, onLanguageChange }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Ne pas afficher le bandeau noir sur les pages dashboard/admin et toutes les pages utilisateur (mes-*)
  const isDashboardPage = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin') || pathname?.startsWith('/mes-');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const { getCartItemCount, cart } = useCart();
  const [cartCount, setCartCount] = useState(0);
  const { user } = useUser();
  const { signOut } = useAuth();
  const [userFirstName, setUserFirstName] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Synchroniser le compteur avec le panier en temps réel
  useEffect(() => {
    const count = getCartItemCount();
    setCartCount(count);
  }, [cart, getCartItemCount]);

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
      // Mettre à jour le compteur immédiatement
      setCartCount(getCartItemCount());
      // Ne pas ouvrir le MiniCart si on est déjà sur la page panier
      if (pathname !== '/panier') {
        setIsMiniCartOpen(true);
      }
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
  }, [pathname, getCartItemCount]); // Inclure getCartItemCount pour la réactivité

  // Récupérer le prénom de l'utilisateur et vérifier le rôle admin
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id || !supabase) {
        setUserFirstName('');
        setIsAdmin(false);
        return;
      }

      try {
        // Essayer de récupérer depuis user_profiles
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('first_name, role')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          // Vérifier le rôle admin (insensible à la casse)
          const isAdminRole = profile.role?.toLowerCase() === 'admin';
          setIsAdmin(isAdminRole);
          console.log('🔍 Header - Profile trouvé:', { role: profile.role, isAdmin: isAdminRole, userId: user.id });

          if (profile.first_name) {
            // Capitaliser la première lettre
            const firstName = profile.first_name.charAt(0).toUpperCase() + profile.first_name.slice(1).toLowerCase();
            setUserFirstName(firstName);
          } else if (user.user_metadata?.first_name) {
            const firstName = user.user_metadata.first_name.charAt(0).toUpperCase() + user.user_metadata.first_name.slice(1).toLowerCase();
            setUserFirstName(firstName);
          } else if (user.email) {
            // Fallback: utiliser la partie avant @ de l'email
            const emailPart = user.email.split('@')[0];
            setUserFirstName(emailPart.charAt(0).toUpperCase() + emailPart.slice(1).toLowerCase());
          }
        } else {
          // Fallback: vérifier dans user_metadata
          const metadataRole = user.user_metadata?.role?.toLowerCase();
          const isAdminFromMetadata = metadataRole === 'admin';
          setIsAdmin(isAdminFromMetadata);
          console.log('🔍 Header - Pas de profile, vérification metadata:', { metadataRole, isAdmin: isAdminFromMetadata });

          if (user.user_metadata?.first_name) {
            const firstName = user.user_metadata.first_name.charAt(0).toUpperCase() + user.user_metadata.first_name.slice(1).toLowerCase();
            setUserFirstName(firstName);
          } else if (user.email) {
            const emailPart = user.email.split('@')[0];
            setUserFirstName(emailPart.charAt(0).toUpperCase() + emailPart.slice(1).toLowerCase());
          }
        }
      } catch (error) {
        console.error('Erreur récupération données utilisateur:', error);
        setIsAdmin(false);
        console.log('🔍 Header - Erreur, isAdmin défini à false');
        // Fallback vers user_metadata ou email
        if (user.user_metadata?.first_name) {
          const firstName = user.user_metadata.first_name.charAt(0).toUpperCase() + user.user_metadata.first_name.slice(1).toLowerCase();
          setUserFirstName(firstName);
        } else if (user.email) {
          const emailPart = user.email.split('@')[0];
          setUserFirstName(emailPart.charAt(0).toUpperCase() + emailPart.slice(1).toLowerCase());
        }
      }
    };

    if (user) {
      fetchUserData();
    } else {
      setUserFirstName('');
      setIsAdmin(false);
    }
  }, [user]);



  const getUserInitials = (user: any) => {
    const email = user?.email || '';
    return email.charAt(0).toUpperCase();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Attendre un peu pour que l'état d'authentification soit mis à jour
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Vider également le localStorage du panier et autres données utilisateur
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sndrush_cart');
        // Dispatcher un événement pour vider le panier dans le contexte
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items: [], total: 0, depositTotal: 0 } }));
      }
      
      // Forcer un rechargement complet de la page pour s'assurer que l'utilisateur est déconnecté
      window.location.href = '/';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // En cas d'erreur, vider quand même le localStorage et rediriger
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sndrush_cart');
        // Vider les clés Supabase
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        window.location.href = '/';
      }
    }
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
      contracts: 'Mes contrats',
      invoices: 'Mes factures',
      signOut: 'Déconnexion',
      adminPanel: 'Panneau admin',
      adminReservations: 'Réservations',
      adminPlanning: 'Planning',
      adminClients: 'Clients',
      adminEtatsDesLieux: 'États des lieux',
      adminCatalog: 'Catalogue',
      adminInvoices: 'Factures',
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
      contracts: 'My contracts',
      invoices: 'My invoices',
      signOut: 'Sign out',
      adminPanel: 'Admin panel',
      adminReservations: 'Reservations',
      adminPlanning: 'Planning',
      adminClients: 'Clients',
      adminEtatsDesLieux: 'Condition reports',
      adminCatalog: 'Catalog',
      adminInvoices: 'Invoices',
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Header principal avec fond sombre */}
      <div className="bg-black relative" data-no-border style={{ border: 'none', boxShadow: 'none', margin: 0, outline: 'none' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between h-16">
            {/* Logo SoundRush */}
            <Link href="/" className="flex items-center">
              <span className="text-xl sm:text-2xl font-bold whitespace-nowrap">
                <span className="text-[#F2431E]">SoundRush</span>
                <span className="text-white"> Paris</span>
              </span>
            </Link>

            {/* Barre de recherche */}
            <div className="hidden lg:flex items-center justify-center flex-1 px-8">
              <SearchBar language={language} />
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-1 lg:gap-1">
              {/* CTA Principal - Réserver */}
              <Button
                asChild
                variant="default"
                size="default"
                className="hidden lg:flex bg-[#F2431E] hover:bg-[#E63A1A] text-white"
              >
                <Link href="/catalogue">
                  {language === 'fr' ? 'Réserver' : 'Book'}
                </Link>
              </Button>

              {/* Séparateur vertical */}
              <div className="hidden lg:block w-px h-6 bg-white/20" />

              {/* Login - Desktop only */}
              <div className="hidden lg:block">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 text-white hover:text-[#F2431E] hover:bg-transparent px-2"
                        aria-label={texts[language].account}
                      >
                        <User className="h-5 w-5" />
                        <span className="font-semibold text-sm">{userFirstName || 'Login'}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {isAdmin ? (
                        <>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/admin/reservations"
                              className="cursor-pointer"
                            >
                              {texts[language].adminReservations}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/admin/clients"
                              className="cursor-pointer"
                            >
                              {texts[language].adminClients}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/admin/etats-des-lieux"
                              className="cursor-pointer"
                            >
                              {texts[language].adminEtatsDesLieux}
                            </Link>
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/dashboard"
                              className="cursor-pointer"
                            >
                              {texts[language].account}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/mes-reservations"
                              className="cursor-pointer"
                            >
                              {texts[language].reservations}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/mes-contrats"
                              className="cursor-pointer"
                            >
                              {texts[language].contracts}
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={async () => {
                          await handleSignOut();
                        }}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                      >
                        {texts[language].signOut}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSignModalOpen(true)}
                    className="flex items-center gap-2 text-white hover:text-[#F2431E] hover:bg-transparent px-2"
                    aria-label="Se connecter"
                  >
                    <User className="h-5 w-5" />
                    <span className="font-semibold text-sm">{language === 'fr' ? 'Connexion' : 'Login'}</span>
                  </Button>
                )}
              </div>
              
              {/* Séparateur vertical */}
              <div className="hidden lg:block w-px h-6 bg-white/20" />

              {/* Panier - Desktop only */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMiniCartOpen(true)}
                className="hidden lg:flex relative text-white hover:text-[#F2431E] hover:bg-white/10"
                aria-label="Panier"
              >
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <Badge 
                    variant="default" 
                    className="absolute -top-1 -right-1 bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center p-0 animate-pulse"
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </Badge>
                )}
              </Button>
              
              {/* Séparateur vertical */}
              <div className="hidden lg:block w-px h-6 bg-white/20" />
              
              {/* Language switcher - Desktop only */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden lg:flex items-center gap-2 text-white hover:text-[#F2431E] hover:bg-transparent px-2"
                  >
                    <Globe className="h-5 w-5" />
                    <span className="font-semibold text-sm uppercase">{language === 'fr' ? 'Fra' : 'Eng'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem
                    onClick={() => {
                      if (language !== 'fr') toggleLanguage();
                    }}
                    className="cursor-pointer"
                  >
                    <span className="font-semibold">Français</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (language !== 'en') toggleLanguage();
                    }}
                    className="cursor-pointer"
                  >
                    <span className="font-semibold">English</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile buttons - Panier, Auth et Toggle regroupés */}
              <div className="lg:hidden flex items-center gap-0 flex-shrink-0">
                {/* Mobile menu button - Priorité pour être toujours visible */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 rounded-lg relative z-50 flex-shrink-0"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                  aria-expanded={isMobileMenuOpen}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>
                
                {/* Séparateur vertical mobile */}
                <div className="w-px h-6 bg-white/20 mx-1" />
                
                {/* Panier Mobile */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMiniCartOpen(true)}
                  className="relative text-white flex-shrink-0"
                  aria-label="Panier"
                >
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && (
                    <Badge 
                      variant="default" 
                      className="absolute -top-1 -right-1 bg-[#F2431E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center p-0"
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </Badge>
                  )}
                </Button>
                
                {/* Séparateur vertical mobile */}
                <div className="w-px h-6 bg-white/20 mx-1" />
                
                {/* Auth Icon - Mobile - Version compacte */}
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/10 rounded-lg flex-shrink-0"
                        aria-label={texts[language].account}
                      >
                        <User className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {isAdmin ? (
                        <>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/admin/reservations"
                              className="cursor-pointer"
                            >
                              {texts[language].adminReservations}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/admin/clients"
                              className="cursor-pointer"
                            >
                              {texts[language].adminClients}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/admin/etats-des-lieux"
                              className="cursor-pointer"
                            >
                              {texts[language].adminEtatsDesLieux}
                            </Link>
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/dashboard"
                              className="cursor-pointer"
                            >
                              {texts[language].account}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/mes-reservations"
                              className="cursor-pointer"
                            >
                              {texts[language].reservations}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/mes-contrats"
                              className="cursor-pointer"
                            >
                              {texts[language].contracts}
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={async () => {
                          await handleSignOut();
                        }}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                      >
                        {texts[language].signOut}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSignModalOpen(true)}
                    className="text-white hover:bg-white/10 rounded-lg flex-shrink-0"
                    aria-label="Se connecter"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                )}
                
                {/* Séparateur vertical mobile */}
                <div className="w-px h-6 bg-white/20 mx-1" />
                
                {/* Language switcher Mobile - Version compacte */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:text-[#F2431E] hover:bg-transparent flex-shrink-0"
                    >
                      <Globe className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem
                      onClick={() => {
                        if (language !== 'fr') toggleLanguage();
                      }}
                      className="cursor-pointer"
                    >
                      <span className="font-semibold">Français</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (language !== 'en') toggleLanguage();
                      }}
                      className="cursor-pointer"
                    >
                      <span className="font-semibold">English</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          
          {/* Mobile menu - Positionné en fixed pour être visible sous le bandeau orange */}
          {isMobileMenuOpen && (
            <div 
              className="lg:hidden fixed top-[112px] left-0 right-0 border-t border-white/20 z-40 overflow-hidden bg-black"
            >
              <div className="pt-3 pb-4 space-y-2 px-4">
                {/* Barre de recherche mobile */}
                <div className="mb-4">
                  <SearchBar language={language} />
                </div>
            
            {/* CTA Réserver - Mobile */}
            <Button
              asChild
              variant="default"
              size="default"
              className="w-full bg-[#F2431E] hover:bg-[#E63A1A] text-white mt-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Link href="/catalogue">
                {language === 'fr' ? 'Réserver' : 'Book'}
              </Link>
            </Button>

            {/* Language switcher for mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 w-full justify-start text-white hover:text-[#F2431E] hover:bg-white/10"
                >
                  <Globe className="h-5 w-5" />
                  <span className="font-semibold text-sm uppercase">{language === 'fr' ? 'Fra' : 'Eng'}</span>
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem
                  onClick={() => {
                    if (language !== 'fr') toggleLanguage();
                  }}
                  className="cursor-pointer"
                >
                  <span className="font-semibold">Français</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (language !== 'en') toggleLanguage();
                  }}
                  className="cursor-pointer"
                >
                  <span className="font-semibold">English</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bandeau orange en bas - collé directement au Header */}
      <TopBanner language={language} />
      
      {/* Bandeau garanties */}
      {!isDashboardPage && <GuaranteesBanner language={language} />}

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

    </header>
  );
}
