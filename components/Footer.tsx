
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import LegalNoticeModal from './LegalNoticeModal';

interface FooterProps {
  language: 'fr' | 'en' | 'it' | 'es' | 'zh';
  onLegalNoticeClick?: () => void;
  onRentalConditionsClick?: () => void;
}

type FooterLocale = 'fr' | 'en' | 'it' | 'es' | 'zh';

export default function Footer({ language }: FooterProps) {
  const pathname = usePathname();
  const isDashboardPage = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin') || pathname?.startsWith('/mes-');
  
  // Masquer le footer sur les pages admin/dashboard/mes-*
  if (isDashboardPage) return null;
  
  const [isLegalNoticeOpen, setIsLegalNoticeOpen] = useState(false);
  const [footerLocale, setFooterLocale] = useState<FooterLocale>(language);
  const modalLanguage: 'fr' | 'en' = footerLocale === 'fr' ? 'fr' : 'en';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const supportedLocales: FooterLocale[] = ['fr', 'en', 'it', 'es', 'zh'];
    const storedLocale = localStorage.getItem('preferredLocale') as FooterLocale | null;
    if (storedLocale && supportedLocales.includes(storedLocale)) {
      setFooterLocale(storedLocale);
    } else {
      setFooterLocale(language as FooterLocale);
    }
  }, [language]);

  const texts = {
    fr: {
      baseline: "Votre solution sono de dernière minute.",
      home: "Accueil",
      packs: "Packs",
      rentalConditions: "Conditions location",
      legalNotice: "Mentions légales",
      faq: "FAQ",
      zone: "Paris & Île-de-France",
      schedule: "24h/24 - 7j/7",
      phone: "07 44 78 27 54",
      whatsapp: "WhatsApp",
      email: "devisclients@guylocationevents.com",
      rights: " 2025 snd•rush. Tous droits réservés.",
      about: "À propos",
      address: "Adresse",
      parisAddress: "Paris, Île-de-France",
      quickLinks: "Liens rapides",
      privacyPolicy: "Mentions légales",
      terms: "Conditions de location",
      allRightsReserved: "Tous droits réservés",
      emergencyService: "Service d'urgence 24h/24 - 7j/7",
      followUs: "Suivez-nous"
    },
    en: {
      baseline: "Your last-minute sound solution.",
      home: "Home",
      packs: "Packs",
      rentalConditions: "Rental conditions",
      legalNotice: "Legal notice",
      faq: "FAQ",
      zone: "Paris & Île-de-France",
      schedule: "24/7",
      phone: "07 44 78 27 54",
      whatsapp: "WhatsApp",
      email: "devisclients@guylocationevents.com",
      rights: " 2025 snd•rush. All rights reserved.",
      about: "About",
      address: "Address",
      parisAddress: "Paris, Île-de-France",
      quickLinks: "Quick links",
      privacyPolicy: "Legal notice",
      terms: "Rental conditions",
      allRightsReserved: "All rights reserved",
      emergencyService: "24/7 emergency service",
      followUs: "Follow us"
    },
    it: {
      baseline: 'La tua soluzione audio last-minute.',
      home: 'Home',
      packs: 'Pack',
      rentalConditions: 'Condizioni di noleggio',
      legalNotice: 'Note legali',
      faq: 'FAQ',
      zone: 'Parigi e Ile-de-France',
      schedule: '24/7',
      phone: '07 44 78 27 54',
      whatsapp: 'WhatsApp',
      email: 'devisclients@guylocationevents.com',
      rights: ' 2025 snd•rush. Tutti i diritti riservati.',
      about: 'Chi siamo',
      address: 'Indirizzo',
      parisAddress: 'Parigi, Ile-de-France',
      quickLinks: 'Link rapidi',
      privacyPolicy: 'Note legali',
      terms: 'Condizioni di noleggio',
      allRightsReserved: 'Tutti i diritti riservati',
      emergencyService: 'Servizio urgenza 24/7',
      followUs: 'Seguici'
    },
    es: {
      baseline: 'Tu solucion de sonido de ultima hora.',
      home: 'Inicio',
      packs: 'Packs',
      rentalConditions: 'Condiciones de alquiler',
      legalNotice: 'Aviso legal',
      faq: 'FAQ',
      zone: 'Paris e Ile-de-France',
      schedule: '24/7',
      phone: '07 44 78 27 54',
      whatsapp: 'WhatsApp',
      email: 'devisclients@guylocationevents.com',
      rights: ' 2025 snd•rush. Todos los derechos reservados.',
      about: 'Acerca de',
      address: 'Direccion',
      parisAddress: 'Paris, Ile-de-France',
      quickLinks: 'Enlaces rapidos',
      privacyPolicy: 'Aviso legal',
      terms: 'Condiciones de alquiler',
      allRightsReserved: 'Todos los derechos reservados',
      emergencyService: 'Servicio de urgencia 24/7',
      followUs: 'Siguenos'
    },
    zh: {
      baseline: '您的紧急音响解决方案。',
      home: '首页',
      packs: '套餐',
      rentalConditions: '租赁条款',
      legalNotice: '法律声明',
      faq: '常见问题',
      zone: '巴黎与法兰西岛',
      schedule: '24/7',
      phone: '07 44 78 27 54',
      whatsapp: 'WhatsApp',
      email: 'devisclients@guylocationevents.com',
      rights: ' 2025 snd•rush. 保留所有权利。',
      about: '关于我们',
      address: '地址',
      parisAddress: '巴黎，法兰西岛',
      quickLinks: '快捷链接',
      privacyPolicy: '法律声明',
      terms: '租赁条款',
      allRightsReserved: '保留所有权利',
      emergencyService: '24/7 紧急服务',
      followUs: '关注我们'
    },
  };

  const footerTexts = {
    fr: {
      solutions: 'Découvrir',
      linkSolutions: 'Solutions',
      linkPromesse: 'Notre promesse',
      linkClients: 'Clients',
      linkEvenements: 'Nos événements',
      linkContact: 'Contact',
      catalogue: 'Catalogue',
      micros: 'Micros',
      speakers: 'Enceintes',
      mixingDesks: 'Tables de mixage',
      lights: 'Lumières',
      accessories: 'Accessoires',
      packs: 'Packs',
      contact: 'Contact',
      getQuote: 'Appeler'
    },
    en: {
      solutions: 'Discover',
      linkSolutions: 'Solutions',
      linkPromesse: 'Our promise',
      linkClients: 'Clients',
      linkEvenements: 'Our events',
      linkContact: 'Contact',
      catalogue: 'Catalogue',
      micros: 'Microphones',
      speakers: 'Speakers',
      mixingDesks: 'Mixing desks',
      lights: 'Lights',
      accessories: 'Accessories',
      packs: 'Packs',
      contact: 'Contact',
      getQuote: 'Call'
    },
    it: {
      solutions: 'Scopri',
      linkSolutions: 'Soluzioni',
      linkPromesse: 'La nostra promessa',
      linkClients: 'Clienti',
      linkEvenements: 'I nostri eventi',
      linkContact: 'Contact',
      catalogue: 'Catalogo',
      micros: 'Microfoni',
      speakers: 'Diffusori',
      mixingDesks: 'Mixer',
      lights: 'Luci',
      accessories: 'Accessori',
      packs: 'Pack',
      contact: 'Contatto',
      getQuote: 'Chiama'
    },
    es: {
      solutions: 'Descubrir',
      linkSolutions: 'Soluciones',
      linkPromesse: 'Nuestra promesa',
      linkClients: 'Clientes',
      linkEvenements: 'Nuestros eventos',
      linkContact: 'Contact',
      catalogue: 'Catalogo',
      micros: 'Microfonos',
      speakers: 'Altavoces',
      mixingDesks: 'Mesas de mezcla',
      lights: 'Luces',
      accessories: 'Accesorios',
      packs: 'Packs',
      contact: 'Contacto',
      getQuote: 'Llamar'
    },
    zh: {
      solutions: '探索',
      linkSolutions: '解决方案',
      linkPromesse: '我们的承诺',
      linkClients: '客户',
      linkEvenements: '近期活动',
      linkContact: '联系',
      catalogue: '目录',
      micros: '麦克风',
      speakers: '音箱',
      mixingDesks: '调音台',
      lights: '灯光',
      accessories: '配件',
      packs: '套餐',
      contact: '联系我们',
      getQuote: '电话咨询'
    },
  };

  const currentFooterTexts = footerTexts[footerLocale];

  return (
    <>
      <footer className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Logo et baseline */}
            <div className="space-y-4">
              <Link href="/" className="inline-block">
                <span className="text-3xl font-bold tracking-tight">
                  <span className="text-[#F2431E]">SoundRush</span>
                  <span className="text-white"> Paris</span>
                </span>
              </Link>
              <p className="text-gray-300 text-sm">
                {texts[footerLocale].baseline}
              </p>
              <a
                href="tel:+33744782754"
                className="inline-block bg-[#F2431E] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#E63A1A] transition-colors mt-4"
              >
                {currentFooterTexts.getQuote}
              </a>
            </div>

            {/* Découvrir - Liens vers les sections de la homepage */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                {currentFooterTexts.solutions}
              </h3>
              <nav className="flex flex-col space-y-2">
                <Link href="/#solutions" className="text-gray-300 hover:text-[#F2431E] transition-colors text-sm">
                  {currentFooterTexts.linkSolutions}
                </Link>
                <Link href="/#promesse" className="text-gray-300 hover:text-[#F2431E] transition-colors text-sm">
                  {currentFooterTexts.linkPromesse}
                </Link>
                <Link href="/#trusted" className="text-gray-300 hover:text-[#F2431E] transition-colors text-sm">
                  {currentFooterTexts.linkClients}
                </Link>
                <Link href="/#recent-events" className="text-gray-300 hover:text-[#F2431E] transition-colors text-sm">
                  {currentFooterTexts.linkEvenements}
                </Link>
                <Link href="/#contact" className="text-gray-300 hover:text-[#F2431E] transition-colors text-sm">
                  {currentFooterTexts.linkContact}
                </Link>
              </nav>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                {currentFooterTexts.contact}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-phone-line text-[#F2431E]"></i>
                  </div>
                  <a href="tel:+33744782754" className="text-gray-300 hover:text-white transition-colors text-sm cursor-pointer">
                    {texts[footerLocale].phone}
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-mail-line text-[#F2431E]"></i>
                  </div>
                  <a href="mailto:devisclients@guylocationevents.com" className="text-gray-300 hover:text-white transition-colors text-sm cursor-pointer">
                    {texts[footerLocale].email}
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-map-pin-line text-[#F2431E]"></i>
                  </div>
                  <span className="text-gray-300 text-sm">{texts[footerLocale].parisAddress}</span>
                </div>
                {/* Social Media Icons */}
                <div className="flex items-center space-x-3 pt-2">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <a 
                      href="https://www.facebook.com/sndrush/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#F2431E] hover:text-[#E63A1A] transition-colors"
                      aria-label="Facebook"
                    >
                      <i className="ri-facebook-line"></i>
                    </a>
                  </div>
                  <div className="w-4 h-4 flex items-center justify-center">
                    <a 
                      href="https://www.instagram.com/sndrush/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#F2431E] hover:text-[#E63A1A] transition-colors"
                      aria-label="Instagram"
                    >
                      <i className="ri-instagram-line"></i>
                    </a>
                  </div>
                  <div className="w-4 h-4 flex items-center justify-center">
                    <a 
                      href="https://www.tiktok.com/@snd.rush" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#F2431E] hover:text-[#E63A1A] transition-colors"
                      aria-label="TikTok"
                    >
                      <i className="ri-tiktok-line"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Moyens de paiement */}
          <div className="mt-2 pt-2 border-t border-gray-800">
            <div className="w-full px-2 sm:px-4 flex justify-center gap-2 md:gap-4 lg:gap-6">
              <Image
                src="/pay.png"
                alt="Moyens de paiement acceptés"
                width={250}
                height={30}
                className="max-w-[250px] h-auto opacity-90"
                style={{ width: '250px', height: 'auto' }}
                priority
              />
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-4 border-t border-gray-800">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
              <p className="text-gray-400 text-sm">
                © 2025 <span className="text-[#F2431E]">SoundRush</span><span className="text-white"> Paris</span> - Tous droits réservés.
              </p>
              <div className="flex items-center gap-4 md:gap-6">
                <Link 
                  href="/cgv"
                  className="text-gray-400 hover:text-[#F2431E] transition-colors text-sm"
                >
                  {texts[footerLocale].terms}
                </Link>
                <Link 
                  href="/mentions-legales"
                  className="text-gray-400 hover:text-[#F2431E] transition-colors text-sm"
                >
                  {texts[footerLocale].privacyPolicy}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>


      <LegalNoticeModal
        isOpen={isLegalNoticeOpen}
        onClose={() => setIsLegalNoticeOpen(false)}
        language={modalLanguage}
      />
    </>
  );
}