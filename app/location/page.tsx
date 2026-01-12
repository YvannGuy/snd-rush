'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, MapPin, Clock, Shield, Zap, Package, Wrench, Users } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';
import Image from 'next/image';

const seoContent = {
  fr: {
    title: 'Location Matériel Sonore Paris - SoundRush 24/7 | Catalogue Complet',
    description: 'Location de matériel sonore professionnel à Paris et Île-de-France. Enceintes, micros, consoles, éclairage. Service clé en main avec livraison et installation. Disponible 24h/24.',
    keywords: [
      'location matériel sonore Paris',
      'location sono Paris',
      'location enceinte Paris',
      'location micro Paris',
      'location console mixage Paris',
      'location matériel audio professionnel',
      'location sono Île-de-France',
      'location matériel sonore avec livraison',
      'location sono professionnelle Paris',
      'location matériel audio événement',
    ],
    h1: 'Location Matériel Sonore Paris - SoundRush 24/7',
    intro: 'SoundRush Paris propose la location de matériel sonore professionnel à Paris et en Île-de-France. Enceintes, micros, consoles de mixage, éclairage : découvrez notre catalogue complet et bénéficiez d\'un service clé en main avec livraison, installation et support technique inclus.',
    sections: [
      {
        title: 'Notre catalogue de location matériel sonore',
        content: `SoundRush Paris met à votre disposition un large catalogue de matériel sonore professionnel disponible à la location. Que vous ayez besoin d'enceintes pour une soirée, de micros pour une conférence, ou d'une console de mixage pour un événement, nous avons l'équipement adapté à vos besoins.

Notre catalogue inclut des enceintes actives et passives de différentes puissances, adaptées à tous types d'événements. Les micros disponibles incluent des modèles filaires et sans-fil, parfaits pour les prises de parole et les animations. Nos consoles de mixage professionnelles permettent de gérer facilement toutes vos sources audio.

L'éclairage LED et les effets lumineux complètent notre offre pour créer une ambiance complète. Tous nos équipements sont régulièrement entretenus et testés pour garantir une qualité professionnelle constante. Chaque location inclut tous les câbles et accessoires nécessaires pour une utilisation immédiate.`
      },
      {
        title: 'Pourquoi louer plutôt qu\'acheter du matériel sonore ?',
        content: `La location de matériel sonore présente de nombreux avantages par rapport à l'achat. Pas d'investissement initial important : vous payez uniquement pour la durée d'utilisation. Le matériel est toujours à jour : nous renouvelons régulièrement notre parc avec les dernières technologies.

La maintenance et les réparations sont incluses dans notre service. Vous n'avez pas à vous soucier de l'entretien ou des pannes. La flexibilité est un autre avantage majeur : vous adaptez le matériel selon vos besoins spécifiques pour chaque événement, sans être limité par un équipement fixe.

Pour les événements ponctuels, la location est la solution la plus économique. Vous bénéficiez d'un matériel professionnel de qualité sans l'investissement et les contraintes de l'achat. Notre service clé en main inclut également la livraison, l'installation et la récupération, vous faisant gagner un temps précieux.`
      },
      {
        title: 'Nos zones de livraison à Paris et Île-de-France',
        content: `SoundRush Paris couvre toute la région parisienne et l'Île-de-France pour la location de matériel sonore. Nous intervenons à Paris intra-muros (tous les arrondissements), dans la petite couronne (Hauts-de-Seine 92, Seine-Saint-Denis 93, Val-de-Marne 94), et dans la grande couronne (Yvelines 78, Essonne 91, Seine-et-Marne 77, Val-d'Oise 95).

Les tarifs de livraison varient selon la zone géographique, avec des prix transparents affichés lors de la réservation. Paris intra-muros bénéficie d'un tarif de base, tandis que les zones périphériques incluent des frais de transport adaptés. Tous les prix sont indiqués TTC et incluent la livraison, l'installation et la récupération du matériel.

Notre service est disponible 24h/24 et 7j/7, y compris les weekends et jours fériés. Cette disponibilité permanente vous permet de réserver même en urgence, avec une intervention rapide garantie. Pour les événements de dernière minute, notre équipe s'organise pour répondre à votre demande dans les meilleurs délais.`
      },
      {
        title: 'Types de location disponibles',
        content: `SoundRush Paris propose différents types de location adaptés à vos besoins. La location à la journée est idéale pour les événements ponctuels : vous réservez le matériel pour une journée complète avec livraison le matin et récupération le lendemain.

La location week-end offre un tarif avantageux pour les événements sur deux jours, parfaits pour les mariages ou les événements festifs. La location longue durée est disponible pour les projets nécessitant du matériel sur plusieurs semaines ou mois, avec des tarifs dégressifs selon la durée.

Notre service urgence 24/7 permet de réserver jusqu'à la dernière minute pour les besoins immédiats. Que vous ayez un événement qui se décide rapidement ou un problème technique de dernière minute, nous intervenons rapidement pour répondre à votre demande.`
      },
      {
        title: 'Processus de location simplifié',
        content: `Réserver du matériel sonore chez SoundRush Paris est simple et rapide. Sur notre site, vous parcourez notre catalogue, sélectionnez les équipements dont vous avez besoin, indiquez la date et l'heure de votre événement, ainsi que le lieu de livraison. Notre système calcule automatiquement le prix selon votre zone géographique.

Un acompte de 30% permet de bloquer votre date et de garantir la disponibilité du matériel. Le solde est demandé 1 jour avant votre événement, vous laissant le temps nécessaire pour finaliser les derniers détails. La réservation peut être effectuée en ligne en quelques minutes, avec confirmation immédiate.

Notre équipe vous contacte ensuite pour confirmer les détails de votre location et s'assurer que nous avons toutes les informations nécessaires. Le jour de l'événement, nos techniciens arrivent à l'heure convenue pour livrer, installer et tester le matériel avant le début de votre événement.`
      },
      {
        title: 'Avantages de notre service de location',
        content: `Choisir SoundRush Paris pour la location de matériel sonore présente de nombreux avantages. Notre service clé en main vous libère de toutes les contraintes : livraison du matériel directement sur votre lieu d'événement, installation complète par nos techniciens qualifiés, réglages optimaux selon vos besoins, et récupération après l'événement.

Nos techniciens expérimentés connaissent parfaitement le matériel et effectuent des tests avant le début de votre événement pour garantir que tout fonctionne parfaitement. En cas de besoin, notre support technique est disponible pendant toute la durée de votre location. La flexibilité de notre service vous permet de réserver jusqu'à la dernière minute, avec un service urgence disponible 24h/24.

Tous nos prix sont transparents et incluent la livraison, l'installation et la récupération. Nous adaptons également notre offre selon vos besoins spécifiques : équipements additionnels, configurations spéciales, ou solutions sur mesure pour des événements particuliers.`
      }
    ],
    faq: [
      {
        q: 'Quels sont les tarifs de location du matériel sonore ?',
        a: 'Les tarifs varient selon le type de matériel et la durée de location. Nos prix sont transparents et affichés sur notre site lors de la sélection. Tous les prix incluent la livraison, l\'installation et la récupération. Contactez-nous pour un devis personnalisé selon vos besoins spécifiques.'
      },
      {
        q: 'La livraison est-elle incluse dans le prix de location ?',
        a: 'Oui, la livraison et la récupération sont incluses dans tous nos tarifs de location. Nos techniciens livrent le matériel directement sur votre lieu d\'événement, l\'installent et le récupèrent après utilisation. Les tarifs varient selon la zone géographique (Paris intra-muros, petite couronne, grande couronne).'
      },
      {
        q: 'Peut-on louer du matériel pour plusieurs jours ?',
        a: 'Oui, nous proposons des locations à la journée, au week-end ou en longue durée. Les tarifs sont adaptés selon la durée de location, avec des avantages pour les locations longues durées. Contactez-nous pour connaître les tarifs dégressifs selon vos besoins.'
      },
      {
        q: 'Y a-t-il une caution à prévoir pour la location ?',
        a: 'Pour nos packs clé en main, aucune caution n\'est requise. Pour la location à la carte de matériel spécifique, une caution peut être demandée selon le type d\'équipement. Tous les détails sont indiqués lors de la réservation.'
      },
      {
        q: 'Le matériel est-il garanti en cas de panne ?',
        a: 'Oui, tous nos équipements sont régulièrement entretenus et testés. En cas de problème technique pendant votre location, notre support technique intervient rapidement pour résoudre le problème ou remplacer le matériel défectueux. Notre service urgence 24/7 garantit une intervention rapide.'
      },
      {
        q: 'Peut-on réserver en urgence pour une location ?',
        a: 'Oui, notre service urgence 24/7 permet de réserver jusqu\'à la dernière minute. Nous nous efforçons d\'intervenir rapidement pour répondre à vos besoins urgents de location de matériel sonore. Contactez-nous par téléphone pour les réservations de dernière minute.'
      },
      {
        q: 'Quelle zone géographique couvrez-vous pour la livraison ?',
        a: 'Nous couvrons toute la région parisienne et l\'Île-de-France : Paris intra-muros, petite couronne (92, 93, 94) et grande couronne (77, 78, 91, 95). Les tarifs de livraison varient selon la zone, avec des prix transparents affichés lors de la réservation.'
      }
    ]
  },
  en: {
    title: 'Sound Equipment Rental Paris - SoundRush 24/7 | Complete Catalog',
    description: 'Professional sound equipment rental in Paris and Île-de-France. Speakers, microphones, mixing consoles, lighting. Turnkey service with delivery and installation. Available 24/7.',
    keywords: [
      'sound equipment rental Paris',
      'sound system rental Paris',
      'speaker rental Paris',
      'microphone rental Paris',
      'mixing console rental Paris',
      'professional audio equipment rental',
      'sound rental Île-de-France',
      'sound equipment rental with delivery',
      'professional sound rental Paris',
      'audio equipment rental event',
    ],
    h1: 'Sound Equipment Rental Paris - SoundRush 24/7',
    intro: 'SoundRush Paris offers professional sound equipment rental in Paris and Île-de-France. Speakers, microphones, mixing consoles, lighting: discover our complete catalog and benefit from a turnkey service with delivery, installation and technical support included.',
    sections: [
      {
        title: 'Our sound equipment rental catalog',
        content: `SoundRush Paris provides a wide catalog of professional sound equipment available for rental. Whether you need speakers for a party, microphones for a conference, or a mixing console for an event, we have the equipment adapted to your needs.`
      },
      {
        title: 'Why rent rather than buy sound equipment?',
        content: `Renting sound equipment offers many advantages over buying. No major initial investment: you only pay for the duration of use. Equipment is always up to date: we regularly renew our fleet with the latest technologies.`
      },
      {
        title: 'Our delivery zones in Paris and Île-de-France',
        content: `SoundRush Paris covers the entire Paris region and Île-de-France for sound equipment rental. We operate in Paris intra-muros (all districts), the inner suburbs (Hauts-de-Seine 92, Seine-Saint-Denis 93, Val-de-Marne 94), and the outer suburbs (Yvelines 78, Essonne 91, Seine-et-Marne 77, Val-d'Oise 95).`
      },
      {
        title: 'Available rental types',
        content: `SoundRush Paris offers different types of rental adapted to your needs. Daily rental is ideal for one-time events. Weekend rental offers advantageous rates for two-day events. Long-term rental is available for projects requiring equipment for several weeks or months.`
      },
      {
        title: 'Simplified rental process',
        content: `Booking sound equipment with SoundRush Paris is simple and fast. On our site, you browse our catalog, select the equipment you need, indicate the date and time of your event, and the delivery location. Our system automatically calculates the price according to your geographical zone.`
      },
      {
        title: 'Advantages of our rental service',
        content: `Choosing SoundRush Paris for sound equipment rental offers many advantages. Our turnkey service frees you from all constraints: delivery of equipment directly to your event location, complete installation by our qualified technicians, optimal settings according to your needs, and pickup after the event.`
      }
    ],
    faq: [
      {
        q: 'What are the rental rates for sound equipment?',
        a: 'Rates vary according to the type of equipment and rental duration. Our prices are transparent and displayed on our site during selection. All prices include delivery, installation and pickup.'
      },
      {
        q: 'Is delivery included in the rental price?',
        a: 'Yes, delivery and pickup are included in all our rental rates. Our technicians deliver the equipment directly to your event location, install it and pick it up after use.'
      },
      {
        q: 'Can equipment be rented for several days?',
        a: 'Yes, we offer daily, weekend or long-term rentals. Rates are adapted according to rental duration, with advantages for long-term rentals.'
      }
    ]
  }
};

