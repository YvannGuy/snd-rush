'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';

// Articles disponibles (même structure que dans page.tsx)
const articles = {
  'enceinte-active-vs-passive': {
    fr: {
      title: 'Enceinte active vs passive : laquelle choisir pour votre événement ?',
      category: 'Comparaison',
      image: '/enceintebt.jpg',
      author: 'Équipe SoundRush',
      date: '2025',
      readTime: '8 min',
      description: 'Découvrez les différences entre enceintes actives et passives, leurs avantages respectifs et comment choisir la solution adaptée à votre événement.',
      content: [
        {
          type: 'heading',
          text: 'Introduction : comprendre les enceintes actives et passives'
        },
        {
          type: 'paragraph',
          text: 'Lors de la location de matériel sonore pour votre événement, vous serez confronté à un choix fondamental : enceinte active ou passive ? Cette décision impacte directement la qualité sonore, la facilité d\'installation et le budget de votre événement. SoundRush Paris vous guide dans ce choix crucial.'
        },
        {
          type: 'heading',
          text: 'Qu\'est-ce qu\'une enceinte active ?'
        },
        {
          type: 'paragraph',
          text: 'Une enceinte active (ou amplifiée) intègre directement l\'amplificateur dans le boîtier. Elle nécessite uniquement une source audio et une alimentation électrique pour fonctionner. C\'est la solution la plus simple et la plus courante pour les événements modernes.'
        },
        {
          type: 'list',
          items: [
            'Amplificateur intégré : pas besoin d\'ampli externe',
            'Réglages optimisés : l\'ampli est calibré pour l\'enceinte',
            'Installation simplifiée : moins de câbles et de connexions',
            'Idéale pour débutants : configuration plug-and-play'
          ]
        },
        {
          type: 'heading',
          text: 'Qu\'est-ce qu\'une enceinte passive ?'
        },
        {
          type: 'paragraph',
          text: 'Une enceinte passive nécessite un amplificateur externe pour fonctionner. Elle reçoit le signal audio amplifié via des câbles. Cette solution offre plus de flexibilité mais requiert davantage de connaissances techniques.'
        },
        {
          type: 'list',
          items: [
            'Amplificateur externe requis : plus de flexibilité de configuration',
            'Poids réduit : l\'enceinte est plus légère',
            'Coût initial plus bas : mais nécessite un ampli',
            'Contrôle total : choix de l\'ampli selon vos besoins'
          ]
        },
        {
          type: 'heading',
          text: 'Comparaison : active vs passive'
        },
        {
          type: 'paragraph',
          text: 'Pour un événement à Paris ou en Île-de-France, voici les critères de choix :'
        },
        {
          type: 'heading',
          text: 'Quand choisir une enceinte active ?'
        },
        {
          type: 'list',
          items: [
            'Événements de petite à moyenne taille (jusqu\'à 150 personnes)',
            'Installation rapide requise',
            'Équipe non technique',
            'Budget serré (location complète)',
            'Événements en extérieur avec alimentation disponible'
          ]
        },
        {
          type: 'heading',
          text: 'Quand choisir une enceinte passive ?'
        },
        {
          type: 'list',
          items: [
            'Grands événements nécessitant plusieurs enceintes',
            'Configuration complexe avec plusieurs sources',
            'Équipe technique expérimentée',
            'Besoin de puissance très élevée',
            'Système modulaire et évolutif'
          ]
        },
        {
          type: 'heading',
          text: 'Nos recommandations SoundRush'
        },
        {
          type: 'paragraph',
          text: 'Pour la majorité des événements (mariages, conférences, soirées privées), nous recommandons les enceintes actives. Elles offrent le meilleur rapport simplicité/qualité et sont parfaitement adaptées à nos packs clé en main. Nos enceintes Mac Mah AS 115 et FBT X-Lite 115A sont des modèles actifs professionnels, idéaux pour vos événements parisiens.'
        },
        {
          type: 'heading',
          text: 'Conclusion'
        },
        {
          type: 'paragraph',
          text: 'Le choix entre enceinte active et passive dépend de vos besoins spécifiques. Pour un événement standard à Paris, l\'enceinte active reste la solution la plus adaptée. N\'hésitez pas à consulter nos packs de sonorisation qui incluent des enceintes actives professionnelles, livrées et installées par nos techniciens.'
        }
      ]
    },
    en: {
      title: 'Active vs Passive Speaker: Which One to Choose for Your Event?',
      category: 'Comparison',
      image: '/enceintebt.jpg',
      author: 'SoundRush Team',
      date: '2025',
      readTime: '8 min',
      description: 'Discover the differences between active and passive speakers, their respective advantages and how to choose the right solution for your event.',
      content: []
    }
  },
  'micro-filaire-vs-sans-fil': {
    fr: {
      title: 'Micro filaire vs sans-fil : guide de choix selon vos besoins',
      category: 'Comparaison',
      image: '/Microsansfil.png',
      author: 'Équipe SoundRush',
      date: '2025',
      readTime: '10 min',
      description: 'Comparaison détaillée entre micros filaires et sans-fil. Avantages, inconvénients et recommandations pour choisir le bon micro selon votre événement.',
      content: [
        {
          type: 'heading',
          text: 'Introduction : micro filaire ou sans-fil ?'
        },
        {
          type: 'paragraph',
          text: 'Le choix entre micro filaire et sans-fil est crucial pour la réussite de votre événement. Chaque type a ses avantages et ses contraintes. SoundRush Paris vous aide à faire le bon choix selon vos besoins.'
        },
        {
          type: 'heading',
          text: 'Micro filaire : fiabilité et qualité'
        },
        {
          type: 'paragraph',
          text: 'Le micro filaire (comme le Shure SM58) offre une qualité sonore exceptionnelle et une fiabilité à toute épreuve. Pas de risque d\'interférence ou de coupure de signal.'
        },
        {
          type: 'list',
          items: [
            'Qualité sonore supérieure : pas de compression audio',
            'Fiabilité totale : aucun risque de coupure',
            'Pas de batterie : fonctionnement continu',
            'Prix de location plus bas',
            'Idéal pour discours et présentations'
          ]
        },
        {
          type: 'heading',
          text: 'Micro sans-fil : liberté de mouvement'
        },
        {
          type: 'paragraph',
          text: 'Le micro sans-fil (comme le Mipro ACT311II) offre une liberté de mouvement totale, essentielle pour les animations et les présentations dynamiques.'
        },
        {
          type: 'list',
          items: [
            'Liberté de mouvement : déplacement libre sur scène',
            'Installation simplifiée : moins de câbles',
            'Professionnel : image moderne et dynamique',
            'Idéal pour animations et présentations interactives',
            'Nécessite gestion des batteries'
          ]
        },
        {
          type: 'heading',
          text: 'Quand choisir un micro filaire ?'
        },
        {
          type: 'list',
          items: [
            'Conférences et présentations statiques',
            'Discours et allocutions',
            'Budget serré',
            'Événements en intérieur uniquement',
            'Besoin de qualité sonore maximale'
          ]
        },
        {
          type: 'heading',
          text: 'Quand choisir un micro sans-fil ?'
        },
        {
          type: 'list',
          items: [
            'Animations et présentations dynamiques',
            'Mariages avec cérémonie et animation',
            'Événements nécessitant plusieurs intervenants',
            'Besoin de liberté de mouvement',
            'Événements en extérieur avec espace large'
          ]
        },
        {
          type: 'heading',
          text: 'Nos recommandations SoundRush'
        },
        {
          type: 'paragraph',
          text: 'Pour la plupart des événements, nous recommandons une combinaison : micros filaires pour les discours (qualité et fiabilité) et micros sans-fil pour les animations (liberté). Nos packs incluent cette combinaison optimale pour garantir le succès de votre événement.'
        }
      ]
    },
    en: {
      title: 'Wired vs Wireless Microphone: Selection Guide Based on Your Needs',
      category: 'Comparison',
      image: '/Microsansfil.png',
      author: 'SoundRush Team',
      date: '2025',
      readTime: '10 min',
      description: 'Detailed comparison between wired and wireless microphones. Advantages, disadvantages and recommendations to choose the right microphone for your event.',
      content: []
    }
  },
  'calculer-puissance-sonore-evenement': {
    fr: {
      title: 'Comment calculer la puissance sonore nécessaire pour votre événement ?',
      category: 'Guide',
      image: '/concert.jpg',
      author: 'Équipe SoundRush',
      date: '2025',
      readTime: '12 min',
      description: 'Guide complet pour calculer la puissance sonore adaptée à votre événement. Formules, exemples pratiques et conseils d\'experts SoundRush.',
      content: [
        {
          type: 'heading',
          text: 'Introduction : pourquoi calculer la puissance sonore ?'
        },
        {
          type: 'paragraph',
          text: 'Choisir la bonne puissance sonore est essentiel pour garantir une qualité audio optimale lors de votre événement. Trop faible, le son sera inaudible. Trop forte, vous risquez la saturation et l\'inconfort. SoundRush Paris vous explique comment calculer la puissance nécessaire.'
        },
        {
          type: 'heading',
          text: 'Facteurs à prendre en compte'
        },
        {
          type: 'list',
          items: [
            'Nombre de personnes : plus il y a de monde, plus il faut de puissance',
            'Taille de la salle : volume et acoustique',
            'Type d\'événement : musique ou parole',
            'Environnement : intérieur ou extérieur',
            'Distance entre enceintes et public'
          ]
        },
        {
          type: 'heading',
          text: 'Formule de base'
        },
        {
          type: 'paragraph',
          text: 'Pour un événement standard en intérieur : Puissance nécessaire (W) = Nombre de personnes × 2 à 5W par personne. Pour la musique, multipliez par 1.5 à 2.'
        },
        {
          type: 'heading',
          text: 'Exemples pratiques'
        },
        {
          type: 'paragraph',
          text: 'Pour 50 personnes (discours) : 50 × 3W = 150W minimum. Pour 50 personnes (musique) : 150W × 1.5 = 225W minimum. Pour 100 personnes (discours) : 100 × 3W = 300W minimum.'
        },
        {
          type: 'heading',
          text: 'Nos packs SoundRush adaptés'
        },
        {
          type: 'paragraph',
          text: 'Nos packs sont conçus selon ces calculs : Pack S (30-70 personnes), Pack M (70-150 personnes), Pack L (150-250 personnes). Chaque pack offre la puissance adaptée au nombre de participants.'
        }
      ]
    },
    en: {
      title: 'How to Calculate the Sound Power Needed for Your Event?',
      category: 'Guide',
      image: '/concert.jpg',
      author: 'SoundRush Team',
      date: '2025',
      readTime: '12 min',
      description: 'Complete guide to calculate the sound power adapted to your event. Formulas, practical examples and expert advice from SoundRush.',
      content: []
    }
  },
  'sonorisation-mariage-guide-complet': {
    fr: {
      title: 'Sonorisation mariage : guide complet du matériel à la configuration',
      category: 'Sectoriel',
      image: '/mariage.jpg',
      author: 'Équipe SoundRush',
      date: '2025',
      readTime: '15 min',
      description: 'Tout ce qu\'il faut savoir pour une sonorisation réussie de mariage. Matériel recommandé, configuration optimale et conseils pratiques.',
      content: [
        {
          type: 'heading',
          text: 'Introduction : la sonorisation, élément clé de votre mariage'
        },
        {
          type: 'paragraph',
          text: 'Une sonorisation de qualité est essentielle pour le succès de votre mariage. De la cérémonie à la soirée dansante, chaque moment nécessite une configuration adaptée. SoundRush Paris vous guide dans l\'organisation de votre sonorisation de mariage.'
        },
        {
          type: 'heading',
          text: 'Matériel nécessaire pour un mariage'
        },
        {
          type: 'list',
          items: [
            'Enceintes principales : 2 enceintes minimum pour une diffusion homogène',
            'Caisson de basse : essentiel pour la soirée dansante',
            'Micros sans-fil : pour la cérémonie et les discours',
            'Console de mixage : pour gérer toutes les sources audio',
            'Retours de scène : si vous avez des musiciens'
          ]
        },
        {
          type: 'heading',
          text: 'Configuration selon les moments'
        },
        {
          type: 'paragraph',
          text: 'Cérémonie : sonorisation douce et claire pour les vœux. Cocktail : ambiance musicale légère. Soirée : puissance et basses pour la danse.'
        },
        {
          type: 'heading',
          text: 'Notre Pack Mariage SoundRush'
        },
        {
          type: 'paragraph',
          text: 'Notre Pack Mariage inclut tout le matériel nécessaire pour votre journée : enceintes haute puissance, caisson de basse, micros sans-fil, console professionnelle. Livraison, installation et récupération incluses. Parfait pour mariages jusqu\'à 200 personnes.'
        }
      ]
    },
    en: {
      title: 'Wedding Sound System: Complete Guide from Equipment to Configuration',
      category: 'Sectorial',
      image: '/mariage.jpg',
      author: 'SoundRush Team',
      date: '2025',
      readTime: '15 min',
      description: 'Everything you need to know for a successful wedding sound system. Recommended equipment, optimal configuration and practical tips.',
      content: []
    }
  },
  '10-erreurs-eviter-location-sono': {
    fr: {
      title: '10 erreurs à éviter lors de la location de matériel sonore',
      category: 'Conseils',
      image: '/livraison.jpg',
      author: 'Équipe SoundRush',
      date: '2025',
      readTime: '9 min',
      description: 'Découvrez les erreurs courantes lors de la location de matériel sonore et comment les éviter pour garantir le succès de votre événement.',
      content: [
        {
          type: 'heading',
          text: 'Introduction : éviter les pièges de la location'
        },
        {
          type: 'paragraph',
          text: 'La location de matériel sonore peut sembler simple, mais de nombreuses erreurs peuvent compromettre votre événement. SoundRush Paris vous liste les 10 erreurs les plus courantes et comment les éviter.'
        },
        {
          type: 'heading',
          text: 'Erreur 1 : Sous-estimer la puissance nécessaire'
        },
        {
          type: 'paragraph',
          text: 'Choisir un matériel trop faible pour le nombre de personnes. Solution : utiliser notre calculateur ou consulter nos packs adaptés.'
        },
        {
          type: 'heading',
          text: 'Erreur 2 : Oublier les micros'
        },
        {
          type: 'paragraph',
          text: 'Penser uniquement aux enceintes et oublier les micros pour les discours. Solution : nos packs incluent toujours des micros adaptés.'
        },
        {
          type: 'heading',
          text: 'Erreur 3 : Ne pas prévoir l\'installation'
        },
        {
          type: 'paragraph',
          text: 'Penser pouvoir installer seul sans connaissances techniques. Solution : opter pour notre service d\'installation inclus dans les packs.'
        },
        {
          type: 'heading',
          text: 'Erreur 4 : Ignorer les besoins en câbles'
        },
        {
          type: 'paragraph',
          text: 'Oublier les câbles nécessaires pour connecter le matériel. Solution : nos packs incluent tous les câbles nécessaires.'
        },
        {
          type: 'heading',
          text: 'Erreur 5 : Ne pas tester avant l\'événement'
        },
        {
          type: 'paragraph',
          text: 'Attendre le jour J pour tester le matériel. Solution : tester 1h avant l\'événement, notre service urgence est disponible.'
        },
        {
          type: 'heading',
          text: 'Erreur 6 : Sous-estimer le temps d\'installation'
        },
        {
          type: 'paragraph',
          text: 'Prévoir trop peu de temps pour l\'installation. Solution : prévoir 1h minimum, nos techniciens gèrent tout.'
        },
        {
          type: 'heading',
          text: 'Erreur 7 : Choisir le matériel le moins cher'
        },
        {
          type: 'paragraph',
          text: 'Privilégier uniquement le prix sans considérer la qualité. Solution : nos packs offrent le meilleur rapport qualité/prix.'
        },
        {
          type: 'heading',
          text: 'Erreur 8 : Oublier les retours de scène'
        },
        {
          type: 'paragraph',
          text: 'Ne pas prévoir de retours si vous avez des musiciens. Solution : nos packs peuvent inclure des retours sur demande.'
        },
        {
          type: 'heading',
          text: 'Erreur 9 : Ne pas vérifier les disponibilités'
        },
        {
          type: 'paragraph',
          text: 'Réserver au dernier moment sans vérifier. Solution : réserver au moins 1 semaine à l\'avance, surtout en période de pointe.'
        },
        {
          type: 'heading',
          text: 'Erreur 10 : Ne pas prévoir de solution de secours'
        },
        {
          type: 'paragraph',
          text: 'Ne pas avoir de plan B en cas de problème. Solution : notre service urgence 24/7 est disponible à Paris et Île-de-France.'
        },
        {
          type: 'heading',
          text: 'Conclusion'
        },
        {
          type: 'paragraph',
          text: 'Éviter ces erreurs garantit le succès de votre événement. Nos packs SoundRush sont conçus pour éviter tous ces pièges : matériel adapté, installation incluse, service urgence disponible. Faites confiance aux experts !'
        }
      ]
    },
    en: {
      title: '10 Mistakes to Avoid When Renting Sound Equipment',
      category: 'Tips',
      image: '/livraison.jpg',
      author: 'SoundRush Team',
      date: '2025',
      readTime: '9 min',
      description: 'Discover common mistakes when renting sound equipment and how to avoid them to ensure the success of your event.',
      content: []
    }
  },
  'budget-sonorisation-evenement-2025': {
    fr: {
      title: 'Budget sonorisation événement : guide des prix 2025',
      category: 'Économique',
      image: '/packdjL.png',
      author: 'Équipe SoundRush',
      date: '2025',
      readTime: '11 min',
      description: 'Guide complet des prix de location de matériel sonore en 2025. Facteurs de coût, prix moyens et conseils pour optimiser votre budget.',
      content: [
        {
          type: 'heading',
          text: 'Introduction : comprendre les prix de la sonorisation'
        },
        {
          type: 'paragraph',
          text: 'Le budget sonorisation peut varier considérablement selon vos besoins. SoundRush Paris vous détaille les prix 2025 et les facteurs qui influencent le coût de location.'
        },
        {
          type: 'heading',
          text: 'Facteurs influençant le prix'
        },
        {
          type: 'list',
          items: [
            'Type de matériel : enceintes, micros, consoles',
            'Puissance nécessaire : selon le nombre de personnes',
            'Durée de location : jour, week-end, semaine',
            'Services inclus : livraison, installation, récupération',
            'Localisation : Paris intra-muros ou hors Paris'
          ]
        },
        {
          type: 'heading',
          text: 'Prix moyens 2025'
        },
        {
          type: 'paragraph',
          text: 'Pack S (30-70 personnes) : à partir de 109€/jour. Pack M (70-150 personnes) : à partir de 129€/jour. Pack L (150-250 personnes) : à partir de 179€/jour. Pack Mariage : à partir de 449€/jour.'
        },
        {
          type: 'heading',
          text: 'Ce qui est inclus dans nos packs'
        },
        {
          type: 'list',
          items: [
            'Matériel professionnel complet',
            'Livraison et récupération',
            'Installation par nos techniciens',
            'Tous les câbles nécessaires',
            'Service urgence 24/7'
          ]
        },
        {
          type: 'heading',
          text: 'Conseils pour optimiser votre budget'
        },
        {
          type: 'list',
          items: [
            'Réserver à l\'avance : réductions possibles',
            'Choisir un pack adapté : éviter le surdimensionnement',
            'Opter pour la location week-end : tarifs avantageux',
            'Comparer les offres : mais attention à ce qui est inclus',
            'Demander un devis personnalisé : pour événements spécifiques'
          ]
        },
        {
          type: 'heading',
          text: 'Conclusion'
        },
        {
          type: 'paragraph',
          text: 'Le prix de la sonorisation dépend de nombreux facteurs. Nos packs SoundRush offrent un excellent rapport qualité/prix avec tous les services inclus. N\'hésitez pas à nous contacter pour un devis personnalisé adapté à votre budget.'
        }
      ]
    },
    en: {
      title: 'Event Sound System Budget: 2025 Price Guide',
      category: 'Economic',
      image: '/packdjL.png',
      author: 'SoundRush Team',
      date: '2025',
      readTime: '11 min',
      description: 'Complete guide to sound equipment rental prices in 2025. Cost factors, average prices and tips to optimize your budget.',
      content: []
    }
  }
};

