'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, ArrowLeft, Calendar, Users, MapPin, Wrench } from 'lucide-react';
import { getBasePack } from '@/lib/packs/basePacks';

interface PackProductPageProps {
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

const texts = {
  fr: {
    back: 'Retour',
    from: 'À partir de',
    deposit: 'Acompte 30% pour bloquer votre date',
    reserve: 'Réserver maintenant',
    features: 'Ce pack comprend',
    included: 'Inclus dans ce pack',
    delivery: 'Livraison & Installation',
    deliveryIncluded: 'Livraison et installation incluses',
    pickup: 'Retrait sur place',
    pickupIncluded: 'Retrait sur place disponible',
    installation: 'Installation',
    installationIncluded: 'Installation par nos techniciens',
    capacity: 'Capacité',
    people: 'personnes',
    description: 'Description',
  },
  en: {
    back: 'Back',
    from: 'From',
    deposit: '30% deposit to secure your date',
    reserve: 'Book now',
    features: 'This pack includes',
    included: 'Included in this pack',
    delivery: 'Delivery & Installation',
    deliveryIncluded: 'Delivery and installation included',
    pickup: 'Pickup on site',
    pickupIncluded: 'Pickup on site available',
    installation: 'Installation',
    installationIncluded: 'Installation by our technicians',
    capacity: 'Capacity',
    people: 'people',
    description: 'Description',
  },
};

export default function PackProductPage({ packKey, language = 'fr', onLanguageChange }: PackProductPageProps) {
  const router = useRouter();
  const pack = getBasePack(packKey);
  const currentTexts = texts[language];

  if (!pack) {
    return null;
  }

  const handleReserve = () => {
    router.push(`/book/${packKey}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header language={language} onLanguageChange={onLanguageChange || (() => {})} />
      
      <main className="pt-[112px] pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-[#F2431E] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{currentTexts.back}</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
              <Image
                src={PACK_IMAGES[packKey]}
                alt={pack.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Content */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  {pack.title}
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {pack.description}
                </p>
              </div>

              {/* Features */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {currentTexts.features}
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {packKey === 'conference' && language === 'fr' && (
                      <>Ce pack s'adapte automatiquement à votre événement selon le nombre de participants et votre zone de livraison. Pour les conférences jusqu'à 30 personnes, il comprend généralement 1 enceinte, 2 micros HF et 1 console de mixage. L'équipement peut être ajusté selon vos besoins spécifiques.</>
                    )}
                    {packKey === 'conference' && language === 'en' && (
                      <>This pack automatically adapts to your event based on the number of participants and your delivery zone. For conferences up to 30 people, it typically includes 1 speaker, 2 wireless microphones and 1 mixing console. Equipment can be adjusted according to your specific needs.</>
                    )}
                    {packKey === 'soiree' && language === 'fr' && (
                      <>Ce pack s'adapte automatiquement à votre événement selon le nombre de participants et votre zone de livraison. Pour les soirées jusqu'à 50 personnes, il comprend généralement 1 enceinte et 1 console de mixage. L'équipement peut être ajusté selon vos besoins spécifiques.</>
                    )}
                    {packKey === 'soiree' && language === 'en' && (
                      <>This pack automatically adapts to your event based on the number of participants and your delivery zone. For parties up to 50 people, it typically includes 1 speaker and 1 mixing console. Equipment can be adjusted according to your specific needs.</>
                    )}
                    {packKey === 'mariage' && language === 'fr' && (
                      <>Ce pack s'adapte automatiquement à votre événement selon le nombre de participants et votre zone de livraison. Pour les mariages jusqu'à 100 personnes, il comprend généralement 1 enceinte, 1 caisson de basses, 2 micros HF et 1 console de mixage. L'équipement peut être ajusté selon vos besoins spécifiques.</>
                    )}
                    {packKey === 'mariage' && language === 'en' && (
                      <>This pack automatically adapts to your event based on the number of participants and your delivery zone. For weddings up to 100 people, it typically includes 1 speaker, 1 subwoofer, 2 wireless microphones and 1 mixing console. Equipment can be adjusted according to your specific needs.</>
                    )}
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      {language === 'fr' 
                        ? '💡 L\'équipement exact sera déterminé lors de votre réservation en fonction du nombre de personnes et de votre localisation.'
                        : '💡 The exact equipment will be determined during your reservation based on the number of people and your location.'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Services */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {currentTexts.included}
                  </h3>
                  <div className="space-y-3">
                    {pack.services.deliveryIncluded && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-[#F2431E] flex-shrink-0" />
                        <span className="text-gray-700">{currentTexts.deliveryIncluded}</span>
                      </div>
                    )}
                    {pack.services.pickupIncluded && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-[#F2431E] flex-shrink-0" />
                        <span className="text-gray-700">{currentTexts.pickupIncluded}</span>
                      </div>
                    )}
                    {pack.services.installationIncluded && (
                      <div className="flex items-center gap-3">
                        <Wrench className="w-5 h-5 text-[#F2431E] flex-shrink-0" />
                        <span className="text-gray-700">{currentTexts.installationIncluded}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Reserve Button */}
              <Button
                onClick={handleReserve}
                className="w-full bg-[#F2431E] hover:bg-[#E63A1A] text-white py-6 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <Calendar className="w-5 h-5 mr-2" />
                {currentTexts.reserve}
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

