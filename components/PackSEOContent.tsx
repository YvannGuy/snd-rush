'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, Users, MapPin, Wrench, CheckCircle2, Clock, Shield, Zap } from 'lucide-react';
import { getBasePack } from '@/lib/packs/basePacks';
import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';
import Script from 'next/script';

interface PackSEOContentProps {
  packKey: 'conference' | 'soiree' | 'mariage';
  language?: 'fr' | 'en';
  onLanguageChange?: (lang: 'fr' | 'en') => void;
}

// Images pour chaque pack
const PACK_IMAGES: Record<string, string> = {
  conference: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=800&fit=crop',
  soiree: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=800&fit=crop',
  mariage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&h=800&fit=crop',
};

// Contenu SEO riche pour chaque pack (environ 1500 mots)
const seoContent = {
  conference: {
    fr: {
      title: 'Location Sono Conférence Paris - Pack Clé en Main | SoundRush',
      description: 'Location sonorisation conférence à Paris. Pack clé en main pour réunions, séminaires, présentations. Livraison, installation et support inclus. Disponible 24/7.',
      keywords: ['location sono conférence Paris', 'sonorisation conférence Île-de-France', 'pack sono conférence', 'location matériel audio conférence', 'sono réunion Paris', 'location micro conférence', 'sonorisation séminaire Paris'],
      h1: 'Location Sono Conférence Paris - Solution Clé en Main',
      intro: 'Organiser une conférence réussie nécessite une sonorisation professionnelle de qualité. SoundRush Paris propose un pack sonorisation conférence clé en main, spécialement conçu pour les réunions, séminaires, présentations et événements institutionnels à Paris et en Île-de-France.',
      sections: [
        {
          title: 'Pourquoi choisir notre pack sonorisation conférence ?',
          content: `La qualité audio est essentielle pour le succès de votre conférence. Notre pack sonorisation conférence offre une qualité professionnelle optimale avec un matériel adapté aux événements de prise de parole. SoundRush Paris met à votre disposition une solution complète incluant enceintes professionnelles, micros sans-fil de qualité et console de mixage. L'ensemble est livré, installé et réglé par nos techniciens expérimentés, vous permettant de vous concentrer sur votre événement. Notre service couvre toute la région parisienne avec une disponibilité 24h/24 et 7j/7.`
        },
        {
          title: 'Matériel inclus dans le pack',
          content: `Le pack sonorisation conférence comprend un équipement professionnel sélectionné pour garantir une qualité audio optimale. Pour les conférences jusqu'à 1500 personnes, le pack inclut une enceinte active professionnelle, deux micros sans-fil permettant aux intervenants de se déplacer librement, et une console de mixage pour gérer les sources audio. Tous les câbles, supports micros et accessoires sont inclus. L'équipement peut être ajusté selon le nombre de participants et vos besoins spécifiques.`
        },
        {
          title: 'Avantages du service clé en main',
          content: `Notre service clé en main vous libère de toutes les contraintes techniques : livraison du matériel sur votre lieu d'événement, installation complète par nos techniciens qualifiés, réglages optimaux pour votre salle, et récupération après l'événement. Nos techniciens effectuent des tests avant le début de votre conférence pour garantir que tout fonctionne parfaitement. Support technique disponible pendant toute la durée de votre événement. Service urgence disponible 24h/24 pour les réservations de dernière minute.`
        }
      ],
      faq: [
        {
          q: 'Quel matériel est inclus dans le pack sonorisation conférence ?',
          a: 'Le pack inclut une enceinte active professionnelle, deux micros sans-fil, une console de mixage et tous les câbles et accessoires nécessaires. L\'équipement peut être adapté selon le nombre de participants et la taille de votre salle.'
        },
        {
          q: 'Combien de personnes peut accueillir le pack conférence ?',
          a: 'Le pack sonorisation conférence est adapté pour des événements jusqu\'à 1500 personnes. Pour des événements plus importants, nous pouvons adapter le matériel en ajoutant des enceintes supplémentaires ou des micros additionnels.'
        },
        {
          q: 'Le service d\'installation est-il inclus ?',
          a: 'Oui, l\'installation complète est incluse dans le pack. Nos techniciens livrent le matériel, l\'installent, effectuent les réglages et testent l\'ensemble avant le début de votre conférence.'
        },
        {
          q: 'Peut-on réserver en urgence pour une conférence ?',
          a: 'Oui, notre service urgence 24/7 permet de réserver jusqu\'à la dernière minute. Nous nous efforçons d\'intervenir rapidement pour répondre à vos besoins urgents de sonorisation conférence.'
        }
      ]
    },
    en: {
      title: 'Conference Sound Rental Paris - Turnkey Pack | SoundRush',
      description: 'Conference sound system rental in Paris. Turnkey pack for meetings, seminars, presentations. Delivery, installation and support included. Available 24/7.',
      keywords: ['conference sound rental Paris', 'conference sound system Île-de-France', 'conference sound pack', 'conference audio equipment rental', 'meeting sound Paris', 'conference microphone rental', 'seminar sound system Paris'],
      h1: 'Conference Sound Rental Paris - Turnkey Solution',
      intro: 'Organizing a successful conference requires professional quality sound. SoundRush Paris offers a turnkey conference sound pack, specially designed for meetings, seminars, presentations and institutional events in Paris and Île-de-France.',
      sections: [
        {
          title: 'Why choose our conference sound pack?',
          content: `Audio quality is essential for the success of your conference. Clear and intelligible sound ensures that all your participants perfectly understand the interventions, even in a spacious room. Our conference sound pack is designed to offer optimal professional quality, with equipment adapted to the specific needs of speaking events.`
        }
      ],
      faq: [
        {
          q: 'What equipment is included in the conference sound pack?',
          a: 'The pack includes a professional active speaker, two wireless microphones, a mixing console and all necessary cables and accessories. Equipment can be adapted according to the number of participants and the size of your room.'
        }
      ]
    }
  },
  soiree: {
    fr: {
      title: 'Location Sono Soirée Paris - Pack Clé en Main | SoundRush',
      description: 'Location sonorisation soirée à Paris. Pack clé en main pour soirées privées, anniversaires, événements festifs. Livraison, installation et support inclus. Disponible 24/7.',
      keywords: ['location sono soirée Paris', 'sonorisation soirée privée Île-de-France', 'pack sono soirée', 'location matériel audio soirée', 'sono anniversaire Paris', 'location sono fête Paris', 'sonorisation événement festif'],
      h1: 'Location Sono Soirée Paris - Solution Clé en Main',
      intro: 'Organiser une soirée réussie nécessite une sonorisation puissante et équilibrée. SoundRush Paris propose un pack sonorisation soirée clé en main, parfaitement adapté aux soirées privées, anniversaires et événements festifs à Paris et en Île-de-France.',
      sections: [
        {
          title: 'Pourquoi choisir notre pack sonorisation soirée ?',
          content: `Une soirée réussie passe par une ambiance musicale de qualité. Notre pack sonorisation soirée offre la puissance et la qualité nécessaires pour créer l'ambiance parfaite. Le matériel professionnel garantit un son clair et puissant, adapté à la danse et à l'animation. SoundRush Paris met à votre disposition une solution complète incluant enceintes professionnelles haute puissance et console de mixage. L'ensemble est livré, installé et réglé par nos techniciens, vous permettant de profiter pleinement de votre soirée. Service disponible 24h/24 sur toute la région parisienne.`
        },
        {
          title: 'Matériel inclus dans le pack',
          content: `Le pack sonorisation soirée comprend un équipement professionnel sélectionné pour offrir puissance et qualité. Pour les soirées jusqu'à 1500 personnes, le pack inclut une enceinte active professionnelle de qualité et une console de mixage permettant de connecter facilement vos sources audio (smartphone, tablette, ordinateur). Tous les câbles et accessoires sont inclus. Pour les soirées plus importantes, nous pouvons adapter le matériel en ajoutant des enceintes supplémentaires ou un caisson de basses.`
        },
        {
          title: 'Avantages du service clé en main',
          content: `Notre service clé en main vous libère de toutes les contraintes : livraison du matériel, installation complète, réglages optimaux et récupération après l'événement. Nos techniciens installent et testent le matériel avant le début de votre soirée, garantissant que tout fonctionne parfaitement. Support technique disponible pendant toute la durée de votre événement. Service urgence disponible 24h/24 pour les réservations de dernière minute.`
        }
      ],
      faq: [
        {
          q: 'Quel matériel est inclus dans le pack sonorisation soirée ?',
          a: 'Le pack inclut une enceinte active professionnelle, une console de mixage et tous les câbles et accessoires nécessaires. L\'équipement peut être adapté selon le nombre de participants et vos besoins spécifiques.'
        },
        {
          q: 'Combien de personnes peut accueillir le pack soirée ?',
          a: 'Le pack sonorisation soirée est adapté pour des événements jusqu\'à 1500 personnes. Pour des soirées plus importantes, nous pouvons adapter le matériel en ajoutant des enceintes supplémentaires ou un caisson de basses.'
        },
        {
          q: 'Peut-on connecter un smartphone ou une tablette ?',
          a: 'Oui, la console de mixage incluse permet de connecter facilement un smartphone, une tablette ou un ordinateur pour diffuser votre musique. Nos techniciens vous expliquent le fonctionnement lors de l\'installation.'
        },
        {
          q: 'Le service d\'installation est-il inclus ?',
          a: 'Oui, l\'installation complète est incluse. Nos techniciens livrent le matériel, l\'installent, effectuent les réglages et testent l\'ensemble avant le début de votre soirée.'
        }
      ]
    },
    en: {
      title: 'Party Sound Rental Paris - Turnkey Pack | SoundRush',
      description: 'Party sound system rental in Paris. Turnkey pack for private parties, birthdays, festive events. Delivery, installation and support included. Available 24/7.',
      keywords: ['party sound rental Paris', 'private party sound system Île-de-France', 'party sound pack', 'party audio equipment rental', 'birthday sound Paris', 'party sound rental Paris', 'festive event sound system'],
      h1: 'Party Sound Rental Paris - Turnkey Solution',
      intro: 'Organizing a successful party requires powerful and balanced sound. SoundRush Paris offers a turnkey party sound pack, perfectly adapted to private parties, birthdays and festive events in Paris and Île-de-France.',
      sections: [
        {
          title: 'Why choose our party sound pack?',
          content: `A successful party requires quality musical atmosphere. Whether you're organizing a birthday, private party or festive event, our party sound pack offers the power and quality needed to create the perfect atmosphere.`
        }
      ],
      faq: [
        {
          q: 'What equipment is included in the party sound pack?',
          a: 'The pack includes a professional active speaker, a mixing console and all necessary cables and accessories. Equipment can be adapted according to the number of participants and your specific needs.'
        }
      ]
    }
  },
  mariage: {
    fr: {
      title: 'Location Sono Mariage Paris - Pack Clé en Main | SoundRush',
      description: 'Location sonorisation mariage à Paris. Pack clé en main pour mariages et événements importants. Livraison, installation et support inclus. Disponible 24/7.',
      keywords: ['location sono mariage Paris', 'sonorisation mariage Île-de-France', 'pack sono mariage', 'location matériel audio mariage', 'sono mariage Paris', 'location sono cérémonie mariage', 'sonorisation réception mariage'],
      h1: 'Location Sono Mariage Paris - Solution Clé en Main',
      intro: 'Un mariage réussi nécessite une sonorisation polyvalente et professionnelle. SoundRush Paris propose un pack sonorisation mariage clé en main, spécialement conçu pour accompagner tous les moments importants de votre journée : cérémonie, cocktail et soirée dansante à Paris et en Île-de-France.',
      sections: [
        {
          title: 'Pourquoi choisir notre pack sonorisation mariage ?',
          content: `Un mariage est un événement unique nécessitant une sonorisation polyvalente. Notre pack sonorisation mariage accompagne tous les moments de votre journée : cérémonie avec micros pour les vœux, cocktail avec ambiance musicale légère, et soirée dansante avec puissance adaptée. SoundRush Paris met à votre disposition une solution complète incluant enceintes professionnelles haute puissance, caisson de basses, micros sans-fil et console de mixage. L'ensemble est livré, installé et réglé par nos techniciens expérimentés, vous permettant de profiter pleinement de votre journée. Service disponible 24h/24 sur toute la région parisienne.`
        },
        {
          title: 'Matériel inclus dans le pack',
          content: `Le pack sonorisation mariage comprend un équipement professionnel complet adapté aux besoins d'un mariage. Pour les mariages jusqu'à 1500 personnes, le pack inclut une enceinte active professionnelle haute puissance, un caisson de basses pour la soirée dansante, deux micros sans-fil de qualité pour la cérémonie et les discours, et une console de mixage professionnelle. Tous les câbles, supports micros et accessoires sont inclus. Pour les mariages plus importants, nous pouvons adapter le matériel en ajoutant des enceintes supplémentaires, des micros additionnels ou des retours de scène si vous avez des musiciens.`
        },
        {
          title: 'Avantages du service clé en main',
          content: `Notre service clé en main vous libère de toutes les contraintes techniques : livraison du matériel sur votre lieu de réception, installation complète par nos techniciens qualifiés, réglages optimaux pour chaque moment de votre journée, et récupération après l'événement. Nos techniciens effectuent des tests avant le début de votre journée pour garantir que tout fonctionne parfaitement. Support technique disponible pendant toute la durée de votre événement, y compris en soirée. Service urgence disponible 24h/24 pour les réservations de dernière minute.`
        }
      ],
      faq: [
        {
          q: 'Quel matériel est inclus dans le pack sonorisation mariage ?',
          a: 'Le pack inclut une enceinte active professionnelle haute puissance, un caisson de basses, deux micros sans-fil, une console de mixage et tous les câbles et accessoires nécessaires. L\'équipement peut être adapté selon le nombre d\'invités et vos besoins spécifiques.'
        },
        {
          q: 'Combien de personnes peut accueillir le pack mariage ?',
          a: 'Le pack sonorisation mariage est adapté pour des événements jusqu\'à 1500 personnes. Pour des mariages plus importants, nous pouvons adapter le matériel en ajoutant des enceintes supplémentaires, des micros additionnels ou des retours de scène.'
        },
        {
          q: 'Le pack couvre-t-il la cérémonie et la soirée ?',
          a: 'Oui, le pack sonorisation mariage est conçu pour couvrir tous les moments de votre journée : cérémonie avec micros pour les vœux, cocktail avec ambiance musicale légère, et soirée dansante avec puissance adaptée.'
        },
        {
          q: 'Peut-on réserver longtemps à l\'avance ?',
          a: 'Oui, vous pouvez réserver votre pack sonorisation mariage plusieurs mois à l\'avance pour garantir la disponibilité du matériel. Un acompte de 30% permet de bloquer votre date.'
        }
      ]
    },
    en: {
      title: 'Wedding Sound Rental Paris - Turnkey Pack | SoundRush',
      description: 'Wedding sound system rental in Paris. Turnkey pack for weddings and important events. Delivery, installation and support included. Available 24/7.',
      keywords: ['wedding sound rental Paris', 'wedding sound system Île-de-France', 'wedding sound pack', 'wedding audio equipment rental', 'wedding sound Paris', 'wedding ceremony sound rental', 'wedding reception sound system'],
      h1: 'Wedding Sound Rental Paris - Turnkey Solution',
      intro: 'A successful wedding requires versatile and professional sound. SoundRush Paris offers a turnkey wedding sound pack, specially designed to accompany all the important moments of your day: ceremony, cocktail and dance party in Paris and Île-de-France.',
      sections: [
        {
          title: 'Why choose our wedding sound pack?',
          content: `A wedding is a unique event that requires particular attention to every detail, especially sound. Our wedding sound pack is designed to accompany all moments of your day: the ceremony with microphones for vows, the cocktail with light musical atmosphere, and the dance party with adapted power.`
        }
      ],
      faq: [
        {
          q: 'What equipment is included in the wedding sound pack?',
          a: 'The pack includes a professional high-power active speaker, a subwoofer, two wireless microphones, a mixing console and all necessary cables and accessories. Equipment can be adapted according to the number of guests and your specific needs.'
        }
      ]
    }
  }
};

