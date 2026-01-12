'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, MapPin, Clock, Shield, Zap, Package, Wrench, Users } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';
import Image from 'next/image';

const seoContent = {
  fr: {
    h1: 'Location Matériel Sonore Paris - SoundRush 24/7',
    intro: 'SoundRush Paris propose la location de matériel sonore professionnel à Paris et en Île-de-France. Enceintes, micros, consoles de mixage, éclairage : découvrez notre catalogue complet et bénéficiez d\'un service clé en main avec livraison, installation et support technique inclus.',
    sections: [
      {
        title: 'Notre catalogue de location matériel sonore',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=800&fit=crop',
        content: `SoundRush Paris met à votre disposition un large catalogue de matériel sonore professionnel disponible à la location. Que vous ayez besoin d'enceintes pour une soirée, de micros pour une conférence, ou d'une console de mixage pour un événement, nous avons l'équipement adapté à vos besoins.

Notre catalogue inclut des enceintes actives et passives de différentes puissances, adaptées à tous types d'événements. Les micros disponibles incluent des modèles filaires et sans-fil, parfaits pour les prises de parole et les animations. Nos consoles de mixage professionnelles permettent de gérer facilement toutes vos sources audio.

L'éclairage LED et les effets lumineux complètent notre offre pour créer une ambiance complète. Tous nos équipements sont régulièrement entretenus et testés pour garantir une qualité professionnelle constante. Chaque location inclut tous les câbles et accessoires nécessaires pour une utilisation immédiate.`
      },
      {
        title: 'Pourquoi louer plutôt qu\'acheter du matériel sonore ?',
        image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&h=800&fit=crop',
        content: `La location de matériel sonore présente de nombreux avantages par rapport à l'achat. Pas d'investissement initial important : vous payez uniquement pour la durée d'utilisation. Le matériel est toujours à jour : nous renouvelons régulièrement notre parc avec les dernières technologies.

La maintenance et les réparations sont incluses dans notre service. Vous n'avez pas à vous soucier de l'entretien ou des pannes. La flexibilité est un autre avantage majeur : vous adaptez le matériel selon vos besoins spécifiques pour chaque événement, sans être limité par un équipement fixe.

Pour les événements ponctuels, la location est la solution la plus économique. Vous bénéficiez d'un matériel professionnel de qualité sans l'investissement et les contraintes de l'achat. Notre service clé en main inclut également la livraison, l'installation et la récupération, vous faisant gagner un temps précieux.`
      },
      {
        title: 'Nos zones de livraison à Paris et Île-de-France',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&h=800&fit=crop',
        content: `SoundRush Paris couvre toute la région parisienne et l'Île-de-France pour la location de matériel sonore. Nous intervenons à Paris intra-muros (tous les arrondissements), dans la petite couronne (Hauts-de-Seine 92, Seine-Saint-Denis 93, Val-de-Marne 94), et dans la grande couronne (Yvelines 78, Essonne 91, Seine-et-Marne 77, Val-d'Oise 95).

Les tarifs de livraison varient selon la zone géographique, avec des prix transparents affichés lors de la réservation. Paris intra-muros bénéficie d'un tarif de base, tandis que les zones périphériques incluent des frais de transport adaptés. Tous les prix sont indiqués TTC et incluent la livraison, l'installation et la récupération du matériel.

Notre service est disponible 24h/24 et 7j/7, y compris les weekends et jours fériés. Cette disponibilité permanente vous permet de réserver même en urgence, avec une intervention rapide garantie. Pour les événements de dernière minute, notre équipe s'organise pour répondre à votre demande dans les meilleurs délais.`
      },
      {
        title: 'Types de location disponibles',
        image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&h=800&fit=crop',
        content: `SoundRush Paris propose différents types de location adaptés à vos besoins. La location à la journée est idéale pour les événements ponctuels : vous réservez le matériel pour une journée complète avec livraison le matin et récupération le lendemain.

La location week-end offre un tarif avantageux pour les événements sur deux jours, parfaits pour les mariages ou les événements festifs. La location longue durée est disponible pour les projets nécessitant du matériel sur plusieurs semaines ou mois, avec des tarifs dégressifs selon la durée.

Notre service urgence 24/7 permet de réserver jusqu'à la dernière minute pour les besoins immédiats. Que vous ayez un événement qui se décide rapidement ou un problème technique de dernière minute, nous intervenons rapidement pour répondre à votre demande.`
      },
      {
        title: 'Processus de location simplifié',
        image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=800&fit=crop',
        content: `Réserver du matériel sonore chez SoundRush Paris est simple et rapide. Sur notre site, vous parcourez notre catalogue, sélectionnez les équipements dont vous avez besoin, indiquez la date et l'heure de votre événement, ainsi que le lieu de livraison. Notre système calcule automatiquement le prix selon votre zone géographique.

Un acompte de 30% permet de bloquer votre date et de garantir la disponibilité du matériel. Le solde est demandé 1 jour avant votre événement, vous laissant le temps nécessaire pour finaliser les derniers détails. La réservation peut être effectuée en ligne en quelques minutes, avec confirmation immédiate.

Notre équipe vous contacte ensuite pour confirmer les détails de votre location et s'assurer que nous avons toutes les informations nécessaires. Le jour de l'événement, nos techniciens arrivent à l'heure convenue pour livrer, installer et tester le matériel avant le début de votre événement.`
      },
      {
        title: 'Avantages de notre service de location',
        image: 'https://images.unsplash.com/photo-1478147427282-58a87a120781?w=1200&h=800&fit=crop',
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
        a: 'Oui, tous nos équipements sont garantis en cas de panne technique. Notre support technique est disponible pendant toute la durée de votre location. En cas de problème, nous intervenons rapidement pour le résoudre ou remplacer le matériel défectueux.'
      },
      {
        q: 'Peut-on modifier ou annuler une réservation ?',
        a: 'Oui, vous pouvez modifier votre réservation depuis votre dashboard. Pour toute annulation, veuillez nous contacter au plus tôt. Les conditions d\'annulation dépendent de la date de votre événement et sont détaillées dans nos conditions générales de vente.'
      }
    ]
  },
  en: {
    h1: 'Sound Equipment Rental Paris - SoundRush 24/7',
    intro: 'SoundRush Paris offers professional sound equipment rental in Paris and Île-de-France. Speakers, microphones, mixing consoles, lighting: discover our complete catalog and benefit from a turnkey service with delivery, installation and technical support included.',
    sections: [],
    faq: []
  }
};

