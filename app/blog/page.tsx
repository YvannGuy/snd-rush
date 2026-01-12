'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';

const blogArticles = {
  fr: [
    {
      slug: 'enceinte-active-vs-passive',
      title: 'Enceinte active vs passive : laquelle choisir pour votre événement ?',
      excerpt: 'Découvrez les différences entre enceintes actives et passives, leurs avantages respectifs et comment choisir la solution adaptée à votre événement.',
      image: '/enceintemacmah.png',
      category: 'Comparaison',
      readTime: '8 min',
      date: '2025',
    },
    {
      slug: 'micro-filaire-vs-sans-fil',
      title: 'Micro filaire vs sans-fil : guide de choix selon vos besoins',
      excerpt: 'Comparaison détaillée entre micros filaires et sans-fil. Avantages, inconvénients et recommandations pour choisir le bon micro selon votre événement.',
      image: '/microshure.png',
      category: 'Comparaison',
      readTime: '10 min',
      date: '2025',
    },
    {
      slug: 'calculer-puissance-sonore-evenement',
      title: 'Comment calculer la puissance sonore nécessaire pour votre événement ?',
      excerpt: 'Guide complet pour calculer la puissance sonore adaptée à votre événement. Formules, exemples pratiques et conseils d\'experts SoundRush.',
      image: '/enceintefbt.png',
      category: 'Guide',
      readTime: '12 min',
      date: '2025',
    },
    {
      slug: 'sonorisation-mariage-guide-complet',
      title: 'Sonorisation mariage : guide complet du matériel à la configuration',
      excerpt: 'Tout ce qu\'il faut savoir pour une sonorisation réussie de mariage. Matériel recommandé, configuration optimale et conseils pratiques.',
      image: '/mariage.jpg',
      category: 'Sectoriel',
      readTime: '15 min',
      date: '2025',
    },
    {
      slug: '10-erreurs-eviter-location-sono',
      title: '10 erreurs à éviter lors de la location de matériel sonore',
      excerpt: 'Découvrez les erreurs courantes lors de la location de matériel sonore et comment les éviter pour garantir le succès de votre événement.',
      image: '/installation.jpg',
      category: 'Conseils',
      readTime: '9 min',
      date: '2025',
    },
    {
      slug: 'budget-sonorisation-evenement-2025',
      title: 'Budget sonorisation événement : guide des prix 2025',
      excerpt: 'Guide complet des prix de location de matériel sonore en 2025. Facteurs de coût, prix moyens et conseils pour optimiser votre budget.',
      image: '/packs.png',
      category: 'Économique',
      readTime: '11 min',
      date: '2025',
    },
  ],
  en: [
    {
      slug: 'enceinte-active-vs-passive',
      title: 'Active vs Passive Speaker: Which One to Choose for Your Event?',
      excerpt: 'Discover the differences between active and passive speakers, their respective advantages and how to choose the right solution for your event.',
      image: '/enceintemacmah.png',
      category: 'Comparison',
      readTime: '8 min',
      date: '2025',
    },
    {
      slug: 'micro-filaire-vs-sans-fil',
      title: 'Wired vs Wireless Microphone: Selection Guide Based on Your Needs',
      excerpt: 'Detailed comparison between wired and wireless microphones. Advantages, disadvantages and recommendations to choose the right microphone for your event.',
      image: '/microshure.png',
      category: 'Comparison',
      readTime: '10 min',
      date: '2025',
    },
    {
      slug: 'calculer-puissance-sonore-evenement',
      title: 'How to Calculate the Sound Power Needed for Your Event?',
      excerpt: 'Complete guide to calculate the sound power adapted to your event. Formulas, practical examples and expert advice from SoundRush.',
      image: '/enceintefbt.png',
      category: 'Guide',
      readTime: '12 min',
      date: '2025',
    },
    {
      slug: 'sonorisation-mariage-guide-complet',
      title: 'Wedding Sound System: Complete Guide from Equipment to Configuration',
      excerpt: 'Everything you need to know for a successful wedding sound system. Recommended equipment, optimal configuration and practical tips.',
      image: '/mariage.jpg',
      category: 'Sectorial',
      readTime: '15 min',
      date: '2025',
    },
    {
      slug: '10-erreurs-eviter-location-sono',
      title: '10 Mistakes to Avoid When Renting Sound Equipment',
      excerpt: 'Discover common mistakes when renting sound equipment and how to avoid them to ensure the success of your event.',
      image: '/installation.jpg',
      category: 'Tips',
      readTime: '9 min',
      date: '2025',
    },
    {
      slug: 'budget-sonorisation-evenement-2025',
      title: 'Event Sound System Budget: 2025 Price Guide',
      excerpt: 'Complete guide to sound equipment rental prices in 2025. Cost factors, average prices and tips to optimize your budget.',
      image: '/packs.png',
      category: 'Economic',
      readTime: '11 min',
      date: '2025',
    },
  ],
};

export default function BlogPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const articles = blogArticles[language];
  
  const texts = {
    fr: {
      title: 'Blog SoundRush',
      subtitle: 'Conseils, guides et actualités sur la sonorisation professionnelle',
      description: 'Découvrez nos articles sur la sonorisation, le matériel audio professionnel et les meilleures pratiques pour vos événements à Paris et en Île-de-France.',
    },
    en: {
      title: 'SoundRush Blog',
      subtitle: 'Tips, guides and news about professional sound systems',
      description: 'Discover our articles on sound systems, professional audio equipment and best practices for your events in Paris and Île-de-France.',
    },
  };

  const currentTexts = texts[language];

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={currentTexts.title}
        description={currentTexts.description}
        canonicalUrl="https://www.sndrush.com/blog"
        keywords={[
          'blog sonorisation',
          'conseils location sono',
          'guide matériel audio',
          'articles sonorisation Paris',
          'location sono professionnelle',
        ]}
      />
      <Header language={language} onLanguageChange={setLanguage} />
      <main className="pt-[180px] sm:pt-[200px] pb-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: language === 'fr' ? 'Accueil' : 'Home', href: '/' },
              { label: language === 'fr' ? 'Blog' : 'Blog', href: '/blog' },
            ]}
            language={language}
          />

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
              {currentTexts.title}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {currentTexts.subtitle}
            </p>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Card key={article.slug} className="overflow-hidden hover:shadow-xl transition-shadow flex flex-col">
                <Link href={`/blog/${article.slug}`}>
                  <div className="relative h-48 bg-gray-100">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-[#F2431E] text-white text-xs font-semibold px-3 py-1 rounded-full">
                        {article.category}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-6 flex-grow flex flex-col">
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{article.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{article.readTime}</span>
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-black mb-3 line-clamp-2">
                      {article.title}
                    </h2>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
                      {article.excerpt}
                    </p>
                    <Button
                      variant="ghost"
                      className="w-full justify-between group text-[#F2431E] hover:text-[#E63A1A] p-0"
                    >
                      {language === 'fr' ? 'Lire l\'article' : 'Read article'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer language={language} onLegalNoticeClick={() => {}} onRentalConditionsClick={() => {}} />
    </div>
  );
}