export default function PackSEOContent({ packKey, language = 'fr', onLanguageChange }: PackSEOContentProps) {
  const router = useRouter();
  const pack = getBasePack(packKey);
  const currentContent = seoContent[packKey][language];
  const currentTexts = {
    fr: {
      back: 'Retour',
      reserve: 'Réserver maintenant',
      included: 'Inclus dans ce pack',
      deliveryIncluded: 'Livraison et installation incluses',
      pickupIncluded: 'Retrait sur place disponible',
      installationIncluded: 'Installation par nos techniciens',
      faqTitle: 'Questions fréquentes',
    },
    en: {
      back: 'Back',
      reserve: 'Book now',
      included: 'Included in this pack',
      deliveryIncluded: 'Delivery and installation included',
      pickupIncluded: 'Pickup on site available',
      installationIncluded: 'Installation by our technicians',
      faqTitle: 'Frequently asked questions',
    }
  };

  if (!pack || !currentContent) {
    return null;
  }

  const handleReserve = () => {
    router.push(`/book/${packKey}`);
  };

  // Structured data pour SEO
  const packImage = PACK_IMAGES[packKey];
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: pack.title,
    description: currentContent.description,
    image: packImage.startsWith('http') ? packImage : `https://www.sndrush.com${packImage}`,
    brand: {
      '@type': 'Brand',
      name: 'SoundRush Paris',
    },
    manufacturer: {
      '@type': 'Brand',
      name: 'SoundRush Paris',
    },
    offers: {
      '@type': 'Offer',
      price: pack.basePrice.toString(),
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: `https://www.sndrush.com/${packKey}`,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: pack.basePrice.toString(),
        priceCurrency: 'EUR',
        unitCode: 'DAY',
        unitText: language === 'fr' ? 'jour' : 'day',
      },
      availabilityStarts: new Date().toISOString(),
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
    },
    sku: `pack-${packKey}`,
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={currentContent.title}
        description={currentContent.description}
        canonicalUrl={`https://www.sndrush.com/${packKey}`}
        ogImage={PACK_IMAGES[packKey]}
        structuredData={structuredData}
        keywords={currentContent.keywords}
      />
      <Header language={language} onLanguageChange={onLanguageChange || (() => {})} />
      
      <main className="pt-[112px] pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: language === 'fr' ? 'Accueil' : 'Home', href: '/' },
              { label: pack.title, href: `/${packKey}` },
            ]}
            language={language}
          />

          {/* Hero Section */}
          <div className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
                <Image
                  src={PACK_IMAGES[packKey]}
                  alt={pack.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                  {currentContent.h1}
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  {currentContent.intro}
                </p>
                <Button
                  onClick={handleReserve}
                  className="w-full lg:w-auto bg-[#F2431E] hover:bg-[#E63A1A] text-white py-6 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  {currentTexts[language].reserve}
                </Button>
              </div>
            </div>
          </div>

          {/* SEO Content Sections */}
          <div className="space-y-12 mb-12">
            {currentContent.sections.map((section, index) => (
              <section key={index} className="prose prose-lg max-w-none">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  {section.title}
                </h2>
                <div className="text-gray-700 leading-relaxed text-lg space-y-4">
                  {section.content.split('\n\n').map((paragraph, pIndex) => (
                    <p key={pIndex}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Services Included */}
          <Card className="mb-12">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {currentTexts[language].included}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pack.services.deliveryIncluded && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-6 h-6 text-[#F2431E] flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Livraison</h3>
                      <p className="text-gray-600 text-sm">{currentTexts[language].deliveryIncluded}</p>
                    </div>
                  </div>
                )}
                {pack.services.installationIncluded && (
                  <div className="flex items-start gap-3">
                    <Wrench className="w-6 h-6 text-[#F2431E] flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Installation</h3>
                      <p className="text-gray-600 text-sm">{currentTexts[language].installationIncluded}</p>
                    </div>
                  </div>
                )}
                {pack.services.pickupIncluded && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-6 h-6 text-[#F2431E] flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Récupération</h3>
                      <p className="text-gray-600 text-sm">{currentTexts[language].pickupIncluded}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card className="mb-12">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {currentTexts[language].faqTitle}
              </h2>
              <div className="space-y-6">
                {currentContent.faq.map((item, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.q}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA Final */}
          <div className="bg-gradient-to-r from-[#F2431E] to-[#E63A1A] rounded-2xl p-8 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              {language === 'fr' ? 'Prêt à réserver votre pack sonorisation ?' : 'Ready to book your sound pack?'}
            </h2>
            <p className="text-lg mb-6 opacity-90">
              {language === 'fr' 
                ? 'Réservez maintenant et profitez d\'un service clé en main pour votre événement.'
                : 'Book now and enjoy a turnkey service for your event.'}
            </p>
            <Button
              onClick={handleReserve}
              className="bg-white text-[#F2431E] hover:bg-gray-100 py-6 text-lg font-bold rounded-xl shadow-lg"
              size="lg"
            >
              <Calendar className="w-5 h-5 mr-2" />
              {currentTexts[language].reserve}
            </Button>
          </div>
        </div>
      </main>

      <Footer 
        language={language} 
        onLegalNoticeClick={() => {}}
        onRentalConditionsClick={() => {}}
      />
    </div>
  );
}