export default function LocationPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const currentContent = seoContent[language];

  // Structured data pour SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Location Matériel Sonore Paris',
    description: currentContent.description,
    provider: {
      '@type': 'LocalBusiness',
      name: 'SoundRush Paris',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Paris',
        addressRegion: 'Île-de-France',
        addressCountry: 'FR',
      },
    },
    areaServed: {
      '@type': 'City',
      name: 'Paris',
    },
    serviceType: 'Location de matériel sonore professionnel',
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: 'https://www.sndrush.com/location',
      servicePhone: '+33744782754',
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={currentContent.title}
        description={currentContent.description}
        canonicalUrl="https://www.sndrush.com/location"
        keywords={currentContent.keywords}
        structuredData={structuredData}
      />
      <Header language={language} onLanguageChange={setLanguage} />
      
      <main className="pt-[112px] pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: language === 'fr' ? 'Accueil' : 'Home', href: '/' },
              { label: language === 'fr' ? 'Location' : 'Location', href: '/location' },
            ]}
            language={language}
          />

          {/* Hero Section */}
          <div className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Section - Text Content */}
            <div>
              {/* Label */}
              <p className="text-sm font-bold text-[#F2431E] uppercase tracking-wider mb-4">
                {language === 'fr' ? 'LOCATION' : 'RENTAL'}
              </p>
              
              {/* Main Heading */}
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {currentContent.h1}
              </h1>
              
              {/* Main Paragraph */}
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                {currentContent.intro}
              </p>
              
              {/* Two Feature Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Left Feature Block */}
                <div>
                  <div className="w-12 h-12 bg-[#F2431E] rounded-full flex items-center justify-center mb-4">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {language === 'fr' ? 'Matériel professionnel' : 'Professional equipment'}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {language === 'fr' 
                      ? 'Équipements de qualité testés et entretenus régulièrement pour garantir des performances optimales.'
                      : 'Quality equipment tested and maintained regularly to ensure optimal performance.'}
                  </p>
                </div>
                
                {/* Right Feature Block */}
                <div>
                  <div className="w-12 h-12 bg-[#F2431E] rounded-full flex items-center justify-center mb-4">
                    <Wrench className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {language === 'fr' ? 'Service clé en main' : 'Turnkey service'}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {language === 'fr' 
                      ? 'Livraison, installation et récupération incluses. Nos techniciens s\'occupent de tout.'
                      : 'Delivery, installation and pickup included. Our technicians take care of everything.'}
                  </p>
                </div>
              </div>
              
              {/* CTA Button */}
              <div className="mt-8">
                <Button
                  asChild
                  className="bg-[#F2431E] hover:bg-[#E63A1A] text-white"
                  size="lg"
                >
                  <Link href="/catalogue">
                    {language === 'fr' ? 'Voir le catalogue' : 'View catalog'}
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Right Section - Image */}
            <div className="relative">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop"
                  alt={language === 'fr' ? 'Location matériel sonore professionnel' : 'Professional sound equipment rental'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
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

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="w-12 h-12 text-[#F2431E] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {language === 'fr' ? 'Enceintes' : 'Speakers'}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {language === 'fr' 
                    ? 'Enceintes actives et passives de différentes puissances'
                    : 'Active and passive speakers of various power'}
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/catalogue">
                    {language === 'fr' ? 'Voir' : 'View'}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-[#F2431E] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {language === 'fr' ? 'Micros' : 'Microphones'}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {language === 'fr' 
                    ? 'Micros filaires et sans-fil professionnels'
                    : 'Professional wired and wireless microphones'}
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/catalogue">
                    {language === 'fr' ? 'Voir' : 'View'}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Wrench className="w-12 h-12 text-[#F2431E] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {language === 'fr' ? 'Consoles' : 'Consoles'}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {language === 'fr' 
                    ? 'Consoles de mixage 8, 16 et 32 canaux'
                    : 'Mixing consoles 8, 16 and 32 channels'}
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/catalogue">
                    {language === 'fr' ? 'Voir' : 'View'}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Zap className="w-12 h-12 text-[#F2431E] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {language === 'fr' ? 'Éclairage' : 'Lighting'}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {language === 'fr' 
                    ? 'Éclairage LED et effets lumineux'
                    : 'LED lighting and light effects'}
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/catalogue">
                    {language === 'fr' ? 'Voir' : 'View'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Advantages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardContent className="p-6">
                <MapPin className="w-8 h-8 text-[#F2431E] mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {language === 'fr' ? 'Livraison incluse' : 'Delivery included'}
                </h3>
                <p className="text-gray-600">
                  {language === 'fr' 
                    ? 'Livraison et récupération directement sur votre lieu d\'événement'
                    : 'Delivery and pickup directly to your event location'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Wrench className="w-8 h-8 text-[#F2431E] mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {language === 'fr' ? 'Installation incluse' : 'Installation included'}
                </h3>
                <p className="text-gray-600">
                  {language === 'fr' 
                    ? 'Installation complète et réglages par nos techniciens'
                    : 'Complete installation and settings by our technicians'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Clock className="w-8 h-8 text-[#F2431E] mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {language === 'fr' ? 'Disponible 24/7' : 'Available 24/7'}
                </h3>
                <p className="text-gray-600">
                  {language === 'fr' 
                    ? 'Service urgence disponible 24h/24 et 7j/7'
                    : 'Emergency service available 24/7'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <Card className="mb-12">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {language === 'fr' ? 'Questions fréquentes' : 'Frequently asked questions'}
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
              {language === 'fr' ? 'Prêt à louer du matériel sonore ?' : 'Ready to rent sound equipment?'}
            </h2>
            <p className="text-lg mb-6 opacity-90">
              {language === 'fr' 
                ? 'Découvrez notre catalogue complet et réservez votre matériel en quelques clics.'
                : 'Discover our complete catalog and book your equipment in a few clicks.'}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                asChild
                className="bg-white text-[#F2431E] hover:bg-gray-100 py-6 text-lg font-bold rounded-xl shadow-lg"
                size="lg"
              >
                <Link href="/catalogue">
                  {language === 'fr' ? 'Voir le catalogue' : 'View catalog'}
                </Link>
              </Button>
            </div>
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