export default function LocationPageClient() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const currentContent = seoContent[language];

  return (
    <div className="min-h-screen bg-white">
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
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#F2431E] rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {language === 'fr' ? 'Matériel Professionnel' : 'Professional Equipment'}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {language === 'fr' ? 'Équipements de qualité professionnelle régulièrement entretenus' : 'Professional quality equipment regularly maintained'}
                  </p>
                </div>

                {/* Right Feature Block */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#F2431E] rounded-lg flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {language === 'fr' ? 'Service Clé en Main' : 'Turnkey Service'}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {language === 'fr' ? 'Livraison, installation et support technique inclus' : 'Delivery, installation and technical support included'}
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <Link href="/catalogue">
                <Button className="bg-[#F2431E] hover:bg-[#E63A1A] text-white px-8 py-6 text-lg font-bold rounded-xl">
                  {language === 'fr' ? 'Voir le catalogue' : 'View catalog'}
                </Button>
              </Link>
            </div>

            {/* Right Section - Image */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
              <Image
                src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=800&fit=crop"
                alt={language === 'fr' ? 'Location matériel sonore professionnel Paris' : 'Professional sound equipment rental Paris'}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                quality={85}
              />
            </div>
          </div>

          {/* SEO Content Sections */}
          {language === 'fr' && currentContent.sections.map((section, index) => {
            // Fonction pour enrichir le texte avec des liens internes
            const enrichText = (text: string): string => {
              return text
                .replace(/(catalogue)/gi, '<a href="/catalogue" class="text-[#F2431E] hover:underline font-medium">$1</a>')
                .replace(/(pack sonorisation|pack)/gi, '<a href="/packs" class="text-[#F2431E] hover:underline font-medium">$1</a>')
                .replace(/(sonorisation professionnelle)/gi, '<a href="/location" class="text-[#F2431E] hover:underline font-medium">$1</a>');
            };
            
            return (
              <section key={index} className="mb-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className={index % 2 === 0 ? 'order-1' : 'order-2'}>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">
                      {section.title}
                    </h2>
                    <div className="text-gray-700 leading-relaxed text-lg space-y-4">
                      {section.content.split('\n\n').map((paragraph, pIndex) => (
                        <p 
                          key={pIndex}
                          dangerouslySetInnerHTML={{ __html: enrichText(paragraph) }}
                        />
                      ))}
                    </div>
                  </div>
                <div className={`relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 ${index % 2 === 0 ? 'order-2' : 'order-1'}`}>
                  <Image
                    src={section.image || '/packdjL.png'}
                    alt={`${section.title} - ${language === 'fr' ? 'Location matériel sonore' : 'Sound equipment rental'}`}
                    fill
                    className="object-cover"
                    loading="lazy"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    quality={85}
                  />
                </div>
              </div>
            </section>
          );
          })}

          {/* FAQ Section */}
          {language === 'fr' && currentContent.faq.length > 0 && (
            <Card className="mt-16">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">
                  {language === 'fr' ? 'Questions fréquentes' : 'Frequently asked questions'}
                </h2>
                <div className="space-y-6">
                  {currentContent.faq.map((item, index) => (
                    <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
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
          )}
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