interface BlogArticleClientProps {
  slug: string;
}

export default function BlogArticleClient({ slug }: BlogArticleClientProps) {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  const article = articles[slug as keyof typeof articles];
  
  // Générer les structured data pour l'article
  const structuredData = article && article[language] ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article[language].title,
    description: article[language].description,
    image: `https://www.sndrush.com${article[language].image}`,
    author: {
      '@type': 'Organization',
      name: article[language].author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'SoundRush Paris',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.sndrush.com/logo.svg',
      },
    },
    datePublished: article[language].date,
    dateModified: article[language].date,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.sndrush.com/blog/${slug}`,
    },
  } : undefined;

  const currentArticle = article?.[language];

  return (
    <div className="min-h-screen bg-white">
      {currentArticle && (
        <SEOHead
          title={currentArticle.title}
          description={currentArticle.description}
          canonicalUrl={`https://www.sndrush.com/blog/${slug}`}
          ogImage={`https://www.sndrush.com${currentArticle.image}`}
          structuredData={structuredData}
          keywords={[
            'location sono Paris',
            'sonorisation professionnelle',
            'location matériel audio',
            'pack sono événement',
            currentArticle.category.toLowerCase(),
          ]}
        />
      )}
      <Header language={language} onLanguageChange={setLanguage} />
      <main className="pt-[180px] sm:pt-[200px] pb-32">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          {currentArticle && (
            <Breadcrumb
              items={[
                { label: language === 'fr' ? 'Accueil' : 'Home', href: '/' },
                { label: language === 'fr' ? 'Blog' : 'Blog', href: '/#blog' },
                { label: currentArticle.title, href: `/blog/${slug}` },
              ]}
              language={language}
            />
          )}

          {/* Navigation retour */}
          <div className="mb-8">
            <Link 
              href="/#blog"
              className="flex items-center gap-2 text-gray-600 hover:text-[#F2431E] transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span>{language === 'fr' ? 'Retour au blog' : 'Back to blog'}</span>
            </Link>
          </div>

          {/* Article Header */}
          <div className="mb-8">
            <div className="inline-block bg-[#F2431E] text-white text-xs font-semibold px-3 py-1 rounded mb-4">
              {currentArticle?.category}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
              {currentArticle?.title}
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              {currentArticle?.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{currentArticle?.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{currentArticle?.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{currentArticle?.readTime} de lecture</span>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-12 bg-gray-200">
            {currentArticle && (
              <Image
                src={currentArticle.image}
                alt={currentArticle.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
                priority
              />
            )}
          </div>

          {/* Article Content */}
          <article className="prose prose-lg max-w-none">
            {currentArticle?.content.map((section: any, index: number) => {
              if (section.type === 'heading') {
                return (
                  <h2 key={index} className="text-3xl font-bold text-black mt-12 mb-6">
                    {section.text}
                  </h2>
                );
              }
              if (section.type === 'paragraph') {
                // Enrichir le texte avec des liens internes stratégiques
                const enrichText = (text: string): string => {
                  return text
                    .replace(/(location de matériel sonore|location sono)/gi, '<a href="/location" class="text-[#F2431E] hover:underline font-medium">$1</a>')
                    .replace(/(catalogue)/gi, '<a href="/catalogue" class="text-[#F2431E] hover:underline font-medium">$1</a>')
                    .replace(/(pack sonorisation|pack)/gi, '<a href="/packs" class="text-[#F2431E] hover:underline font-medium">$1</a>');
                };
                
                return (
                  <p 
                    key={index} 
                    className="text-gray-700 leading-relaxed mb-6 text-lg"
                    dangerouslySetInnerHTML={{ __html: enrichText(section.text) }}
                  />
                );
              }
              if (section.type === 'list') {
                return (
                  <ul key={index} className="list-disc list-inside mb-6 space-y-2 text-gray-700 text-lg">
                    {'items' in section && section.items ? section.items.map((item: string, itemIndex: number) => (
                      <li key={itemIndex}>{item}</li>
                    )) : null}
                  </ul>
                );
              }
              return null;
            })}
          </article>

          {/* Articles similaires */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              {language === 'fr' ? 'Articles similaires' : 'Related articles'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.keys(articles)
                .filter(articleSlug => articleSlug !== slug)
                .slice(0, 3)
                .map((relatedSlug) => {
                  const relatedArticle = articles[relatedSlug as keyof typeof articles]?.[language];
                  if (!relatedArticle) return null;
                  
                  return (
                    <Link key={relatedSlug} href={`/blog/${relatedSlug}`}>
                      <Card className="h-full hover:shadow-xl transition-shadow">
                        <div className="relative h-48 bg-gray-200">
                          <Image
                            src={relatedArticle.image}
                            alt={relatedArticle.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                            loading="lazy"
                            quality={85}
                          />
                        </div>
                        <CardContent className="p-6">
                          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                            {relatedArticle.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {relatedArticle.description}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
            </div>
          </div>

          {/* CTA Section */}
          <Card className="mt-16 bg-gradient-to-br from-[#F2431E] to-[#E63A1A] text-white border-0">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">
                {language === 'fr' ? 'Besoin de matériel pour votre événement ?' : 'Need equipment for your event?'}
              </h3>
              <p className="text-white/90 mb-6 text-lg">
                {language === 'fr' 
                  ? 'Découvrez nos packs de sonorisation clé en main, livrés et installés par nos techniciens.'
                  : 'Discover our turnkey sound system packs, delivered and installed by our technicians.'}
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-[#F2431E] hover:bg-gray-100"
                >
                  <Link href="/packs">
                    {language === 'fr' ? 'Voir nos packs' : 'View our packs'}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  <Link href="/catalogue">
                    {language === 'fr' ? 'Voir le catalogue' : 'View catalog'}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer language={language} onLegalNoticeClick={() => {}} onRentalConditionsClick={() => {}} />
    </div>
  );
}
